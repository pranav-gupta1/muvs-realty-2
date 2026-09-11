import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  AreaUnit,
  InventorySort,
  PropertyLocation,
  PropertyType,
  type InventorySort as InventorySortValue,
} from '@/lib/taxonomy'

/**
 * Query layer for resale inventory. Filters round-trip through the URL so a
 * filtered view is shareable, and every value is re-parsed against the taxonomy
 * before it reaches the database.
 */

/**
 * Conversion to square feet. BIGHA varies by region — this uses the western UP
 * / Delhi NCR pucca bigha (3,025 sq.yd.), which is the convention across the
 * markets MUVS operates in.
 */
export const AREA_TO_SQFT: Record<string, number> = {
  SQFT: 1,
  SQYD: 9,
  SQM: 10.7639,
  ACRE: 43_560,
  BIGHA: 27_225,
}

export function toSqft(area: number, areaUnit: string): number | null {
  const factor = AREA_TO_SQFT[areaUnit]
  if (!factor || !Number.isFinite(area) || area <= 0) return null
  return Math.round(area * factor)
}

/**
 * The derived columns, recomputed on every write so they never drift from the
 * source values. Called by the admin API and the seed script.
 */
export function deriveInventoryFields({
  price,
  area,
  areaUnit,
}: {
  price: number
  area: number
  areaUnit: string
}): { pricePerUnit: number | null; areaSqft: number | null } {
  const valid = Number.isFinite(price) && price > 0 && Number.isFinite(area) && area > 0
  return {
    pricePerUnit: valid ? Math.round(price / area) : null,
    areaSqft: toSqft(area, areaUnit),
  }
}

export const INVENTORY_PAGE_SIZE = 12

export type InventoryFilters = {
  types: string[]
  locations: string[]
  priceMin: number | null
  priceMax: number | null
  areaMin: number | null
  areaMax: number | null
  sort: InventorySortValue
  q: string
  page: number
}

export type SearchParams = Record<string, string | string[] | undefined>

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return []
  const list = Array.isArray(value) ? value : value.split(',')
  return list.map((item) => item.trim()).filter(Boolean)
}

function toNumber(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw === undefined || raw === '') return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

/** Untrusted query string → validated filters. Unknown values are dropped. */
export function parseInventoryFilters(searchParams: SearchParams): InventoryFilters {
  const page = Math.max(1, Math.floor(toNumber(searchParams.page) ?? 1))

  return {
    types: toArray(searchParams.type).filter(PropertyType.is),
    locations: toArray(searchParams.location).filter(PropertyLocation.is),
    priceMin: toNumber(searchParams.priceMin),
    priceMax: toNumber(searchParams.priceMax),
    areaMin: toNumber(searchParams.areaMin),
    areaMax: toNumber(searchParams.areaMax),
    sort: InventorySort.parse(Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort) ?? 'newest',
    q: (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q)?.trim().slice(0, 80) ?? '',
    page,
  }
}

/** Filters → query string. Defaults are omitted so shared URLs stay short. */
export function serializeInventoryFilters(filters: Partial<InventoryFilters>): string {
  const params = new URLSearchParams()
  if (filters.types?.length) params.set('type', filters.types.join(','))
  if (filters.locations?.length) params.set('location', filters.locations.join(','))
  if (filters.priceMin != null) params.set('priceMin', String(filters.priceMin))
  if (filters.priceMax != null) params.set('priceMax', String(filters.priceMax))
  if (filters.areaMin != null) params.set('areaMin', String(filters.areaMin))
  if (filters.areaMax != null) params.set('areaMax', String(filters.areaMax))
  if (filters.q) params.set('q', filters.q)
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort)
  if (filters.page && filters.page > 1) params.set('page', String(filters.page))
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function hasActiveFilters(filters: InventoryFilters): boolean {
  return Boolean(
    filters.types.length ||
      filters.locations.length ||
      filters.priceMin != null ||
      filters.priceMax != null ||
      filters.areaMin != null ||
      filters.areaMax != null ||
      filters.q,
  )
}

const SORT_ORDER: Record<InventorySortValue, Prisma.InventoryOrderByWithRelationInput[]> = {
  newest: [{ createdAt: 'desc' }],
  price_asc: [{ price: 'asc' }],
  price_desc: [{ price: 'desc' }],
  area_desc: [{ areaSqft: 'desc' }],
}

