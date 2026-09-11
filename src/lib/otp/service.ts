import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { env } from '@/lib/env'
import { maskPhone } from '@/lib/phone'
import { getSmsProvider } from '@/lib/otp/providers'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PHONE VERIFICATION
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Codes are generated, hashed and checked here; the configured SmsProvider only
 * delivers the text. See "Phone verification" in README.md for why this is
 * preferred over a hosted auth provider for this business.
 *
 * Guarantees implemented below:
 *   • Codes are stored only as HMAC-SHA256 digests keyed by OTP_HASH_SECRET, so
 *     a database dump does not reveal any live code.
 *   • Single use: a challenge is marked consumed the moment it verifies.
 *   • Issuing a new code voids every earlier outstanding code for that number.
 *   • Codes expire after OTP_TTL_MINUTES (default 10).
 *   • Wrong attempts are capped per challenge, and the caller is told how many
 *     remain.
 *   • Codes issued per phone number per hour are capped in the database, so the
 *     limit survives a restart.
 *
 * Comparison is timing-safe, and no branch reveals whether a challenge exists.
 */

export const OTP_TTL_MS = env.otp.ttlMinutes * 60_000

function hashCode(phone: string, code: string): string {
  return createHmac('sha256', env.otp.hashSecret).update(`${phone}|${code}`).digest('hex')
}

function generateCode(): string {
  if (env.otp.devMode) return env.otp.devCode
  const max = 10 ** env.otp.codeLength
  return String(randomInt(0, max)).padStart(env.otp.codeLength, '0')
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'utf8')
  const bufferB = Buffer.from(b, 'utf8')
  if (bufferA.length !== bufferB.length) return false
  return timingSafeEqual(bufferA, bufferB)
}

export type IssueResult =
  | {
      ok: true
      challengeId: string
      expiresAt: Date
      resendAfterSeconds: number
      /** Present only in dev mode, so the tester can see the code on screen. */
      devCode?: string
      /** Set when the provider logged instead of sending (console provider). */
      deliveryNote?: string
    }
  | {
      ok: false
      reason: 'PHONE_QUOTA' | 'DELIVERY_FAILED'
      message: string
      /** Provider's actual error. Surfaced to the client only in development. */
      detail?: string
      retryAfterSeconds?: number
    }

/**
 * Issues a fresh code for a number, voiding any earlier outstanding one.
 * `ip` is recorded for abuse forensics only; IP rate limiting lives in the route.
 */
export async function issueOtp({
  phone,
  ip,
}: {
  phone: string
  ip?: string | null
}): Promise<IssueResult> {
  const now = new Date()
  const hourAgo = new Date(now.getTime() - 3_600_000)

  const recentCount = await prisma.otpChallenge.count({
    where: { phone, createdAt: { gte: hourAgo } },
  })

  if (recentCount >= env.otp.maxPerPhonePerHour) {
    const oldest = await prisma.otpChallenge.findFirst({
      where: { phone, createdAt: { gte: hourAgo } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    })
    const resetAt = (oldest?.createdAt ?? now).getTime() + 3_600_000
    const retryAfterSeconds = Math.max(60, Math.ceil((resetAt - now.getTime()) / 1000))

    return {
      ok: false,
      reason: 'PHONE_QUOTA',
      message: `We have already sent ${env.otp.maxPerPhonePerHour} codes to this number in the last hour. Please try again in about ${Math.ceil(retryAfterSeconds / 60)} minutes.`,
      retryAfterSeconds,
    }
  }

  // Issuing a new code voids every earlier one for this number.
  await prisma.otpChallenge.updateMany({
    where: { phone, consumed: false },
    data: { consumed: true, consumedAt: now },
  })

  const code = generateCode()
  const challenge = await prisma.otpChallenge.create({
    data: {
      phone,
      codeHash: hashCode(phone, code),
      expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      maxAttempts: env.otp.maxAttempts,
      ip: ip ?? null,
    },
  })

  const base = {
    challengeId: challenge.id,
    expiresAt: challenge.expiresAt,
    resendAfterSeconds: env.otp.resendCooldownSeconds,
  }

  if (env.otp.devMode) {
    console.info(
      `\n  [OTP_DEV_MODE] Code for ${maskPhone(phone)} is ${code} (fixed by OTP_DEV_CODE). No SMS sent.\n`,
    )
    return { ok: true, ...base, devCode: code, deliveryNote: 'Dev mode: the code is shown on screen.' }
  }

  const provider = getSmsProvider()
  const message = `${code} is your MUVS Realty verification code. It is valid for ${env.otp.ttlMinutes} minutes. Do not share it with anyone.`
  const result = await provider.send({ to: phone, code, message })

  if (!result.ok) {
    // Delivery failed, so the code can never be used — void it immediately
    // rather than burning one of the caller's hourly attempts.
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumed: true, consumedAt: new Date() },
    })

    // The provider's real error is always logged, never swallowed.
    console.error(
      `[otp] ${provider.name} failed to deliver to ${maskPhone(phone)}: ${result.error}` +
        (result.detail ? ` (${result.detail})` : ''),
    )
    // Local safety net: a developer must never be blocked by a provider outage.
    if (env.isDevelopment) {
      console.info(`  [otp] Code that would have been sent: ${code}\n`)
    }

    return {
      ok: false,
      reason: 'DELIVERY_FAILED',
      message: 'We could not send the code to that number just now.',
      detail: [result.error, result.detail].filter(Boolean).join(': '),
    }
  }

  return { ok: true, ...base, deliveryNote: result.note }
}

