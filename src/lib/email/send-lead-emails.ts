import type { Lead } from '@prisma/client'
import { sendMail } from '@/lib/email/mailer'
import { renderLeadAutoResponse } from '@/lib/email/templates/lead-autoresponse'
import { renderLeadInternalNotification } from '@/lib/email/templates/lead-internal'
import { env } from '@/lib/env'
import { getSiteSettings } from '@/lib/site'

/**
 * Fires both lead emails. Every failure is swallowed and logged: the lead row
 * is already committed by the time this runs, and no email problem may turn a
 * captured lead into an error page.
 */
export async function sendLeadEmails(lead: Lead): Promise<void> {
  try {
    const settings = await getSiteSettings()

    const internal = renderLeadInternalNotification({ lead, companyName: settings.companyName })
    const tasks: Array<Promise<unknown>> = [
      sendMail({
        to: env.smtp.leadsInbox,
        ...internal,
        replyTo: lead.email || undefined,
      }),
    ]

    if (lead.email) {
      tasks.push(sendMail({ to: lead.email, ...renderLeadAutoResponse({ lead, settings }) }))
    }

    await Promise.allSettled(tasks)
  } catch (error) {
    console.error('[email] Lead notification pipeline failed:', error)
  }
}
