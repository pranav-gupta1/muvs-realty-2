import type { Metadata } from 'next'
import { env } from '@/lib/env'
import { formatIndianPrice } from '@/lib/format'
import type { ResolvedSettings } from '@/lib/site'
import { linkValue } from '@/lib/site'

/**
 * Metadata and structured data. Canonicals always resolve against
 * NEXT_PUBLIC_SITE_URL (https://www.muvsrealty.com), never against localhost,
 * so a page previewed in dev still advertises its production URL.
 */

export const SITE_NAME = 'MUVS Realty'
export const SITE_URL = env.siteUrl

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function buildMetadata({
  title,
  description,
  path,
  image,
  noindex = false,
  type = 'website',
}: {
  title: string
  description: string
  path: string
  image?: string | null
  noindex?: boolean
  type?: 'website' | 'article'
}): Metadata {
  const url = absoluteUrl(path)
  const images = image ? [{ url: absoluteUrl(image), width: 1200, height: 630, alt: title }] : undefined

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'en_IN',
      type,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  }
}

/* ── JSON-LD ────────────────────────────────────────────────────────────── */

type Json = Record<string, unknown>

/** Drops empty values so the emitted JSON-LD has no null/"" properties. */
function compact(input: Json): Json {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (value === null || value === undefined || value === '') return false
      if (Array.isArray(value) && value.length === 0) return false
      return true
    }),
  )
}

/** RealEstateAgent — emitted once, on the home page. */
export function realEstateAgentJsonLd(settings: ResolvedSettings): Json {
  const { contact, socials } = settings

  return compact({
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': `${SITE_URL}/#organization`,
    name: settings.companyName,
    url: SITE_URL,
    description: linkValue(settings.tagline) ?? undefined,
    image: settings.heroImageUrl || undefined,
    telephone: contact.phone ?? undefined,
    email: contact.email ?? undefined,
    address: contact.address
      ? compact({
          '@type': 'PostalAddress',
          streetAddress: contact.address,
          addressRegion: 'Delhi NCR',
          addressCountry: 'IN',
        })
      : undefined,
    areaServed: ['Noida', 'Greater Noida', 'Yamuna Expressway', 'Delhi NCR'].map((name) => ({
      '@type': 'Place',
      name,
    })),
    sameAs: socials.map((social) => social.href),
    openingHours: contact.officeHours ?? undefined,
    priceRange: '₹₹₹',
  })
}

/** Product + Offer — emitted on every listing and project detail page. */
export function listingJsonLd({
  name,
  description,
  path,
  images,
  price,
  availability = 'InStock',
}: {
  name: string
  description: string
  path: string
  images: string[]
  price?: number | null
  availability?: 'InStock' | 'SoldOut' | 'PreOrder'
}): Json {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    url: absoluteUrl(path),
    image: images.map((image) => absoluteUrl(image)),
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: compact({
      '@type': 'Offer',
      url: absoluteUrl(path),
      priceCurrency: 'INR',
      price: price && price > 0 ? Math.round(price) : undefined,
      availability: `https://schema.org/${availability}`,
      ...(price && price > 0 ? {} : { description: formatIndianPrice(null) }),
      seller: { '@id': `${SITE_URL}/#organization` },
    }),
  })
}

/** BreadcrumbList — emitted on every detail page. */
export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function videoJsonLd({
  name,
  description,
  youtubeId,
  uploadDate,
}: {
  name: string
  description: string
  youtubeId: string
  uploadDate: Date
}): Json {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name,
    description,
    thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    uploadDate: uploadDate.toISOString(),
    embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
  })
}
