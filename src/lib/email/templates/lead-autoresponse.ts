import type { Lead } from '@prisma/client'
import {
  BRAND,
  button,
  detailTable,
  emailLayout,
  escapeHtml,
  goldRule,
  heading,
  paragraph,
} from '@/lib/email/templates/layout'
import { BudgetRange, InterestType, PropertyLocation } from '@/lib/taxonomy'
import { formatPhoneForDisplay } from '@/lib/phone'
import { buildWhatsAppLink, type ResolvedSettings } from '@/lib/site'

/**
 * Branded auto-response sent to the person who submitted the form. Thanks them
 * by name, restates what they asked for so they know it was captured correctly,
 * and gives every way of reaching us. Placeholder contact details are omitted
 * rather than rendered as dead links.
 */
export function renderLeadAutoResponse({
  lead,
  settings,
}: {
  lead: Lead
  settings: ResolvedSettings
}): { subject: string; html: string; text: string } {
  const firstName = lead.name.trim().split(/\s+/)[0] || 'there'
  const { contact, socials } = settings

  const summary = [
    lead.relatedTitle ? { label: 'Enquiry about', value: lead.relatedTitle } : null,
    lead.propertyTypeInterest
      ? { label: 'Looking for', value: InterestType.label(lead.propertyTypeInterest) }
      : null,
    lead.budgetRange ? { label: 'Budget', value: BudgetRange.label(lead.budgetRange) } : null,
    lead.preferredLocation
      ? { label: 'Location', value: PropertyLocation.label(lead.preferredLocation) }
      : null,
    { label: 'Verified number', value: formatPhoneForDisplay(lead.phone) },
  ].filter((row): row is { label: string; value: string } => row !== null)

  const whatsappLink = buildWhatsAppLink(
    contact.whatsapp,
    `Hi ${settings.companyName}, I just submitted an enquiry on your website.`,
  )

  const contactLines = [
    contact.phone
      ? `<a href="${escapeHtml(contact.telHref!)}" style="color:${BRAND.maroon700};text-decoration:none;font-weight:600;">${escapeHtml(contact.phone)}</a>`
      : null,
    contact.email
      ? `<a href="${escapeHtml(contact.mailtoHref!)}" style="color:${BRAND.maroon700};text-decoration:none;font-weight:600;">${escapeHtml(contact.email)}</a>`
      : null,
  ].filter(Boolean)

  const body = [
    heading(`Thank you, ${firstName}.`),
    paragraph(
      `We have received your enquiry and verified your number. A ${escapeHtml(settings.companyName)} advisor will call you shortly, usually within one working day.`,
    ),
    paragraph(`<strong style="color:${BRAND.maroon900};">Here is what you told us:</strong>`),
    detailTable(summary),
    lead.requirements
      ? paragraph(
          `<span style="color:${BRAND.ink500};">Your requirements:</span><br>${escapeHtml(lead.requirements)}`,
        )
      : '',
    whatsappLink ? button(whatsappLink, 'Chat with us on WhatsApp') : '',
    goldRule(),
    contactLines.length > 0
      ? paragraph(`Prefer to reach us directly? ${contactLines.join(' &nbsp;·&nbsp; ')}`)
      : '',
    contact.officeHours
      ? paragraph(
          `<span style="color:${BRAND.ink500};font-size:13px;">Office hours: ${escapeHtml(contact.officeHours)}</span>`,
        )
      : '',
  ]
    .filter(Boolean)
    .join('\n')

  const socialHtml =
    socials.length > 0
      ? `<div style="margin-top:10px;">${socials
          .map(
            (s) =>
              `<a href="${escapeHtml(s.href)}" style="color:${BRAND.gold200};text-decoration:underline;margin-right:12px;">${escapeHtml(s.name)}</a>`,
          )
          .join('')}</div>`
      : ''

  const footer = [
    `<strong style="color:#ffffff;">${escapeHtml(settings.companyName)}</strong>`,
    contact.address ? escapeHtml(contact.address) : '',
    contact.reraNumber ? `RERA: ${escapeHtml(contact.reraNumber)}` : '',
    socialHtml,
  ]
    .filter(Boolean)
    .join('<br>')

  const text = [
    `Thank you, ${firstName}.`,
    '',
    `We have received your enquiry and verified your number. A ${settings.companyName} advisor will call you shortly.`,
    '',
    ...summary.map((row) => `${row.label}: ${row.value}`),
    lead.requirements ? `\nYour requirements: ${lead.requirements}` : '',
    '',
    contact.phone ? `Phone: ${contact.phone}` : '',
    contact.email ? `Email: ${contact.email}` : '',
    whatsappLink ? `WhatsApp: ${whatsappLink}` : '',
    contact.reraNumber ? `RERA: ${contact.reraNumber}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  return {
    subject: `${settings.companyName}: thank you for your enquiry, ${firstName}`,
    html: emailLayout({
      title: `Thank you for your enquiry`,
      preheader: `We have your enquiry and will call you shortly.`,
      companyName: settings.companyName,
      body,
      footer,
    }),
    text,
  }
}
