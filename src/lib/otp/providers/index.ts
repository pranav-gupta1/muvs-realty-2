import { env } from '@/lib/env'
import type { SmsProvider } from '@/lib/otp/provider'
import { consoleProvider } from '@/lib/otp/providers/console'
import { msg91Provider } from '@/lib/otp/providers/msg91'
import { twilioProvider } from '@/lib/otp/providers/twilio'

export const SMS_PROVIDERS: Record<string, SmsProvider> = {
  console: consoleProvider,
  msg91: msg91Provider,
  twilio: twilioProvider,
}

/**
 * Resolves SMS_PROVIDER. An unknown value falls back to the console provider
 * with a warning rather than breaking the lead form — a misconfigured provider
 * must never cost a lead.
 */
export function getSmsProvider(): SmsProvider {
  const provider = SMS_PROVIDERS[env.sms.provider]
  if (provider) return provider

  console.warn(
    `[sms] Unknown SMS_PROVIDER "${env.sms.provider}". ` +
      `Expected one of: ${Object.keys(SMS_PROVIDERS).join(', ')}. Falling back to "console".`,
  )
  return consoleProvider
}
