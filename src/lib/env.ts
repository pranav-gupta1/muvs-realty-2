/**
 * Environment access, parsed once and typed. Nothing else in the app reads
 * process.env directly (except NEXT_PUBLIC_* values inlined into client code),
 * so misconfiguration surfaces here rather than as a runtime surprise deep in a
 * request handler.
 */

function bool(value: string | undefined, fallback = false): boolean {
  if (value === undefined || value === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

function int(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function str(value: string | undefined): string {
  return (value ?? '').trim()
}

const nodeEnv = process.env.NODE_ENV ?? 'development'
const isProduction = nodeEnv === 'production'

/** Canonical public origin — used for metadata, sitemap and OG URLs. */
const siteUrl = (str(process.env.NEXT_PUBLIC_SITE_URL) || 'https://www.muvsrealty.com').replace(
  /\/+$/,
  '',
)

const otpDevMode = bool(process.env.OTP_DEV_MODE, !isProduction)

/**
 * `next build` evaluates every module with NODE_ENV=production while only
 * compiling — it is not serving traffic. Refusing there would make
 * `npm run build` impossible with a development .env, so the guards below apply
 * to a serving process only.
 *
 * On a real production server the throw fires the first time anything imports
 * this module — in practice, the first request to /api/otp/send. The site stays
 * up, verification refuses loudly, and the reason is in the server log. It is
 * therefore impossible to hand out the fixed development code in production.
 */
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'
const isServingProduction = isProduction && !isBuildPhase

// A production server that still hands out a fixed OTP is a security hole, not
// a convenience. Fail loudly at boot rather than silently accepting 123456.
if (isServingProduction && otpDevMode) {
  throw new Error(
    'OTP_DEV_MODE is enabled in production. Set OTP_DEV_MODE=false and configure SMS_PROVIDER.',
  )
}

const otpHashSecret = str(process.env.OTP_HASH_SECRET)
if (isServingProduction && otpHashSecret.length < 16) {
  throw new Error('OTP_HASH_SECRET must be set to a long random value in production.')
}

const smtpHost = str(process.env.SMTP_HOST)

export const env = {
  nodeEnv,
  isProduction,
  isDevelopment: !isProduction,

  siteUrl,
  /** Where THIS instance is reachable — localhost in dev, the domain in prod. */
  appOrigin: isProduction ? siteUrl : str(process.env.AUTH_URL) || 'http://localhost:3000',

  otp: {
    devMode: otpDevMode,
    devCode: str(process.env.OTP_DEV_CODE) || '123456',
    hashSecret: otpHashSecret || 'muvs-dev-only-otp-secret-do-not-use-in-production',
    codeLength: 6,
    ttlMinutes: int(process.env.OTP_TTL_MINUTES, 10),
    maxAttempts: int(process.env.OTP_MAX_ATTEMPTS, 5),
    /** Codes a single phone number may be issued per rolling hour. */
    maxPerPhonePerHour: int(process.env.OTP_MAX_PER_PHONE_PER_HOUR, 5),
    /** Send requests allowed from one IP per rolling hour. */
    maxSendPerIpPerHour: int(process.env.OTP_MAX_SEND_PER_IP_PER_HOUR, 15),
    /** Seconds before the "Resend code" button re-enables. */
    resendCooldownSeconds: int(process.env.OTP_RESEND_COOLDOWN_SECONDS, 60),
  },

  sms: {
    provider: (str(process.env.SMS_PROVIDER) || 'console').toLowerCase(),
    msg91: {
      authKey: str(process.env.MSG91_AUTH_KEY),
      templateId: str(process.env.MSG91_TEMPLATE_ID),
      senderId: str(process.env.MSG91_SENDER_ID),
    },
    twilio: {
      accountSid: str(process.env.TWILIO_ACCOUNT_SID),
      authToken: str(process.env.TWILIO_AUTH_TOKEN),
      fromNumber: str(process.env.TWILIO_FROM_NUMBER),
      messagingServiceSid: str(process.env.TWILIO_MESSAGING_SERVICE_SID),
    },
  },

  smtp: {
    configured: smtpHost.length > 0,
    host: smtpHost,
    port: int(process.env.SMTP_PORT, 465),
    secure: bool(process.env.SMTP_SECURE, true),
    user: str(process.env.SMTP_USER),
    pass: str(process.env.SMTP_PASS),
    from: str(process.env.SMTP_FROM) || 'MUVS Realty <info@muvsrealty.com>',
    leadsInbox: str(process.env.LEADS_INBOX) || 'info@muvsrealty.com',
  },

  upload: {
    driver: (str(process.env.UPLOAD_DRIVER) || 'local').toLowerCase(),
    maxBytes: int(process.env.UPLOAD_MAX_MB, 8) * 1024 * 1024,
  },

  admin: {
    email: str(process.env.ADMIN_EMAIL) || 'admin@muvsrealty.com',
    password: str(process.env.ADMIN_PASSWORD) || 'muvs@admin123',
    name: str(process.env.ADMIN_NAME) || 'MUVS Admin',
  },

  leads: {
    /** Lead submissions allowed from one IP per rolling hour. */
    maxPerIpPerHour: int(process.env.LEAD_MAX_PER_IP_PER_HOUR, 5),
    /** Submissions faster than this are treated as bots. */
    minFillSeconds: int(process.env.LEAD_MIN_FILL_SECONDS, 3),
  },
} as const
