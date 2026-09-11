import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { leadSubmitSchema } from '@/lib/validators'
import { verifyOtp } from '@/lib/otp/service'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { sendLeadEmails } from '@/lib/email/send-lead-emails'
import { grantPreLaunchAccess } from '@/lib/gate'
import { env } from '@/lib/env'

/**
 * POST /api/leads — verifies the code and stores the lead, in that order.
 *
 * The security property that matters: the phone number is derived server-side
 * from the submitted country + digits, and the OTP challenge is then required
 * to belong to THAT number. A client cannot verify one number and submit
 * another, and `phoneVerified` is only ever set by this code path.
 */
export async function POST(request: Request) {
  const ip = clientIp(request.headers)
  const userAgent = request.headers.get('user-agent')?.slice(0, 300) ?? null

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Malformed request.' }, { status: 400 })
  }

  const parsed = leadSubmitSchema.safeParse(body)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return NextResponse.json(
      { ok: false, error: issue?.message ?? 'Please check the details you entered.' },
      { status: 400 },
    )
  }

  const data = parsed.data

  // Silent bot discard — a normal success shape, nothing stored.
  const filledTooFast =
    typeof data.startedAt === 'number' &&
    Date.now() - data.startedAt < env.leads.minFillSeconds * 1000
  if (data.company || filledTooFast) {
    return NextResponse.json({ ok: true })
  }

  const limit = rateLimit({
    key: `lead:${ip}`,
    limit: env.leads.maxPerIpPerHour,
    windowMs: 3_600_000,
  })
  if (!limit.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `You have submitted several enquiries from this connection already. Please try again in about ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
      },
      { status: 429, headers: { 'retry-after': String(limit.retryAfterSeconds) } },
    )
  }

  const verification = await verifyOtp({
    challengeId: data.challengeId,
    phone: data.phoneE164,
    code: data.code,
  })

  if (!verification.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: verification.message,
        reason: verification.reason,
        ...(verification.remainingAttempts !== undefined
          ? { remainingAttempts: verification.remainingAttempts }
          : {}),
      },
      { status: verification.reason === 'TOO_MANY_ATTEMPTS' ? 429 : 400 },
    )
  }

  // Resolve the related listing server-side; the client's title is never trusted.
  let relatedTitle: string | null = null
  let relatedProjectId: string | null = null
  let relatedInventoryId: string | null = null
  let isGatedProject = false

  if (data.relatedId && data.relatedType === 'project') {
    const project = await prisma.project.findUnique({
      where: { id: data.relatedId },
      select: { id: true, title: true, isGated: true, status: true },
    })
    if (project) {
      relatedProjectId = project.id
      relatedTitle = project.title
      isGatedProject = project.isGated || project.status === 'PRE_LAUNCH'
    }
  } else if (data.relatedId && data.relatedType === 'inventory') {
    const listing = await prisma.inventory.findUnique({
      where: { id: data.relatedId },
      select: { id: true, title: true },
    })
    if (listing) {
      relatedInventoryId = listing.id
      relatedTitle = listing.title
    }
  }

  const lead = await prisma.lead.create({
    data: {
      name: data.name,
      phone: data.phoneE164,
      email: data.email ?? null,
      propertyTypeInterest: data.propertyTypeInterest ?? null,
      budgetRange: data.budgetRange ?? null,
      preferredLocation: data.preferredLocation ?? null,
      requirements: data.requirements ?? null,
      source: data.source ?? '/',
      relatedType: data.relatedType ?? null,
      relatedTitle,
      relatedProjectId,
      relatedInventoryId,
      phoneVerified: true,
      status: 'NEW',
      ip,
      userAgent,
    },
  })

  // Gated pre-launch content unlocks via an httpOnly, signed cookie set here —
  // never by the client.
  const fromPreLaunchPage = (data.source ?? '').startsWith('/pre-launch')
  if (isGatedProject || fromPreLaunchPage) {
    await grantPreLaunchAccess()
  }

  // Email failures are logged inside and never surface here: the lead is saved,
  // which is the part that must not fail.
  await sendLeadEmails(lead)

  return NextResponse.json({ ok: true, leadId: lead.id })
}
