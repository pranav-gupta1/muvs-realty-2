import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { otpSendSchema } from '@/lib/validators'
import { issueOtp, pruneExpiredChallenges } from '@/lib/otp/service'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { maskPhone } from '@/lib/phone'
import { env } from '@/lib/env'

/**
 * POST /api/otp/send — issues a verification code for a phone number.
 *
 * Bot handling is deliberately silent: a filled honeypot or an impossibly fast
 * submission gets a normal-looking 200 with a throwaway challenge id, so the
 * bot proceeds to /api/leads and is discarded there too, learning nothing about
 * which signal caught it.
 */
export async function POST(request: Request) {
  const ip = clientIp(request.headers)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Malformed request.' }, { status: 400 })
  }

  const parsed = otpSendSchema.safeParse(body)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return NextResponse.json(
      {
        ok: false,
        error: issue?.message ?? 'Please check the number you entered.',
        field: issue?.path[0] === 'phone' ? 'phone' : undefined,
      },
      { status: 400 },
    )
  }

  const { phoneE164, company, startedAt } = parsed.data

  const filledTooFast =
    typeof startedAt === 'number' && Date.now() - startedAt < env.leads.minFillSeconds * 1000
  if (company || filledTooFast) {
    return NextResponse.json({
      ok: true,
      challengeId: randomUUID(),
      maskedPhone: maskPhone(phoneE164),
      resendAfterSeconds: env.otp.resendCooldownSeconds,
    })
  }

  const limit = rateLimit({
    key: `otp:send:${ip}`,
    limit: env.otp.maxSendPerIpPerHour,
    windowMs: 3_600_000,
  })
  if (!limit.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `Too many code requests from this connection. Please try again in about ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
      },
      { status: 429, headers: { 'retry-after': String(limit.retryAfterSeconds) } },
    )
  }

  // Housekeeping, best effort: drop verification records that expired over a
  // day ago, so they are not kept longer than the privacy policy states.
  void pruneExpiredChallenges().catch((error) => {
    console.warn('[otp] pruning expired challenges failed:', error)
  })

  const result = await issueOtp({ phone: phoneE164, ip })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.message,
        // The provider's real error is invaluable while developing and must
        // never reach a visitor in production.
        ...(env.isDevelopment && result.detail ? { detail: result.detail } : {}),
      },
      { status: result.reason === 'PHONE_QUOTA' ? 429 : 502 },
    )
  }

  return NextResponse.json({
    ok: true,
    challengeId: result.challengeId,
    expiresAt: result.expiresAt.toISOString(),
    resendAfterSeconds: result.resendAfterSeconds,
    maskedPhone: maskPhone(phoneE164),
    // Only ever populated when OTP_DEV_MODE is on, which cannot be true in a
    // production build (src/lib/env.ts throws at boot).
    ...(result.devCode ? { devCode: result.devCode } : {}),
    ...(result.deliveryNote ? { note: result.deliveryNote } : {}),
  })
}
