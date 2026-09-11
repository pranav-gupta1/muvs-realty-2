import { randomBytes } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { env } from '@/lib/env'
import { slugify } from '@/lib/utils'

/**
 * Upload abstraction. Everything that stores a file goes through `storage`,
 * so moving to S3 or Cloudinary means adding one adapter here and flipping
 * UPLOAD_DRIVER — no route, form or component changes.
 *
 * The local adapter writes to /public/uploads, which works in dev and on a
 * persistent server but NOT on serverless (Vercel's filesystem is ephemeral and
 * read-only at runtime). See "Deploying to Vercel" in README.md.
 */

export type StoredFile = {
  /** Public URL to render — a /uploads path locally, a CDN URL in production. */
  url: string
  /** Adapter-specific handle used for deletion. */
  key: string
  size: number
  contentType: string
}

export interface StorageAdapter {
  readonly name: string
  save(input: { data: Buffer; filename: string; contentType: string }): Promise<StoredFile>
  remove(key: string): Promise<void>
}

const ALLOWED_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/avif', 'avif'],
  ['image/gif', 'gif'],
  ['application/pdf', 'pdf'],
])

export class UploadError extends Error {}

/** Rejects anything oversized or of a type we do not serve. */
export function assertUploadable(file: { size: number; type: string; name: string }) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new UploadError(
      `"${file.name}" is not a supported file type (${file.type || 'unknown'}). Upload a JPG, PNG, WebP, AVIF, GIF or PDF.`,
    )
  }
  if (file.size > env.upload.maxBytes) {
    const limit = Math.round(env.upload.maxBytes / (1024 * 1024))
    throw new UploadError(`"${file.name}" is larger than the ${limit} MB upload limit.`)
  }
}

/** Collision-proof, readable, and safe to put in a URL. */
function buildObjectName(filename: string, contentType: string): string {
  const parsed = path.parse(filename)
  const base = slugify(parsed.name).slice(0, 60) || 'file'
  const ext = ALLOWED_TYPES.get(contentType) ?? parsed.ext.replace('.', '').toLowerCase() ?? 'bin'
  const stamp = new Date().toISOString().slice(0, 10)
  return `${stamp}-${base}-${randomBytes(4).toString('hex')}.${ext}`
}

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

const localAdapter: StorageAdapter = {
  name: 'local',

  async save({ data, filename, contentType }) {
    await mkdir(UPLOAD_DIR, { recursive: true })
    const objectName = buildObjectName(filename, contentType)
    await writeFile(path.join(UPLOAD_DIR, objectName), data)
    return {
      url: `/uploads/${objectName}`,
      key: objectName,
      size: data.byteLength,
      contentType,
    }
  },

  async remove(key) {
    // Never let a crafted key escape the uploads directory.
    const safe = path.basename(key)
    await unlink(path.join(UPLOAD_DIR, safe)).catch(() => undefined)
  },
}

/**
 * To add S3: implement this interface with @aws-sdk/client-s3, register it
 * below under the key you put in UPLOAD_DRIVER, and nothing else changes.
 *
 *   const s3Adapter: StorageAdapter = {
 *     name: 's3',
 *     async save({ data, filename, contentType }) { ... return { url, key, ... } },
 *     async remove(key) { ... },
 *   }
 */
const ADAPTERS: Record<string, StorageAdapter> = {
  local: localAdapter,
}

export function getStorage(): StorageAdapter {
  const adapter = ADAPTERS[env.upload.driver]
  if (adapter) return adapter
  console.warn(`[storage] Unknown UPLOAD_DRIVER "${env.upload.driver}". Falling back to "local".`)
  return localAdapter
}

export const storage = {
  save: (input: { data: Buffer; filename: string; contentType: string }) =>
    getStorage().save(input),
  remove: (key: string) => getStorage().remove(key),
  /** Derives the adapter key from a stored URL, for deletions. */
  keyFromUrl: (url: string) => url.split('/').pop() ?? url,
}
