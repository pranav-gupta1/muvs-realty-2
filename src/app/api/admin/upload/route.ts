import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { UploadError, assertUploadable, storage } from '@/lib/storage'
import { env } from '@/lib/env'

/**
 * POST /api/admin/upload — multipart upload for the admin image manager.
 * Accepts several files at once and returns their public URLs in order.
 *
 * The actual write goes through the storage adapter (src/lib/storage.ts), so
 * moving to S3 or Cloudinary does not touch this route.
 */
export async function POST(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Expected a multipart upload.' }, { status: 400 })
  }

  const files = form.getAll('files').filter((entry): entry is File => entry instanceof File)
  if (files.length === 0) {
    return NextResponse.json({ error: 'No files were received.' }, { status: 400 })
  }
  if (files.length > 20) {
    return NextResponse.json({ error: 'Upload at most 20 files at a time.' }, { status: 400 })
  }

  try {
    const uploaded = []
    for (const file of files) {
      assertUploadable({ size: file.size, type: file.type, name: file.name })
      const data = Buffer.from(await file.arrayBuffer())
      uploaded.push(
        await storage.save({ data, filename: file.name, contentType: file.type }),
      )
    }
    return NextResponse.json({ ok: true, files: uploaded })
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('[upload] failed:', error)
    return NextResponse.json(
      {
        error: 'The upload failed. Please try again.',
        ...(env.isDevelopment
          ? { detail: error instanceof Error ? error.message : String(error) }
          : {}),
      },
      { status: 500 },
    )
  }
}
