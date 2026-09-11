'use client'

import * as React from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { BLUR_DATA_URL } from '@/lib/images'
import { cn } from '@/lib/utils'

export type GalleryImage = { id: string; url: string; alt: string }

/**
 * Image gallery with a full-screen lightbox. Arrow keys and swipe move between
 * images; only the active image is rendered at full size, and thumbnails are
 * requested at thumbnail dimensions.
 */
export function Gallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [index, setIndex] = React.useState(0)
  const [open, setOpen] = React.useState(false)
  const touchStart = React.useRef<number | null>(null)

  const count = images.length
  const go = React.useCallback(
    (delta: number) => setIndex((current) => (current + delta + count) % count),
    [count],
  )

  React.useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') go(1)
      if (event.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, go])

  if (count === 0) return null
  const active = images[index]

  const arrows = (size: 'sm' | 'lg') =>
    count > 1 ? (
      <>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            go(-1)
          }}
          aria-label="Previous image"
          className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-maroon-900/60 text-cream-50 backdrop-blur-sm transition-colors hover:bg-maroon-900',
            size === 'lg' ? 'p-3' : 'p-2',
          )}
        >
          <ChevronLeft className={size === 'lg' ? 'size-6' : 'size-5'} />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            go(1)
          }}
          aria-label="Next image"
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-maroon-900/60 text-cream-50 backdrop-blur-sm transition-colors hover:bg-maroon-900',
            size === 'lg' ? 'p-3' : 'p-2',
          )}
        >
          <ChevronRight className={size === 'lg' ? 'size-6' : 'size-5'} />
        </button>
      </>
    ) : null

  return (
    <div>
      <div
        className="group relative aspect-[16/10] overflow-hidden rounded border border-maroon-900/10 bg-maroon-900/5"
        onTouchStart={(event) => {
          touchStart.current = event.touches[0]?.clientX ?? null
        }}
        onTouchEnd={(event) => {
          const start = touchStart.current
          const end = event.changedTouches[0]?.clientX
          if (start != null && end != null && Math.abs(end - start) > 45) go(end < start ? 1 : -1)
          touchStart.current = null
        }}
      >
        <Image
          key={active.id}
          src={active.url}
          alt={active.alt || title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 66vw"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          className="object-cover"
        />

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open image full screen"
          className="absolute right-3 top-3 rounded-full bg-maroon-900/60 p-2 text-cream-50 backdrop-blur-sm transition-colors hover:bg-maroon-900"
        >
          <Expand className="size-4" />
        </button>

        {arrows('sm')}

        <span className="tabular absolute bottom-3 right-3 rounded-full bg-maroon-900/65 px-2.5 py-1 text-[12px] text-cream-50 backdrop-blur-sm">
          {index + 1} / {count}
        </span>
      </div>

      {count > 1 ? (
        <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {images.map((image, imageIndex) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setIndex(imageIndex)}
              aria-label={`Show image ${imageIndex + 1}`}
              aria-current={imageIndex === index}
              className={cn(
                'relative size-20 shrink-0 overflow-hidden rounded border-2 transition-all sm:size-24',
                imageIndex === index
                  ? 'border-gold-500'
                  : 'border-transparent opacity-65 hover:opacity-100',
              )}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="96px"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent bare className="max-w-6xl">
          <DialogTitle className="sr-only">{title}, image {index + 1} of {count}</DialogTitle>
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded bg-maroon-900">
            <Image
              src={active.url}
              alt={active.alt || title}
              fill
              sizes="100vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="object-contain"
            />
            {arrows('lg')}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
