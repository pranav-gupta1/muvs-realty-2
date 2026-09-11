import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { Compass, Landmark, MapPin, ScrollText } from 'lucide-react'

import { prisma } from '@/lib/prisma'
import { getSimilarInventory } from '@/lib/inventory'
import { buildWhatsAppLink, getSiteSettings } from '@/lib/site'
import { readJson, readLandmarks } from '@/lib/json'
import { describeDetails, bhkLabel, type InventoryDetails } from '@/lib/inventory-details'
import { Facing, Ownership, PropertyLocation, PropertyType, TransactionType } from '@/lib/taxonomy'
import { formatArea, formatIndianPrice, formatPricePerUnit } from '@/lib/format'
import { galleryImages, primaryImageUrl } from '@/lib/images'
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
import { InventoryCard } from '@/components/property/inventory-card'
import { ShareButton } from '@/components/property/share-button'
import { LeadForm } from '@/components/lead/lead-form'

const detailsSchema = z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).catch({})

async function getListing(slug: string) {
  return prisma.inventory.findFirst({
    where: { slug, isPublished: true },
    include: { images: { orderBy: { sortOrder: 'asc' } } },
  })
}

export async function generateStaticParams() {
  const listings = await prisma.inventory.findMany({
    where: { isPublished: true },
    select: { slug: true },
  })
  return listings.map((listing) => ({ slug: listing.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const listing = await getListing(slug)
  if (!listing) {
    return buildMetadata({
      title: 'Listing not found',
      description: '',
      path: `/inventory/${slug}`,
      noindex: true,
    })
  }

  return buildMetadata({
    title: listing.title,
    description: truncate(
      stripHtml(listing.description) ||
        `${PropertyType.label(listing.propertyType)} for sale in ${PropertyLocation.label(listing.location)}. ${formatIndianPrice(listing.price)}, ${formatArea(listing.area, listing.areaUnit)}.`,
      160,
    ),
    path: `/inventory/${listing.slug}`,
    image: primaryImageUrl(listing.images),
    type: 'article',
  })
}

export default async function InventoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [listing, settings] = await Promise.all([getListing(slug), getSiteSettings()])
  if (!listing) notFound()

  const details = readJson(listing.details, detailsSchema, {}) as InventoryDetails
  const landmarks = readLandmarks(listing.nearbyLandmarks)
  const detailRows = describeDetails(listing.propertyType, details, listing.areaUnit)
  const similar = await getSimilarInventory(listing)

  const images = galleryImages(listing.images).map((image) => ({
    id: image.id,
    url: image.url,
    alt: image.alt,
  }))

  const perUnit = formatPricePerUnit(listing.pricePerUnit, listing.areaUnit)
  const bhk = bhkLabel(listing.propertyType, details)

  const whatsappHref = buildWhatsAppLink(
    settings.contact.whatsapp,
    `Hi ${settings.companyName}, I am interested in "${listing.title}" (${formatIndianPrice(listing.price)}). Please share more details.`,
  )

  const baseRows = [
    { label: 'Property type', value: PropertyType.label(listing.propertyType) },
    { label: 'Transaction', value: TransactionType.label(listing.transactionType) },
    {
      label: 'Location',
      value: [PropertyLocation.label(listing.location), listing.sector].filter(Boolean).join(', '),
    },
    { label: 'Area', value: formatArea(listing.area, listing.areaUnit) },
    ...(perUnit ? [{ label: 'Rate', value: perUnit }] : []),
    ...(listing.ownership ? [{ label: 'Ownership', value: Ownership.label(listing.ownership) }] : []),
    ...(listing.facing ? [{ label: 'Facing', value: Facing.label(listing.facing) }] : []),
    {
      label: 'Price',
      value: `${formatIndianPrice(listing.price)}${listing.priceNegotiable ? ' (negotiable)' : ''}`,
    },
  ]

  return (
    <>
      <JsonLd
        data={[
          listingJsonLd({
            name: listing.title,
            description: truncate(stripHtml(listing.description), 300),
            path: `/inventory/${listing.slug}`,
            images: images.map((image) => image.url),
            price: listing.price,
            availability: listing.isSold ? 'SoldOut' : 'InStock',
          }),
          breadcrumbJsonLd([
            { name: 'Inventory', path: '/inventory' },
            { name: listing.title, path: `/inventory/${listing.slug}` },
          ]),
        ]}
      />

      <PageHero
        size="sm"
        eyebrow={PropertyType.label(listing.propertyType)}
        title={listing.title}
        imageUrl={primaryImageUrl(listing.images)}
        crumbs={[{ label: 'Inventory', href: '/inventory' }, { label: listing.title }]}
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[13.5px] text-cream-50/80">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4 text-gold-500" />
            {PropertyLocation.label(listing.location)}
            {listing.sector ? `, ${listing.sector}` : ''}
          </span>
          <span className="tabular flex items-center gap-1.5">
            <Compass className="size-4 text-gold-500" />
            {formatArea(listing.area, listing.areaUnit)}
          </span>
          {bhk ? <Badge variant="light">{bhk}</Badge> : null}
          {listing.isSold ? <Badge variant="gold">Sold</Badge> : null}
        </div>
      </PageHero>

      <Section className="bg-cream-50 py-12 sm:py-16">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-8">
              <Reveal>
                <Gallery images={images} title={listing.title} />
              </Reveal>

              <Reveal className="mt-10 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="tabular font-serif text-[30px] font-semibold leading-none text-maroon-900">
                    {formatIndianPrice(listing.price)}
                  </p>
                  <p className="tabular mt-2 text-[13.5px] text-ink-500">
                    {perUnit ? `${perUnit} · ` : ''}
                    {formatArea(listing.area, listing.areaUnit)}
                    {listing.priceNegotiable ? ' · Negotiable' : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <ShareButton title={listing.title} path={`/inventory/${listing.slug}`} />
                  {whatsappHref ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                        WhatsApp us
                      </a>
                    </Button>
                  ) : null}
                </div>
              </Reveal>

              <Reveal className="mt-12">
                <h2 className="font-serif text-2xl text-maroon-900">Property details</h2>
                <div className="hairline my-5" />
                <SpecTable rows={baseRows} />
              </Reveal>

              {detailRows.length > 0 ? (
                <Reveal className="mt-12">
                  <h2 className="font-serif text-2xl text-maroon-900">
                    {PropertyType.label(listing.propertyType)} specifications
                  </h2>
                  <div className="hairline my-5" />
                  <SpecTable rows={detailRows.map(({ label, value }) => ({ label, value }))} />
                </Reveal>
              ) : null}

              {listing.description ? (
                <Reveal className="mt-12">
                  <h2 className="font-serif text-2xl text-maroon-900">About this property</h2>
                  <div className="hairline my-5" />
                  <div
                    className="prose-brand"
                    dangerouslySetInnerHTML={{ __html: listing.description }}
                  />
                </Reveal>
              ) : null}

              {listing.address ? (
                <Reveal className="mt-12">
                  <h2 className="font-serif text-2xl text-maroon-900">Address</h2>
                  <div className="hairline my-5" />
                  <p className="flex gap-3 rounded border border-maroon-900/8 bg-white px-5 py-4 text-[14.5px] leading-relaxed text-ink-900">
                    <Landmark className="mt-0.5 size-4 shrink-0 text-gold-500" />
                    {listing.address}
                  </p>
                </Reveal>
              ) : null}

              {landmarks.length > 0 ? (
                <Reveal className="mt-12">
                  <h2 className="font-serif text-2xl text-maroon-900">Nearby landmarks</h2>
                  <div className="hairline my-5" />
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {landmarks.map((landmark) => (
                      <li
                        key={landmark.name}
                        className="flex items-center justify-between gap-4 rounded border border-maroon-900/8 bg-white px-4 py-3"
                      >
                        <span className="text-[14px] text-ink-900">{landmark.name}</span>
                        <span className="tabular shrink-0 text-[13px] font-medium text-maroon-700">
                          {landmark.distance}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ) : null}
            </div>

            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-24">
                <LeadForm
                  source={`/inventory/${listing.slug}`}
                  relatedType="inventory"
                  relatedId={listing.id}
                  relatedTitle={listing.title}
                  defaultInterest={listing.propertyType}
                  defaultLocation={listing.location}
                  heading="Enquire about this property"
                  description="Verify your number and an advisor will call you back to go over the paperwork, the price and a time for a site visit."
                  contactPhone={settings.contact.phone}
                  contactPhoneHref={settings.contact.telHref}
                />

                <p className="mt-4 flex items-start gap-2.5 rounded border border-maroon-900/8 bg-white px-5 py-4 text-[12.5px] leading-relaxed text-ink-500">
                  <ScrollText className="mt-0.5 size-4 shrink-0 text-gold-500" />
                  <span>
                    We check the title documents, approvals and dues before we arrange any site
                    visit.
                  </span>
                </p>

                <p className="mt-4 text-center text-[12.5px] text-ink-500">
                  <Link href="/inventory" className="text-maroon-700 hover:underline">
                    ← Back to all inventory
                  </Link>
                </p>
              </div>
            </aside>
          </div>

          {similar.length > 0 ? (
            <Reveal className="mt-20">
              <h2 className="font-serif text-2xl text-maroon-900">Similar properties</h2>
              <div className="hairline my-5" />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {similar.map((item) => (
                  <InventoryCard key={item.id} listing={item} className="h-full" />
                ))}
              </div>
            </Reveal>
          ) : null}
        </div>
      </Section>
    </>
  )
}