export function buildInventoryWhere(filters: InventoryFilters): Prisma.InventoryWhereInput {
  const where: Prisma.InventoryWhereInput = { isPublished: true }

  if (filters.types.length) where.propertyType = { in: filters.types }
  if (filters.locations.length) where.location = { in: filters.locations }

  if (filters.priceMin != null || filters.priceMax != null) {
    where.price = {
      ...(filters.priceMin != null ? { gte: filters.priceMin } : {}),
      ...(filters.priceMax != null ? { lte: filters.priceMax } : {}),
    }
  }

  if (filters.areaMin != null || filters.areaMax != null) {
    where.areaSqft = {
      ...(filters.areaMin != null ? { gte: filters.areaMin } : {}),
      ...(filters.areaMax != null ? { lte: filters.areaMax } : {}),
    }
  }

  if (filters.q) {
    // SQLite's LIKE is case-insensitive for ASCII, which is what these fields
    // hold. Prisma's `mode: 'insensitive'` is a Postgres-only feature, so it is
    // deliberately not used here — see the Postgres notes in README.md.
    where.OR = [
      { title: { contains: filters.q } },
      { sector: { contains: filters.q } },
      { address: { contains: filters.q } },
      { description: { contains: filters.q } },
    ]
  }

  return where
}

export const inventoryCardSelect = {
  id: true,
  slug: true,
  title: true,
  propertyType: true,
  transactionType: true,
  location: true,
  sector: true,
  price: true,
  priceNegotiable: true,
  area: true,
  areaUnit: true,
  pricePerUnit: true,
  details: true,
  isFeatured: true,
  isSold: true,
  createdAt: true,
  images: { orderBy: { sortOrder: 'asc' }, take: 1 },
} satisfies Prisma.InventorySelect

export type InventoryCard = Prisma.InventoryGetPayload<{ select: typeof inventoryCardSelect }>

export async function getInventoryPage(filters: InventoryFilters) {
  const where = buildInventoryWhere(filters)
  const skip = (filters.page - 1) * INVENTORY_PAGE_SIZE

  const [items, total] = await Promise.all([
    prisma.inventory.findMany({
      where,
      orderBy: SORT_ORDER[filters.sort],
      skip,
      take: INVENTORY_PAGE_SIZE,
      select: inventoryCardSelect,
    }),
    prisma.inventory.count({ where }),
  ])

  return {
    items,
    total,
    page: filters.page,
    pageCount: Math.max(1, Math.ceil(total / INVENTORY_PAGE_SIZE)),
  }
}

export type InventoryBounds = {
  priceMin: number
  priceMax: number
  areaMin: number
  areaMax: number
}

/** Slider endpoints, derived from live data rather than hardcoded. */
export async function getInventoryBounds(): Promise<InventoryBounds> {
  const aggregate = await prisma.inventory.aggregate({
    where: { isPublished: true },
    _min: { price: true, areaSqft: true },
    _max: { price: true, areaSqft: true },
  })

  const roundDown = (value: number, step: number) => Math.floor(value / step) * step
  const roundUp = (value: number, step: number) => Math.ceil(value / step) * step

  const priceMin = aggregate._min.price ?? 0
  const priceMax = aggregate._max.price ?? 100_000_000
  const areaMin = aggregate._min.areaSqft ?? 0
  const areaMax = aggregate._max.areaSqft ?? 50_000

  return {
    priceMin: roundDown(priceMin, 100_000),
    priceMax: Math.max(roundUp(priceMax, 100_000), roundDown(priceMin, 100_000) + 100_000),
    areaMin: roundDown(areaMin, 100),
    areaMax: Math.max(roundUp(areaMax, 100), roundDown(areaMin, 100) + 100),
  }
}

/** Same type, same location, similar price — shown under a listing. */
export async function getSimilarInventory(listing: {
  id: string
  propertyType: string
  location: string
  price: number
}) {
  const near = await prisma.inventory.findMany({
    where: {
      isPublished: true,
      id: { not: listing.id },
      propertyType: listing.propertyType,
      OR: [
        { location: listing.location },
        { price: { gte: listing.price * 0.6, lte: listing.price * 1.4 } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: inventoryCardSelect,
  })

  if (near.length >= 3) return near

  // Top up with anything else of the same type so the section is never sparse.
  const filler = await prisma.inventory.findMany({
    where: {
      isPublished: true,
      id: { notIn: [listing.id, ...near.map((item) => item.id)] },
      propertyType: listing.propertyType,
    },
    orderBy: { createdAt: 'desc' },
    take: 3 - near.length,
    select: inventoryCardSelect,
  })

  return [...near, ...filler]
}

/** Count per property type, for the home page tiles. */
export async function getInventoryTypeCounts(): Promise<Record<string, number>> {
  const rows = await prisma.inventory.groupBy({
    by: ['propertyType'],
    where: { isPublished: true, isSold: false },
    _count: { _all: true },
  })
  return Object.fromEntries(rows.map((row) => [row.propertyType, row._count._all]))
}

export function areaUnitOptions() {
  return AreaUnit.options
}
