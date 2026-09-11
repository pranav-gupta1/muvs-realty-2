import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, EyeOff, Star } from 'lucide-react'

import { prisma } from '@/lib/prisma'
import { PropertyLocation, PropertyType } from '@/lib/taxonomy'
import { formatArea, formatIndianPrice } from '@/lib/format'
import { BLUR_DATA_URL, primaryImageUrl } from '@/lib/images'
import { AdminPageHeader } from '@/components/admin/page-header'
import { Badge } from '@/components/ui/badge'
import { toggleInventoryFlag } from './actions'

export const metadata: Metadata = { title: 'Inventory', robots: { index: false } }

export default async function AdminInventoryPage() {
  const listings = await prisma.inventory.findMany({
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
  })

  return (
    <>
      <AdminPageHeader
        title="Inventory"
        description="Resale and ready listings. The specification fields change with the property type."
        action={{ href: '/admin/inventory/new', label: 'New listing' }}
      />

      {listings.length === 0 ? (
        <p className="rounded border border-dashed border-maroon-900/20 bg-white px-5 py-12 text-center text-[13.5px] text-ink-500">
          No listings yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {listings.map((listing) => (
            <li
              key={listing.id}
              className="flex flex-wrap items-center gap-4 rounded border border-maroon-900/10 bg-white p-4"
            >
              <Link
                href={`/admin/inventory/${listing.id}`}
                className="relative size-16 shrink-0 overflow-hidden rounded bg-cream-50"
              >
                <Image
                  src={primaryImageUrl(listing.images)}
                  alt=""
                  fill
                  sizes="64px"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className="object-cover"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/inventory/${listing.id}`}
                    className="text-[14.5px] font-semibold text-maroon-900 hover:underline"
                  >
                    {listing.title}
                  </Link>
                  <Badge variant="outline">{PropertyType.label(listing.propertyType)}</Badge>
                  {!listing.isPublished ? <Badge variant="muted">Draft</Badge> : null}
                  {listing.isSold ? <Badge variant="maroon">Sold</Badge> : null}
                </div>
                <p className="tabular mt-1 text-[12.5px] text-ink-500">
                  {formatIndianPrice(listing.price)} · {formatArea(listing.area, listing.areaUnit)} ·{' '}
                  {PropertyLocation.label(listing.location)}
                  {listing.sector ? `, ${listing.sector}` : ''}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <form action={toggleInventoryFlag}>
                  <input type="hidden" name="id" value={listing.id} />
                  <input type="hidden" name="field" value="isFeatured" />
                  <button
                    type="submit"
                    title={listing.isFeatured ? 'Remove from featured' : 'Mark as featured'}
                    aria-label={listing.isFeatured ? 'Remove from featured' : 'Mark as featured'}
                    className="rounded p-2 hover:bg-cream-50"
                  >
                    <Star
                      className={
                        listing.isFeatured ? 'size-4 fill-gold-500 text-gold-500' : 'size-4 text-ink-500'
                      }
                    />
                  </button>
                </form>

                <form action={toggleInventoryFlag}>
                  <input type="hidden" name="id" value={listing.id} />
                  <input type="hidden" name="field" value="isPublished" />
                  <button
                    type="submit"
                    title={listing.isPublished ? 'Unpublish' : 'Publish'}
                    aria-label={listing.isPublished ? 'Unpublish' : 'Publish'}
                    className="rounded p-2 hover:bg-cream-50"
                  >
                    {listing.isPublished ? (
                      <Eye className="size-4 text-maroon-700" />
                    ) : (
                      <EyeOff className="size-4 text-ink-500" />
                    )}
                  </button>
                </form>

                <form action={toggleInventoryFlag}>
                  <input type="hidden" name="id" value={listing.id} />
                  <input type="hidden" name="field" value="isSold" />
                  <button
                    type="submit"
                    className="rounded px-2.5 py-1.5 text-[12.5px] font-medium text-ink-500 hover:bg-cream-50"
                  >
                    {listing.isSold ? 'Mark available' : 'Mark sold'}
                  </button>
                </form>

                <Link
                  href={`/inventory/${listing.slug}`}
                  target="_blank"
                  className="rounded px-2.5 py-1.5 text-[12.5px] font-medium text-ink-500 hover:bg-cream-50"
                >
                  View
                </Link>
                <Link
                  href={`/admin/inventory/${listing.id}`}
                  className="rounded px-2.5 py-1.5 text-[12.5px] font-medium text-maroon-700 hover:bg-cream-50"
                >
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
