import { env } from '@/lib/env'
import type { CredentialCheck, SmsProvider, SmsSendResult } from '@/lib/otp/provider'

/**
 * MSG91 — the pragmatic choice for an Indian business. Transactional SMS to
 * Indian numbers costs a fraction of the international gateways, and MSG91
 * handles the TRAI/DLT registration that Indian regulation requires for
 * template-based transactional messages.
 *
 * We use the Flow API with a DLT-approved template that contains a single
 * `##OTP##`-style variable, so the message body is controlled by the approved
 * template rather than by this code.
 */

const FLOW_ENDPOINT = 'https://control.msg91.com/api/v5/flow/'
const BALANCE_ENDPOINT = 'https://control.msg91.com/api/v5/user/balance'

export const msg91Provider: SmsProvider = {
  name: 'msg91',

  describe() {
    return `MSG91 Flow API using template ${env.sms.msg91.templateId || '(unset)'}${
      env.sms.msg91.senderId ? ` from sender ${env.sms.msg91.senderId}` : ''
    }.`
  },

  requiredEnv() {
    return ['MSG91_AUTH_KEY', 'MSG91_TEMPLATE_ID']
  },

  async verifyCredentials(): Promise<CredentialCheck> {
    const { authKey, templateId } = env.sms.msg91
    if (!authKey) return { ok: false, message: 'MSG91_AUTH_KEY is not set.' }
    if (!templateId) return { ok: false, message: 'MSG91_TEMPLATE_ID is not set.' }

    try {
      // Balance lookup validates the auth key without spending a message.
      const response = await fetch(`${BALANCE_ENDPOINT}?type=4`, {
        headers: { authkey: authKey, accept: 'application/json' },
      })
      const body = await response.text()

      if (!response.ok) {
        return {
          ok: false,
          message: `MSG91 rejected the auth key (HTTP ${response.status}).`,
          detail: body.slice(0, 400),
        }
      }
      return { ok: true, message: 'MSG91 auth key accepted.', detail: body.slice(0, 200) }
    } catch (error) {
      return {
        ok: false,
        message: 'Could not reach MSG91.',
        detail: error instanceof Error ? error.message : String(error),
      }
    }
  },

  async send({ to, code }): Promise<SmsSendResult> {
    const { authKey, templateId, senderId } = env.sms.msg91
    if (!authKey || !templateId) {
      return { ok: false, error: 'MSG91 is selected but MSG91_AUTH_KEY / MSG91_TEMPLATE_ID are missing.' }
    }

    try {
      const response = await fetch(FLOW_ENDPOINT, {
        method: 'POST',
        headers: {
          authkey: authKey,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          template_id: templateId,
          ...(senderId ? { sender: senderId } : {}),
          short_url: '0',
          recipients: [
            {
              // MSG91 expects the number without the leading "+".
              mobiles: to.replace(/^\+/, ''),
              OTP: code,
              otp: code,
            },
          ],
        }),
      })

      const text = await response.text()
      if (!response.ok) {
        return {
          ok: false,
          error: 'MSG91 refused the message.',
          detail: text.slice(0, 400),
          status: response.status,
        }
      }

      // MSG91 returns HTTP 200 with { type: "error" } for template problems.
      try {
        const json = JSON.parse(text) as { type?: string; message?: string; request_id?: string }
        if (json.type && json.type !== 'success') {
          return { ok: false, error: 'MSG91 refused the message.', detail: json.message ?? text }
        }
        return { ok: true, providerMessageId: json.request_id }
      } catch {
        return { ok: true }
      }
    } catch (error) {
      return {
        ok: false,
        error: 'Could not reach MSG91.',
        detail: error instanceof Error ? error.message : String(error),
      }
    }
  },
}
