import nodemailer, { type Transporter } from 'nodemailer'
import { env } from '@/lib/env'

/**
 * Transactional email.
 *
 * Two rules this module enforces, because a lead is worth more than an email:
 *   1. If SMTP is not configured, messages are pretty-printed to the server
 *      console instead of sent. Nothing crashes.
 *   2. Sending never throws. `sendMail` always resolves; failures are logged
 *      and reported in the return value, and the caller ignores them because
 *      the lead is already saved.
 */

export type MailMessage = {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
}

export type MailResult =
  | { ok: true; transport: 'smtp' | 'console'; messageId?: string }
  | { ok: false; transport: 'smtp'; error: string }

let cachedTransport: Transporter | null = null

function getTransport(): Transporter {
  if (cachedTransport) return cachedTransport
  cachedTransport = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  })
  return cachedTransport
}

function logToConsole(message: MailMessage, reason: string) {
  const rule = '═'.repeat(64)
  console.info(
    [
      '',
      rule,
      `  EMAIL NOT SENT (${reason}). Printed below instead.`,
      rule,
      `  To:      ${message.to}`,
      `  From:    ${env.smtp.from}`,
      `  Subject: ${message.subject}`,
      message.replyTo ? `  Reply-To: ${message.replyTo}` : '',
      '─'.repeat(64),
      message.text,
      rule,
      '',
    ]
      .filter(Boolean)
      .join('\n'),
  )
}

export async function sendMail(message: MailMessage): Promise<MailResult> {
  if (!env.smtp.configured) {
    logToConsole(message, 'SMTP_HOST is not set')
    return { ok: true, transport: 'console' }
  }

  try {
    const info = await getTransport().sendMail({
      from: env.smtp.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: message.replyTo,
    })
    return { ok: true, transport: 'smtp', messageId: info.messageId }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.error(`[email] Failed to send "${message.subject}" to ${message.to}: ${detail}`)
    // Still show the developer what would have gone out.
    if (env.isDevelopment) logToConsole(message, 'SMTP send failed')
    return { ok: false, transport: 'smtp', error: detail }
  }
}

/** Verifies the SMTP connection — used by the admin settings page and scripts. */
export async function verifySmtp(): Promise<{ ok: boolean; message: string }> {
  if (!env.smtp.configured) {
    return { ok: false, message: 'SMTP_HOST is not set, so emails are logged to the console instead.' }
  }
  try {
    await getTransport().verify()
    return { ok: true, message: `Connected to ${env.smtp.host}:${env.smtp.port}.` }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) }
  }
}
