'use client'

import * as React from 'react'
import Image from 'next/image'
import { Loader2, UploadCloud, X } from 'lucide-react'
import { toast } from 'sonner'
import { BLUR_DATA_URL } from '@/lib/images'
import { cn } from '@/lib/utils'

/**
 * One-image uploader for records that hold a single URL (certifications,
 * director photo, hero image). Accepts an upload or a pasted URL, and keeps the
 * value in a hidden input so the surrounding server action receives it.
 */
export function SingleImagePicker({
  name,
  initialUrl = '',
}: {
  name: string
  initialUrl?: string
}) {
  const [url, setUrl] = React.useState(initialUrl)
  const [uploading, setUploading] = React.useState(false)
  const [dragOver, setDragOver] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    setUploading(true)
    try {
      const body = new FormData()
      body.append('files', file)
      const response = await fetch('/api/admin/upload', { method: 'POST', body })
      const data = (await response.json()) as { ok?: boolean; files?: Array<{ url: string }>; error?: string }

      if (!response.ok || !data.ok || !data.files?.[0]) {
        toast.error(data.error ?? 'The upload failed.')
        return
      }
      setUrl(data.files[0].url)
      toast.success('Image uploaded.')
    } catch {
      toast.error('Could not reach the server.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={url} />

      <div className="flex flex-wrap items-start gap-4">
        {url ? (
          <div className="relative size-28 shrink-0 overflow-hidden rounded border border-maroon-900/10 bg-cream-50">
            <Image
              src={url}
              alt=""
              fill
              sizes="112px"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => setUrl('')}
              aria-label="Remove image"
              className="absolute right-1 top-1 rounded-full bg-maroon-900/70 p-1 text-cream-50 hover:bg-maroon-900"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : null}

        <div
          onDragOver={(event) => {
            event.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragOver(false)
            const file = event.dataTransfer.files?.[0]
            if (file) upload(file)
          }}
          className={cn(
            'flex min-w-[200px] flex-1 flex-col items-center justify-center rounded border-2 border-dashed px-4 py-6 text-center transition-colors',
            dragOver ? 'border-gold-500 bg-gold-200/30' : 'border-maroon-900/20 bg-white',
          )}
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin text-maroon-700" />
          ) : (
            <UploadCloud className="size-5 text-maroon-700/70" />
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="mt-2 text-[13px] font-medium text-maroon-700 hover:underline disabled:opacity-60"
          >
            {uploading ? 'Uploading…' : 'Upload an image'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) upload(file)
              event.target.value = ''
            }}
          />
        </div>
      </div>

      <input
        type="url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="…or paste an image URL"
        className="h-10 w-full rounded border border-maroon-900/15 px-3 text-[13px] focus:border-gold-500 focus:outline-none"
      />
    </div>
  )
}
