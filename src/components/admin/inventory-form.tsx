import type { Image as ImageRow, Inventory } from '@prisma/client'
import { z } from 'zod'
import { AreaUnit, Facing, Ownership, PropertyLocation, TransactionType } from '@/lib/taxonomy'
import { readJson, readLandmarks } from '@/lib/json'
import type { InventoryDetails } from '@/lib/inventory-details'
import {
  AdminField,
  FormSection,
  SelectInput,
  SubmitButton,
  TextArea,
  TextInput,
  Toggle,
} from '@/components/admin/form-fields'
import { ImageManager } from '@/components/admin/image-manager'
import { InventoryTypeFields } from '@/components/admin/inventory-type-fields'

const detailsSchema = z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).catch({})

type ListingWithImages = Inventory & { images: ImageRow[] }

export function InventoryForm({
  listing,
  action,
}: {
  listing?: ListingWithImages
  action: (formData: FormData) => Promise<void>
}) {
  const details = listing
    ? (readJson(listing.details, detailsSchema, {}) as InventoryDetails)
    : {}
  const landmarks = listing ? readLandmarks(listing.nearbyLandmarks) : []

  return (
    <form action={action} className="space-y-6">
      {listing ? <input type="hidden" name="id" value={listing.id} /> : null}

      <FormSection title="Basics">
        <AdminField label="Listing title" htmlFor="title" required>
          <TextInput
            id="title"
            name="title"
            defaultValue={listing?.title}
            required
            placeholder="3 BHK Apartment in Sector 150, Noida"
          />
        </AdminField>

        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField label="URL slug" htmlFor="slug" hint="Leave blank to generate from the title.">
            <TextInput id="slug" name="slug" defaultValue={listing?.slug} placeholder="auto" />
          </AdminField>

          <AdminField label="Transaction" htmlFor="transactionType">
            <SelectInput
              id="transactionType"
              name="transactionType"
              options={TransactionType.options}
              defaultValue={listing?.transactionType ?? 'RESALE'}
            />
          </AdminField>

          <AdminField label="Location" htmlFor="location">
            <SelectInput
              id="location"
              name="location"
              options={PropertyLocation.options}
              defaultValue={listing?.location ?? 'NOIDA'}
            />
          </AdminField>

          <AdminField label="Sector / locality" htmlFor="sector">
            <TextInput id="sector" name="sector" defaultValue={listing?.sector ?? ''} />
          </AdminField>

          <AdminField label="Full address" htmlFor="address" className="sm:col-span-2">
            <TextInput id="address" name="address" defaultValue={listing?.address ?? ''} />
          </AdminField>
        </div>
      </FormSection>

      <FormSection
        title="Price & area"
        description="Price in rupees. The rate per unit and the sq.ft. equivalent used by the area filter are calculated automatically."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AdminField label="Price (₹)" htmlFor="price" required>
            <TextInput
              id="price"
              name="price"
              inputMode="numeric"
              required
              defaultValue={listing?.price ?? ''}
              placeholder="16200000"
            />
          </AdminField>

          <AdminField label="Area" htmlFor="area" required>
            <TextInput
              id="area"
              name="area"
              inputMode="decimal"
              required
              defaultValue={listing?.area ?? ''}
            />
          </AdminField>

          <AdminField label="Area unit" htmlFor="areaUnit">
            <SelectInput
              id="areaUnit"
              name="areaUnit"
              options={AreaUnit.options}
              defaultValue={listing?.areaUnit ?? 'SQFT'}
            />
          </AdminField>

          <AdminField label="Ownership" htmlFor="ownership">
            <SelectInput
              id="ownership"
              name="ownership"
              options={Ownership.options}
              placeholder="Not specified"
              defaultValue={listing?.ownership ?? ''}
            />
          </AdminField>

          <AdminField label="Facing" htmlFor="facing">
            <SelectInput
              id="facing"
              name="facing"
              options={Facing.options}
              placeholder="Not specified"
              defaultValue={listing?.facing ?? ''}
            />
          </AdminField>
        </div>

        <Toggle
          name="priceNegotiable"
          label="Price is negotiable"
          defaultChecked={listing?.priceNegotiable ?? false}
        />
      </FormSection>

      <FormSection title="Property type & specifications">
        <InventoryTypeFields
          defaultType={listing?.propertyType}
          defaultDetails={details}
          defaultAreaUnit={listing?.areaUnit}
        />
      </FormSection>

      <FormSection title="Description & surroundings">
        <AdminField
          label="Description"
          htmlFor="description"
          hint="Basic HTML is allowed. Wrap each paragraph in <p> tags."
        >
          <TextArea id="description" name="description" rows={7} defaultValue={listing?.description ?? ''} />
        </AdminField>

        <AdminField
          label="Nearby landmarks"
          htmlFor="nearbyLandmarks"
          hint='JSON array: [{"name":"Sector 137 Metro","distance":"2.6 km"}]'
        >
          <TextArea
            id="nearbyLandmarks"
            name="nearbyLandmarks"
            rows={5}
            className="font-mono text-[12px]"
            defaultValue={JSON.stringify(landmarks, null, 2)}
          />
        </AdminField>
      </FormSection>

      <FormSection title="Images" description="Drag to reorder. The starred image is used on cards and for sharing.">
        <ImageManager
          initial={(listing?.images ?? []).map((image) => ({
            url: image.url,
            alt: image.alt,
            isPrimary: image.isPrimary,
          }))}
        />
      </FormSection>

      <FormSection title="Visibility">
        <div className="grid gap-4 sm:grid-cols-3">
          <Toggle
            name="isPublished"
            label="Published"
            hint="Hidden from the website when off."
            defaultChecked={listing?.isPublished ?? true}
          />
          <Toggle
            name="isFeatured"
            label="Featured"
            defaultChecked={listing?.isFeatured ?? false}
          />
          <Toggle
            name="isSold"
            label="Sold"
            hint="Stays visible but marked as sold."
            defaultChecked={listing?.isSold ?? false}
          />
        </div>
      </FormSection>

      <div className="flex justify-end">
        <SubmitButton>{listing ? 'Save changes' : 'Create listing'}</SubmitButton>
      </div>
    </form>
  )
}
