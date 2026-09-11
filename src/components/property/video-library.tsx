'use client'

import * as React from 'react'
import type { Video } from '@prisma/client'
import { VideoCategory } from '@/lib/taxonomy'
import { VideoGrid } from '@/components/property/video-grid'
import { EmptyState } from '@/components/site/empty-state'
import { cn } from '@/lib/utils'

/**
 * Category-filtered video gallery. Filtering is client-side because the whole
 * library is a handful of rows — no round-trip is worth it here.
 */
export function VideoLibrary({ videos }: { videos: Video[] }) {
  const [category, setCategory] = React.useState<string>('ALL')

  const counts = React.useMemo(() => {
    const map: Record<string, number> = {}
    for (const video of videos) map[video.category] = (map[video.category] ?? 0) + 1
    return map
  }, [videos])

  const filtered = category === 'ALL' ? videos : videos.filter((v) => v.category === category)

  const tabs = [
    { value: 'ALL', label: 'All videos', count: videos.length },
    ...VideoCategory.options.map((option) => ({
      value: option.value,
      label: option.label,
      count: counts[option.value] ?? 0,
    })),
  ]

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Video categories">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={category === tab.value}
            onClick={() => setCategory(tab.value)}
            disabled={tab.count === 0}
            className={cn(
              'rounded-full border px-4 py-2 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
              category === tab.value
                ? 'border-maroon-700 bg-maroon-700 text-cream-50'
                : 'border-maroon-900/15 bg-white text-ink-900 hover:border-gold-500 hover:bg-gold-200/25',
            )}
          >
            {tab.label}
            <span
              className={cn(
                'tabular ml-1.5',
                category === tab.value ? 'text-cream-50/70' : 'text-ink-500',
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-10">
        {filtered.length > 0 ? (
          <VideoGrid videos={filtered} />
        ) : (
          <EmptyState
            title="No videos in this category yet"
            description="We add walkthroughs and market updates regularly. Try another category in the meantime."
          />
        )}
      </div>
    </div>
  )
}
