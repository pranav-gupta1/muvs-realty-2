import { prisma } from '@/lib/prisma'

/**
 * Content the seed ships as stand-ins until the owner supplies the real thing.
 *
 * Some of it reads as a factual claim about the business (the trust-strip
 * numbers, the NAR / ISO / empanelment certifications), so it is tracked here
 * and surfaced on the admin dashboard. None of it may go live unverified.
 *
 * Detection is by the identifiers the seed creates: replace a row through
 * /admin, or delete it, and it stops being reported.
 */

/** Trust-strip figures written by prisma/seed.ts. Imported by the seed itself. */
export const SAMPLE_STATS = {
  statYears: 12,
  statProperties: 480,
  statCities: 6,
  statClients: 1200,
} as const

/** The seeded hero photo, matched on the Unsplash photo id. */
export const SAMPLE_HERO_PHOTO_ID = 'photo-1600585154340-be6161a56a0c'

/**
 * Certifications the seed invents. The RERA registration is NOT in this list:
 * it is a real row awaiting the owner's number, handled by the [FILL] flow.
 */
export const UNVERIFIED_CERTIFICATION_SLUGS = [
  'nar-india-membership',
  'iso-9001-2015',
  'authority-empanelment',
]

/** Public YouTube videos from other channels, used so the gallery is not empty. */
export const SAMPLE_VIDEO_IDS = [
  'Fsaw4JuigaA',
  '7rqekSIXyPU',
  '7Dt0wTrS_1A',
  'woKNztAhYgc',
  'cD8jihkIFqk',
  'AlMiEsMBk00',
]

export const SAMPLE_TESTIMONIAL_SLUGS = [
  'rajeev-menon',
  'anita-sharma',
  'harpreet-singh-gill',
  'meera-krishnan',
  'vikram-bhatia',
]

export const SAMPLE_PROJECT_SLUGS = [
  'aarvam-skyline-yamuna-expressway',
  'kesar-plaza-sector-18-noida',
  'meridian-one-sector-150-noida',
  'northgate-business-park-noida',
  'sarovar-vistas-greater-noida',
  'vanya-estate-plots-yeida',
  'verdant-villas-omicron-greater-noida',
]

export const SAMPLE_INVENTORY_SLUGS = [
  '12-bigha-agricultural-land-dankaur',
  '2-5-acre-orchard-land-sikandrabad-road',
  '2-bhk-sector-16c-greater-noida-west',
  '3-bhk-sector-150-noida-resale',
  '3-bhk-villa-yamuna-expressway-sector-22',
  '4-acre-farmland-jewar-yamuna-expressway',
  '4-bhk-sector-128-noida-expressway',
  '4-bhk-villa-omicron-1-greater-noida',
  '5-bhk-villa-sector-135-noida',
  'gnida-omicron-3-plot-162-sqyd',
  'industrial-plot-ecotech-3-greater-noida',
  'industrial-shed-8000-sqft-surajpur',
  'noida-sector-51-plot-300-sqyd',
  'office-space-sector-62-noida-1200-sqft',
  'retail-shop-sector-18-noida-market',
  'showroom-alpha-1-greater-noida-1800-sqft',
  'warehouse-shed-20000-sqft-site-5-kasna',
  'yeida-sector-20-residential-plot-200-sqyd',
]

export type SampleGroup = {
  key: string
  label: string
  /** How many sample rows remain, or null where the item is not countable. */
  count: number | null
  note: string
  href: string
  /** True where publishing the sample would state something untrue about the business. */
  isClaim: boolean
}

/** What is still sample content, for the admin dashboard. */
export async function getSampleContent(): Promise<SampleGroup[]> {
  const [settings, certifications, videos, testimonials, projects, inventory] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: 'default' } }),
    prisma.certification.count({ where: { slug: { in: UNVERIFIED_CERTIFICATION_SLUGS } } }),
    prisma.video.count({ where: { youtubeId: { in: SAMPLE_VIDEO_IDS } } }),
    prisma.testimonial.count({ where: { slug: { in: SAMPLE_TESTIMONIAL_SLUGS } } }),
    prisma.project.count({ where: { slug: { in: SAMPLE_PROJECT_SLUGS } } }),
    prisma.inventory.count({ where: { slug: { in: SAMPLE_INVENTORY_SLUGS } } }),
  ])

  const groups: SampleGroup[] = []

  const statsUntouched =
    settings != null &&
    settings.statYears === SAMPLE_STATS.statYears &&
    settings.statProperties === SAMPLE_STATS.statProperties &&
    settings.statCities === SAMPLE_STATS.statCities &&
    settings.statClients === SAMPLE_STATS.statClients

  if (statsUntouched) {
    groups.push({
      key: 'stats',
      label: 'Company numbers',
      count: null,
      note: `The home page counts up to ${SAMPLE_STATS.statYears} years, ${SAMPLE_STATS.statProperties} properties and ${SAMPLE_STATS.statClients.toLocaleString('en-IN')} clients. These are made-up figures.`,
      href: '/admin/settings',
      isClaim: true,
    })
  }

  if (certifications > 0) {
    groups.push({
      key: 'certifications',
      label: 'Unverified certifications',
      count: certifications,
      note: 'NAR India membership, ISO 9001:2015 and developer empanelment are sample entries. Do not publish them unless the company actually holds them.',
      href: '/admin/certifications',
      isClaim: true,
    })
  }

  if (testimonials > 0) {
    groups.push({
      key: 'testimonials',
      label: 'Sample testimonials',
      count: testimonials,
      note: 'Written for the demo. They are not real clients and are not quoting anyone.',
      href: '/admin/testimonials',
      isClaim: true,
    })
  }

  if (projects > 0 || inventory > 0) {
    groups.push({
      key: 'listings',
      label: 'Sample projects and listings',
      count: projects + inventory,
      note: 'Invented projects and resale listings, including placeholder RERA numbers. Replace them with real stock.',
      href: '/admin/projects',
      isClaim: true,
    })
  }

  if (videos > 0) {
    groups.push({
      key: 'videos',
      label: 'Sample videos',
      count: videos,
      note: 'Public videos from other channels, used so the gallery is not empty. Swap in your own uploads.',
      href: '/admin/videos',
      isClaim: false,
    })
  }

  if (settings?.heroImageUrl.includes(SAMPLE_HERO_PHOTO_ID)) {
    groups.push({
      key: 'hero',
      label: 'Home page banner photo',
      count: null,
      note: 'Still the stock photo from the seed.',
      href: '/admin/settings',
      isClaim: false,
    })
  }

  return groups
}
