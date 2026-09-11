import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, ArrowUpRight, Award, MapPin, Sparkles } from 'lucide-react'

import { prisma } from '@/lib/prisma'
import { getSiteSettings, isPlaceholder } from '@/lib/site'
import { getFeaturedProjects, getPreLaunchProjects } from '@/lib/projects'
import { getInventoryTypeCounts, serializeInventoryFilters } from '@/lib/inventory'
import { PropertyLocation, PropertyType } from '@/lib/taxonomy'
import { formatIndianPrice } from '@/lib/format'
import { BLUR_DATA_URL } from '@/lib/images'
import { buildMetadata, realEstateAgentJsonLd } from '@/lib/seo'
import { stripHtml, truncate } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Section, SectionHeading } from '@/components/site/section'
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal'
import { Carousel } from '@/components/site/carousel'
import { StatStrip } from '@/components/site/stat-strip'
import { JsonLd } from '@/components/site/json-ld'
import { ProjectCard } from '@/components/property/project-card'
import { Testimonials } from '@/components/property/testimonials'
import { VideoGrid } from '@/components/property/video-grid'
import { LeadForm } from '@/components/lead/lead-form'

export const metadata: Metadata = buildMetadata({
  title: 'MUVS Realty | Real Estate Advisory in Delhi NCR',
  description:
    'Buy, sell or invest in property across Noida, Greater Noida, the Yamuna Expressway and Delhi NCR. Verified listings, early access to new launches, and help with every step of the paperwork.',
  path: '/',
})

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2400&q=75'

/** The six tiles link into pre-filtered inventory. */
const TYPE_TILE_IMAGES: Record<string, string> = {
  APARTMENT: 'photo-1502005229762-cf1b2da7c5d6',
  PLOT: 'photo-1500595046743-cd271d694d30',
  VILLA: 'photo-1613977257363-707ba9348227',
  AGRICULTURAL: 'photo-1416331108676-a22ccb276e35',
  INDUSTRIAL: 'photo-1565610222536-ef125c59da2e',
  COMMERCIAL: 'photo-1486406146926-c627a92ad1ab',
}

const SERVICE_AREAS = [
  {
    location: 'NOIDA',
    image: 'photo-1512917774080-9991f1c4c750',
    note: 'Sectors 150, 128 and the Expressway belt',
  },
  {
    location: 'GREATER_NOIDA',
    image: 'photo-1570129477492-45c003edd2be',
    note: 'Greater Noida West, Omicron and Alpha',
  },
  {
    location: 'YAMUNA_EXPRESSWAY',
    image: 'photo-1500382017468-9049fed747ef',
    note: 'YEIDA sectors and the Jewar airport corridor',
  },
  {
    location: 'DELHI',
    image: 'photo-1523217582562-09d0def993a6',
    note: 'South and West Delhi residential',
  },
]

