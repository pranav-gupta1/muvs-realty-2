import type { Metadata } from 'next'
import { BadgeCheck } from 'lucide-react'

import { prisma } from '@/lib/prisma'
import { getSiteSettings } from '@/lib/site'
import { buildMetadata } from '@/lib/seo'

import { PageHero } from '@/components/site/page-hero'
import { Section } from '@/components/site/section'
import { Reveal } from '@/components/site/reveal'
import { EmptyState } from '@/components/site/empty-state'
import { CertificationGrid } from '@/components/property/certification-grid'

export const metadata: Metadata = buildMetadata({
  title: 'Certifications & Registrations',
  description:
    'RERA registration, professional memberships and quality accreditations held by MUVS Realty.',
  path: '/certifications',
})

export default async function CertificationsPage() {
  const [certifications, settings] = await Promise.all([
    prisma.certification.findMany({ where: { isPublished: true }, orderBy: { sortOrder: 'asc' } }),
    getSiteSettings(),
  ])

  return (
    <>
      <PageHero
        eyebrow="Registered & accredited"
        title="Certifications"
        lede="The registrations and memberships we hold, with the details you need to check them yourself."
        crumbs={[{ label: 'Certifications' }]}
        imageUrl="https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=2000&q=75"
      />

      {/* RERA number, displayed prominently as required. */}
      {settings.contact.reraNumber ? (
        <Section className="border-b border-gold-500/25 bg-white py-12">
          <div className="container">
            <Reveal className="flex flex-col items-center gap-4 rounded border border-gold-500/40 bg-gold-200/25 px-6 py-8 text-center">
              <BadgeCheck className="size-8 text-maroon-700" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-500">
                RERA Registration Number
              </p>
              <p className="tabular font-serif text-2xl font-semibold text-maroon-900 sm:text-3xl">
                {settings.contact.reraNumber}
              </p>
              <p className="max-w-xl text-[13.5px] leading-relaxed text-ink-500">
                Registered as a real estate agent under the Real Estate (Regulation and Development)
                Act, 2016. You can verify this number on the UP RERA portal.
              </p>
            </Reveal>
          </div>
        </Section>
      ) : null}

      <Section className="bg-cream-50">
        <div className="container">
          {certifications.length > 0 ? (
            <CertificationGrid certifications={certifications} />
          ) : (
            <EmptyState
              title="Certifications are being added"
              description="Our registrations and accreditations will be published here shortly."
              actionHref="/contact"
              actionLabel="Ask us directly"
            />
          )}
        </div>
      </Section>
    </>
  )
}
