import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { BLUR_DATA_URL, primaryImageUrl } from '@/lib/images'
import { formatArea, formatIndianPrice, formatPricePerUnit } from '@/lib/format'
import { PropertyLocation, PropertyType } from '@/lib/taxonomy'
import { bhkLabel, cardHighlights, type InventoryDetails } from '@/lib/inventory-details'
import { readJson } from '@/lib/json'
import { z } from 'zod'
import type { InventoryCard as InventoryCardData } from '@/lib/inventory'
import { cn } from '@/lib/utils'

const detailsSchema = z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).catch({})

export function InventoryCard({
  listing,
  className,
}: {
  listing: InventoryCardData
  className?: string
}) {
  const href = `/inventory/${listing.slug}`
  const details = readJson(listing.details, detailsSchema, {}) as InventoryDetails
  const highlights = cardHighlights(listing.propertyType, details, listing.areaUnit)
  const bhk = bhkLabel(listing.propertyType, details)
  const perUnit = formatPricePerUnit(listing.pricePerUnit, listing.areaUnit)

  return (
    <article
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded border border-maroon-900/8 bg-white shadow-card transition-all duration-300 hover:border-gold-500/60 hover:shadow-card-hover',
        listing.isSold && 'opacity-90',
        className,
      )}
    >
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden">
        <Image
          src={primaryImageUrl(listing.images)}
          alt={listing.images[0]?.alt || listing.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          className={cn(
            'object-cover transition-transform duration-700 group-hover:scale-[1.04]',
            listing.isSold && 'grayscale',
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-maroon-900/55 via-transparent to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge variant="light">{PropertyType.label(listing.propertyType)}</Badge>
          {bhk ? <Badge variant="light">{bhk}</Badge> : null}
          {listing.isFeatured && !listing.isSold ? <Badge variant="gold">Featured</Badge> : null}
        </div>

        {listing.isSold ? (
          <div className="absolute inset-0 flex items-center justify-center bg-maroon-900/45">
            <span className="rounded border border-cream-50/40 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.16em] text-cream-50">
              Sold
            </span>
          </div>
        ) : null}

        <p className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[12.5px] font-medium text-cream-50">
          <MapPin className="size-3.5 text-gold-500" />
          {PropertyLocation.label(listing.location)}
          {listing.sector ? ` · ${listing.sector}` : ''}
        </p>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="tabular font-serif text-[22px] font-semibold text-maroon-900">
            {formatIndianPrice(listing.price)}
          </p>
          {listing.priceNegotiable ? (
            <span className="text-[11px] uppercase tracking-[0.08em] text-ink-500">Negotiable</span>
          ) : null}
        </div>
        {perUnit ? <p className="tabular mt-0.5 text-[12.5px] text-ink-500">{perUnit}</p> : null}

        <h3 className="mt-3 font-serif text-[17px] leading-snug text-maroon-900">
          <Link href={href} className="transition-colors hover:text-maroon-500">
            {listing.title}
          </Link>
        </h3>

        <p className="tabular mt-2 text-[13.5px] text-ink-900">
          {formatArea(listing.area, listing.areaUnit)}
        </p>

        {highlights.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-1.5 border-t border-gold-500/20 pt-4">
            {highlights.map((row) => (
              <li
                key={row.key}
                className="rounded-full bg-cream-50 px-2.5 py-1 text-[11.5px] text-ink-900"
              >
                {row.kind === 'boolean' ? (
                  row.label
                ) : row.kind === 'number' ? (
                  <>
                    <span className="tabular font-medium">{row.value}</span>{' '}
                    <span className="text-ink-500">{row.label.toLowerCase()}</span>
                  </>
                ) : (
                  row.value
                )}
              </li>
            ))}
          </ul>
        ) : null}

        <Link
          href={href}
          className="mt-auto inline-flex items-center gap-1.5 self-start pt-5 text-[13.5px] font-semibold text-maroon-700 transition-colors hover:text-maroon-500"
        >
          View details
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </article>
  )
}
