import { z } from 'zod'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SINGLE SOURCE OF TRUTH FOR EVERY ENUM-LIKE VALUE IN THE APP
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * SQLite has no native enum type, so every "enum" column in prisma/schema.prisma
 * is a plain `String`. The allowed values and their human labels live here and
 * ONLY here. The Prisma schema comments, the zod validators, the public filter
 * UIs, the admin forms and the seed script all import from this module, so the
 * list cannot drift between layers.
 *
 * `npm run check:taxonomy` asserts that the `/// @taxonomy` comments in
 * prisma/schema.prisma still match the sets defined below, and it runs as part
 * of `npm run typecheck`.
 *
 * When migrating to Postgres you can promote any of these to a real enum — see
 * "Migrating to Postgres" in README.md.
 */

export type TaxonomyEntry<V extends string = string> = {
  value: V
  label: string
  /** Optional longer form used in filter drawers and admin help text. */
  hint?: string
}

export type Taxonomy<V extends string> = {
  readonly entries: readonly TaxonomyEntry<V>[]
  /** Same as `entries`; named for readability at `<Select>` call sites. */
  readonly options: readonly TaxonomyEntry<V>[]
  readonly values: readonly V[]
  readonly labels: Readonly<Record<V, string>>
  /** Runtime type guard — use before trusting a query param or form value. */
  is(value: unknown): value is V
  /** Human label, with a safe fallback for legacy/unknown rows. */
  label(value: string | null | undefined, fallback?: string): string
  /** Narrows an untrusted string (query param, JSON column) or returns null. */
  parse(value: unknown): V | null
  /** Strict zod enum for request bodies. */
  schema: z.ZodEnum<[V, ...V[]]>
}

function taxonomy<const T extends readonly TaxonomyEntry[]>(
  entries: T,
): Taxonomy<T[number]['value']> {
  type V = T[number]['value']

  const values = entries.map((e) => e.value) as V[]
  const labels = Object.fromEntries(entries.map((e) => [e.value, e.label])) as Record<V, string>
  const lookup = new Set<string>(values)

  if (lookup.size !== values.length) {
    throw new Error(`Duplicate taxonomy value in: ${values.join(', ')}`)
  }

  const is = (value: unknown): value is V => typeof value === 'string' && lookup.has(value)

  return {
    entries,
    options: entries,
    values,
    labels,
    is,
    label: (value, fallback = 'N/A') => (is(value) ? labels[value] : fallback),
    parse: (value) => (is(value) ? value : null),
    schema: z.enum(values as [V, ...V[]]),
  }
}

/* ── Projects ───────────────────────────────────────────────────────────── */

export const ProjectStatus = taxonomy([
  { value: 'PRE_LAUNCH', label: 'Pre-Launch', hint: 'Early-bird pricing, not yet publicly launched' },
  { value: 'NEW_LAUNCH', label: 'New Launch', hint: 'Recently launched, booking open' },
  { value: 'UNDER_CONSTRUCTION', label: 'Under Construction', hint: 'Construction in progress' },
  { value: 'READY_TO_MOVE', label: 'Ready to Move', hint: 'Possession available' },
] as const)
export type ProjectStatus = (typeof ProjectStatus.values)[number]

export const ProjectType = taxonomy([
  { value: 'RESIDENTIAL_APARTMENT', label: 'Residential Apartments' },
  { value: 'PLOTTED_DEVELOPMENT', label: 'Plotted Development' },
  { value: 'VILLA_TOWNSHIP', label: 'Villas & Townships' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'INDUSTRIAL', label: 'Industrial' },
  { value: 'MIXED_USE', label: 'Mixed Use' },
] as const)
export type ProjectType = (typeof ProjectType.values)[number]

/* ── Inventory (resale listings) ────────────────────────────────────────── */

export const PropertyType = taxonomy([
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'PLOT', label: 'Plot' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'AGRICULTURAL', label: 'Agricultural Land' },
  { value: 'INDUSTRIAL', label: 'Industrial' },
  { value: 'COMMERCIAL', label: 'Commercial' },
] as const)
export type PropertyType = (typeof PropertyType.values)[number]

export const TransactionType = taxonomy([
  { value: 'RESALE', label: 'Resale' },
  { value: 'NEW', label: 'New' },
] as const)
export type TransactionType = (typeof TransactionType.values)[number]

export const Ownership = taxonomy([
  { value: 'FREEHOLD', label: 'Freehold' },
  { value: 'LEASEHOLD', label: 'Leasehold' },
  { value: 'POWER_OF_ATTORNEY', label: 'Power of Attorney' },
] as const)
export type Ownership = (typeof Ownership.values)[number]

/* ── Shared ─────────────────────────────────────────────────────────────── */

export const PropertyLocation = taxonomy([
  { value: 'NOIDA', label: 'Noida' },
  { value: 'GREATER_NOIDA', label: 'Greater Noida' },
  { value: 'YAMUNA_EXPRESSWAY', label: 'Yamuna Expressway' },
  { value: 'DELHI', label: 'Delhi' },
  { value: 'GHAZIABAD', label: 'Ghaziabad' },
  { value: 'OTHER', label: 'Other (Delhi NCR)' },
] as const)
export type PropertyLocation = (typeof PropertyLocation.values)[number]

export const AreaUnit = taxonomy([
  { value: 'SQFT', label: 'sq.ft.' },
  { value: 'SQYD', label: 'sq.yd.' },
  { value: 'ACRE', label: 'acre' },
  { value: 'BIGHA', label: 'bigha' },
  { value: 'SQM', label: 'sq.m.' },
] as const)
export type AreaUnit = (typeof AreaUnit.values)[number]

