import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Building2,
  CalendarClock,
  Download,
  FileCheck2,
  Lock,
  MapPin,
  Sparkles,
} from 'lucide-react'

import { prisma } from '@/lib/prisma'
import { getProjectBySlug } from '@/lib/projects'
import { getSiteSettings, buildWhatsAppLink } from '@/lib/site'
import { hasPreLaunchAccess } from '@/lib/gate'
import { readConfigurations, readFloorPlans, readStringList } from '@/lib/json'
import { ProjectStatus, ProjectType, PropertyLocation, AreaUnit } from '@/lib/taxonomy'
import {
  formatArea,
  formatAreaRange,
  formatIndianPrice,
  formatMonthYear,
  formatPriceRange,
} from '@/lib/format'
import { BLUR_DATA_URL, galleryImages, primaryImageUrl } from '@/lib/images'
import { breadcrumbJsonLd, buildMetadata, listingJsonLd } from '@/lib/seo'
import { stripHtml, truncate } from '@/lib/utils'

import { PageHero } from '@/components/site/page-hero'
import { Section } from '@/components/site/section'
import { Reveal } from '@/components/site/reveal'
import { JsonLd } from '@/components/site/json-ld'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Gallery } from '@/components/property/gallery'
import { SpecTable } from '@/components/property/spec-table'
import { AmenitiesGrid } from '@/components/property/amenities-grid'
import { MapEmbed } from '@/components/property/map-embed'
import { VideoGrid } from '@/components/property/video-grid'
import { ShareButton } from '@/components/property/share-button'
import { LeadForm } from '@/components/lead/lead-form'

