import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import { parseListInput } from '@/lib/json'

/**
 * Helpers shared by every admin server action. FormData gives everything as
 * strings, so these normalise it once — and every value still goes through the
 * taxonomy or a zod schema before it reaches the database.
 */

export function str(form: FormData, key: string): string {
  const value = form.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export function optionalStr(form: FormData, key: string): string | null {
  const value = str(form, key)
  return value === '' ? null : value
}

export function num(form: FormData, key: string): number | null {
  const value = str(form, key)
  if (value === '') return null
  const parsed = Number(value.replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

export function requiredNum(form: FormData, key: string, fallback = 0): number {
  return num(form, key) ?? fallback
}

export function int(form: FormData, key: string, fallback = 0): number {
  const value = num(form, key)
  return value === null ? fallback : Math.round(value)
}

/** Unchecked checkboxes are simply absent from FormData. */
export function bool(form: FormData, key: string): boolean {
  const value = form.get(key)
  return value === 'on' || value === 'true' || value === '1'
}

export function date(form: FormData, key: string): Date | null {
  const value = str(form, key)
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** Newline- or comma-separated textarea → JSON array column. */
export function list(form: FormData, key: string): string {
  return JSON.stringify(parseListInput(str(form, key)))
}

const managedImageSchema = z
  .array(
    z.object({
      url: z.string().min(1),
      alt: z.string().default(''),
      isPrimary: z.boolean().default(false),
    }),
  )
  .catch([])

export type ManagedImageInput = { url: string; alt: string; sortOrder: number; isPrimary: boolean }

/** Reads the ImageManager's hidden input into ordered image rows. */
export function images(form: FormData, key = 'images'): ManagedImageInput[] {
  const raw = str(form, key)
  if (!raw) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }

  const list = managedImageSchema.parse(parsed)
  const hasPrimary = list.some((image) => image.isPrimary)

  return list.map((image, index) => ({
    url: image.url,
    alt: image.alt,
    sortOrder: index,
    isPrimary: hasPrimary ? image.isPrimary : index === 0,
  }))
}

/** Parses a JSON textarea (configurations, floor plans, landmarks). */
export function jsonField<S extends z.ZodTypeAny>(
  form: FormData,
  key: string,
  schema: S,
  fallback: z.infer<S>,
): string {
  const raw = str(form, key)
  if (!raw) return JSON.stringify(fallback)
  try {
    const parsed = schema.safeParse(JSON.parse(raw))
    return JSON.stringify(parsed.success ? parsed.data : fallback)
  } catch {
    return JSON.stringify(fallback)
  }
}

type SlugModel = 'project' | 'inventory' | 'certification' | 'testimonial'

/** Returns the id of the row already holding this slug, if any. */
async function slugOwner(model: SlugModel, slug: string): Promise<string | null> {
  const select = { id: true } as const
  switch (model) {
    case 'project':
      return (await prisma.project.findUnique({ where: { slug }, select }))?.id ?? null
    case 'inventory':
      return (await prisma.inventory.findUnique({ where: { slug }, select }))?.id ?? null
    case 'certification':
      return (await prisma.certification.findUnique({ where: { slug }, select }))?.id ?? null
    case 'testimonial':
      return (await prisma.testimonial.findUnique({ where: { slug }, select }))?.id ?? null
  }
}

/**
 * Derives a slug from the title when the editor leaves it blank, and appends a
 * counter until it is free — so saving never fails on a duplicate slug.
 */
export async function uniqueSlug(
  model: SlugModel,
  desired: string,
  fallbackFrom: string,
  currentId?: string,
): Promise<string> {
  const base = slugify(desired || fallbackFrom) || 'item'

  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`
    const owner = await slugOwner(model, candidate)
    if (!owner || owner === currentId) return candidate
  }

  return `${base}-${Date.now()}`
}

export type ActionResult = { ok: true } | { ok: false; error: string }
