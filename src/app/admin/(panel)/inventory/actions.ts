'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { AreaUnit, Facing, Ownership, PropertyLocation, PropertyType, TransactionType } from '@/lib/taxonomy'
import { landmarkListSchema } from '@/lib/json'
import { deriveInventoryFields } from '@/lib/inventory'
import { sanitizeDetails } from '@/lib/inventory-details'
import { bool, images, jsonField, num, optionalStr, requiredNum, str, uniqueSlug } from '@/lib/admin-forms'

async function assertAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error('Not authorised.')
}

function revalidateInventory(slug?: string) {
  revalidatePath('/')
  revalidatePath('/inventory')
  revalidatePath('/admin/inventory')
  if (slug) revalidatePath(`/inventory/${slug}`)
}

/** Collects the `details.<key>` inputs the type-specific field set produces. */
function collectDetails(form: FormData, propertyType: string) {
  const raw: Record<string, FormDataEntryValue> = {}
  for (const [key, value] of form.entries()) {
    if (key.startsWith('details.')) raw[key.slice('details.'.length)] = value
  }
  // sanitizeDetails validates against the same spec the public page renders
  // from, and silently drops anything unknown or empty.
  return sanitizeDetails(propertyType, raw)
}

async function readInventoryForm(form: FormData, currentId?: string) {
  const title = str(form, 'title') || 'Untitled listing'
  const propertyType = PropertyType.parse(str(form, 'propertyType')) ?? 'APARTMENT'
  const areaUnit = AreaUnit.parse(str(form, 'areaUnit')) ?? 'SQFT'
  const price = requiredNum(form, 'price')
  const area = requiredNum(form, 'area')

  return {
    slug: await uniqueSlug('inventory', str(form, 'slug'), title, currentId),
    title,
    propertyType,
    transactionType: TransactionType.parse(str(form, 'transactionType')) ?? 'RESALE',
    location: PropertyLocation.parse(str(form, 'location')) ?? 'NOIDA',
    sector: optionalStr(form, 'sector'),
    address: optionalStr(form, 'address'),

    price,
    priceNegotiable: bool(form, 'priceNegotiable'),
    area,
    areaUnit,
    ...deriveInventoryFields({ price, area, areaUnit }),

    description: str(form, 'description'),
    ownership: Ownership.parse(str(form, 'ownership')),
    facing: Facing.parse(str(form, 'facing')),

    nearbyLandmarks: jsonField(form, 'nearbyLandmarks', landmarkListSchema, []),
    details: JSON.stringify(collectDetails(form, propertyType)),

    isFeatured: bool(form, 'isFeatured'),
    isPublished: bool(form, 'isPublished'),
    isSold: bool(form, 'isSold'),
  }
}

export async function createInventory(form: FormData) {
  await assertAdmin()
  const data = await readInventoryForm(form)

  const listing = await prisma.inventory.create({
    data: { ...data, images: { create: images(form) } },
    select: { id: true, slug: true },
  })

  revalidateInventory(listing.slug)
  redirect(`/admin/inventory/${listing.id}?saved=1`)
}

export async function updateInventory(form: FormData) {
  await assertAdmin()

  const id = str(form, 'id')
  if (!id) throw new Error('Missing listing id.')

  const previous = await prisma.inventory.findUnique({ where: { id }, select: { slug: true } })
  const data = await readInventoryForm(form, id)

  await prisma.inventory.update({
    where: { id },
    data: { ...data, images: { deleteMany: {}, create: images(form) } },
  })

  revalidateInventory(data.slug)
  if (previous && previous.slug !== data.slug) revalidatePath(`/inventory/${previous.slug}`)
  redirect(`/admin/inventory/${id}?saved=1`)
}

export async function deleteInventory(form: FormData) {
  await assertAdmin()

  const id = str(form, 'id')
  if (!id) return

  const listing = await prisma.inventory.findUnique({ where: { id }, select: { slug: true } })
  await prisma.inventory.delete({ where: { id } })

  revalidateInventory(listing?.slug)
  redirect('/admin/inventory')
}

export async function toggleInventoryFlag(form: FormData) {
  await assertAdmin()

  const id = str(form, 'id')
  const field = z.enum(['isPublished', 'isFeatured', 'isSold']).safeParse(str(form, 'field'))
  if (!id || !field.success) return

  const listing = await prisma.inventory.findUnique({
    where: { id },
    select: { slug: true, isPublished: true, isFeatured: true, isSold: true },
  })
  if (!listing) return

  await prisma.inventory.update({
    where: { id },
    data: { [field.data]: !listing[field.data] },
  })

  revalidateInventory(listing.slug)
}