export async function generateStaticParams() {
  const projects = await prisma.project.findMany({
    where: { isPublished: true },
    select: { slug: true },
  })
  return projects.map((project) => ({ slug: project.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) return buildMetadata({ title: 'Project not found', description: '', path: `/projects/${slug}`, noindex: true })

  const price =
    project.status === 'PRE_LAUNCH'
      ? formatIndianPrice(project.startingPrice)
      : formatPriceRange(project.priceMin, project.priceMax)

  return buildMetadata({
    title: `${project.title}, ${PropertyLocation.label(project.location)}`,
    description: truncate(
      stripHtml(project.description) ||
        `${project.title} by ${project.developer} in ${PropertyLocation.label(project.location)}. Price: ${price}.`,
      160,
    ),
    path: `/projects/${project.slug}`,
    image: primaryImageUrl(project.images),
    type: 'article',
  })
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [project, settings] = await Promise.all([getProjectBySlug(slug), getSiteSettings()])
  if (!project) notFound()

  // Gated pre-launch content is decided on the server. When access has not been
  // granted, the locked sections are never rendered or sent to the browser.
  const unlocked = project.isGated ? await hasPreLaunchAccess() : true

  const images = galleryImages(project.images).map((image) => ({
    id: image.id,
    url: image.url,
    alt: image.alt,
  }))
  const highlights = readStringList(project.highlights)
  const amenities = readStringList(project.amenities)
  const configurations = readConfigurations(project.configurations)
  const floorPlans = readFloorPlans(project.floorPlans)
  const videoIds = readStringList(project.videoIds)

  const videos = videoIds.length
    ? await prisma.video.findMany({ where: { youtubeId: { in: videoIds }, isPublished: true } })
    : []

  const isPreLaunch = project.status === 'PRE_LAUNCH'
  const price = isPreLaunch
    ? project.startingPrice
      ? `${formatIndianPrice(project.startingPrice)} onwards`
      : 'Price on request'
    : formatPriceRange(project.priceMin, project.priceMax)

  const whatsappHref = buildWhatsAppLink(
    settings.contact.whatsapp,
    `Hi ${settings.companyName}, I am interested in ${project.title} (${PropertyLocation.label(project.location)}). Please share details.`,
  )

  const overviewRows = [
    { label: 'Developer', value: project.developer },
    { label: 'Project type', value: ProjectType.label(project.projectType) },
    { label: 'Status', value: ProjectStatus.label(project.status) },
    {
      label: 'Location',
      value: [PropertyLocation.label(project.location), project.sector].filter(Boolean).join(', '),
    },
    { label: 'Price', value: price },
    {
      label: 'Area range',
      value: formatAreaRange(project.areaMin, project.areaMax, project.areaUnit),
    },
    isPreLaunch
      ? { label: 'Expected launch', value: project.expectedLaunch || 'To be announced' }
      : { label: 'Possession', value: formatMonthYear(project.possessionDate, 'To be confirmed') },
    { label: 'RERA', value: project.reraNumber || 'Registration pending' },
  ]

  return (
    <>
      <JsonLd
        data={[
          listingJsonLd({
            name: project.title,
            description: truncate(stripHtml(project.description), 300),
            path: `/projects/${project.slug}`,
            images: images.map((image) => image.url),
            price: isPreLaunch ? project.startingPrice : project.priceMin,
            availability: isPreLaunch ? 'PreOrder' : 'InStock',
          }),
          breadcrumbJsonLd([
            { name: 'Projects', path: '/projects' },
            { name: project.title, path: `/projects/${project.slug}` },
          ]),
        ]}
      />

      <PageHero
        size="sm"
        eyebrow={ProjectStatus.label(project.status)}
        title={project.title}
        imageUrl={primaryImageUrl(project.images)}
        crumbs={[{ label: 'Projects', href: '/projects' }, { label: project.title }]}
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[13.5px] text-cream-50/80">
          <span className="flex items-center gap-1.5">
            <Building2 className="size-4 text-gold-500" />
            {project.developer}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4 text-gold-500" />
            {PropertyLocation.label(project.location)}
            {project.sector ? `, ${project.sector}` : ''}
          </span>
          <span className="tabular flex items-center gap-1.5">
            <CalendarClock className="size-4 text-gold-500" />
            {isPreLaunch
              ? project.expectedLaunch || 'Launch to be announced'
              : `Possession ${formatMonthYear(project.possessionDate, 'to be confirmed')}`}
          </span>
        </div>
      </PageHero>

      <Section className="bg-cream-50 py-12 sm:py-16">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-8">
              <Reveal>
                <Gallery images={images} title={project.title} />
              </Reveal>

              <Reveal className="mt-10 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="tabular font-serif text-[26px] font-semibold text-maroon-900">
                    {price}
                  </p>
                  <p className="tabular mt-1 text-[13.5px] text-ink-500">
                    {formatAreaRange(project.areaMin, project.areaMax, project.areaUnit)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <ShareButton title={project.title} path={`/projects/${project.slug}`} />
                  {whatsappHref ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                        WhatsApp us
                      </a>
                    </Button>
                  ) : null}
                </div>
              </Reveal>

              {/* Gate notice — replaces the locked sections entirely. */}
              {!unlocked ? (
                <Reveal className="mt-10 rounded border border-gold-500/45 bg-gold-200/25 p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-maroon-900">
                      <Lock className="size-5 text-gold-200" />
                    </span>
                    <div>
                      <h2 className="font-serif text-xl text-maroon-900">
                        Full details are for verified buyers
                      </h2>
                      <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-900/80">
                        This is a pre-launch project. We share pricing, configurations, floor plans
                        and the brochure once you have verified your phone number, which keeps the
                        list to serious buyers. Verify below and this page will unlock straight
                        away.
                      </p>
                      {project.earlyBirdNote ? (
                        <p className="mt-4 flex gap-2 text-[13.5px] text-maroon-900">
                          <Sparkles className="mt-0.5 size-4 shrink-0 text-gold-500" />
                          {project.earlyBirdNote}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Reveal>
              ) : null}

              {/* Overview */}
              <Reveal className="mt-12">
                <h2 className="font-serif text-2xl text-maroon-900">Overview</h2>
                <div className="hairline my-5" />
                <SpecTable rows={overviewRows} />

                {project.description ? (
                  <div
                    className="prose-brand mt-8"
                    dangerouslySetInnerHTML={{ __html: project.description }}
                  />
                ) : null}
              </Reveal>

              {highlights.length > 0 ? (
                <Reveal className="mt-12">
                  <h2 className="font-serif text-2xl text-maroon-900">Highlights</h2>
                  <div className="hairline my-5" />
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="flex gap-3 rounded border border-maroon-900/8 bg-white px-4 py-3 text-[14px] text-ink-900"
                      >
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold-500" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ) : null}

              {/* Configurations — gated */}
              {unlocked && configurations.length > 0 ? (
                <Reveal className="mt-12">
                  <h2 className="font-serif text-2xl text-maroon-900">Configurations</h2>
                  <div className="hairline my-5" />
                  <div className="overflow-x-auto rounded border border-maroon-900/10 bg-white">
                    <table className="w-full text-sm">
                      <thead className="border-b border-maroon-900/10 bg-cream-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                            Configuration
                          </th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                            Area
                          </th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                            Price
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {configurations.map((configuration) => (
                          <tr
                            key={`${configuration.type}-${configuration.area}`}
                            className="border-b border-maroon-900/8 last:border-0"
                          >
                            <td className="px-4 py-3 font-medium text-maroon-900">
                              {configuration.type}
                            </td>
                            <td className="tabular px-4 py-3 text-right text-ink-900">
                              {formatArea(
                                configuration.area,
                                AreaUnit.is(configuration.areaUnit)
                                  ? configuration.areaUnit
                                  : project.areaUnit,
                              )}
                            </td>
                            <td className="tabular px-4 py-3 text-right font-semibold text-maroon-900">
                              {formatIndianPrice(configuration.price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Reveal>
              ) : null}

              {amenities.length > 0 ? (
                <Reveal className="mt-12">
                  <h2 className="font-serif text-2xl text-maroon-900">Amenities</h2>
                  <div className="hairline my-5" />
                  <AmenitiesGrid amenities={amenities} />
                </Reveal>
              ) : null}

              {/* Floor plans — gated */}
              {unlocked && floorPlans.length > 0 ? (
                <Reveal className="mt-12">
                  <h2 className="font-serif text-2xl text-maroon-900">Floor plans</h2>
                  <div className="hairline my-5" />
                  <div className="grid gap-5 sm:grid-cols-2">
                    {floorPlans.map((plan) => (
                      <figure
                        key={plan.title}
                        className="overflow-hidden rounded border border-maroon-900/10 bg-white"
                      >
                        <div className="relative aspect-[4/3] bg-cream-50">
                          <Image
                            src={plan.imageUrl}
                            alt={plan.title}
                            fill
                            sizes="(max-width: 640px) 100vw, 50vw"
                            placeholder="blur"
                            blurDataURL={BLUR_DATA_URL}
                            className="object-cover"
                          />
                        </div>
                        <figcaption className="px-4 py-3 text-[13.5px] font-medium text-maroon-900">
                          {plan.title}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </Reveal>
              ) : null}

              {videos.length > 0 ? (
                <Reveal className="mt-12">
                  <h2 className="font-serif text-2xl text-maroon-900">Videos</h2>
                  <div className="hairline my-5" />
                  <VideoGrid videos={videos} columns={2} showCategory={false} />
                </Reveal>
              ) : null}

              {project.mapEmbedUrl ? (
                <Reveal className="mt-12">
                  <h2 className="font-serif text-2xl text-maroon-900">Location</h2>
                  <div className="hairline my-5" />
                  {project.address ? (
                    <p className="mb-4 text-[14px] text-ink-500">{project.address}</p>
                  ) : null}
                  <MapEmbed url={project.mapEmbedUrl} title={project.title} />
                </Reveal>
              ) : null}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-24">
                <LeadForm
                  source={`/projects/${project.slug}`}
                  relatedType="project"
                  relatedId={project.id}
                  relatedTitle={project.title}
                  defaultLocation={project.location}
                  unlocksGatedContent={project.isGated && !unlocked}
                  heading={unlocked ? 'Enquire about this project' : 'Unlock full details'}
                  description={
                    unlocked
                      ? 'Send us your requirement and an advisor will call you back with pricing, availability and the status of the paperwork.'
                      : 'Verify your number to see pricing, configurations, floor plans and the brochure.'
                  }
                  submitLabel={unlocked ? 'Verify Phone & Submit' : 'Verify Phone & Unlock'}
                  contactPhone={settings.contact.phone}
                  contactPhoneHref={settings.contact.telHref}
                />

                {/* Brochure — gated */}
                {unlocked && project.brochureUrl ? (
                  <a
                    href={project.brochureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center gap-3 rounded border border-maroon-900/10 bg-white px-5 py-4 text-[14px] font-medium text-maroon-900 shadow-card transition-colors hover:border-gold-500"
                  >
                    <Download className="size-4 text-gold-500" />
                    Download brochure
                  </a>
                ) : null}

                {project.reraNumber ? (
                  <p className="tabular mt-4 flex items-start gap-2.5 rounded border border-maroon-900/8 bg-white px-5 py-4 text-[12.5px] leading-relaxed text-ink-500">
                    <FileCheck2 className="mt-0.5 size-4 shrink-0 text-gold-500" />
                    <span>
                      <span className="block font-medium text-maroon-900">RERA registered</span>
                      {project.reraNumber}
                    </span>
                  </p>
                ) : null}

                <p className="mt-4 text-center text-[12.5px] text-ink-500">
                  <Link href="/projects" className="text-maroon-700 hover:underline">
                    ← Back to all projects
                  </Link>
                </p>
              </div>
            </aside>
          </div>
        </div>
      </Section>
    </>
  )
}
