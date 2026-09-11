import type { Metadata } from 'next'

import { prisma } from '@/lib/prisma'
import { getSiteSettings } from '@/lib/site'
import { buildMetadata, videoJsonLd } from '@/lib/seo'

import { PageHero } from '@/components/site/page-hero'
import { Section } from '@/components/site/section'
import { JsonLd } from '@/components/site/json-ld'
import { EmptyState } from '@/components/site/empty-state'
import { VideoLibrary } from '@/components/property/video-library'
import { LeadForm } from '@/components/lead/lead-form'

export const metadata: Metadata = buildMetadata({
  title: 'Property Videos',
  description:
    'Property tours, site visits, client stories and Delhi NCR market updates from MUVS Realty.',
  path: '/videos',
})

export default async function VideosPage() {
  const [videos, settings] = await Promise.all([
    prisma.video.findMany({ where: { isPublished: true }, orderBy: { sortOrder: 'asc' } }),
    getSiteSettings(),
  ])

  return (
    <>
      {videos.length > 0 ? (
        <JsonLd
          data={videos.map((video) =>
            videoJsonLd({
              name: video.title,
              description: video.description || video.title,
              youtubeId: video.youtubeId,
              uploadDate: video.createdAt,
            }),
          )}
        />
      ) : null}

      <PageHero
        eyebrow="Watch"
        title="Videos"
        lede="Walkthroughs, site visits and market updates, so you can get a good look at a property before making the trip."
        crumbs={[{ label: 'Videos' }]}
        imageUrl="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2000&q=75"
      />

      <Section className="bg-cream-50">
        <div className="container">
          {videos.length > 0 ? (
            <VideoLibrary videos={videos} />
          ) : (
            <EmptyState
              title="No videos published yet"
              description="Property tours and market updates will appear here soon."
              actionHref="/inventory"
              actionLabel="Browse inventory instead"
            />
          )}
        </div>
      </Section>

      <Section className="border-t border-gold-500/20 bg-white">
        <div className="container max-w-2xl">
          <LeadForm
            source="/videos"
            heading="Want a private walkthrough?"
            description="Can't make it to a site visit? We will record a video walkthrough just for you. Many of our NRI clients use this."
            contactPhone={settings.contact.phone}
            contactPhoneHref={settings.contact.telHref}
          />
        </div>
      </Section>
    </>
  )
}
