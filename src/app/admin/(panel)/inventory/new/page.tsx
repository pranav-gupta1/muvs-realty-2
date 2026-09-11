import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/page-header'
import { InventoryForm } from '@/components/admin/inventory-form'
import { createInventory } from '../actions'

export const metadata: Metadata = { title: 'New listing', robots: { index: false } }

export default function NewInventoryPage() {
  return (
    <>
      <AdminPageHeader
        title="New listing"
        description="Add a resale or ready property. Pick the property type first and the matching specification fields will appear."
      />
      <InventoryForm action={createInventory} />
    </>
  )
}
