'use client'

import * as React from 'react'
import Image from 'next/image'
import { GripVertical, Loader2, Star, Trash2, UploadCloud } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { BLUR_DATA_URL } from '@/lib/images'

export type ManagedImage = { url: string; alt: string; isPrimary: boolean }

/**
 * Drag-and-drop image manager for the admin forms.
 *
 * Handles multiple files, reordering by drag, alt text, and choosing the
 * primary image. The resulting ordered array is serialised into a hidden input
 * so the surrounding server action receives it with the rest of the form —
 * no separate save step, and no client-side state that can silently diverge
 * from what gets written.
 */
export function ImageManager({
  name = 'images',
  initial = [],
}: {
  name?: string
  initial?: ManagedImage[]
}) {
  const [images, setImages] = React.useState<ManagedImage[]>(() =>
    initial.length > 0 && !initial.some((image) => image.isPrimary)
      ? initial.map((image, index) => ({ ...image, isPrimary: index === 0 }))
      : initial,
  )
  const [uploading, setUploading] = React.useState(false)
  const [dragOver, setDragOver] = React.useState(false)
  const dragIndex = React.useRef<number | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function upload(files: FileList | File[]) {
    const list = Array.from(files)
    if (list.length === 0) return

    setUploading(true)
    try {
      const body = new FormData()
      for (const file of list) body.append('files', file)

      const response = await fetch('/api/admin/upload', { method: 'POST', body })
      const data = (await response.json()) as {
        ok?: boolean
        files?: Array<{ url: string }>
        error?: string
        detail?: string
      }

      if (!response.ok || !data.ok || !data.files) {
        toast.error(data.error ?? 'The upload failed.')
        if (data.detail) console.error('[upload]', data.detail)
        return
      }

      setImages((current) => {
        const added = data.files!.map((file) => ({ url: file.url, alt: '', isPrimary: false }))
        const next = [...current, ...added]
        // First image uploaded becomes primary by default.
        return next.some((image) => image.isPrimary)
          ? next
          : next.map((image, index) => ({ ...image, isPrimary: index === 0 }))
      })
      toast.success(`${data.files.length} image${data.files.length === 1 ? '' : 's'} uploaded.`)
    } catch {
      toast.error('Could not reach the server. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const move = (from: number, to: number) =>
    setImages((current) => {
      if (to < 0 || to >= current.length || from === to) return current
      const next = [...current]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })

  const setPrimary = (index: number) =>
    setImages((current) => current.map((image, i) => ({ ...image, isPrimary: i === index })))

  const remove = (index: number) =>
    setImages((current) => {
      const next = current.filter((_, i) => i !== index)
      return next.length > 0 && !next.some((image) => image.isPrimary)
        ? next.map((image, i) => ({ ...image, isPrimary: i === 0 }))
        : next
    })

  const setAlt = (index: number, alt: string) =>
    setImages((current) => current.map((image, i) => (i === index ? { ...image, alt } : image)))

  return (
    <div className="space-y-4">
      <input type="hidden" name={name} value={JSON.stringify(images)} />

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragOver(false)
          if (event.dataTransfer.files?.length) upload(event.dataTransfer.files)
        }}
        className={cn(
          'flex flex-col items-center justify-center rounded border-2 border-dashed px-6 py-10 text-center transition-colors',
          dragOver ? 'border-gold-500 bg-gold-200/30' : 'border-maroon-900/20 bg-white',
        )}
      >
        {uploading ? (
          <Loader2 className="size-7 animate-spin text-maroon-700" />
        ) : (
          <UploadCloud className="size-7 text-maroon-700/70" />
        )}
        <p className="mt-3 text-[14px] font-medium text-maroon-900">
          {uploading ? 'Uploading…' : 'Drag images here'}
        </p>
        <p className="mt-1 text-[12.5px] text-ink-500">JPG, PNG, WebP or AVIF, up to 8 MB each</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mt-4 rounded border border-maroon-900/20 bg-white px-4 py-2 text-[13px] font-medium text-maroon-900 transition-colors hover:border-gold-500 disabled:opacity-60"
        >
          Choose files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files) upload(event.target.files)
            event.target.value = ''
          }}
        />
      </div>

      {images.length > 0 ? (
        <ul className="space-y-2.5">
          {images.map((image, index) => (
            <li
              key={`${image.url}-${index}`}
              draggable
              onDragStart={() => {
                dragIndex.current = index
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                if (dragIndex.current !== null) move(dragIndex.current, index)
                dragIndex.current = null
              }}
              className={cn(
                'flex items-center gap-3 rounded border bg-white p-2.5',
                image.isPrimary ? 'border-gold-500' : 'border-maroon-900/10',
              )}
            >
              <GripVertical className="size-4 shrink-0 cursor-grab text-ink-500/60" />

              <span className="relative size-16 shrink-0 overflow-hidden rounded bg-cream-50">
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="64px"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className="object-cover"
                />
              </span>

              <div className="min-w-0 flex-1">
                <input
                  type="text"
                  value={image.alt}
                  onChange={(event) => setAlt(index, event.target.value)}
                  placeholder="Alt text (describe the image)"
                  className="h-9 w-full rounded border border-maroon-900/15 px-2.5 text-[13px] focus:border-gold-500 focus:outline-none"
                />
                <p className="mt-1 truncate text-[11px] text-ink-500">{image.url}</p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, index - 1)}
                  disabled={index === 0}
                  aria-label="Move up"
                  className="rounded p-1.5 text-ink-500 hover:bg-cream-50 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, index + 1)}
                  disabled={index === images.length - 1}
                  aria-label="Move down"
                  className="rounded p-1.5 text-ink-500 hover:bg-cream-50 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => setPrimary(index)}
                  aria-label="Set as primary image"
                  title="Set as primary image"
                  className={cn(
                    'rounded p-1.5 transition-colors hover:bg-cream-50',
                    image.isPrimary ? 'text-gold-500' : 'text-ink-500',
                  )}
                >
                  <Star className={cn('size-4', image.isPrimary && 'fill-gold-500')} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label="Remove image"
                  className="rounded p-1.5 text-red-700 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12.5px] text-ink-500">
          No images yet. The first image you add becomes the primary one shown on cards.
        </p>
      )}
    </div>
  )
}
