import { z } from 'zod'

/**
 * SQLite has no JSON or scalar-list columns, so arrays and objects are stored
 * as JSON strings. Nothing in the app parses those columns inline — every read
 * and write goes through the typed helpers here, so a malformed or legacy row
 * degrades to a safe default instead of throwing during render.
 *
 * On Postgres these columns can become `Json` / `String[]`; the call sites stay
 * identical because they only ever touch these helpers.
 */

/** Parse a JSON column against a schema, falling back on any failure. */
export function readJson<S extends z.ZodTypeAny>(
  raw: string | null | undefined,
  schema: S,
  fallback: z.infer<S>,
): z.infer<S> {
  if (!raw) return fallback
  try {
    const parsed = schema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : fallback
  } catch {
    return fallback
  }
}

/** Serialise for a JSON column. */
export function writeJson(value: unknown): string {
  return JSON.stringify(value ?? null)
}

/* ── Column shapes ──────────────────────────────────────────────────────── */

export const stringListSchema = z.array(z.string()).catch([])

export const configurationSchema = z.object({
  type: z.string(),
  area: z.number(),
  areaUnit: z.string().default('SQFT'),
  price: z.number().nullable().default(null),
})
export type Configuration = z.infer<typeof configurationSchema>
export const configurationListSchema = z.array(configurationSchema).catch([])

export const floorPlanSchema = z.object({
  title: z.string(),
  imageUrl: z.string(),
})
export type FloorPlan = z.infer<typeof floorPlanSchema>
export const floorPlanListSchema = z.array(floorPlanSchema).catch([])

export const landmarkSchema = z.object({
  name: z.string(),
  distance: z.string(),
})
export type Landmark = z.infer<typeof landmarkSchema>
export const landmarkListSchema = z.array(landmarkSchema).catch([])

/* ── Typed accessors ────────────────────────────────────────────────────── */

export const readStringList = (raw: string | null | undefined): string[] =>
  readJson(raw, stringListSchema, [])

export const readConfigurations = (raw: string | null | undefined): Configuration[] =>
  readJson(raw, configurationListSchema, [])

export const readFloorPlans = (raw: string | null | undefined): FloorPlan[] =>
  readJson(raw, floorPlanListSchema, [])

export const readLandmarks = (raw: string | null | undefined): Landmark[] =>
  readJson(raw, landmarkListSchema, [])

/** Accepts either a JSON array or a newline/comma separated admin textarea. */
export function parseListInput(input: string | string[] | null | undefined): string[] {
  if (!input) return []
  if (Array.isArray(input)) return input.map((s) => s.trim()).filter(Boolean)
  const trimmed = input.trim()
  if (trimmed.startsWith('[')) return readStringList(trimmed)
  return trimmed
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
}
