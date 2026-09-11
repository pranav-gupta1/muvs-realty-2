import type { Lead } from '@prisma/client'
import { BudgetRange, InterestType, LeadStatus, PropertyLocation } from '@/lib/taxonomy'
import { formatPhoneForDisplay, toWhatsAppNumber } from '@/lib/phone'
import { formatDateTime } from '@/lib/format'
import { env } from '@/lib/env'
import { escapeHtml } from '@/lib/email/templates/layout'

/**
 * Internal notification. Deliberately plain — this one is read on a phone
 * between site visits, so every field is present, the number is tappable, and
 * the admin link goes straight to the lead.
 */
export function renderLeadInternalNotification({
  lead,
  companyName,
}: {
  lead: Lead
  companyName: string
}): { subject: string; html: string; text: string } {
  const adminUrl = `${env.appOrigin}/admin/leads?q=${encodeURIComponent(lead.phone)}`
  const displayPhone = formatPhoneForDisplay(lead.phone)
  const whatsappUrl = `https://wa.me/${toWhatsAppNumber(lead.phone)}`

  const rows: Array<[string, string]> = [
    ['Name', lead.name],
    ['Phone', `${displayPhone} (${lead.phone})`],
    ['Phone verified', lead.phoneVerified ? 'Yes (confirmed by one-time code)' : 'No'],
    ['Email', lead.email || 'Not provided'],
    ['Interested in', lead.propertyTypeInterest ? InterestType.label(lead.propertyTypeInterest) : 'Not provided'],
    ['Budget', lead.budgetRange ? BudgetRange.label(lead.budgetRange) : 'Not provided'],
    ['Preferred location', lead.preferredLocation ? PropertyLocation.label(lead.preferredLocation) : 'Not provided'],
    ['Requirements', lead.requirements || 'Not provided'],
    ['Source page', lead.source],
    ['Related listing', lead.relatedTitle ? `${lead.relatedTitle} (${lead.relatedType ?? 'type not recorded'})` : 'None (general enquiry)'],
    ['Status', LeadStatus.label(lead.status)],
    ['Received', formatDateTime(lead.createdAt)],
    ['Lead ID', lead.id],
  ]

  const text = [
    `New ${lead.phoneVerified ? 'VERIFIED ' : ''}lead for ${companyName}`,
    '='.repeat(48),
    ...rows.map(([label, value]) => `${label.padEnd(20)} ${value}`),
    '',
    `Call:     tel:${lead.phone}`,
    `WhatsApp: ${whatsappUrl}`,
    `Admin:    ${adminUrl}`,
  ].join('\n')

  const html = `<div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.7;color:#1A1A1A;">
  <p style="margin:0 0 12px;font-size:15px;"><strong>New ${lead.phoneVerified ? 'verified ' : ''}lead for ${escapeHtml(companyName)}</strong></p>
  <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    ${rows
      .map(
        ([label, value]) =>
          `<tr><td style="padding:3px 16px 3px 0;color:#6B6B6B;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:3px 0;">${escapeHtml(value)}</td></tr>`,
      )
      .join('')}
  </table>
  <p style="margin:16px 0 0;">
    <a href="tel:${escapeHtml(lead.phone)}" style="color:#7A1220;">Call ${escapeHtml(displayPhone)}</a> &nbsp;·&nbsp;
    <a href="${escapeHtml(whatsappUrl)}" style="color:#7A1220;">WhatsApp</a> &nbsp;·&nbsp;
    <a href="${escapeHtml(adminUrl)}" style="color:#7A1220;">Open in admin</a>
  </p>
</div>`

  return {
    subject: `${lead.phoneVerified ? '[Verified] ' : ''}New lead: ${lead.name}, ${displayPhone}`,
    html,
    text,
  }
}
