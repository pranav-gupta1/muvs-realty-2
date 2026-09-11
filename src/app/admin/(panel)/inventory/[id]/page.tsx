import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AdminPageHeader } from '@/components/admin/page-header'
import { InventoryForm } from '@/components/admin/inventory-form'
import { DeleteButton } from '@/components/admin/form-fields'
import { deleteInventory, updateInventory } from '../actions'

export const metadata: Metadata = { title: 'Edit listing', robots: { index: false } }

export default async function EditInventoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string }>
}) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams])

  const listing = await prisma.inventory.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!listing) notFound()

  return (
    <>
      <AdminPageHeader title="Edit listing" description={`Editing “${listing.title}”.`} />

      {saved ? (
        <p className="mb-6 rounded border border-gold-500/45 bg-gold-200/30 px-4 py-3 text-[13px] font-medium text-maroon-900">
          Saved.{' '}
          <Link href={`/inventory/${listing.slug}`} target="_blank" className="underline">
            View the live page →
          </Link>
        </p>
      ) : null}

      <InventoryForm listing={listing} action={updateInventory} />

      <form action={deleteInventory} className="mt-8 rounded border border-red-600/25 bg-red-50/50 p-5">
        <input type="hidden" name="id" value={listing.id} />
        <h2 className="text-[13.5px] font-semibold text-red-800">Delete this listing</h2>
        <p className="mt-1 text-[12.5px] text-red-800/75">
          Removes the listing and its images permanently.
        </p>
        <div className="mt-3">
          <DeleteButton
            label="Delete listing"
            confirmMessage={`Delete “${listing.title}”? This cannot be undone.`}
          />
        </div>
      </form>
    </>
  )
}
