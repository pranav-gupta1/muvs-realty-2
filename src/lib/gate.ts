import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'

/**
 * Pre-launch gating.
 *
 * Gated projects show only a teaser publicly; full details and the brochure
 * require an OTP-verified lead. The unlock is an httpOnly, signed cookie set by
 * the server after verification, and the gated content is never sent to the
 * browser until the server has checked it — so the gate cannot be lifted from
 * devtools by flipping a flag or deleting an overlay.
 */

const COOKIE_NAME = 'muvs_unlock'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

function sign(payload: string): string {
  return createHmac('sha256', env.otp.hashSecret).update(payload).digest('hex').slice(0, 32)
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB)
}

/** Cookie value: "<issuedAt>.<signature>". */
function buildValue(): string {
  const issuedAt = String(Date.now())
  return `${issuedAt}.${sign(issuedAt)}`
}

function isValidValue(value: string | undefined): boolean {
  if (!value) return false
  const [issuedAt, signature] = value.split('.')
  if (!issuedAt || !signature) return false
  if (!safeEqual(signature, sign(issuedAt))) return false

  const age = Date.now() - Number(issuedAt)
  return Number.isFinite(age) && age >= 0 && age <= MAX_AGE_SECONDS * 1000
}

/** Called from the lead route after a successful verification. */
export async function grantPreLaunchAccess(): Promise<void> {
  const store = await cookies()
  store.set(COOKIE_NAME, buildValue(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

/** Server-side check. Gated content is only queried/rendered when this is true. */
export async function hasPreLaunchAccess(): Promise<boolean> {
  const store = await cookies()
  return isValidValue(store.get(COOKIE_NAME)?.value)
}

export async function revokePreLaunchAccess(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}
