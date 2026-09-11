import { z } from 'zod'
import {
  ApprovalAuthority,
  AreaUnit,
  CommercialSubType,
  Furnishing,
  PropertyType,
  areaUnitLabel,
  type Taxonomy,
} from '@/lib/taxonomy'
import { formatIndianNumber, formatIndianPrice } from '@/lib/format'

/**
 * The `Inventory.details` JSON column holds fields that only make sense for one
 * property type — an apartment has balconies, a farm has a soil type. Rather
 * than a sparse table of 50 mostly-null columns, each type declares its fields
 * once, here.
 *
 * This single spec drives all three consumers, so they cannot disagree:
 *   • the zod schema the API and admin forms validate against
 *   • the spec table rendered on /inventory/[slug]
 *   • the field set the admin form renders when the type dropdown changes
 */

export type DetailField = {
  key: string
  label: string
  /** `inherit` uses the listing's own areaUnit (a plot may be priced in sq.yd.). */
  unit?: string | 'inherit'
  help?: string
} & (
  | { type: 'number'; format?: 'number' | 'price' }
  | { type: 'text' }
  | { type: 'boolean' }
  | { type: 'select'; options: Taxonomy<string> }
)

export const DETAIL_FIELDS: Record<PropertyType, readonly DetailField[]> = {
  APARTMENT: [
    { key: 'bedrooms', label: 'Bedrooms', type: 'number' },
    { key: 'bathrooms', label: 'Bathrooms', type: 'number' },
    { key: 'balconies', label: 'Balconies', type: 'number' },
    { key: 'floor', label: 'Floor', type: 'number' },
    { key: 'totalFloors', label: 'Total Floors', type: 'number' },
    { key: 'furnishing', label: 'Furnishing', type: 'select', options: Furnishing },
    { key: 'carpetArea', label: 'Carpet Area', type: 'number', unit: 'SQFT' },
    { key: 'builtUpArea', label: 'Built-up Area', type: 'number', unit: 'SQFT' },
    { key: 'superArea', label: 'Super Area', type: 'number', unit: 'SQFT' },
    { key: 'parkingCount', label: 'Covered Parking', type: 'number' },
    { key: 'ageOfProperty', label: 'Age of Property', type: 'number', unit: 'years' },
    { key: 'societyName', label: 'Society', type: 'text' },
    {
      key: 'maintenanceCharges',
      label: 'Maintenance',
      type: 'number',
      format: 'price',
      unit: 'per month',
    },
  ],
  VILLA: [
    { key: 'bedrooms', label: 'Bedrooms', type: 'number' },
    { key: 'bathrooms', label: 'Bathrooms', type: 'number' },
    { key: 'plotArea', label: 'Plot Area', type: 'number', unit: 'inherit' },
    { key: 'builtUpArea', label: 'Built-up Area', type: 'number', unit: 'SQFT' },
    { key: 'floors', label: 'Floors', type: 'number' },
    { key: 'garden', label: 'Private Garden', type: 'boolean' },
    { key: 'parkingCount', label: 'Covered Parking', type: 'number' },
    { key: 'furnishing', label: 'Furnishing', type: 'select', options: Furnishing },
    { key: 'ageOfProperty', label: 'Age of Property', type: 'number', unit: 'years' },
    { key: 'gatedCommunity', label: 'Gated Community', type: 'boolean' },
  ],
  PLOT: [
    { key: 'plotArea', label: 'Plot Area', type: 'number', unit: 'inherit' },
    { key: 'plotDimensions', label: 'Dimensions', type: 'text', help: 'e.g. 30 ft × 60 ft' },
    { key: 'roadWidth', label: 'Road Width', type: 'number', unit: 'ft.' },
    { key: 'cornerPlot', label: 'Corner Plot', type: 'boolean' },
    { key: 'parkFacing', label: 'Park Facing', type: 'boolean' },
    { key: 'boundaryWall', label: 'Boundary Wall', type: 'boolean' },
    { key: 'approvedBy', label: 'Approved By', type: 'select', options: ApprovalAuthority },
    { key: 'khasraNumber', label: 'Khasra Number', type: 'text' },
    { key: 'landUse', label: 'Land Use', type: 'text', help: 'e.g. Residential, Institutional' },
  ],
  AGRICULTURAL: [
    { key: 'landArea', label: 'Land Area', type: 'number', unit: 'inherit' },
    { key: 'soilType', label: 'Soil Type', type: 'text', help: 'e.g. Alluvial loam' },
    { key: 'waterSource', label: 'Water Source', type: 'text', help: 'e.g. Tube well + canal' },
    { key: 'roadAccess', label: 'Road Access', type: 'text' },
    { key: 'currentCrop', label: 'Current Crop', type: 'text' },
    { key: 'khasraNumber', label: 'Khasra Number', type: 'text' },
    { key: 'khatauniAvailable', label: 'Khatauni Available', type: 'boolean' },
    { key: 'distanceFromHighway', label: 'Distance from Highway', type: 'text' },
  ],
  INDUSTRIAL: [
    { key: 'plotArea', label: 'Plot Area', type: 'number', unit: 'inherit' },
    { key: 'builtUpArea', label: 'Built-up Area', type: 'number', unit: 'SQFT' },
    { key: 'shedArea', label: 'Shed Area', type: 'number', unit: 'SQFT' },
    { key: 'powerLoadKVA', label: 'Sanctioned Power Load', type: 'number', unit: 'KVA' },
    { key: 'ceilingHeight', label: 'Ceiling Height', type: 'number', unit: 'ft.' },
    { key: 'industrialZone', label: 'Industrial Zone', type: 'text' },
    { key: 'approvedBy', label: 'Approved By', type: 'select', options: ApprovalAuthority },
    { key: 'craneAvailable', label: 'Overhead Crane', type: 'boolean' },
    { key: 'truckAccess', label: 'Truck Access', type: 'text', help: 'e.g. 40-ft trailer access' },
  ],
  COMMERCIAL: [
    { key: 'subType', label: 'Property Sub-type', type: 'select', options: CommercialSubType },
    { key: 'carpetArea', label: 'Carpet Area', type: 'number', unit: 'SQFT' },
    { key: 'superArea', label: 'Super Area', type: 'number', unit: 'SQFT' },
    { key: 'floor', label: 'Floor', type: 'number' },
    { key: 'totalFloors', label: 'Total Floors', type: 'number' },
    { key: 'frontageWidth', label: 'Frontage', type: 'number', unit: 'ft.' },
    { key: 'footfallZone', label: 'Footfall Zone', type: 'text', help: 'e.g. High street, Mall' },
    { key: 'currentlyRented', label: 'Currently Rented', type: 'boolean' },
    { key: 'rentalYield', label: 'Rental Yield', type: 'number', unit: '%' },
    { key: 'washroomCount', label: 'Washrooms', type: 'number' },
    { key: 'parkingCount', label: 'Parking', type: 'number' },
  ],
}