/** Plural forms — `2 acres` reads better than `2 acre`. */
const AREA_UNIT_PLURALS: Record<AreaUnit, string> = {
  SQFT: 'sq.ft.',
  SQYD: 'sq.yd.',
  ACRE: 'acres',
  BIGHA: 'bigha',
  SQM: 'sq.m.',
}

export function areaUnitLabel(unit: string | null | undefined, count = 1): string {
  const parsed = AreaUnit.parse(unit)
  if (!parsed) return ''
  return count === 1 ? AreaUnit.labels[parsed] : AREA_UNIT_PLURALS[parsed]
}

export const Facing = taxonomy([
  { value: 'NORTH', label: 'North' },
  { value: 'SOUTH', label: 'South' },
  { value: 'EAST', label: 'East' },
  { value: 'WEST', label: 'West' },
  { value: 'NORTH_EAST', label: 'North-East' },
  { value: 'NORTH_WEST', label: 'North-West' },
  { value: 'SOUTH_EAST', label: 'South-East' },
  { value: 'SOUTH_WEST', label: 'South-West' },
] as const)
export type Facing = (typeof Facing.values)[number]

export const Furnishing = taxonomy([
  { value: 'UNFURNISHED', label: 'Unfurnished' },
  { value: 'SEMI_FURNISHED', label: 'Semi-Furnished' },
  { value: 'FURNISHED', label: 'Fully Furnished' },
] as const)
export type Furnishing = (typeof Furnishing.values)[number]

export const CommercialSubType = taxonomy([
  { value: 'SHOP', label: 'Shop' },
  { value: 'OFFICE', label: 'Office' },
  { value: 'SHOWROOM', label: 'Showroom' },
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'FOOD_COURT', label: 'Food Court' },
] as const)
export type CommercialSubType = (typeof CommercialSubType.values)[number]

export const ApprovalAuthority = taxonomy([
  { value: 'YEIDA', label: 'YEIDA' },
  { value: 'GNIDA', label: 'GNIDA' },
  { value: 'NOIDA_AUTHORITY', label: 'Noida Authority' },
  { value: 'GDA', label: 'GDA' },
  { value: 'DDA', label: 'DDA' },
  { value: 'OTHER', label: 'Other' },
] as const)
export type ApprovalAuthority = (typeof ApprovalAuthority.values)[number]

/* ── Leads ──────────────────────────────────────────────────────────────── */

export const LeadStatus = taxonomy([
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'LOST', label: 'Lost' },
] as const)
export type LeadStatus = (typeof LeadStatus.values)[number]

/** What the lead form's "Property Type of Interest" dropdown offers. */
export const InterestType = taxonomy([
  ...PropertyType.entries,
  { value: 'PRE_LAUNCH_PROJECT', label: 'Pre-Launch Project' },
  { value: 'NOT_SURE', label: 'Not sure yet' },
] as const)
export type InterestType = (typeof InterestType.values)[number]

/**
 * Budget buckets. `min`/`max` are in rupees and drive the lead-routing hints in
 * the internal notification email; `max: null` means "and above".
 */
export const BudgetRange = taxonomy([
  { value: 'UNDER_50L', label: 'Under ₹50 Lakh' },
  { value: '50L_1CR', label: '₹50 Lakh to ₹1 Crore' },
  { value: '1CR_2CR', label: '₹1 Crore to ₹2 Crore' },
  { value: '2CR_5CR', label: '₹2 Crore to ₹5 Crore' },
  { value: '5CR_10CR', label: '₹5 Crore to ₹10 Crore' },
  { value: 'ABOVE_10CR', label: 'Above ₹10 Crore' },
] as const)
export type BudgetRange = (typeof BudgetRange.values)[number]

export const BUDGET_BOUNDS: Record<BudgetRange, { min: number; max: number | null }> = {
  UNDER_50L: { min: 0, max: 5_000_000 },
  '50L_1CR': { min: 5_000_000, max: 10_000_000 },
  '1CR_2CR': { min: 10_000_000, max: 20_000_000 },
  '2CR_5CR': { min: 20_000_000, max: 50_000_000 },
  '5CR_10CR': { min: 50_000_000, max: 100_000_000 },
  ABOVE_10CR: { min: 100_000_000, max: null },
}

/* ── Content ────────────────────────────────────────────────────────────── */

export const VideoCategory = taxonomy([
  { value: 'PROPERTY_TOUR', label: 'Property Tour' },
  { value: 'SITE_VISIT', label: 'Site Visit' },
  { value: 'CLIENT_TESTIMONIAL', label: 'Client Testimonial' },
  { value: 'MARKET_UPDATE', label: 'Market Update' },
] as const)
export type VideoCategory = (typeof VideoCategory.values)[number]

/* ── Sorting (inventory list page) ──────────────────────────────────────── */

export const InventorySort = taxonomy([
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'area_desc', label: 'Area: largest first' },
] as const)
export type InventorySort = (typeof InventorySort.values)[number]

/**
 * Consumed by scripts/check-taxonomy.ts. Keys match the `/// @taxonomy(NAME)`
 * annotations in prisma/schema.prisma.
 */
export const TAXONOMY_REGISTRY = {
  ProjectStatus,
  ProjectType,
  PropertyType,
  TransactionType,
  Ownership,
  PropertyLocation,
  AreaUnit,
  Facing,
  Furnishing,
  CommercialSubType,
  ApprovalAuthority,
  LeadStatus,
  InterestType,
  BudgetRange,
  VideoCategory,
} as const satisfies Record<string, Taxonomy<string>>
