import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, CalendarClock, Download, Lock, MapPin, Sparkles, Unlock } from 'lucide-react'

import { getPreLaunchProjects } from '@/lib/projects'
import { getSiteSettings } from '@/lib/site'
import { hasPreLaunchAccess } from '@/lib/gate'
import { prisma } from '@/lib/prisma'
import { PropertyLocation } from '@/lib/taxonomy'
import { formatAreaRange, formatIndianPrice } from '@/lib/format'
import { BLUR_DATA_URL, primaryImageUrl } from '@/lib/images'
import { buildMetadata } from '@/lib/seo'

import { PageHero } from '@/components/site/page-hero'
import { Section, SectionHeading } from '@/components/site/section'
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal'
import { EmptyState } from '@/components/site/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LeadForm } from '@/components/lead/lead-form'

export const metadata: Metadata = buildMetadata({
  title: 'Pre-Launch Opportunities',
  description:
    'Early access to Delhi NCR projects before their public launch. Pricing, floor plans and brochures are shared with verified buyers.',
  path: '/pre-launch',
})

export default async function PreLaunchPage() {
  const [projects, settings, unlocked] = await Promise.all([
    getPreLaunchProjects(),
    getSiteSettings(),
    hasPreLaunchAccess(),
  ])

  // Gated detail is only queried when the server has confirmed access, so it
  // never reaches the browser for a visitor who has not verified.
  const gatedDetail = unlocked
    ? await prisma.project.findMany({
        where: { isPublished: true, status: 'PRE_LAUNCH' },
        select: { id: true, priceMin: true, priceMax: true, areaMin: true, areaMax: true, areaUnit: true, brochureUrl: true, reraNumber: true },
      })
    : []
  const detailById = new Map(gatedDetail.map((row) => [row.id, row]))

  return (
    <>
      <PageHero
        eyebrow="Before it goes public"
        title="Pre-launch opportunities"
        lede="Prices are usually at their lowest before a project officially launches. These are the projects we can get you into early."
        crumbs={[{ label: 'Pre-Launch' }]}
        imageUrl="https://images.unsplash.com/photo-1590725140246-20acdee442be?auto=format&fit=crop&w=2000&q=75"
      >
        <div className="inline-flex items-center gap-2.5 rounded-full border border-gold-500/40 bg-maroon-900/40 px-4 py-2 text-[13px] text-cream-50/85 backdrop-blur-sm">
          {unlocked ? (
            <>
              <Unlock className="size-4 text-gold-500" />
              Full details unlocked for this device
            </>
          ) : (
            <>
              <Lock className="size-4 text-gold-500" />
              Verify your number once to unlock every pre-launch on this page
            </>
          )}
        </div>
      </PageHero>

      <Section className="bg-cream-50">
        <div className="container">
          {projects.length === 0 ? (
            <EmptyState
              title="No pre-launch allocations open right now"
              description="They open and close quickly. Leave your requirement and we will call you the moment the next one is released."
              actionHref="/contact"
              actionLabel="Register your interest"
            />
          ) : (
            <RevealGroup className="grid gap-6 lg:grid-cols-2">
              {projects.map((project) => {
                const detail = detailById.get(project.id)

                return (
                  <RevealItem key={project.id} className="h-full">
                    <article className="flex h-full flex-col overflow-hidden rounded border border-maroon-900/8 bg-white shadow-card transition-all duration-300 hover:border-gold-500/60 hover:shadow-card-hover">
                      <Link
                        href={`/projects/${project.slug}`}
                        className="relative block aspect-[16/9] overflow-hidden"
                      >
                        <Image
                          src={primaryImageUrl(project.images)}
                          alt={project.images[0]?.alt || project.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                          className="object-cover transition-transform duration-700 hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-maroon-900/70 to-transparent" />
                        <div className="absolute left-4 top-4">
                          <Badge variant="gold">Pre-Launch</Badge>
                        </div>
                      </Link>

                      <div className="flex flex-1 flex-col p-6">
                        {/* Teaser: always public */}
                        <h2 className="font-serif text-[21px] text-maroon-900">
                          <Link href={`/projects/${project.slug}`} className="hover:text-maroon-500">
                            {project.title}
                          </Link>
                        </h2>
                        <p className="mt-1.5 text-[13px] text-ink-500">{project.developer}</p>

                        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3.5 border-t border-gold-500/20 pt-5 text-[13.5px]">
                          <div>
                            <dt className="flex items-center gap-1.5 text-[12px] text-ink-500">
                              <MapPin className="size-3.5 text-gold-500" />
                              Location
                            </dt>
                            <dd className="mt-1 text-ink-900">
                              {PropertyLocation.label(project.location)}
                              {project.sector ? `, ${project.sector}` : ''}
                            </dd>
                          </div>
                          <div>
                            <dt className="flex items-center gap-1.5 text-[12px] text-ink-500">
                              <CalendarClock className="size-3.5 text-gold-500" />
                              Expected launch
                            </dt>
                            <dd className="mt-1 text-ink-900">
                              {project.expectedLaunch || 'To be announced'}
                            </dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-[12px] text-ink-500">Starting price</dt>
                            <dd className="tabular mt-1 font-serif text-[20px] font-semibold text-maroon-900">
                              {project.startingPrice
                                ? `${formatIndianPrice(project.startingPrice)} onwards`
                                : 'On request'}
                            </dd>
                          </div>
                        </dl>

                        {project.earlyBirdNote ? (
                          <p className="mt-4 flex gap-2.5 rounded border border-gold-500/35 bg-gold-200/25 px-4 py-3 text-[13px] leading-relaxed text-maroon-900">
                            <Sparkles className="mt-0.5 size-4 shrink-0 text-gold-500" />
                            {project.earlyBirdNote}
                          </p>
                        ) : null}

                        {/* Gated block */}
                        {unlocked && detail ? (
                          <div className="mt-5 rounded border border-maroon-900/8 bg-cream-50 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gold-500">
                              Unlocked details
                            </p>
                            <dl className="mt-3 space-y-2 text-[13.5px]">
                              <div className="flex justify-between gap-4">
                                <dt className="text-ink-500">Price band</dt>
                                <dd className="tabular font-medium text-maroon-900">
                                  {formatIndianPrice(detail.priceMin)} to{' '}
                                  {formatIndianPrice(detail.priceMax)}
                                </dd>
                              </div>
                              <div className="flex justify-between gap-4">
                                <dt className="text-ink-500">Sizes</dt>
                                <dd className="tabular text-ink-900">
                                  {formatAreaRange(detail.areaMin, detail.areaMax, detail.areaUnit)}
                                </dd>
                              </div>
                              {detail.reraNumber ? (
                                <div className="flex justify-between gap-4">
                                  <dt className="text-ink-500">RERA</dt>
                                  <dd className="tabular text-right text-ink-900">
                                    {detail.reraNumber}
                                  </dd>
                                </div>
                              ) : null}
                            </dl>

                            {detail.brochureUrl ? (
                              <a
                                href={detail.brochureUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 inline-flex items-center gap-2 text-[13.5px] font-semibold text-maroon-700 hover:text-maroon-500"
                              >
                                <Download className="size-4 text-gold-500" />
                                Download brochure
                              </a>
                            ) : null}
                          </div>
                        ) : (
                          <div className="mt-5 flex items-start gap-3 rounded border border-dashed border-maroon-900/25 bg-cream-50 px-4 py-4">
                            <Lock className="mt-0.5 size-4 shrink-0 text-maroon-700" />
                            <p className="text-[13px] leading-relaxed text-ink-500">
                              Price band, unit sizes, RERA details and the brochure are shown to
                              verified buyers.{' '}
                              <a href="#unlock" className="font-medium text-maroon-700 hover:underline">
                                Verify below
                              </a>{' '}
                              to unlock.
                            </p>
                          </div>
                        )}

                        <Link
                          href={`/projects/${project.slug}`}
                          className="mt-auto inline-flex items-center gap-1.5 self-start pt-6 text-[13.5px] font-semibold text-maroon-700 hover:text-maroon-500"
                        >
                          View full project page
                          <ArrowUpRight className="size-4" />
                        </Link>
                      </div>
                    </article>
                  </RevealItem>
                )
              })}
            </RevealGroup>
          )}
        </div>
      </Section>

      <Section id="unlock" className="scroll-mt-24 border-t border-gold-500/20 bg-white">
        <div className="container">
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <SectionHeading
                eyebrow={unlocked ? 'You are verified' : 'One verification, all projects'}
                title={
                  unlocked
                    ? 'Want us to walk you through these?'
                    : 'Unlock every pre-launch on this page'
                }
                lede={
                  unlocked
                    ? 'Pre-launch allocations move fast and the paperwork differs from a normal booking. Tell us which one interests you and an advisor will take you through it.'
                    : 'We ask you to verify your phone number before we share pre-launch pricing. It keeps the list to serious buyers, and the prices you see are ones we can hold for you.'
                }
              />

              <ul className="mt-8 space-y-3.5">
                {[
                  'Prices locked in before the launch price rise',
                  'First pick of corner, park-facing and lower-floor units',
                  'The RERA and approval status, before you commit',
                  'We review the allotment paperwork for you',
                ].map((point) => (
                  <li key={point} className="flex gap-3 text-[14.5px] text-ink-900/85">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold-500" />
                    {point}
                  </li>
                ))}
              </ul>

              {settings.contact.phone && settings.contact.telHref ? (
                <p className="mt-8 text-[14px] text-ink-500">
                  Prefer to talk first?{' '}
                  <a
                    href={settings.contact.telHref}
                    className="tabular font-medium text-maroon-700 hover:underline"
                  >
                    Call {settings.contact.phone}
                  </a>
                </p>
              ) : null}
            </Reveal>

            <Reveal delay={0.08}>
              <LeadForm
                source="/pre-launch"
                defaultInterest="PRE_LAUNCH_PROJECT"
                unlocksGatedContent={!unlocked}
                heading={unlocked ? 'Speak to an advisor' : 'Verify to unlock'}
                description={
                  unlocked
                    ? 'Tell us which pre-launch interests you and we will call you back.'
                    : 'Enter your details and verify your number. The page unlocks as soon as you enter the code.'
                }
                submitLabel={unlocked ? 'Verify Phone & Submit' : 'Verify Phone & Unlock'}
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