const unsplash = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`

export default async function HomePage() {
  const settings = await getSiteSettings()

  const [featured, preLaunch, typeCounts, videos, testimonials, certifications] = await Promise.all([
    getFeaturedProjects(6),
    getPreLaunchProjects(3),
    getInventoryTypeCounts(),
    prisma.video.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
      take: 3,
    }),
    prisma.testimonial.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
      take: 3,
    }),
    prisma.certification.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  const heroImage = settings.heroImageUrl || HERO_FALLBACK
  const directorBio = truncate(stripHtml(settings.directorBio), 260)

  return (
    <>
      <JsonLd data={realEstateAgentJsonLd(settings)} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate flex min-h-[92svh] items-end overflow-hidden bg-maroon-900 pb-16 pt-[var(--header-height)] sm:min-h-screen sm:pb-24">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          sizes="100vw"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-maroon-900 via-maroon-900/75 to-maroon-900/35" />

        <div className="container relative">
          <Reveal className="max-w-3xl">
            <p className="eyebrow text-gold-200">{settings.tagline}</p>
            <h1 className="mt-5 text-balance font-serif text-[38px] font-semibold leading-[1.06] text-cream-50 sm:text-6xl lg:text-[68px]">
              {settings.heroTitle}
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-cream-50/80 sm:text-lg">
              {settings.heroSubtitle}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="gold">
                <Link href="/inventory">
                  Explore Properties
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="light">
                <Link href="/contact">Talk to Us</Link>
              </Button>
            </div>
          </Reveal>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" />
      </section>

      {/* ── Trust strip ──────────────────────────────────────────────────── */}
      <Section className="border-b border-gold-500/20 bg-cream-50 py-14 sm:py-16">
        <div className="container">
          <StatStrip
            stats={[
              { label: 'Years of experience', value: settings.statYears, suffix: '+' },
              { label: 'Properties closed', value: settings.statProperties, suffix: '+' },
              { label: 'Cities served', value: settings.statCities },
              { label: 'Happy clients', value: settings.statClients, suffix: '+' },
            ]}
          />
        </div>
      </Section>

      {/* ── Featured projects ────────────────────────────────────────────── */}
      {featured.length > 0 ? (
        <Section className="bg-white">
          <div className="container">
            <SectionHeading
              eyebrow="Now selling"
              title="Featured projects"
              lede="Projects we are selling right now in Noida, Greater Noida and along the Yamuna Expressway."
              action={
                <Button asChild variant="outline">
                  <Link href="/projects">
                    All projects
                    <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
              }
            />
            <div className="mt-12">
              <Carousel label="Featured projects">
                {featured.map((project) => (
                  <ProjectCard key={project.id} project={project} className="h-full" />
                ))}
              </Carousel>
            </div>
          </div>
        </Section>
      ) : null}

      {/* ── Property types ───────────────────────────────────────────────── */}
      <Section className="bg-cream-50">
        <div className="container">
          <SectionHeading
            eyebrow="What we deal in"
            title="Homes, land and commercial space"
            lede="Whether it is your first flat or an industrial shed, we handle every kind of property in Delhi NCR."
          />

          <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PropertyType.options.map((option) => {
              const count = typeCounts[option.value] ?? 0
              return (
                <RevealItem key={option.value}>
                  <Link
                    href={`/inventory${serializeInventoryFilters({ types: [option.value] })}`}
                    className="group relative flex h-44 items-end overflow-hidden rounded border border-maroon-900/8 shadow-card transition-all duration-300 hover:border-gold-500/60 hover:shadow-card-hover sm:h-52"
                  >
                    <Image
                      src={unsplash(TYPE_TILE_IMAGES[option.value] ?? TYPE_TILE_IMAGES.APARTMENT, 800)}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-maroon-900/90 via-maroon-900/35 to-transparent" />
                    <div className="relative w-full p-5">
                      <h3 className="font-serif text-[19px] text-cream-50">{option.label}</h3>
                      <p className="tabular mt-1 text-[12.5px] text-cream-50/70">
                        {count > 0
                          ? `${count} listing${count === 1 ? '' : 's'} available`
                          : 'Enquire for availability'}
                      </p>
                    </div>
                  </Link>
                </RevealItem>
              )
            })}
          </RevealGroup>
        </div>
      </Section>

      {/* ── Locations ────────────────────────────────────────────────────── */}
      <Section className="bg-white">
        <div className="container">
          <SectionHeading
            eyebrow="Where we work"
            title="Locations we serve"
            lede="We only work in the areas we know well, and our team is on the ground in each of them every week."
          />

          <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICE_AREAS.map((area) => (
              <RevealItem key={area.location}>
                <Link
                  href={`/inventory${serializeInventoryFilters({ locations: [area.location] })}`}
                  className="group block overflow-hidden rounded border border-maroon-900/8 bg-white shadow-card transition-all duration-300 hover:border-gold-500/60 hover:shadow-card-hover"
                >
                  <span className="relative block aspect-[4/3] overflow-hidden">
                    <Image
                      src={unsplash(area.image, 700)}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 25vw"
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                    />
                  </span>
                  <span className="block p-5">
                    <span className="flex items-center gap-1.5 font-serif text-[17px] text-maroon-900">
                      <MapPin className="size-4 text-gold-500" />
                      {PropertyLocation.label(area.location)}
                    </span>
                    <span className="mt-1.5 block text-[13px] leading-relaxed text-ink-500">
                      {area.note}
                    </span>
                  </span>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </Section>

      {/* ── Pre-launch band ──────────────────────────────────────────────── */}
      {preLaunch.length > 0 ? (
        <Section className="relative isolate overflow-hidden bg-maroon-900">
          <div
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                'radial-gradient(900px 380px at 12% 0%, rgba(163,30,48,0.6), transparent 60%), radial-gradient(700px 320px at 88% 100%, rgba(201,162,39,0.22), transparent 60%)',
            }}
          />
          <div className="container relative">
            <SectionHeading
              tone="light"
              eyebrow="Before the public launch"
              title="Pre-launch opportunities"
              lede="Book before the official launch, when prices are at their lowest."
              action={
                <Button asChild variant="gold">
                  <Link href="/pre-launch">
                    View all pre-launch
                    <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
              }
            />

            <RevealGroup className="mt-12 grid gap-5 lg:grid-cols-3">
              {preLaunch.map((project) => (
                <RevealItem key={project.id}>
                  <Link
                    href={`/projects/${project.slug}`}
                    className="group flex h-full flex-col rounded border border-cream-50/12 bg-cream-50/[0.06] p-6 backdrop-blur-sm transition-colors hover:border-gold-500/60"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="gold">Pre-Launch</Badge>
                      {project.expectedLaunch ? (
                        <span className="text-[12px] text-cream-50/60">
                          Launching {project.expectedLaunch}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-4 font-serif text-[20px] text-cream-50">{project.title}</h3>
                    <p className="mt-1 text-[13px] text-cream-50/60">
                      {project.developer} · {PropertyLocation.label(project.location)}
                      {project.sector ? `, ${project.sector}` : ''}
                    </p>

                    <p className="tabular mt-5 font-serif text-[22px] text-gold-200">
                      {project.startingPrice
                        ? `${formatIndianPrice(project.startingPrice)} onwards`
                        : 'Price on request'}
                    </p>

                    {project.earlyBirdNote ? (
                      <p className="mt-3 flex gap-2 text-[12.5px] leading-relaxed text-cream-50/65">
                        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-gold-500" />
                        {project.earlyBirdNote}
                      </p>
                    ) : null}

                    <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[13.5px] font-semibold text-gold-200">
                      Unlock full details
                      <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </Link>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Section>
      ) : null}

      {/* ── Director ─────────────────────────────────────────────────────── */}
      <Section className="bg-cream-50">
        <div className="container">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <div className="relative aspect-[4/5] overflow-hidden rounded border border-gold-500/25 shadow-card sm:aspect-[4/3] lg:aspect-[4/5]">
                <Image
                  src={settings.directorImageUrl || unsplash('photo-1497366216548-37526070297c', 1000)}
                  alt={
                    isPlaceholder(settings.directorName)
                      ? 'Director, MUVS Realty'
                      : settings.directorName
                  }
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className="object-cover"
                />
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <p className="eyebrow">Leadership</p>
              <h2 className="mt-3 text-[28px] leading-tight sm:text-4xl">
                {isPlaceholder(settings.directorName) ? 'Meet the Director' : settings.directorName}
              </h2>
              <p className="mt-2 text-[13.5px] uppercase tracking-[0.1em] text-gold-500">
                {settings.directorDesignation}
              </p>

              {settings.directorQuote ? (
                <blockquote className="mt-8 border-l-2 border-gold-500 pl-5 font-serif text-[19px] leading-relaxed text-maroon-900 sm:text-[22px]">
                  “{settings.directorQuote}”
                </blockquote>
              ) : null}

              {directorBio ? (
                <p className="mt-7 text-[15px] leading-relaxed text-ink-500">{directorBio}</p>
              ) : null}

              <Button asChild variant="outline" className="mt-8">
                <Link href="/about">
                  Read more
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ── Videos ───────────────────────────────────────────────────────── */}
      {videos.length > 0 ? (
        <Section className="bg-white">
          <div className="container">
            <SectionHeading
              eyebrow="Watch"
              title="Property tours & market views"
              lede="Walkthroughs, site visits and our view on where the Delhi NCR market is heading."
              action={
                <Button asChild variant="outline">
                  <Link href="/videos">
                    All videos
                    <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
              }
            />
            <div className="mt-12">
              <VideoGrid videos={videos} />
            </div>
          </div>
        </Section>
      ) : null}

      {/* ── Certifications strip ─────────────────────────────────────────── */}
      {certifications.length > 0 ? (
        <Section className="border-y border-gold-500/20 bg-cream-50 py-14 sm:py-16">
          <div className="container">
            <Reveal className="flex flex-col items-center gap-8">
              <p className="eyebrow">Our registrations and memberships</p>
              <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
                {certifications.map((certification) => (
                  <li
                    key={certification.id}
                    className="flex items-center gap-2.5 text-[13px] text-ink-500"
                  >
                    <Award className="size-4 shrink-0 text-gold-500" aria-hidden="true" />
                    <span>
                      <span className="block font-medium text-maroon-900">
                        {certification.title}
                      </span>
                      <span className="tabular block text-[12px]">
                        {certification.issuingBody} · {certification.year}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/certifications"
                className="text-[13px] font-medium text-maroon-700 underline-offset-4 hover:underline"
              >
                View all certifications →
              </Link>
            </Reveal>
          </div>
        </Section>
      ) : null}

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      {testimonials.length > 0 ? (
        <Section className="bg-white">
          <div className="container">
            <SectionHeading
              eyebrow="Testimonials"
              title="What our clients say"
              align="center"
            />
            <div className="mt-12">
              <Testimonials testimonials={testimonials} />
            </div>
          </div>
        </Section>
      ) : null}

      {/* ── Lead capture ─────────────────────────────────────────────────── */}
      <Section className="bg-cream-50">
        <div className="container">
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="eyebrow">Get in touch</p>
              <h2 className="mt-3 text-[28px] leading-tight sm:text-4xl">
                Tell us what you are looking for
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-ink-500">
                Share your requirement and we will send you options that suit your budget and
                timeline. We confirm every phone number with a one-time code, and your details are
                never passed on to anyone else.
              </p>

              <ul className="mt-8 space-y-3.5">
                {[
                  'A shortlist that matches your budget and timeline',
                  'Title, approvals and RERA status checked before we suggest a property',
                  'We handle the negotiation and paperwork for you',
                  'Help for NRI buyers, whatever your time zone',
                ].map((point) => (
                  <li key={point} className="flex gap-3 text-[14.5px] text-ink-900/85">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold-500" />
                    {point}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.08}>
              <LeadForm
                source="/"
                contactPhone={settings.contact.phone}
                contactPhoneHref={settings.contact.telHref}
              />
            </Reveal>
          </div>
        </div>
      </Section>
    </>
  )
}