export type InventoryDetails = Record<string, string | number | boolean | null>

/** Every detail field is optional — listings arrive with partial information. */
function fieldSchema(field: DetailField): z.ZodTypeAny {
  switch (field.type) {
    case 'number':
      return z.preprocess(
        (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
        z.number().finite().nonnegative().optional(),
      )
    case 'boolean':
      return z.preprocess(
        (v) => (v === '' || v === null || v === undefined ? undefined : v === true || v === 'true' || v === 'on'),
        z.boolean().optional(),
      )
    case 'select':
      return field.options.schema.optional().or(z.literal('').transform(() => undefined))
    case 'text':
      return z
        .string()
        .trim()
        .max(200)
        .optional()
        .transform((v) => (v ? v : undefined))
  }
}

/** zod schema for one property type's details object. */
export function detailsSchemaFor(propertyType: PropertyType): z.ZodType<InventoryDetails> {
  const shape = Object.fromEntries(
    DETAIL_FIELDS[propertyType].map((field) => [field.key, fieldSchema(field)]),
  )
  return z.object(shape).strip() as unknown as z.ZodType<InventoryDetails>
}

/** Validates and drops unknown/empty keys; never throws on bad admin input. */
export function sanitizeDetails(propertyType: string, raw: unknown): InventoryDetails {
  const type = PropertyType.parse(propertyType)
  if (!type) return {}
  const parsed = detailsSchemaFor(type).safeParse(raw ?? {})
  if (!parsed.success) return {}
  return Object.fromEntries(
    Object.entries(parsed.data).filter(([, value]) => value !== undefined && value !== null),
  ) as InventoryDetails
}

function unitSuffix(field: DetailField, listingAreaUnit: string | null | undefined): string {
  if (!field.unit) return ''
  if (field.unit === 'inherit') return areaUnitLabel(listingAreaUnit)
  if (AreaUnit.is(field.unit)) return AreaUnit.labels[field.unit]
  return field.unit
}

export type DetailRow = {
  key: string
  label: string
  value: string
  /** Lets callers render chips sensibly: "3 Bedrooms" vs "Corner Plot". */
  kind: DetailField['type']
}

/**
 * Turns the stored details object into label/value rows for the spec table.
 * Fields with no value are omitted rather than rendered as "—".
 */
export function describeDetails(
  propertyType: string,
  details: InventoryDetails,
  listingAreaUnit?: string | null,
): DetailRow[] {
  const type = PropertyType.parse(propertyType)
  if (!type) return []

  return DETAIL_FIELDS[type].flatMap<DetailRow>((field) => {
    const value = details?.[field.key]
    if (value === undefined || value === null || value === '') return []

    let rendered: string
    switch (field.type) {
      case 'boolean':
        if (value !== true) return []
        rendered = 'Yes'
        break
      case 'select':
        rendered = field.options.label(String(value))
        break
      case 'number': {
        const numeric = Number(value)
        if (!Number.isFinite(numeric)) return []
        const suffix = unitSuffix(field, listingAreaUnit)
        rendered =
          field.format === 'price'
            ? `${formatIndianPrice(numeric, { fallback: 'N/A' })}${suffix ? ` ${suffix}` : ''}`
            : `${formatIndianNumber(numeric)}${suffix ? ` ${suffix}` : ''}`
        break
      }
      default:
        rendered = String(value)
    }

    return [{ key: field.key, label: field.label, value: rendered, kind: field.type }]
  })
}

/**
 * The two or three details worth showing on a card, per type — bedrooms for a
 * flat, approving authority for a plot, power load for a shed.
 */
const CARD_KEYS: Record<PropertyType, readonly string[]> = {
  APARTMENT: ['bedrooms', 'bathrooms', 'furnishing'],
  VILLA: ['bedrooms', 'bathrooms', 'floors'],
  PLOT: ['approvedBy', 'plotDimensions', 'cornerPlot'],
  AGRICULTURAL: ['waterSource', 'currentCrop', 'khatauniAvailable'],
  INDUSTRIAL: ['powerLoadKVA', 'shedArea', 'craneAvailable'],
  COMMERCIAL: ['subType', 'floor', 'currentlyRented'],
}

export function cardHighlights(
  propertyType: string,
  details: InventoryDetails,
  listingAreaUnit?: string | null,
): DetailRow[] {
  const type = PropertyType.parse(propertyType)
  if (!type) return []
  const wanted = new Set(CARD_KEYS[type])
  return describeDetails(propertyType, details, listingAreaUnit)
    .filter((row) => wanted.has(row.key))
    .slice(0, 3)
}

/** "3 BHK" for apartments/villas — used in card titles and OG descriptions. */
export function bhkLabel(propertyType: string, details: InventoryDetails): string | null {
  if (propertyType !== 'APARTMENT' && propertyType !== 'VILLA') return null
  const bedrooms = Number(details?.bedrooms)
  return Number.isFinite(bedrooms) && bedrooms > 0 ? `${bedrooms} BHK` : null
}
