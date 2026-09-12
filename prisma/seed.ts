import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'
import { deriveInventoryFields } from '../src/lib/inventory'
import { AMENITY_SETS, PHOTOS, img, mapEmbed } from './seed-data'
import { SAMPLE_ABOUT_MISSION, SAMPLE_STATS } from '../src/lib/sample-content'

const prisma = new PrismaClient()

/**
 * Idempotent seed — every record upserts on a natural key (slug, youtubeId,
 * email, or the settings singleton id), so `npm run db:seed` can be re-run at
 * any time without duplicating anything. Child images are replaced wholesale on
 * each run so edits to this file always take effect.
 */

/* ── helpers ────────────────────────────────────────────────────────────── */

type ImageSeed = { url: string; alt: string }

const images = (ids: readonly string[], alt: string, count: number, offset = 0): ImageSeed[] =>
  Array.from({ length: count }, (_, index) => {
    const id = ids[(offset + index) % ids.length]
    return { url: img(id), alt: `${alt}, photo ${index + 1}` }
  })

const toImageRows = (list: ImageSeed[]) =>
  list.map((image, index) => ({ ...image, sortOrder: index, isPrimary: index === 0 }))

const rupees = {
  lakh: (value: number) => value * 100_000,
  crore: (value: number) => value * 10_000_000,
}

const paragraphs = (...parts: string[]) => parts.map((part) => `<p>${part}</p>`).join('\n')

/**
 * Writes a minimal, valid one-page PDF so the "Download brochure" button works
 * out of the box. TODO(content): replace with the real brochure via /admin.
 */
