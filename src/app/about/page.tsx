import type { Metadata } from 'next'
import Image from 'next/image'
import { Award, Compass, HandshakeIcon, ShieldCheck } from 'lucide-react'

import { getSiteSettings, isPlaceholder } from '@/lib/site'
import { buildMetadata } from '@/lib/seo'
import { BLUR_DATA_URL } from '@/lib/images'

import { PageHero } from '@/components/site/page-hero'
import { Section, SectionHeading } from '@/components/site/section'
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal'
import { StatStrip } from '@/components/site/stat-strip'
import { LeadForm } from '@/components/lead/lead-form'

export const metadata: Metadata = buildMetadata({
  title: 'About MUVS Realty',
  description:
    'Who we are, how we work, and why buyers across Delhi NCR trust MUVS Realty with residential, commercial, industrial and agricultural transactions.',
  path: '/about',
})

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'We check before we recommend',
    body: 'Before a property reaches your shortlist, we check the title, mutation, approvals, dues and RERA filing. If something does not add up, we will not show it to you.',
  },
  {
    icon: Compass,
    title: 'We know our markets',
    body: 'We work in Noida, Greater Noida, the Yamuna Expressway and Delhi NCR, and we are out in these areas every week. Staying focused is what keeps our pricing advice accurate.',
  },
  {
    icon: HandshakeIcon,
    title: 'We tell you what we think',
    body: 'If a property is overpriced, or it makes sense to wait, we will say so. We would rather lose a deal than see you buy the wrong property.',
  },
  {
    icon: Award,
    title: 'One advisor, start to finish',
    body: 'The same advisor looks after you from the first site visit through registry and handover. You will not be passed to a call centre once you have booked.',
  },
]

export default async function AboutPage() {
  const settings = await getSiteSettings()
  const directorNamed = !isPlaceholder(settings.directorName)

  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Straightforward property advice"
        lede="MUVS Realty helps buyers, sellers and investors across Delhi NCR, and we check the paperwork before any deal goes ahead."
        crumbs={[{ label: 'About' }]}
        imageUrl="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=75"
      />

      {/* Director */}
      <Section className="bg-cream-50">
        <div className="container">
          <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <div className="relative aspect-[4/5] overflow-hidden rounded border border-gold-500/25 shadow-card">
                <Image
                  src={
                    settings.directorImageUrl ||
                    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=75'
                  }
                  alt={directorNamed ? settings.directorName : 'Director, MUVS Realty'}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className="object-cover"
                />
              </div>

              {settings.directorCredentialList.length > 0 ? (
                <ul className="mt-6 space-y-2.5 rounded border border-maroon-900/8 bg-white p-5">
                  <li className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-500">
                    Credentials
                  </li>
                  {settings.directorCredentialList.map((credential) => (
                    <li key={credential} className="flex gap-3 text-[13.5px] leading-relaxed text-ink-900/85">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold-500" />
                      {credential}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Reveal>

            <Reveal delay={0.08} className="lg:col-span-7">
              <p className="eyebrow">Leadership</p>
              <h2 className="mt-3 text-[30px] leading-tight sm:text-4xl">
                {directorNamed ? settings.directorName : 'Meet the Director'}
              </h2>
              <p className="mt-2 text-[13.5px] uppercase tracking-[0.1em] text-gold-500">
                {settings.directorDesignation}
              </p>

              {settings.directorBio ? (
                <div
                  className="prose-brand mt-8"
                  dangerouslySetInnerHTML={{ __html: settings.directorBio }}
                />
              ) : null}

              {settings.directorQuote ? (
                <blockquote className="mt-10 border-l-2 border-gold-500 pl-6 font-serif text-[20px] leading-relaxed text-maroon-900 sm:text-[24px]">
                  “{settings.directorQuote}”
                </blockquote>
              ) : null}
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Story + mission */}
      <Section className="bg-white">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <SectionHeading eyebrow="Our story" title="How MUVS Realty started" />
              {settings.aboutStory ? (
                <div
                  className="prose-brand mt-8"
                  dangerouslySetInnerHTML={{ __html: settings.aboutStory }}
                />
              ) : null}
            </div>

            <Reveal delay={0.08} className="lg:col-span-5">
              <div className="rounded border border-gold-500/30 bg-cream-50 p-8">
                <p className="eyebrow">Our mission</p>
                <p className="mt-5 font-serif text-[21px] leading-relaxed text-maroon-900">
                  {settings.aboutMission}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Stats */}
      <Section className="border-y border-gold-500/20 bg-cream-50 py-14 sm:py-16">
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

      {/* Pillars */}
      <Section className="bg-white">
        <div className="container">
          <SectionHeading
            eyebrow="Why choose us"
            title="Why clients work with us"
            align="center"
          />

          <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2">
            {PILLARS.map((pillar) => (
              <RevealItem key={pillar.title} className="h-full">
                <div className="flex h-full gap-5 rounded border border-maroon-900/8 bg-cream-50 p-6 transition-colors hover:border-gold-500/60">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-maroon-900">
                    <pillar.icon className="size-5 text-gold-200" />
                  </span>
                  <div>
                    <h3 className="font-serif text-[18px] text-maroon-900">{pillar.title}</h3>
                    <p className="mt-2.5 text-[14px] leading-relaxed text-ink-500">{pillar.body}</p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </Section>

      <Section className="bg-cream-50">
        <div className="container max-w-2xl">
          <LeadForm
            source="/about"
            heading="Start a conversation"
            description="Tell us what you are planning. Buying, selling, or still deciding whether now is a good time, we are happy to talk it through."
            contactPhone={settings.contact.phone}
            contactPhoneHref={settings.contact.telHref}
          />
        </div>
      </Section>
    </>
  )
}
