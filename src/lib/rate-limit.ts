/**
 * Fixed-window rate limiter held in process memory.
 *
 * Deliberately dependency-free and good enough for a single long-lived Node
 * process, which is how this app runs locally and on a VPS. It is NOT correct
 * on serverless (every lambda gets its own memory) or behind multiple
 * instances — see "Deploying to Vercel" in README.md, which covers swapping
 * this for Upstash Redis. The call signature is designed so only this file
 * changes.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

let lastSweep = 0
function sweep(now: number) {
  // Amortised cleanup so the map cannot grow without bound.
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export type RateLimitResult = {
  ok: boolean
  limit: number
  remaining: number
  resetAt: number
  retryAfterSeconds: number
}

export type RateLimitOptions = {
  key: string
  limit: number
  windowMs: number
  /** Check the budget without spending it. */
  peek?: boolean
}

export function rateLimit({ key, limit, windowMs, peek = false }: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  sweep(now)

  let bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs }
    buckets.set(key, bucket)
  }

  const wouldExceed = bucket.count >= limit
  if (!peek && !wouldExceed) bucket.count += 1

  return {
    ok: !wouldExceed,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  }
}

/** Gives a request its budget back — used when a downstream call fails. */
export function refundRateLimit(key: string) {
  const bucket = buckets.get(key)
  if (bucket && bucket.count > 0) bucket.count -= 1
}

/** Test/dev helper. */
export function resetRateLimits() {
  buckets.clear()
}

const IP_HEADERS = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'] as const

/** Best-effort client IP. Falls back to a constant so limits still apply. */
export function clientIp(headers: Headers): string {
  for (const header of IP_HEADERS) {
    const value = headers.get(header)
    if (value) {
      const first = value.split(',')[0]?.trim()
      if (first) return first
    }
  }
  return '127.0.0.1'
}
