'use client'

import * as React from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'
import type { Video } from '@prisma/client'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { VideoCategory } from '@/lib/taxonomy'
import { BLUR_DATA_URL, youtubeEmbedUrl, youtubeThumbnail } from '@/lib/images'
import { cn } from '@/lib/utils'

/**
 * Video gallery. Only the YouTube poster image loads with the page — the player
 * iframe is mounted when a card is clicked, so no third-party script or cookie
 * is fetched until the visitor actually asks to watch.
 */
export function VideoGrid({
  videos,
  columns = 3,
  showCategory = true,
}: {
  videos: Video[]
  columns?: 2 | 3
  showCategory?: boolean
}) {
  const [active, setActive] = React.useState<Video | null>(null)

  if (videos.length === 0) return null

  return (
    <>
      <ul
        className={cn(
          'grid gap-5',
          columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2',
        )}
      >
        {videos.map((video) => (
          <li key={video.id}>
            <button
              type="button"
              onClick={() => setActive(video)}
              className="group block w-full overflow-hidden rounded border border-maroon-900/8 bg-white text-left shadow-card transition-all duration-300 hover:border-gold-500/60 hover:shadow-card-hover"
            >
              <span className="relative block aspect-video overflow-hidden bg-maroon-900/10">
                <Image
                  src={youtubeThumbnail(video.youtubeId)}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <span className="absolute inset-0 bg-maroon-900/25 transition-colors group-hover:bg-maroon-900/15" />
                <span className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-cream-50/95 shadow-lg transition-transform group-hover:scale-110">
                  <Play className="size-5 translate-x-0.5 fill-maroon-700 text-maroon-700" />
                </span>
              </span>

              <span className="block p-5">
                {showCategory ? (
                  <Badge variant="gold">{VideoCategory.label(video.category)}</Badge>
                ) : null}
                <span className="mt-3 block font-serif text-[16px] leading-snug text-maroon-900">
                  {video.title}
                </span>
                {video.description ? (
                  <span className="mt-1.5 line-clamp-2 block text-[13px] leading-relaxed text-ink-500">
                    {video.description}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent bare className="max-w-4xl">
          <DialogTitle className="sr-only">{active?.title ?? 'Video'}</DialogTitle>
          {active ? (
            <div className="aspect-video w-full overflow-hidden rounded bg-black">
              <iframe
                src={youtubeEmbedUrl(active.youtubeId)}
                title={active.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="size-full border-0"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