async function writeSampleBrochure(): Promise<string> {
  const uploads = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(uploads, { recursive: true })

  const lines = [
    'MUVS Realty - Sample Brochure',
    'This placeholder ships with the seed data.',
    'Replace it from /admin > Projects > Brochure.',
  ]
  const content = [
    'BT /F1 18 Tf 72 720 Td (' + lines[0] + ') Tj ET',
    'BT /F1 11 Tf 72 690 Td (' + lines[1] + ') Tj ET',
    'BT /F1 11 Tf 72 672 Td (' + lines[2] + ') Tj ET',
  ].join('\n')

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((body, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`
  })

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  pdf += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  await writeFile(path.join(uploads, 'sample-brochure.pdf'), pdf, 'latin1')
  return '/uploads/sample-brochure.pdf'
}

/* ── site settings ──────────────────────────────────────────────────────── */

async function seedSettings(brochureUrl: string) {
  // Contact details, RERA number and socials were supplied by the owner and are
  // real. TODO(content): any remaining "[FILL: ...]" below is still outstanding,
  // either here or through /admin → Site Settings. Unfilled contact and social
  // values are hidden in the UI rather than rendered as broken links.
  const settings = {
    companyName: 'MUVS Realty',
    tagline: 'Residential and commercial property advisors across Delhi NCR',

    phone: '+91 93100 86252',
    whatsapp: '+919310086252',
    email: 'info.muvsrealty@gmail.com',
    address: 'B-488, Sector 2, Patwari, Greater Noida, Uttar Pradesh 201318',
    officeHours: 'Monday to Sunday, 10 AM to 6 PM',
    reraNumber: 'UPRERAAGT000443/02/2026',

    instagram: 'https://www.instagram.com/muvsrealty',
    facebook: 'https://www.facebook.com/p/MuvsRealty-61575730314949/',
    linkedin: 'https://www.linkedin.com/company/muvs-realty-llp',
    youtube: 'https://youtube.com/@muvsrealty',

    heroTitle: 'Buying property in Noida or Greater Noida? Talk to us first.',
    heroSubtitle:
      'Homes, plots and commercial space across Noida, Greater Noida and the Yamuna Expressway. We check the title and approvals before you pay, and handle the price negotiation for you.',
    heroImageUrl: img(PHOTOS.residential[2], 2400),

    aboutStory: paragraphs(
      'We set up MUVS Realty because buyers in Delhi NCR had plenty of listings to choose from but very few straight answers. Prices moved on rumour and approvals were quoted from memory. Often the only difference between a good plot and a disputed one was a document nobody had read.',
      'We began as a small advisory office in Noida and Greater Noida. Most of our work then, as now, was checking titles, reading RERA filings and visiting a site before recommending it. When a property had a problem, we told the client not to buy it.',
      'Today we work on apartments, plots, villas, agricultural land, industrial sheds and commercial space across the Yamuna Expressway corridor and the rest of Delhi NCR, for buyers living in India and abroad.',
    ),
    // TODO(content): demo text, tracked by src/lib/sample-content.ts.
    aboutMission: SAMPLE_ABOUT_MISSION,

    mapEmbedUrl: mapEmbed('MUVS REALTY, B-488, Sector 2, Patwari, Greater Noida, Uttar Pradesh 201318'),

    // TODO(content): sample figures. Tracked by src/lib/sample-content.ts and
    // flagged on the admin dashboard until the owner supplies the real ones.
    ...SAMPLE_STATS,
  }

  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    create: { id: 'default', ...settings },
    update: settings,
  })

  return brochureUrl
}

/* ── admin ──────────────────────────────────────────────────────────────── */

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@muvsrealty.com').toLowerCase()
  const password = process.env.ADMIN_PASSWORD || 'muvs@admin123'
  const name = process.env.ADMIN_NAME || 'MUVS Admin'
  const passwordHash = await hashPassword(password)

  await prisma.adminUser.upsert({
    where: { email },
    create: { email, name, passwordHash },
    // Re-seeding resets the password back to ADMIN_PASSWORD, which is what you
    // want for a dev database and is called out in the README.
    update: { name, passwordHash },
  })

  return { email, password }
}

/* ── projects ───────────────────────────────────────────────────────────── */

type ProjectSeed = Parameters<typeof prisma.project.create>[0]['data'] & { slug: string }

function projectSeeds(brochureUrl: string) {
  return [
    {
      slug: 'aarvam-skyline-yamuna-expressway',
      title: 'Aarvam Skyline',
      developer: 'Trilok Infratech',
      projectType: 'RESIDENTIAL_APARTMENT',
      status: 'PRE_LAUNCH',
      location: 'YAMUNA_EXPRESSWAY',
      sector: 'Sector 22D',
      address: 'Sector 22D, Yamuna Expressway, Gautam Buddh Nagar, UP 203201',
      priceMin: rupees.lakh(85),
      priceMax: rupees.crore(2.1),
      areaMin: 1180,
      areaMax: 2450,
      areaUnit: 'SQFT',
      possessionDate: new Date('2030-06-30'),
      reraNumber: 'UPRERAPRJ-YEIDA-2026-0148',
      description: paragraphs(
        'Aarvam Skyline is a pre-launch group housing project in Sector 22D on the Yamuna Expressway, about eleven minutes from the approach road to the Noida International Airport terminal.',
        'Five towers are planned on a 6.4-acre plot, with 68% of the land kept open. Units range from compact 2 BHK homes suited to first-time buyers up to 4 BHK duplexes on the upper floors.',
        'A limited number of pre-launch allocations are open before the public launch. Prices are expected to go up once the launch is announced.',
      ),
      highlights: JSON.stringify([
        '11 minutes from Noida International Airport',
        '68% open space on a 6.4-acre plot',
        'Frontage on a 60m sector road',
        'Pre-launch allocation, limited units',
        'Payment plan: 10:40:50 construction-linked',
      ]),
      amenities: JSON.stringify(AMENITY_SETS.apartment),
      configurations: JSON.stringify([
        { type: '2 BHK', area: 1180, areaUnit: 'SQFT', price: rupees.lakh(85) },
        { type: '3 BHK', area: 1640, areaUnit: 'SQFT', price: rupees.crore(1.24) },
        { type: '3 BHK + Study', area: 1885, areaUnit: 'SQFT', price: rupees.crore(1.46) },
        { type: '4 BHK Duplex', area: 2450, areaUnit: 'SQFT', price: rupees.crore(2.1) },
      ]),
      floorPlans: JSON.stringify([
        { title: '2 BHK, 1,180 sq.ft.', imageUrl: img(PHOTOS.documents[3], 1200) },
        { title: '3 BHK, 1,640 sq.ft.', imageUrl: img(PHOTOS.documents[4], 1200) },
      ]),
      videoIds: JSON.stringify(['Fsaw4JuigaA']),
      brochureUrl,
      mapEmbedUrl: mapEmbed('Sector 22D, Yamuna Expressway, Greater Noida'),
      expectedLaunch: 'Q1 2027',
      startingPrice: rupees.lakh(85),
      earlyBirdNote:
        'Pre-launch prices apply to the first 60 allocations, and PLC is waived on park-facing units.',
      isGated: true,
      isFeatured: true,
      imageSeeds: images(PHOTOS.residential, 'Aarvam Skyline', 4, 0),
    },
    {
      slug: 'vanya-estate-plots-yeida',
      title: 'Vanya Estate Plots',
      developer: 'Kalash Buildwell',
      projectType: 'PLOTTED_DEVELOPMENT',
      status: 'PRE_LAUNCH',
      location: 'YAMUNA_EXPRESSWAY',
      sector: 'Sector 18',
      address: 'Sector 18, YEIDA, Gautam Buddh Nagar, UP 203201',
      priceMin: rupees.lakh(42),
      priceMax: rupees.crore(1.35),
      areaMin: 120,
      areaMax: 300,
      areaUnit: 'SQYD',
      possessionDate: new Date('2028-03-31'),
      reraNumber: 'UPRERAPRJ-YEIDA-2026-0203',
      description: paragraphs(
        'A gated plotted development in YEIDA Sector 18, with freehold residential plots from 120 to 300 sq.yd. Internal roads, sewage and electricity lines are part of the development.',
        'Plots are being released before the formal launch to buyers who finish their documentation early. The registry is done directly by the developer, and YEIDA has already approved the layout.',
      ),
      highlights: JSON.stringify([
        'YEIDA-approved layout, freehold registry',
        '9m and 12m internal roads',
        'Underground electricity and sewage lines',
        'Walking distance from the proposed sector market',
        'Corner and park-facing plots available',
      ]),
      amenities: JSON.stringify(AMENITY_SETS.plotted),
      configurations: JSON.stringify([
        { type: '120 sq.yd. plot', area: 120, areaUnit: 'SQYD', price: rupees.lakh(42) },
        { type: '162 sq.yd. plot', area: 162, areaUnit: 'SQYD', price: rupees.lakh(58) },
        { type: '200 sq.yd. plot', area: 200, areaUnit: 'SQYD', price: rupees.lakh(74) },
        { type: '300 sq.yd. plot', area: 300, areaUnit: 'SQYD', price: rupees.crore(1.35) },
      ]),
      floorPlans: JSON.stringify([
        { title: 'Sector layout plan', imageUrl: img(PHOTOS.documents[1], 1200) },
      ]),
      videoIds: JSON.stringify(['woKNztAhYgc', '7Dt0wTrS_1A']),
      brochureUrl,
      mapEmbedUrl: mapEmbed('Sector 18, YEIDA, Gautam Buddh Nagar'),
      expectedLaunch: 'Q4 2026',
      startingPrice: rupees.lakh(42),
      earlyBirdNote:
        'Early buyers get today’s circle-rate-linked price and first choice of corner and park-facing plots.',
      isGated: true,
      isFeatured: false,
      imageSeeds: images(PHOTOS.plot, 'Vanya Estate Plots', 4, 0),
    },
    {
      slug: 'meridian-one-sector-150-noida',
      title: 'Meridian One',
      developer: 'Meridian Estates',
      projectType: 'RESIDENTIAL_APARTMENT',
      status: 'NEW_LAUNCH',
      location: 'NOIDA',
      sector: 'Sector 150',
      address: 'Sector 150, Noida, Gautam Buddh Nagar, UP 201310',
      priceMin: rupees.crore(1.85),
      priceMax: rupees.crore(4.4),
      areaMin: 1750,
      areaMax: 3900,
      areaUnit: 'SQFT',
      possessionDate: new Date('2029-12-31'),
      reraNumber: 'UPRERAPRJ-NOIDA-2026-0091',
      description: paragraphs(
        'Meridian One is a newly launched low-density project in Sector 150, the sports city belt. Over 80% of the sector is reserved as open and recreational land, which makes it the greenest residential pocket in Noida.',
        'There are three towers of 32 floors each, with four apartments on every floor. Every home is a corner unit with cross-ventilation on three sides, and the towers stand 45 metres apart.',
      ),
      highlights: JSON.stringify([
        'Sector 150, Noida’s lowest-density residential sector',
        'Only 4 apartments per floor, all corner units',
        '45m tower-to-tower spacing',
        '2 km from Noida-Greater Noida Expressway',
        'Booking open at launch pricing',
      ]),
      amenities: JSON.stringify(AMENITY_SETS.apartment),
      configurations: JSON.stringify([
        { type: '3 BHK', area: 1750, areaUnit: 'SQFT', price: rupees.crore(1.85) },
        { type: '3 BHK + Servant', area: 2180, areaUnit: 'SQFT', price: rupees.crore(2.35) },
        { type: '4 BHK', area: 2950, areaUnit: 'SQFT', price: rupees.crore(3.3) },
        { type: '4 BHK Penthouse', area: 3900, areaUnit: 'SQFT', price: rupees.crore(4.4) },
      ]),
      floorPlans: JSON.stringify([
        { title: '3 BHK, 1,750 sq.ft.', imageUrl: img(PHOTOS.documents[0], 1200) },
        { title: '4 BHK, 2,950 sq.ft.', imageUrl: img(PHOTOS.documents[2], 1200) },
      ]),
      videoIds: JSON.stringify(['7rqekSIXyPU']),
      brochureUrl,
      mapEmbedUrl: mapEmbed('Sector 150, Noida, Uttar Pradesh'),
      expectedLaunch: null,
      startingPrice: null,
      earlyBirdNote: null,
      isGated: false,
      isFeatured: true,
      imageSeeds: images(PHOTOS.interior, 'Meridian One', 5, 0),
    },
    {
      slug: 'sarovar-vistas-greater-noida',
      title: 'Sarovar Vistas',
      developer: 'Sarovar Buildcon',
      projectType: 'RESIDENTIAL_APARTMENT',
      status: 'UNDER_CONSTRUCTION',
      location: 'GREATER_NOIDA',
      sector: 'Sector 12',
      address: 'Sector 12, Greater Noida West, Gautam Buddh Nagar, UP 201318',
      priceMin: rupees.lakh(62),
      priceMax: rupees.crore(1.55),
      areaMin: 1050,
      areaMax: 2100,
      areaUnit: 'SQFT',
      possessionDate: new Date('2027-09-30'),
      reraNumber: 'UPRERAPRJ-GNIDA-2024-0377',
      description: paragraphs(
        'Sarovar Vistas is a mid-segment project in Greater Noida West. Four of its six towers have reached eighth-floor casting, and structure work is about one quarter ahead of the timeline committed to RERA.',
        'It suits buyers who want to see construction on the ground before they commit. Prices here are still below those of completed flats in the same sector.',
      ),
      highlights: JSON.stringify([
        'Construction ahead of RERA timeline',
        '6 towers on 4.2 acres',
        'Clubhouse structure already topped out',
        'Subvention plan available with select banks',
        'Possession committed for Q3 2027',
      ]),
      amenities: JSON.stringify(AMENITY_SETS.apartment),
      configurations: JSON.stringify([
        { type: '2 BHK', area: 1050, areaUnit: 'SQFT', price: rupees.lakh(62) },
        { type: '3 BHK', area: 1420, areaUnit: 'SQFT', price: rupees.lakh(88) },
        { type: '3 BHK + Study', area: 1720, areaUnit: 'SQFT', price: rupees.crore(1.12) },
        { type: '4 BHK', area: 2100, areaUnit: 'SQFT', price: rupees.crore(1.55) },
      ]),
      floorPlans: JSON.stringify([
        { title: '2 BHK, 1,050 sq.ft.', imageUrl: img(PHOTOS.documents[1], 1200) },
        { title: '3 BHK, 1,420 sq.ft.', imageUrl: img(PHOTOS.documents[3], 1200) },
      ]),
      videoIds: JSON.stringify(['Fsaw4JuigaA']),
      brochureUrl,
      mapEmbedUrl: mapEmbed('Sector 12, Greater Noida West'),
      expectedLaunch: null,
      startingPrice: null,
      earlyBirdNote: null,
      isGated: false,
      isFeatured: true,
      imageSeeds: images(PHOTOS.construction, 'Sarovar Vistas', 4, 0),
    },
    {
      slug: 'northgate-business-park-noida',
      title: 'Northgate Business Park',
      developer: 'Northgate Infra',
      projectType: 'COMMERCIAL',
      status: 'UNDER_CONSTRUCTION',
      location: 'NOIDA',
      sector: 'Sector 62',
      address: 'Sector 62, Noida, Gautam Buddh Nagar, UP 201309',
      priceMin: rupees.lakh(48),
      priceMax: rupees.crore(6.5),
      areaMin: 480,
      areaMax: 6200,
      areaUnit: 'SQFT',
      possessionDate: new Date('2027-03-31'),
      reraNumber: 'UPRERAPRJ-NOIDA-2024-0512',
      description: paragraphs(
        'A Grade-A office and retail building on the Sector 62 institutional belt, opposite an established IT corridor where companies are already occupying space.',
        'Units start with 480 sq.ft. suites that suit professional practices and go up to full floors of 6,200 sq.ft. The ground and first floors are retail, with a food court as the anchor.',
      ),
      highlights: JSON.stringify([
        'Grade-A specification with central air conditioning',
        '480 sq.ft. suites to 6,200 sq.ft. full floors',
        'Metro station within 700 metres',
        'Assured rental options on select inventory',
        'Two levels of basement parking',
      ]),
      amenities: JSON.stringify(AMENITY_SETS.commercial),
      configurations: JSON.stringify([
        { type: 'Retail Shop', area: 480, areaUnit: 'SQFT', price: rupees.lakh(48) },
        { type: 'Office Suite', area: 1100, areaUnit: 'SQFT', price: rupees.crore(1.05) },
        { type: 'Half Floor', area: 3100, areaUnit: 'SQFT', price: rupees.crore(3.1) },
        { type: 'Full Floor', area: 6200, areaUnit: 'SQFT', price: rupees.crore(6.5) },
      ]),
      floorPlans: JSON.stringify([
        { title: 'Typical office floor plate', imageUrl: img(PHOTOS.documents[2], 1200) },
      ]),
      videoIds: JSON.stringify([]),
      brochureUrl,
      mapEmbedUrl: mapEmbed('Sector 62, Noida, Uttar Pradesh'),
      expectedLaunch: null,
      startingPrice: null,
      earlyBirdNote: null,
      isGated: false,
      isFeatured: false,
      imageSeeds: images(PHOTOS.commercial, 'Northgate Business Park', 4, 0),
    },
    {
      slug: 'verdant-villas-omicron-greater-noida',
      title: 'Verdant Villas',
      developer: 'Verdant Realty',
      projectType: 'VILLA_TOWNSHIP',
      status: 'READY_TO_MOVE',
      location: 'GREATER_NOIDA',
      sector: 'Omicron 1',
      address: 'Omicron 1, Greater Noida, Gautam Buddh Nagar, UP 201310',
      priceMin: rupees.crore(2.4),
      priceMax: rupees.crore(5.2),
      areaMin: 200,
      areaMax: 500,
      areaUnit: 'SQYD',
      possessionDate: new Date('2025-04-30'),
      reraNumber: 'UPRERAPRJ-GNIDA-2021-0118',
      description: paragraphs(
        'A completed community of 84 independent villas in Omicron 1. Possession has been handed over and about 70% of the villas are already occupied.',
        'The villas are built on 200 to 500 sq.yd. plots, each with its own garden. The clubhouse, pool and landscaping are already running, so you can see the finished community on a site visit.',
      ),
      highlights: JSON.stringify([
        'Ready to move, possession handed over',
        '84 villas, ~70% already occupied',
        'Operational clubhouse and swimming pool',
        'Private garden with every villa',
        'Freehold registry, immediate transfer',
      ]),
      amenities: JSON.stringify(AMENITY_SETS.villa),
      configurations: JSON.stringify([
        { type: '3 BHK Villa, 200 sq.yd.', area: 200, areaUnit: 'SQYD', price: rupees.crore(2.4) },
        { type: '4 BHK Villa, 300 sq.yd.', area: 300, areaUnit: 'SQYD', price: rupees.crore(3.45) },
        { type: '5 BHK Villa, 500 sq.yd.', area: 500, areaUnit: 'SQYD', price: rupees.crore(5.2) },
      ]),
      floorPlans: JSON.stringify([
        { title: '4 BHK Villa, ground floor', imageUrl: img(PHOTOS.documents[4], 1200) },
      ]),
      videoIds: JSON.stringify(['cD8jihkIFqk']),
      brochureUrl,
      mapEmbedUrl: mapEmbed('Omicron 1, Greater Noida'),
      expectedLaunch: null,
      startingPrice: null,
      earlyBirdNote: null,
      isGated: false,
      isFeatured: true,
      imageSeeds: images(PHOTOS.villa, 'Verdant Villas', 5, 0),
    },
    {
      slug: 'kesar-plaza-sector-18-noida',
      title: 'Kesar Plaza',
      developer: 'Kesar Group',
      projectType: 'MIXED_USE',
      status: 'READY_TO_MOVE',
      location: 'NOIDA',
      sector: 'Sector 18',
      address: 'Sector 18 Market, Noida, Gautam Buddh Nagar, UP 201301',
      priceMin: rupees.lakh(75),
      priceMax: rupees.crore(4.8),
      areaMin: 320,
      areaMax: 2400,
      areaUnit: 'SQFT',
      possessionDate: new Date('2023-11-30'),
      reraNumber: 'UPRERAPRJ-NOIDA-2020-0064',
      description: paragraphs(
        'A completed mixed-use building in the Sector 18 market, which has the highest footfall of any retail area in Noida. Shops are trading on the lower floors, with offices above.',
        'Units are available for outright purchase. Several already have tenants paying rent, so the buyer earns rent from the day of registry.',
      ),
      highlights: JSON.stringify([
        'Sector 18 market, highest footfall in Noida',
        'Several units tenanted, rent from day one',
        'Metro station at 400 metres',
        'Completed and occupied building',
        'Rental yields of 5.5 to 6.5%',
      ]),
      amenities: JSON.stringify(AMENITY_SETS.commercial),
      configurations: JSON.stringify([
        { type: 'Ground Floor Shop', area: 320, areaUnit: 'SQFT', price: rupees.crore(1.6) },
        { type: 'First Floor Showroom', area: 850, areaUnit: 'SQFT', price: rupees.crore(2.4) },
        { type: 'Office Floor', area: 2400, areaUnit: 'SQFT', price: rupees.crore(4.8) },
      ]),
      floorPlans: JSON.stringify([
        { title: 'Retail level plan', imageUrl: img(PHOTOS.documents[0], 1200) },
      ]),
      videoIds: JSON.stringify(['AlMiEsMBk00']),
      brochureUrl,
      mapEmbedUrl: mapEmbed('Sector 18 Market, Noida'),
      expectedLaunch: null,
      startingPrice: null,
      earlyBirdNote: null,
      isGated: false,
      isFeatured: false,
      imageSeeds: images(PHOTOS.commercial, 'Kesar Plaza', 4, 2),
    },
  ]
}

async function seedProjects(brochureUrl: string) {
  const seeds = projectSeeds(brochureUrl)

  for (const { imageSeeds, ...data } of seeds) {
    const imageRows = toImageRows(imageSeeds)
    await prisma.project.upsert({
      where: { slug: data.slug },
      create: { ...(data as ProjectSeed), images: { create: imageRows } },
      // Replace images wholesale so edits to this file always take effect.
      update: { ...(data as ProjectSeed), images: { deleteMany: {}, create: imageRows } },
    })
  }

  return seeds.length
}

/* ── inventory (resale listings) ────────────────────────────────────────── */

const landmarks = (...entries: Array<[string, string]>) =>
  JSON.stringify(entries.map(([name, distance]) => ({ name, distance })))

function inventorySeeds() {
  return [
    /* APARTMENT ×3 */
    {
      slug: '3-bhk-sector-150-noida-resale',
      title: '3 BHK Apartment in Sector 150, Noida',
      propertyType: 'APARTMENT',
      location: 'NOIDA',
      sector: 'Sector 150',
      address: 'Sector 150, Noida, Gautam Buddh Nagar, UP 201310',
      price: rupees.crore(1.62),
      priceNegotiable: true,
      area: 1750,
      areaUnit: 'SQFT',
      ownership: 'FREEHOLD',
      facing: 'NORTH_EAST',
      isFeatured: true,
      description: paragraphs(
        'A north-east facing 3 BHK on the 14th floor of a low-density Sector 150 society, with an uninterrupted view over the golf course and the sports city green belt.',
        'The flat is four years old, has been lightly used, and comes with two covered parking slots. The society is fully occupied, the RWA is active and maintenance is well run.',
      ),
      landmarks: landmarks(
        ['Noida-Greater Noida Expressway', '2.1 km'],
        ['Advant Navis Business Park', '6 km'],
        ['Sector 148 Metro (Aqua Line)', '4.5 km'],
        ['Genesis Global School', '3.2 km'],
      ),
      details: {
        bedrooms: 3,
        bathrooms: 3,
        balconies: 3,
        floor: 14,
        totalFloors: 24,
        furnishing: 'SEMI_FURNISHED',
        carpetArea: 1180,
        builtUpArea: 1520,
        superArea: 1750,
        parkingCount: 2,
        ageOfProperty: 4,
        societyName: 'Sector 150 Sports City Enclave',
        maintenanceCharges: 5250,
      },
      photos: PHOTOS.interior,
      offset: 0,
    },
    {
      slug: '2-bhk-sector-16c-greater-noida-west',
      title: '2 BHK Apartment in Sector 16C, Greater Noida West',
      propertyType: 'APARTMENT',
      location: 'GREATER_NOIDA',
      sector: 'Sector 16C',
      address: 'Sector 16C, Greater Noida West, Gautam Buddh Nagar, UP 201318',
      price: rupees.lakh(58),
      priceNegotiable: true,
      area: 1075,
      areaUnit: 'SQFT',
      ownership: 'FREEHOLD',
      facing: 'EAST',
      isFeatured: false,
      description: paragraphs(
        'An east-facing 2 BHK on a middle floor that works well as a first home or as a rental investment. Similar flats in the same tower are currently let at ₹18,000 to ₹20,000 a month.',
        'The seller is relocating, so the flat is available with immediate possession. The registry is clean and the home loan has been closed.',
      ),
      landmarks: landmarks(
        ['Gaur City Mall', '2.8 km'],
        ['Noida Extension main road', '900 m'],
        ['Fortis Hospital, Greater Noida', '7 km'],
        ['Ryan International School', '1.6 km'],
      ),
      details: {
        bedrooms: 2,
        bathrooms: 2,
        balconies: 2,
        floor: 7,
        totalFloors: 18,
        furnishing: 'UNFURNISHED',
        carpetArea: 720,
        builtUpArea: 920,
        superArea: 1075,
        parkingCount: 1,
        ageOfProperty: 6,
        societyName: 'Greenwood Heights',
        maintenanceCharges: 2400,
      },
      photos: PHOTOS.residential,
      offset: 3,
    },
    {
      slug: '4-bhk-sector-128-noida-expressway',
      title: '4 BHK Apartment in Sector 128, Noida Expressway',
      propertyType: 'APARTMENT',
      location: 'NOIDA',
      sector: 'Sector 128',
      address: 'Sector 128, Noida Expressway, Gautam Buddh Nagar, UP 201304',
      price: rupees.crore(3.85),
      priceNegotiable: false,
      area: 3200,
      areaUnit: 'SQFT',
      ownership: 'FREEHOLD',
      facing: 'SOUTH_WEST',
      isFeatured: true,
      description: paragraphs(
        'A 3,200 sq.ft. four-bedroom apartment in one of the low-density golf-facing societies on the Noida Expressway, with a servant room, utility area and a 12-foot-deep balcony running the width of the living room.',
        'Fully furnished by the current owner with imported fittings, modular kitchen and centralised air conditioning. Three covered parking slots.',
      ),
      landmarks: landmarks(
        ['Jaypee Greens Golf Course', '600 m'],
        ['Sector 137 Metro (Aqua Line)', '3.4 km'],
        ['DPS Noida, Sector 132', '2.2 km'],
        ['Noida Expressway', '1.1 km'],
      ),
      details: {
        bedrooms: 4,
        bathrooms: 4,
        balconies: 3,
        floor: 9,
        totalFloors: 22,
        furnishing: 'FURNISHED',
        carpetArea: 2280,
        builtUpArea: 2850,
        superArea: 3200,
        parkingCount: 3,
        ageOfProperty: 7,
        societyName: 'Expressway Golf Residences',
        maintenanceCharges: 11500,
      },
      photos: PHOTOS.interior,
      offset: 4,
    },

    /* PLOT ×3 */
    {
      slug: 'yeida-sector-20-residential-plot-200-sqyd',
      title: '200 sq.yd. Residential Plot, YEIDA Sector 20',
      propertyType: 'PLOT',
      location: 'YAMUNA_EXPRESSWAY',
      sector: 'Sector 20',
      address: 'Sector 20, YEIDA, Gautam Buddh Nagar, UP 203201',
      price: rupees.lakh(78),
      priceNegotiable: true,
      area: 200,
      areaUnit: 'SQYD',
      ownership: 'FREEHOLD',
      facing: 'EAST',
      isFeatured: true,
      description: paragraphs(
        'A YEIDA-allotted residential plot in Sector 20, east facing on a 24-metre road, with possession already taken and the boundary wall constructed.',
        'The allotment is complete, all authority dues are cleared and the transfer memorandum is ready, so the registry can go ahead without delay.',
      ),
      landmarks: landmarks(
        ['Noida International Airport', '14 km'],
        ['Yamuna Expressway interchange', '3.5 km'],
        ['Proposed Film City site', '9 km'],
        ['Sector 18 YEIDA market', '2.4 km'],
      ),
      details: {
        plotArea: 200,
        plotDimensions: '40 ft × 45 ft',
        roadWidth: 79,
        cornerPlot: true,
        parkFacing: false,
        boundaryWall: true,
        approvedBy: 'YEIDA',
        khasraNumber: '412/3',
        landUse: 'Residential',
      },
      photos: PHOTOS.plot,
      offset: 0,
    },
    {
      slug: 'noida-sector-51-plot-300-sqyd',
      title: '300 sq.yd. Plot in Sector 51, Noida',
      propertyType: 'PLOT',
      location: 'NOIDA',
      sector: 'Sector 51',
      address: 'Sector 51, Noida, Gautam Buddh Nagar, UP 201301',
      price: rupees.crore(4.2),
      priceNegotiable: false,
      area: 300,
      areaUnit: 'SQYD',
      ownership: 'LEASEHOLD',
      facing: 'NORTH',
      isFeatured: false,
      description: paragraphs(
        'A Noida Authority residential plot in the established Sector 51 belt, park facing and on a 45-foot road, in one of the few remaining undeveloped parcels in this sector.',
        'The plot is leasehold from the Noida Authority with the lease deed executed, and the buyer can build up to the sanctioned FAR.',
      ),
      landmarks: landmarks(
        ['Sector 51 Metro (Aqua Line)', '1.2 km'],
        ['Sector 18 Market', '5.5 km'],
        ['Kailash Hospital', '2.8 km'],
        ['Noida Golf Course', '4 km'],
      ),
      details: {
        plotArea: 300,
        plotDimensions: '50 ft × 54 ft',
        roadWidth: 45,
        cornerPlot: false,
        parkFacing: true,
        boundaryWall: false,
        approvedBy: 'NOIDA_AUTHORITY',
        khasraNumber: '88/2',
        landUse: 'Residential',
      },
      photos: PHOTOS.plot,
      offset: 1,
    },
    {
      slug: 'gnida-omicron-3-plot-162-sqyd',
      title: '162 sq.yd. Plot in Omicron 3, Greater Noida',
      propertyType: 'PLOT',
      location: 'GREATER_NOIDA',
      sector: 'Omicron 3',
      address: 'Omicron 3, Greater Noida, Gautam Buddh Nagar, UP 201310',
      price: rupees.lakh(62),
      priceNegotiable: true,
      area: 162,
      areaUnit: 'SQYD',
      ownership: 'FREEHOLD',
      facing: 'WEST',
      isFeatured: false,
      description: paragraphs(
        'A GNIDA residential plot in Omicron 3, in a fully developed pocket where the neighbouring plots are already built and occupied. Water, sewer and electricity connections are live at the plot boundary.',
        'A good fit for a buyer who wants to start construction straight away.',
      ),
      landmarks: landmarks(
        ['Pari Chowk', '4.2 km'],
        ['Greater Noida Metro (Delta 1)', '5 km'],
        ['Sharda University', '6.5 km'],
        ['Ansal Plaza', '3 km'],
      ),
      details: {
        plotArea: 162,
        plotDimensions: '30 ft × 48 ft',
        roadWidth: 30,
        cornerPlot: false,
        parkFacing: false,
        boundaryWall: true,
        approvedBy: 'GNIDA',
        khasraNumber: '215/1',
        landUse: 'Residential',
      },
      photos: PHOTOS.plot,
      offset: 2,
    },

    /* VILLA ×3 */
    {
      slug: '4-bhk-villa-omicron-1-greater-noida',
      title: '4 BHK Villa in Omicron 1, Greater Noida',
      propertyType: 'VILLA',
      location: 'GREATER_NOIDA',
      sector: 'Omicron 1',
      address: 'Omicron 1, Greater Noida, Gautam Buddh Nagar, UP 201310',
      price: rupees.crore(3.4),
      priceNegotiable: true,
      area: 300,
      areaUnit: 'SQYD',
      ownership: 'FREEHOLD',
      facing: 'NORTH_EAST',
      isFeatured: true,
      description: paragraphs(
        'An independent four-bedroom villa on a 300 sq.yd. plot inside a gated community, with a private lawn at the front and a covered porch for two cars.',
        'It is built as ground plus two floors, with a separate staircase to the top floor, so the family can use the whole house or let the top floor out.',
      ),
      landmarks: landmarks(
        ['Pari Chowk', '3.6 km'],
        ['Jaypee Hospital', '5.2 km'],
        ['Greater Noida Golf Course', '4 km'],
        ['Delhi Public School, Greater Noida', '2.5 km'],
      ),
      details: {
        bedrooms: 4,
        bathrooms: 4,
        plotArea: 300,
        builtUpArea: 3150,
        floors: 3,
        garden: true,
        parkingCount: 2,
        furnishing: 'SEMI_FURNISHED',
        ageOfProperty: 5,
        gatedCommunity: true,
      },
      photos: PHOTOS.villa,
      offset: 0,
    },
    {
      slug: '5-bhk-villa-sector-135-noida',
      title: '5 BHK Villa in Sector 135, Noida',
      propertyType: 'VILLA',
      location: 'NOIDA',
      sector: 'Sector 135',
      address: 'Sector 135, Noida, Gautam Buddh Nagar, UP 201304',
      price: rupees.crore(7.2),
      priceNegotiable: false,
      area: 500,
      areaUnit: 'SQYD',
      ownership: 'FREEHOLD',
      facing: 'EAST',
      isFeatured: true,
      description: paragraphs(
        'A 500 sq.yd. villa in a low-density gated pocket off the Noida Expressway, with five bedrooms, a double-height living room, a home theatre in the basement and a landscaped rear garden.',
        'The current owner had the house built to their own specification and has kept it in very good condition. It is among the best villas available in Sector 135.',
      ),
      landmarks: landmarks(
        ['Noida Expressway', '1.8 km'],
        ['Sector 137 Metro (Aqua Line)', '2.6 km'],
        ['Advant Navis Business Park', '4.5 km'],
        ['Amity University, Sector 125', '7 km'],
      ),
      details: {
        bedrooms: 5,
        bathrooms: 6,
        plotArea: 500,
        builtUpArea: 5400,
        floors: 3,
        garden: true,
        parkingCount: 4,
        furnishing: 'FURNISHED',
        ageOfProperty: 3,
        gatedCommunity: true,
      },
      photos: PHOTOS.villa,
      offset: 2,
    },
    {
      slug: '3-bhk-villa-yamuna-expressway-sector-22',
      title: '3 BHK Villa on Yamuna Expressway, Sector 22',
      propertyType: 'VILLA',
      location: 'YAMUNA_EXPRESSWAY',
      sector: 'Sector 22',
      address: 'Sector 22, Yamuna Expressway, Gautam Buddh Nagar, UP 203201',
      price: rupees.crore(1.95),
      priceNegotiable: true,
      area: 200,
      areaUnit: 'SQYD',
      ownership: 'FREEHOLD',
      facing: 'SOUTH',
      isFeatured: false,
      description: paragraphs(
        'A compact three-bedroom villa on the Yamuna Expressway corridor, completed and ready to occupy, in a township where the clubhouse and internal roads are already functional.',
        'It will interest buyers who want to get in before the airport opens. The asking price is below what it would cost to build the same villa closer to Noida.',
      ),
      landmarks: landmarks(
        ['Noida International Airport', '16 km'],
        ['Yamuna Expressway toll plaza', '4 km'],
        ['Buddh International Circuit', '11 km'],
        ['Sector 18 YEIDA market', '5 km'],
      ),
      details: {
        bedrooms: 3,
        bathrooms: 3,
        plotArea: 200,
        builtUpArea: 2100,
        floors: 2,
        garden: true,
        parkingCount: 2,
        furnishing: 'UNFURNISHED',
        ageOfProperty: 2,
        gatedCommunity: true,
      },
      photos: PHOTOS.villa,
      offset: 3,
    },

    /* AGRICULTURAL ×3 */
    {
      slug: '4-acre-farmland-jewar-yamuna-expressway',
      title: '4 Acre Agricultural Land near Jewar',
      propertyType: 'AGRICULTURAL',
      location: 'YAMUNA_EXPRESSWAY',
      sector: 'Jewar',
      address: 'Village Rohi, near Jewar, Gautam Buddh Nagar, UP 203135',
      price: rupees.crore(1.6),
      priceNegotiable: true,
      area: 4,
      areaUnit: 'ACRE',
      ownership: 'FREEHOLD',
      facing: 'NORTH',
      isFeatured: true,
      description: paragraphs(
        'Four acres of irrigated agricultural land in the Jewar belt, with road access on one side and a functioning tube well on the parcel.',
        'The land is currently under wheat and mustard rotation. Khatauni and khasra records are clear and in the seller’s name, with no co-sharer disputes.',
      ),
      landmarks: landmarks(
        ['Noida International Airport', '7 km'],
        ['Jewar town', '4.5 km'],
        ['Yamuna Expressway', '6 km'],
        ['Proposed Medical Device Park', '9 km'],
      ),
      details: {
        landArea: 4,
        soilType: 'Alluvial loam',
        waterSource: 'Tube well and canal irrigation',
        roadAccess: '18 ft village road on the northern boundary',
        currentCrop: 'Wheat and mustard rotation',
        khasraNumber: '742, 743/1',
        khatauniAvailable: true,
        distanceFromHighway: '6 km from Yamuna Expressway',
      },
      photos: PHOTOS.agricultural,
      offset: 0,
    },
    {
      slug: '12-bigha-agricultural-land-dankaur',
      title: '12 Bigha Agricultural Land at Dankaur',
      propertyType: 'AGRICULTURAL',
      location: 'GREATER_NOIDA',
      sector: 'Dankaur',
      address: 'Village Salarpur, Dankaur, Gautam Buddh Nagar, UP 203201',
      price: rupees.crore(2.4),
      priceNegotiable: true,
      area: 12,
      areaUnit: 'BIGHA',
      ownership: 'FREEHOLD',
      facing: 'WEST',
      isFeatured: false,
      description: paragraphs(
        'Twelve bigha of contiguous agricultural land near Dankaur, in a pocket that has seen steady institutional acquisition over the last three years.',
        'This land is best bought as a long-term land bank. The records are clean and the parcel is one continuous holding.',
      ),
      landmarks: landmarks(
        ['Dankaur railway station', '3.2 km'],
        ['Yamuna Expressway', '8 km'],
        ['Gautam Buddha University', '12 km'],
        ['Pari Chowk', '18 km'],
      ),
      details: {
        landArea: 12,
        soilType: 'Sandy loam',
        waterSource: 'Two tube wells on the parcel',
        roadAccess: 'Approach from the Dankaur-Salarpur link road',
        currentCrop: 'Sugarcane',
        khasraNumber: '1120, 1121, 1122',
        khatauniAvailable: true,
        distanceFromHighway: '8 km from Yamuna Expressway',
      },
      photos: PHOTOS.agricultural,
      offset: 1,
    },
    {
      slug: '2-5-acre-orchard-land-sikandrabad-road',
      title: '2.5 Acre Orchard Land on Sikandrabad Road',
      propertyType: 'AGRICULTURAL',
      location: 'GREATER_NOIDA',
      sector: 'Sikandrabad Road',
      address: 'Sikandrabad Road, Greater Noida, Gautam Buddh Nagar, UP 203205',
      price: rupees.lakh(95),
      priceNegotiable: true,
      area: 2.5,
      areaUnit: 'ACRE',
      ownership: 'FREEHOLD',
      facing: 'SOUTH_EAST',
      isFeatured: false,
      description: paragraphs(
        'An established mango and guava orchard across two and a half acres, with mature trees already in commercial bearing and a small farmhouse structure on the parcel.',
        'This is a working farm. Along with the land value, the buyer gets the orchard income and a place to spend weekends.',
      ),
      landmarks: landmarks(
        ['Sikandrabad industrial area', '6 km'],
        ['Greater Noida Kasna', '9 km'],
        ['NH-91', '4 km'],
        ['Bulandshahr', '22 km'],
      ),
      details: {
        landArea: 2.5,
        soilType: 'Loam with good drainage',
        waterSource: 'Bore well with drip irrigation installed',
        roadAccess: 'Direct frontage on Sikandrabad Road',
        currentCrop: 'Mango and guava orchard, in bearing',
        khasraNumber: '308/2',
        khatauniAvailable: true,
        distanceFromHighway: '4 km from NH-91',
      },
      photos: PHOTOS.agricultural,
      offset: 2,
    },

    /* INDUSTRIAL ×3 */
    {
      slug: 'industrial-plot-ecotech-3-greater-noida',
      title: '1,000 sq.m. Industrial Plot, Ecotech-III',
      propertyType: 'INDUSTRIAL',
      location: 'GREATER_NOIDA',
      sector: 'Ecotech-III',
      address: 'Ecotech-III, Greater Noida, Gautam Buddh Nagar, UP 201306',
      price: rupees.crore(3.2),
      priceNegotiable: true,
      area: 1000,
      areaUnit: 'SQM',
      ownership: 'LEASEHOLD',
      facing: 'NORTH',
      isFeatured: true,
      description: paragraphs(
        'A GNIDA-allotted industrial plot in Ecotech-III with the building plan already sanctioned and the boundary wall in place, ready for a buyer to start construction.',
        'The lease deed is executed and all authority dues are cleared. Transfer charges are to the buyer’s account as per GNIDA policy.',
      ),
      landmarks: landmarks(
        ['Eastern Peripheral Expressway', '5 km'],
        ['Kasna industrial belt', '3 km'],
        ['Pari Chowk', '9 km'],
        ['Dadri railway freight terminal', '12 km'],
      ),
      details: {
        plotArea: 1000,
        builtUpArea: 0,
        shedArea: 0,
        powerLoadKVA: 150,
        ceilingHeight: 0,
        industrialZone: 'Ecotech-III, GNIDA industrial zone',
        approvedBy: 'GNIDA',
        craneAvailable: false,
        truckAccess: '24 m sector road, 40-ft trailer accessible',
      },
      photos: PHOTOS.industrial,
      offset: 0,
    },
    {
      slug: 'warehouse-shed-20000-sqft-site-5-kasna',
      title: '20,000 sq.ft. Warehouse Shed, Site-V Kasna',
      propertyType: 'INDUSTRIAL',
      location: 'GREATER_NOIDA',
      sector: 'Site-V, Kasna',
      address: 'Site-V, Kasna, Greater Noida, Gautam Buddh Nagar, UP 201310',
      price: rupees.crore(5.5),
      priceNegotiable: false,
      area: 20000,
      areaUnit: 'SQFT',
      ownership: 'LEASEHOLD',
      facing: 'EAST',
      isFeatured: false,
      description: paragraphs(
        'A completed warehouse with a 32-foot clear ceiling, epoxy flooring and a dedicated loading dock, currently vacant and available for immediate occupation.',
        'Sanctioned power load of 500 KVA with a DG backup already installed. Suits third-party logistics, e-commerce fulfilment or light assembly.',
      ),
      landmarks: landmarks(
        ['Eastern Peripheral Expressway', '4 km'],
        ['Noida-Greater Noida Expressway', '11 km'],
        ['Dadri freight corridor terminal', '9 km'],
        ['Pari Chowk', '7 km'],
      ),
      details: {
        plotArea: 2500,
        builtUpArea: 20000,
        shedArea: 18500,
        powerLoadKVA: 500,
        ceilingHeight: 32,
        industrialZone: 'Site-V industrial area',
        approvedBy: 'GNIDA',
        craneAvailable: true,
        truckAccess: 'Dedicated dock, 40-ft container turning radius',
      },
      photos: PHOTOS.industrial,
      offset: 1,
    },
    {
      slug: 'industrial-shed-8000-sqft-surajpur',
      title: '8,000 sq.ft. Industrial Shed at Surajpur',
      propertyType: 'INDUSTRIAL',
      location: 'GREATER_NOIDA',
      sector: 'Surajpur',
      address: 'Surajpur Industrial Area, Greater Noida, Gautam Buddh Nagar, UP 201306',
      price: rupees.crore(2.1),
      priceNegotiable: true,
      area: 8000,
      areaUnit: 'SQFT',
      ownership: 'LEASEHOLD',
      facing: 'SOUTH',
      isFeatured: false,
      description: paragraphs(
        'A compact manufacturing shed in the established Surajpur belt, with a small office block at the front and worker facilities at the rear.',
        'The shed is currently running as a light engineering unit, and the seller will vacate within sixty days of registry. It is priced for a buyer who needs working space quickly.',
      ),
      landmarks: landmarks(
        ['Surajpur Kasna Road', '600 m'],
        ['Eastern Peripheral Expressway', '7 km'],
        ['Greater Noida Metro (Delta 1)', '8 km'],
        ['NTPC Dadri', '14 km'],
      ),
      details: {
        plotArea: 1100,
        builtUpArea: 8000,
        shedArea: 6800,
        powerLoadKVA: 200,
        ceilingHeight: 22,
        industrialZone: 'Surajpur industrial area',
        approvedBy: 'GNIDA',
        craneAvailable: true,
        truckAccess: '12 m internal road, tempo and 20-ft truck access',
      },
      photos: PHOTOS.industrial,
      offset: 2,
    },

    /* COMMERCIAL ×3 */
    {
      slug: 'retail-shop-sector-18-noida-market',
      title: 'Retail Shop in Sector 18 Market, Noida',
      propertyType: 'COMMERCIAL',
      location: 'NOIDA',
      sector: 'Sector 18',
      address: 'Sector 18 Market, Noida, Gautam Buddh Nagar, UP 201301',
      price: rupees.crore(1.55),
      priceNegotiable: false,
      area: 320,
      areaUnit: 'SQFT',
      ownership: 'FREEHOLD',
      facing: 'NORTH',
      isFeatured: true,
      description: paragraphs(
        'A ground-floor shop with 14 feet of frontage in the Sector 18 market, the highest-footfall retail location in Noida. Shops in this market rarely stay vacant.',
        'Currently let to a food and beverage operator on a five-year lease with three years remaining, giving the buyer rent from the day of registry.',
      ),
      landmarks: landmarks(
        ['Sector 18 Metro (Blue Line)', '400 m'],
        ['DLF Mall of India', '650 m'],
        ['Great India Place', '900 m'],
        ['Noida Expressway', '3.5 km'],
      ),
      details: {
        subType: 'SHOP',
        carpetArea: 280,
        superArea: 320,
        floor: 0,
        totalFloors: 4,
        frontageWidth: 14,
        footfallZone: 'High street, Sector 18 main market',
        currentlyRented: true,
        rentalYield: 6.2,
        washroomCount: 1,
        parkingCount: 1,
      },
      photos: PHOTOS.commercial,
      offset: 3,
    },
    {
      slug: 'office-space-sector-62-noida-1200-sqft',
      title: '1,200 sq.ft. Office in Sector 62, Noida',
      propertyType: 'COMMERCIAL',
      location: 'NOIDA',
      sector: 'Sector 62',
      address: 'Sector 62, Noida, Gautam Buddh Nagar, UP 201309',
      price: rupees.crore(1.15),
      priceNegotiable: true,
      area: 1200,
      areaUnit: 'SQFT',
      ownership: 'FREEHOLD',
      facing: 'EAST',
      isFeatured: false,
      description: paragraphs(
        'A fitted office on the fourth floor of a Grade-A building in the Sector 62 IT corridor, with twelve workstations, two cabins and a small meeting room already in place.',
        'It is sold with the fit-out, so a business can move in without spending on interiors. The building has full power backup and covered parking.',
      ),
      landmarks: landmarks(
        ['Sector 62 Metro (Blue Line)', '700 m'],
        ['Fortis Hospital, Sector 62', '1.4 km'],
        ['NH-24 / Delhi-Meerut Expressway', '2.1 km'],
        ['Sector 18 Market', '8 km'],
      ),
      details: {
        subType: 'OFFICE',
        carpetArea: 860,
        superArea: 1200,
        floor: 4,
        totalFloors: 9,
        frontageWidth: 0,
        footfallZone: 'IT corridor, institutional belt',
        currentlyRented: false,
        rentalYield: 5.4,
        washroomCount: 2,
        parkingCount: 2,
      },
      photos: PHOTOS.commercial,
      offset: 1,
    },
    {
      slug: 'showroom-alpha-1-greater-noida-1800-sqft',
      title: '1,800 sq.ft. Showroom in Alpha 1, Greater Noida',
      propertyType: 'COMMERCIAL',
      location: 'GREATER_NOIDA',
      sector: 'Alpha 1',
      address: 'Alpha 1 Commercial Belt, Greater Noida, Gautam Buddh Nagar, UP 201310',
      price: rupees.crore(2.3),
      priceNegotiable: true,
      area: 1800,
      areaUnit: 'SQFT',
      ownership: 'FREEHOLD',
      facing: 'WEST',
      isFeatured: false,
      description: paragraphs(
        'A double-height showroom on the Alpha 1 commercial belt with 28 feet of glass frontage on the main road, suitable for automotive, furniture or a branded retail format.',
        'It is vacant and available immediately. A mezzanine adds back-of-house space on top of the quoted carpet area.',
      ),
      landmarks: landmarks(
        ['Pari Chowk', '2.4 km'],
        ['Alpha Commercial Belt main road', 'On site'],
        ['Greater Noida Metro (Alpha 1)', '900 m'],
        ['Gautam Buddha University', '5 km'],
      ),
      details: {
        subType: 'SHOWROOM',
        carpetArea: 1560,
        superArea: 1800,
        floor: 0,
        totalFloors: 3,
        frontageWidth: 28,
        footfallZone: 'Main road commercial belt',
        currentlyRented: false,
        rentalYield: 5.8,
        washroomCount: 2,
        parkingCount: 4,
      },
      photos: PHOTOS.commercial,
      offset: 4,
    },
  ]
}

async function seedInventory() {
  const seeds = inventorySeeds()

  for (const seed of seeds) {
    const { photos, offset, details, landmarks: nearbyLandmarks, ...rest } = seed
    const derived = deriveInventoryFields({
      price: rest.price,
      area: rest.area,
      areaUnit: rest.areaUnit,
    })

    const data = {
      ...rest,
      transactionType: 'RESALE',
      isPublished: true,
      isSold: false,
      nearbyLandmarks,
      details: JSON.stringify(details),
      ...derived,
    }

    const imageRows = toImageRows(images(photos, rest.title, 3, offset))

    await prisma.inventory.upsert({
      where: { slug: rest.slug },
      create: { ...data, images: { create: imageRows } },
      update: { ...data, images: { deleteMany: {}, create: imageRows } },
    })
  }

  return seeds.length
}

/* ── leadership ─────────────────────────────────────────────────────────── */

/**
 * The two co-founders. Biographies and credentials were supplied by the owner.
 * TODO(content): no photographs yet, so imageUrl is empty and the site shows
 * initials instead of a stock photo of someone who is not them.
 */
async function seedTeam() {
  const team = [
    {
      slug: 'mohit-goel',
      name: 'Mohit Goel',
      designation: 'Co-Founder and Director',
      sortOrder: 0,
      phone: '+91 98102 02834',
      bio:
      '<p>Mohit Goel is a co-founder and Director of MUVS Realty, and the operational anchor of the firm. He brings more than 19 years of experience as an industrial trader in the construction sector, and works from data modelling and market tracking rather than from speculation.</p>' +
      '<p>He runs a logistics operation with a private fleet of 21 trucks, and has spent close to two decades supplying building material directly from manufacturing hubs to major development sites. That mix of supply chain data, corporate management and operational scale shapes how he reads the market: where infrastructure is expanding, how cycles turn, and how an investment should be judged.</p>' +
      '<p>For buyers, that scale shows up in three ways:</p>' +
      '<ul><li><strong>Location intelligence.</strong> Tracking where heavy construction material moves across the region shows which corridors are growing, often well before they appear on standard real estate maps.</li>' +
      '<li><strong>Developer risk.</strong> Twenty years of working directly with infrastructure players means knowing the financial position, material quality and delivery record of regional developers, so clients buy property that is legally clean and structurally sound.</li>' +
      '<li><strong>Market timing.</strong> Supply chain insight makes structural cycles easier to read, which helps clients time when to enter and when to exit.</li></ul>',
      quote: '',
      credentials: JSON.stringify([
        'MBA, Business Administration',
        'BCA, Computer Applications',
      ]),
      imageUrl: '',
      isPublished: true,
    },
    {
      slug: 'vipul-choudhary',
      name: 'Vipul Choudhary',
      designation: 'Co-Founder and Director',
      sortOrder: 1,
      phone: '+91 96542 37642',
      bio:
      '<p>Vipul Choudhary is a co-founder and Director of MUVS Realty. He is an international business strategist and management consultant with over two decades of leadership experience across North America, Africa, the Middle East and India.</p>' +
      '<p>He has lived and worked in the United States, South Africa, Tanzania, Kenya, the Middle East and India, and brings a working knowledge of global compliance, cross-cultural markets and international asset standards. He has worked closely with institutions including State Farm Insurance, Cablevision, AutoZone and Fresenius Medical Care.</p>' +
      '<p>Managing risk for global insurance and medical groups calls for close attention to compliance and quality control, and he applies the same discipline to property advisory. That means vetting developer balance sheets, project delivery histories and legal titles, so clients are protected from market swings and construction delays.</p>',
      quote: '',
      credentials: JSON.stringify([
        "B.Sc., St. Stephen's College, Delhi",
        'M.A., Jawaharlal Nehru University, New Delhi',
        'MBA, Hofstra University, New York',
        'Advanced studies in Sociology and Public Administration, Annamalai University',
      ]),
      imageUrl: '',
      isPublished: true,
    },
  ]

  for (const member of team) {
    await prisma.teamMember.upsert({
      where: { slug: member.slug },
      create: member,
      update: member,
    })
  }

  return team.length
}

/* ── certifications ─────────────────────────────────────────────────────── */

async function seedCertifications() {
  // TODO(content): every certification below except the RERA registration is a
  // sample claim. They must be confirmed by the owner or deleted before launch.
  // Tracked by src/lib/sample-content.ts.
  const seeds = [
    {
      slug: 'up-rera-agent-registration',
      title: 'RERA Agent Registration',
      issuingBody: 'Uttar Pradesh Real Estate Regulatory Authority',
      year: 2023,
      // Supplied by the owner 2026-09-12.
      number: 'UPRERAAGT000443/02/2026',
      imageUrl: img(PHOTOS.documents[0], 1400),
      description:
        'Registration as a real estate agent under the Real Estate (Regulation and Development) Act, 2016. It allows us to sell registered projects anywhere in Uttar Pradesh.',
      sortOrder: 0,
    },
    {
      slug: 'nar-india-membership',
      title: 'Member of the National Association of Realtors, India',
      issuingBody: 'NAR India',
      year: 2022,
      number: null,
      imageUrl: img(PHOTOS.documents[1], 1400),
      description:
        'As NAR India members we follow its published code of ethics on disclosure, handling of client funds and fair dealing between agents.',
      sortOrder: 1,
    },
    {
      slug: 'iso-9001-2015',
      title: 'ISO 9001:2015 Quality Management System',
      issuingBody: 'Accredited certification body',
      year: 2024,
      number: null,
      imageUrl: img(PHOTOS.documents[2], 1400),
      description:
        'Our advisory, documentation and client-handover processes are audited annually against the ISO 9001:2015 quality management standard.',
      sortOrder: 2,
    },
    {
      slug: 'authority-empanelment',
      title: 'Empanelled Channel Partner',
      issuingBody: 'Leading Delhi NCR developers',
      year: 2021,
      number: null,
      imageUrl: img(PHOTOS.documents[3], 1400),
      description:
        'We are empanelled with developer sales teams across Noida, Greater Noida and the Yamuna Expressway. This is how our clients get access to pre-launch allocations.',
      sortOrder: 3,
    },
  ]

  for (const seed of seeds) {
    await prisma.certification.upsert({
      where: { slug: seed.slug },
      create: seed,
      update: seed,
    })
  }

  return seeds.length
}

/* ── videos ─────────────────────────────────────────────────────────────── */

async function seedVideos() {
  // TODO(content): these are real, public, on-topic YouTube videos used so the
  // gallery works on first run. Replace them with MUVS Realty's own uploads via
  // /admin → Videos — only the YouTube ID is stored, never a video file.
  const seeds = [
    {
      youtubeId: 'Fsaw4JuigaA',
      title: 'Luxury 3 BHK Tour in Greater Noida',
      description:
        'A full walkthrough of a 3 BHK configuration in a Greater Noida group housing project, covering layout, finishes and the society amenities.',
      category: 'PROPERTY_TOUR',
      sortOrder: 0,
    },
    {
      youtubeId: '7rqekSIXyPU',
      title: 'Inside a ₹8.5 Cr Noida Apartment',
      description:
        'A tour of a luxury apartment on the Noida Expressway belt, at the top end of the city’s residential market.',
      category: 'PROPERTY_TOUR',
      sortOrder: 1,
    },
    {
      youtubeId: '7Dt0wTrS_1A',
      title: 'YEIDA Sector 17 Residential Plots: Full Details',
      description:
        'Plot sizes, layout and location detail for the YEIDA Sector 17 residential scheme on the Yamuna Expressway.',
      category: 'SITE_VISIT',
      sortOrder: 2,
    },
    {
      youtubeId: 'woKNztAhYgc',
      title: 'Site Visit to Sector 17C, YEIDA',
      description:
        'On-ground walkthrough of Sector 17C on the Yamuna Expressway, with notes on connectivity to the Noida International Airport.',
      category: 'SITE_VISIT',
      sortOrder: 3,
    },
    {
      youtubeId: 'cD8jihkIFqk',
      title: 'Client Stories',
      description:
        'Buyers talk about what they were looking for and how their purchase went.',
      category: 'CLIENT_TESTIMONIAL',
      sortOrder: 4,
    },
    {
      youtubeId: 'AlMiEsMBk00',
      title: 'Is Noida Still Worth Investing In?',
      description:
        'A market update on Noida residential pricing, supply and the infrastructure timelines that are driving the current cycle.',
      category: 'MARKET_UPDATE',
      sortOrder: 5,
    },
  ]

  for (const seed of seeds) {
    await prisma.video.upsert({
      where: { youtubeId: seed.youtubeId },
      create: seed,
      update: seed,
    })
  }

  return seeds.length
}

/* ── testimonials ───────────────────────────────────────────────────────── */

async function seedTestimonials() {
  // TODO(content): written for the demo, not real clients.
  const seeds = [
    {
      slug: 'rajeev-menon',
      name: 'Rajeev Menon',
      role: 'Bought a 3 BHK in Sector 150',
      location: 'Noida',
      quote:
        'They talked me out of the first two properties I liked. The third one they found for me had a cleaner title and cost eleven lakh less.',
      rating: 5,
      sortOrder: 0,
    },
    {
      slug: 'anita-sharma',
      name: 'Anita Sharma',
      role: 'Sold a villa in Omicron 1',
      location: 'Greater Noida',
      quote:
        'I was selling from Bangalore and could not travel. Every viewing was recorded and sent to me, and the paperwork was done before I flew in. It closed in six weeks.',
      rating: 5,
      sortOrder: 1,
    },
    {
      slug: 'harpreet-singh-gill',
      name: 'Harpreet Singh Gill',
      role: 'Bought agricultural land near Jewar',
      location: 'Yamuna Expressway',
      quote:
        'Buying farmland is where people get taken. They pulled the khatauni themselves and walked the boundary with the lekhpal before I paid a rupee.',
      rating: 5,
      sortOrder: 2,
    },
    {
      slug: 'meera-krishnan',
      name: 'Meera Krishnan',
      role: 'NRI buyer, pre-launch allocation',
      location: 'Dubai, UAE',
      quote:
        'I was buying from Dubai and never once had to chase them for an update. The pre-launch allocation was exactly what they said it would be.',
      rating: 5,
      sortOrder: 3,
    },
    {
      slug: 'vikram-bhatia',
      name: 'Vikram Bhatia',
      role: 'Leased an industrial shed at Kasna',
      location: 'Greater Noida',
      quote:
        'They understood sanctioned load, ceiling height and trailer access without me explaining it twice. That saved me two months of looking at unsuitable sheds.',
      rating: 5,
      sortOrder: 4,
    },
  ]

  for (const seed of seeds) {
    await prisma.testimonial.upsert({
      where: { slug: seed.slug },
      create: seed,
      update: seed,
    })
  }

  return seeds.length
}

/* ── main ───────────────────────────────────────────────────────────────── */

async function main() {
  console.info('\n  Seeding MUVS Realty…\n')

  const brochureUrl = await writeSampleBrochure()
  await seedSettings(brochureUrl)
  const admin = await seedAdmin()
  const projects = await seedProjects(brochureUrl)
  const inventory = await seedInventory()
  const teamCount = await seedTeam()
  const certifications = await seedCertifications()
  const videos = await seedVideos()
  const testimonials = await seedTestimonials()

  const preLaunch = await prisma.project.count({ where: { status: 'PRE_LAUNCH' } })

  console.info(
    [
      `  ✓ Site settings      1 (real contact details, RERA number and socials)`,
      `  ✓ Projects           ${projects} (${preLaunch} pre-launch)`,
      `  ✓ Inventory          ${inventory}`,
      `  ✓ Certifications     ${certifications}`,

      `  ✓ Leadership       ${teamCount} (photographs still to come)`,
      `  ✓ Videos             ${videos}`,
      `  ✓ Testimonials       ${testimonials}`,
      '',
      `  Admin login → ${admin.email} / ${admin.password}`,
      `  Change it in .env (ADMIN_EMAIL / ADMIN_PASSWORD) and re-run the seed.`,
      '',
    ].join('\n'),
  )
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error('\n  Seed failed:\n', error)
    await prisma.$disconnect()
    process.exit(1)
  })
