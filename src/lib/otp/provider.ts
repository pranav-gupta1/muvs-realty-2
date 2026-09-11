/**
 * SMS delivery is the only part of phone verification that is outsourced. The
 * code generation, hashing, expiry, attempt caps and the lead-time check that
 * the verified number matches the submitted number all stay in this app (see
 * src/lib/otp/service.ts), so swapping providers never touches the form or the
 * lead pipeline.
 */

export type SmsSendSuccess = { ok: true; providerMessageId?: string; note?: string }
export type SmsSendFailure = { ok: false; error: string; detail?: string; status?: number }
export type SmsSendResult = SmsSendSuccess | SmsSendFailure

export type CredentialCheck = {
  ok: boolean
  /** Shown by `npm run check:sms`. */
  message: string
  detail?: string
}

export interface SmsProvider {
  readonly name: string
  /** One line describing what this provider is configured to do. */
  describe(): string
  /** Which env vars must be set for this provider to work. */
  requiredEnv(): string[]
  /**
   * Validates credentials against the provider's API without spending a
   * message. Called by the doctor script.
   */
  verifyCredentials(): Promise<CredentialCheck>
  send(params: { to: string; code: string; message: string }): Promise<SmsSendResult>
}
