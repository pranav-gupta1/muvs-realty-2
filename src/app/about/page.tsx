import type { Metadata } from 'next'
import Image from 'next/image'
import { HandshakeIcon, ShieldCheck, Users } from 'lucide-react'

import { getSiteSettings } from '@/lib/site'
import { getTeam } from '@/lib/team'
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

/** Supplied by the owner as "Our Core Competencies". */
const COMPETENCIES = [
  {
    icon: ShieldCheck,
    title: '100% Transparency',
    body: 'Honest and accurate information you can rely on.',
  },
  {
    icon: Users,
    title: 'Client First',
    body: 'Your needs and interests always come first.',
  },
  {
    icon: HandshakeIcon,
    title: 'We Build Relations',
    body: 'We believe in creating long-term relationships, not just transactions.',
  },
]

export default async function AboutPage() {
  const [settings, team] = await Promise.all([getSiteSettings(), getTeam()])

  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Straightforward property advice"
        lede="MUVS Realty helps buyers, sellers and investors across Delhi NCR, and we check the paperwork before any deal goes ahead."
        crumbs={[{ label: 'About' }]}
        imageUrl="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=75"
      />

      {/* Leadership */}
      {team.length > 0 ? (
        <Section className="bg-cream-50">
          <div className="container">
            <SectionHeading
              eyebrow="Leadership"
              title={team.length > 1 ? 'The people behind MUVS Realty' : 'Meet the Director'}
            />

            <div className="mt-12 space-y-16">
              {team.map((member, index) => (
                <Reveal key={member.id}>
                  <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
                    <div className="lg:col-span-4">
                      {member.imageUrl ? (
                        <div className="relative aspect-[4/5] overflow-hidden rounded border border-gold-500/25 shadow-card">
                          <Image
                            src={member.imageUrl}
                            alt={member.name}
                            fill
                            priority={index === 0}
                            sizes="(max-width: 1024px) 100vw, 33vw"
                            placeholder="blur"
                            blurDataURL={BLUR_DATA_URL}
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        /* No photograph supplied yet, so show initials rather than
                           a stock photo of someone who is not them. */
                        <div className="flex aspect-[4/5] flex-col items-center justify-center gap-4 rounded border border-gold-500/25 bg-maroon-900 shadow-card">
                          <span className="font-serif text-5xl font-semibold text-gold-200">
                            {member.initials}
                          </span>
                          <span className="text-[11px] uppercase tracking-[0.14em] text-cream-50/45">
                            Photograph to follow
                          </span>
                        </div>
                      )}

                      {member.credentials.length > 0 ? (
                        <ul className="mt-5 space-y-2.5 rounded border border-maroon-900/8 bg-white p-5">
                          <li className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-500">
                            Credentials
                          </li>
                          {member.credentials.map((credential) => (
                            <li
                              key={credential}
                              className="flex gap-3 text-[13.5px] leading-relaxed text-ink-900/85"
                            >
                              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold-500" />
                              {credential}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    <div className="lg:col-span-8">
                      <h3 className="font-serif text-[26px] leading-tight text-maroon-900 sm:text-3xl">
                        {member.name}
                      </h3>
                      <p className="mt-2 text-[13.5px] uppercase tracking-[0.1em] text-gold-500">
                        {member.designation}
                      </p>

                      {member.bio ? (
                        <div
                          className="prose-brand mt-7"
                          dangerouslySetInnerHTML={{ __html: member.bio }}
                        />
                      ) : null}

                      {member.quote ? (
                        <blockquote className="mt-8 border-l-2 border-gold-500 pl-6 font-serif text-[20px] leading-relaxed text-maroon-900">
                          “{member.quote}”
                        </blockquote>
                      ) : null}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Section>
      ) : null}

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

          <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-3">
            {COMPETENCIES.map((pillar) => (
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
