import { cache } from 'react'
import type { SiteSettings } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { readStringList } from '@/lib/json'
import { toWhatsAppNumber } from '@/lib/phone'

/**
 * Content placeholders seeded as "[FILL: ...]". They are intentionally visible
 * in body copy so the owner can spot what still needs writing, but anything
 * that would become an href — phone, email, WhatsApp, socials — is treated as
 * absent so the UI hides the element instead of rendering a broken link.
 */
export function isPlaceholder(value: string | null | undefined): boolean {
  return !value || /^\s*\[FILL/i.test(value)
}

/** Returns the value only if it is real content; otherwise null. */
export function linkValue(value: string | null | undefined): string | null {
  return isPlaceholder(value) ? null : (value as string).trim()
}

export const NAV_LINKS = [
  { href: '/projects', label: 'Projects' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/pre-launch', label: 'Pre-Launch' },
  { href: '/about', label: 'About' },
  { href: '/certifications', label: 'Certifications' },
  { href: '/videos', label: 'Videos' },
  { href: '/contact', label: 'Contact' },
] as const

export const DEFAULT_SETTINGS: SiteSettings = {
  id: 'default',
  companyName: 'MUVS Realty',
  tagline: 'Residential and commercial property advisors across Delhi NCR',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  officeHours: '',
  reraNumber: '',
  instagram: '',
  facebook: '',
  linkedin: '',
  youtube: '',
  heroTitle: 'Buying property in Noida or Greater Noida? Talk to us first.',
  heroSubtitle:
    'Homes, plots and commercial space across Noida, Greater Noida and the Yamuna Expressway. We check the title and approvals before you pay, and handle the price negotiation for you.',
  heroImageUrl: '',
  directorName: '',
  directorDesignation: 'Director, MUVS Realty',
  directorBio: '',
  directorQuote: '',
  directorImageUrl: '',
  directorCredentials: '[]',
  aboutStory: '',
  aboutMission: '',
  mapEmbedUrl: '',
  statYears: 0,
  statProperties: 0,
  statCities: 0,
  statClients: 0,
  updatedAt: new Date(),
}

export type SocialLink = { key: string; name: string; href: string }

export type ResolvedSettings = SiteSettings & {
  /** Contact fields with placeholders resolved to null. */
  contact: {
    phone: string | null
    whatsapp: string | null
    email: string | null
    address: string | null
    officeHours: string | null
    reraNumber: string | null
    telHref: string | null
    mailtoHref: string | null
  }
  socials: SocialLink[]
  directorCredentialList: string[]
}

export function resolveSettings(row: SiteSettings | null): ResolvedSettings {
  const settings = row ?? DEFAULT_SETTINGS

  const phone = linkValue(settings.phone)
  const whatsapp = linkValue(settings.whatsapp)
  const email = linkValue(settings.email)

  const socials: SocialLink[] = (
    [
      { key: 'instagram', name: 'Instagram', value: settings.instagram },
      { key: 'facebook', name: 'Facebook', value: settings.facebook },
      { key: 'linkedin', name: 'LinkedIn', value: settings.linkedin },
      { key: 'youtube', name: 'YouTube', value: settings.youtube },
    ] as const
  ).flatMap(({ key, name, value }) => {
    const href = linkValue(value)
    return href ? [{ key, name, href }] : []
  })

  return {
    ...settings,
    contact: {
      phone,
      whatsapp,
      email,
      address: linkValue(settings.address),
      officeHours: linkValue(settings.officeHours),
      reraNumber: linkValue(settings.reraNumber),
      telHref: phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : null,
      mailtoHref: email ? `mailto:${email}` : null,
    },
    socials,
    directorCredentialList: readStringList(settings.directorCredentials),
  }
}

/**
 * Deduped per request. Falls back to defaults so every page still renders on a
 * database that has not been seeded yet.
 */
export const getSiteSettings = cache(async (): Promise<ResolvedSettings> => {
  try {
    const row = await prisma.siteSettings.findUnique({ where: { id: 'default' } })
    return resolveSettings(row)
  } catch {
    return resolveSettings(null)
  }
})

/** wa.me deep link with a prefilled message. Null when no number is configured. */
export function buildWhatsAppLink(
  whatsapp: string | null | undefined,
  message?: string,
): string | null {
  const number = toWhatsAppNumber(linkValue(whatsapp))
  if (!number) return null
  const base = `https://wa.me/${number}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
