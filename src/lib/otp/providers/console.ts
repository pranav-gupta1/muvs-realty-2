import { env } from '@/lib/env'
import { maskPhone } from '@/lib/phone'
import type { CredentialCheck, SmsProvider, SmsSendResult } from '@/lib/otp/provider'

/**
 * Default provider. Needs no account and no credentials, so the whole
 * verification flow — including rate limits, attempt caps and expiry — is
 * testable on localhost. The code is printed to the server log; when
 * OTP_DEV_MODE is on it is also returned to the browser and shown on screen.
 */
export const consoleProvider: SmsProvider = {
  name: 'console',

  describe() {
    return 'Prints the verification code to the server log. No account or credentials required.'
  },

  requiredEnv() {
    return []
  },

  async verifyCredentials(): Promise<CredentialCheck> {
    return {
      ok: true,
      message: 'No credentials needed. Codes are written to the server console.',
    }
  },

  async send({ to, code, message }): Promise<SmsSendResult> {
    const banner = '─'.repeat(58)
    console.info(
      [
        '',
        `┌${banner}┐`,
        `  SMS (console provider) → ${maskPhone(to)}`,
        `  VERIFICATION CODE: ${code}`,
        `  ${message}`,
        `  Full number: ${to}`,
        `└${banner}┘`,
        '',
      ].join('\n'),
    )
    return { ok: true, providerMessageId: `console-${Date.now()}`, note: 'Logged to server console' }
  },
}

/** Dev mode never sends anything; it only makes the fixed code discoverable. */
export function devModeNotice(code: string, to: string) {
  console.info(
    `\n  [OTP_DEV_MODE] Verification code for ${maskPhone(to)} is ${code} ` +
      `(fixed by OTP_DEV_CODE). No SMS was sent.\n`,
  )
  return env.otp.devCode
}