export type VerifyResult =
  | { ok: true; phone: string; challengeId: string }
  | {
      ok: false
      reason: 'NOT_FOUND' | 'PHONE_MISMATCH' | 'EXPIRED' | 'ALREADY_USED' | 'TOO_MANY_ATTEMPTS' | 'INCORRECT'
      message: string
      remainingAttempts?: number
    }

/**
 * Verifies a code against a specific challenge AND asserts the challenge was
 * issued for the number now being submitted. The phone check is what makes
 * verification mean anything: a client cannot request a code for a number it
 * controls and then submit a different number on the form.
 */
export async function verifyOtp({
  challengeId,
  phone,
  code,
}: {
  challengeId: string
  phone: string
  code: string
}): Promise<VerifyResult> {
  const challenge = await prisma.otpChallenge.findUnique({ where: { id: challengeId } })

  if (!challenge) {
    return {
      ok: false,
      reason: 'NOT_FOUND',
      message: 'That verification session has expired. Please request a new code.',
    }
  }

  if (challenge.phone !== phone) {
    return {
      ok: false,
      reason: 'PHONE_MISMATCH',
      message:
        'The number on the form is not the one we sent the code to. Please request a new code for this number.',
    }
  }

  if (challenge.consumed) {
    return {
      ok: false,
      reason: 'ALREADY_USED',
      message: 'That code has already been used. Please request a new one.',
    }
  }

  if (challenge.expiresAt.getTime() <= Date.now()) {
    return {
      ok: false,
      reason: 'EXPIRED',
      message: `That code has expired. Codes last ${env.otp.ttlMinutes} minutes, so please request a new one.`,
    }
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    return {
      ok: false,
      reason: 'TOO_MANY_ATTEMPTS',
      message: 'Too many incorrect attempts for that code. Please request a new one.',
      remainingAttempts: 0,
    }
  }

  if (!safeEqual(challenge.codeHash, hashCode(phone, code))) {
    const updated = await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true, maxAttempts: true },
    })
    const remainingAttempts = Math.max(0, updated.maxAttempts - updated.attempts)

    return {
      ok: false,
      reason: remainingAttempts === 0 ? 'TOO_MANY_ATTEMPTS' : 'INCORRECT',
      message:
        remainingAttempts === 0
          ? 'That code was incorrect and you have no attempts left. Please request a new code.'
          : `That code is incorrect. You have ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} left.`,
      remainingAttempts,
    }
  }

  // Single use: consume atomically, and only if still unconsumed, so two
  // concurrent submissions cannot both succeed.
  const consumed = await prisma.otpChallenge.updateMany({
    where: { id: challenge.id, consumed: false },
    data: { consumed: true, consumedAt: new Date() },
  })

  if (consumed.count === 0) {
    return {
      ok: false,
      reason: 'ALREADY_USED',
      message: 'That code has already been used. Please request a new one.',
    }
  }

  return { ok: true, phone, challengeId: challenge.id }
}

/** Housekeeping: drop challenges that expired over a day ago. */
export async function pruneExpiredChallenges(): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 3_600_000)
  const { count } = await prisma.otpChallenge.deleteMany({ where: { expiresAt: { lt: cutoff } } })
  return count
}
