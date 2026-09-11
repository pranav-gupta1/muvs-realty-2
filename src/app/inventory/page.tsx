import type { Metadata } from 'next'
import Link from 'next/link'
import { getSiteSettings } from '@/lib/site'
import {
  getInventoryBounds,
  getInventoryPage,
  parseInventoryFilters,
  serializeInventoryFilters,
  type SearchParams,
} from '@/lib/inventory'
import { buildMetadata } from '@/lib/seo'
import { cn } from '@/lib/utils'

import { PageHero } from '@/components/site/page-hero'
import { Section } from '@/components/site/section'
import { RevealGroup, RevealItem } from '@/components/site/reveal'
import { EmptyState } from '@/components/site/empty-state'
import { InventoryCard } from '@/components/property/inventory-card'
import { InventoryFilters } from '@/components/property/inventory-filters'
import { LeadForm } from '@/components/lead/lead-form'

export const metadata: Metadata = buildMetadata({
  title: 'Inventory & Resale Listings',
  description:
    'Verified resale apartments, plots, villas, agricultural land, industrial sheds and commercial space across Noida, Greater Noida, the Yamuna Expressway and Delhi NCR.',
  path: '/inventory',
})

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const filters = parseInventoryFilters(params)

  const [{ items, total, page, pageCount }, bounds, settings] = await Promise.all([
    getInventoryPage(filters),
    getInventoryBounds(),
    getSiteSettings(),
  ])

  const pageHref = (target: number) =>
    `/inventory${serializeInventoryFilters({ ...filters, page: target })}`

  return (
    <>
      <PageHero
        eyebrow="Resale & ready inventory"
        title="Inventory"
        lede="We visit and verify every listing here, and check its price against recent sales nearby."
        crumbs={[{ label: 'Inventory' }]}
        imageUrl="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=2000&q=75"
      />

      <Section className="bg-cream-50">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-3">
              <div className="lg:sticky lg:top-24">
                <InventoryFilters filters={filters} bounds={bounds} total={total} />
              </div>
            </div>

            <div className="lg:col-span-9">
              <p className="tabular text-[13px] text-ink-500">
                {total} listing{total === 1 ? '' : 's'}
                {pageCount > 1 ? ` · page ${page} of ${pageCount}` : ''}
              </p>

              {items.length > 0 ? (
                <>
                  <RevealGroup className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((listing) => (
                      <RevealItem key={listing.id} className="h-full">
                        <InventoryCard listing={listing} className="h-full" />
                      </RevealItem>
                    ))}
                  </RevealGroup>

                  {pageCount > 1 ? (
                    <nav
                      aria-label="Pagination"
                      className="mt-12 flex flex-wrap items-center justify-center gap-2"
                    >
                      {page > 1 ? (
                        <Link
                          href={pageHref(page - 1)}
                          className="rounded border border-maroon-900/15 bg-white px-4 py-2 text-[13.5px] font-medium text-maroon-900 transition-colors hover:border-gold-500"
                          rel="prev"
                        >
                          Previous
                        </Link>
                      ) : null}

                      {Array.from({ length: pageCount }, (_, index) => index + 1).map((target) => (
                        <Link
                          key={target}
                          href={pageHref(target)}
                          aria-current={target === page ? 'page' : undefined}
                          className={cn(
                            'tabular rounded border px-3.5 py-2 text-[13.5px] font-medium transition-colors',
                            target === page
                              ? 'border-maroon-700 bg-maroon-700 text-cream-50'
                              : 'border-maroon-900/15 bg-white text-maroon-900 hover:border-gold-500',
                          )}
                        >
                          {target}
                        </Link>
                      ))}

                      {page < pageCount ? (
                        <Link
                          href={pageHref(page + 1)}
                          className="rounded border border-maroon-900/15 bg-white px-4 py-2 text-[13.5px] font-medium text-maroon-900 transition-colors hover:border-gold-500"
                          rel="next"
                        >
                          Next
                        </Link>
                      ) : null}
                    </nav>
                  ) : null}
                </>
              ) : (
                <EmptyState
                  title="Nothing matches those filters yet"
                  description="Try widening the price or area range, or tell us what you need. Much of our stock is never listed publicly."
                  actionHref="/inventory"
                  actionLabel="Clear all filters"
                />
              )}
            </div>
          </div>
        </div>
      </Section>

      <Section className="border-t border-gold-500/20 bg-white">
        <div className="container max-w-2xl">
          <LeadForm
            source="/inventory"
            heading="Can't find what you need?"
            description="A lot of good resale property never makes it onto the big portals. Tell us what you are after and we will look for it."
            contactPhone={settings.contact.phone}
            contactPhoneHref={settings.contact.telHref}
          />
        </div>
      </Section>
    </>
  )
}
