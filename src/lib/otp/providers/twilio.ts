import { env } from '@/lib/env'
import type { CredentialCheck, SmsProvider, SmsSendResult } from '@/lib/otp/provider'

/**
 * Twilio Programmable SMS. More expensive than MSG91 for Indian traffic, but
 * the better choice when NRI numbers (US, UAE, UK, Singapore…) dominate, since
 * deliverability and reporting outside India are stronger.
 *
 * Note this uses Programmable SMS, not Twilio Verify: the code itself is still
 * generated and checked by this app, which keeps the verification record in our
 * own database where the lead pipeline can enforce it.
 */

const API_BASE = 'https://api.twilio.com/2010-04-01'

function authHeader(): string {
  const { accountSid, authToken } = env.sms.twilio
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`
}

export const twilioProvider: SmsProvider = {
  name: 'twilio',

  describe() {
    const { messagingServiceSid, fromNumber } = env.sms.twilio
    const origin = messagingServiceSid
      ? `messaging service ${messagingServiceSid}`
      : fromNumber || '(no sender configured)'
    return `Twilio Programmable SMS from ${origin}.`
  },

  requiredEnv() {
    return [
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID',
    ]
  },

  async verifyCredentials(): Promise<CredentialCheck> {
    const { accountSid, authToken, fromNumber, messagingServiceSid } = env.sms.twilio
    if (!accountSid || !authToken) {
      return { ok: false, message: 'TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN are not set.' }
    }
    if (!fromNumber && !messagingServiceSid) {
      return {
        ok: false,
        message: 'Set either TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID.',
      }
    }

    try {
      // Fetching the account validates the credentials without sending an SMS.
      const response = await fetch(`${API_BASE}/Accounts/${accountSid}.json`, {
        headers: { authorization: authHeader() },
      })
      const text = await response.text()

      if (!response.ok) {
        return {
          ok: false,
          message: `Twilio rejected the credentials (HTTP ${response.status}).`,
          detail: text.slice(0, 400),
        }
      }

      const account = JSON.parse(text) as { friendly_name?: string; status?: string }
      return {
        ok: account.status === 'active',
        message:
          account.status === 'active'
            ? `Twilio account "${account.friendly_name}" is active.`
            : `Twilio account status is "${account.status}".`,
      }
    } catch (error) {
      return {
        ok: false,
        message: 'Could not reach Twilio.',
        detail: error instanceof Error ? error.message : String(error),
      }
    }
  },

  async send({ to, message }): Promise<SmsSendResult> {
    const { accountSid, authToken, fromNumber, messagingServiceSid } = env.sms.twilio
    if (!accountSid || !authToken || (!fromNumber && !messagingServiceSid)) {
      return { ok: false, error: 'Twilio is selected but its credentials are incomplete.' }
    }

    const params = new URLSearchParams({ To: to, Body: message })
    if (messagingServiceSid) params.set('MessagingServiceSid', messagingServiceSid)
    else params.set('From', fromNumber)

    try {
      const response = await fetch(`${API_BASE}/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          authorization: authHeader(),
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: params,
      })

      const text = await response.text()
      if (!response.ok) {
        let detail = text.slice(0, 400)
        try {
          const json = JSON.parse(text) as { message?: string; code?: number }
          if (json.message) detail = `${json.message}${json.code ? ` (code ${json.code})` : ''}`
        } catch {
          /* keep the raw body */
        }
        return {
          ok: false,
          error: 'Twilio refused the message.',
          detail,
          status: response.status,
        }
      }

      const json = JSON.parse(text) as { sid?: string }
      return { ok: true, providerMessageId: json.sid }
    } catch (error) {
      return {
        ok: false,
        error: 'Could not reach Twilio.',
        detail: error instanceof Error ? error.message : String(error),
      }
    }
  },
}
