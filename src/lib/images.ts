import type { Image as ImageRow } from '@prisma/client'

/**
 * A tiny inline SVG in the brand's cream/gold, used as the blur placeholder for
 * every next/image. Remote images (Unsplash, and any CDN once uploads move off
 * local disk) cannot be statically analysed for a real blur hash, so a warm
 * constant beats an empty grey box.
 */
export const BLUR_DATA_URL =
  'data:image/svg+xml;base64,' +
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="10">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#EFE7DA"/>
        <stop offset="55%" stop-color="#E8D9A0"/>
        <stop offset="100%" stop-color="#D8C7A8"/>
      </linearGradient></defs>
      <rect width="16" height="10" fill="url(#g)"/>
    </svg>`,
  ).toString('base64')

export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=70'

/** Primary image if flagged, else the first by sort order. */
export function primaryImage(images: ImageRow[] | undefined | null): ImageRow | null {
  if (!images || images.length === 0) return null
  return images.find((image) => image.isPrimary) ?? images[0]
}

export function primaryImageUrl(images: ImageRow[] | undefined | null, fallback = PLACEHOLDER_IMAGE): string {
  return primaryImage(images)?.url || fallback
}

/** Gallery order: primary first, then sortOrder (already applied by the query). */
export function galleryImages(images: ImageRow[] | undefined | null): ImageRow[] {
  if (!images || images.length === 0) return []
  const primary = images.find((image) => image.isPrimary)
  if (!primary) return images
  return [primary, ...images.filter((image) => image.id !== primary.id)]
}

/** YouTube poster without loading the player. */
export function youtubeThumbnail(youtubeId: string, quality: 'hq' | 'maxres' = 'hq'): string {
  const name = quality === 'maxres' ? 'maxresdefault' : 'hqdefault'
  return `https://i.ytimg.com/vi/${youtubeId}/${name}.jpg`
}

export function youtubeEmbedUrl(youtubeId: string): string {
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`
}

export function youtubeWatchUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`
}

/**
 * Accepts a bare video ID or any YouTube URL and stores just the ID — we never
 * store video files, and the poster is derived from the ID.
 */
export function extractYouTubeId(input: string): string {
  const trimmed = input.trim()
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed

  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{11})/,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/(?:embed|shorts|live)\/)([A-Za-z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match?.[1]) return match[1]
  }
  return ''
}
