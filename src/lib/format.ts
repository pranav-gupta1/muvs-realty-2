import { AreaUnit, areaUnitLabel } from '@/lib/taxonomy'

const CRORE = 10_000_000
const LAKH = 100_000

/** Drops trailing zeros: 1.50 → "1.5", 1.00 → "1". */
function trimDecimals(value: number, maxDecimals = 2): string {
  return Number(value.toFixed(maxDecimals)).toString()
}

/**
 * Indian price formatting — the convention every buyer in this market reads.
 *   125_00_000 → "₹1.25 Cr"     85_00_000 → "₹85 Lakh"     45_000 → "₹45,000"
 * Never renders as "$1,250,000".
 */
export function formatIndianPrice(
  value: number | null | undefined,
  options: { fallback?: string; compact?: boolean } = {},
): string {
  const { fallback = 'Price on request' } = options
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) return fallback

  if (value >= CRORE) return `₹${trimDecimals(value / CRORE)} Cr`
  if (value >= LAKH) return `₹${trimDecimals(value / LAKH)} Lakh`
  return `₹${formatIndianNumber(Math.round(value))}`
}

/** Indian digit grouping: 12,34,567 rather than 1,234,567. */
export function formatIndianNumber(value: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)
}

/** "₹1.25 Cr – ₹1.8 Cr", collapsing to a single value when both ends match. */
export function formatPriceRange(
  min: number | null | undefined,
  max: number | null | undefined,
  fallback = 'Price on request',
): string {
  const hasMin = typeof min === 'number' && min > 0
  const hasMax = typeof max === 'number' && max > 0
  if (!hasMin && !hasMax) return fallback
  if (hasMin && !hasMax) return `${formatIndianPrice(min)} onwards`
  if (!hasMin && hasMax) return `Up to ${formatIndianPrice(max)}`
  if (min === max) return formatIndianPrice(min)
  return `${formatIndianPrice(min)} to ${formatIndianPrice(max)}`
}

/** "1,850 sq.ft." — every area in the UI carries its unit. */
export function formatArea(
  value: number | null | undefined,
  unit: string | null | undefined,
  fallback = 'N/A',
): string {
  const amount = formatAreaAmount(value)
  if (amount === null) return fallback
  const label = areaUnitLabel(unit, value as number)
  return label ? `${amount} ${label}` : amount
}

/** The number half of an area, without its unit. */
function formatAreaAmount(value: number | null | undefined): string | null {
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) return null
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value)
}

/** "1,200 – 2,400 sq.ft." — the unit is printed once, at the end. */
export function formatAreaRange(
  min: number | null | undefined,
  max: number | null | undefined,
  unit: string | null | undefined,
  fallback = 'N/A',
): string {
  const low = formatAreaAmount(min)
  const high = formatAreaAmount(max)
  if (!low && !high) return fallback
  if (low && high && min !== max) return `${low} to ${formatArea(max, unit)}`
  return formatArea(low ? min : max, unit, fallback)
}

/** "₹8,500 / sq.ft." */
export function formatPricePerUnit(
  value: number | null | undefined,
  unit: string | null | undefined,
): string | null {
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) return null
  const parsed = AreaUnit.parse(unit)
  if (!parsed) return null
  return `₹${formatIndianNumber(Math.round(value))} / ${AreaUnit.labels[parsed]}`
}

export function formatDate(value: Date | string | null | undefined, fallback = 'N/A'): string {
  if (!value) return fallback
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(value: Date | string | null | undefined, fallback = 'N/A'): string {
  if (!value) return fallback
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(date)
}

/** "Possession by Mar 2027" style — month + year only. */
export function formatMonthYear(value: Date | string | null | undefined, fallback = 'N/A'): string {
  if (!value) return fallback
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(date)
}
