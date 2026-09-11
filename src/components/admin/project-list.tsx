import Image from 'next/image'
import Link from 'next/link'
import type { Image as ImageRow, Project } from '@prisma/client'
import { Eye, EyeOff, Star } from 'lucide-react'

import { ProjectStatus, PropertyLocation } from '@/lib/taxonomy'
import { formatPriceRange, formatIndianPrice } from '@/lib/format'
import { BLUR_DATA_URL, primaryImageUrl } from '@/lib/images'
import { Badge } from '@/components/ui/badge'
import { toggleProjectFlag } from '@/app/admin/(panel)/projects/actions'

type Row = Project & { images: ImageRow[] }

/** Shared by /admin/projects and the pre-launch filtered view. */
export function AdminProjectList({
  projects,
  emptyMessage = 'No projects yet.',
}: {
  projects: Row[]
  emptyMessage?: string
}) {
  if (projects.length === 0) {
    return (
      <p className="rounded border border-dashed border-maroon-900/20 bg-white px-5 py-12 text-center text-[13.5px] text-ink-500">
        {emptyMessage}
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {projects.map((project) => {
        const isPreLaunch = project.status === 'PRE_LAUNCH'
        return (
          <li
            key={project.id}
            className="flex flex-wrap items-center gap-4 rounded border border-maroon-900/10 bg-white p-4"
          >
            <Link
              href={`/admin/projects/${project.id}`}
              className="relative size-16 shrink-0 overflow-hidden rounded bg-cream-50"
            >
              <Image
                src={primaryImageUrl(project.images)}
                alt=""
                fill
                sizes="64px"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="object-cover"
              />
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="text-[14.5px] font-semibold text-maroon-900 hover:underline"
                >
                  {project.title}
                </Link>
                <Badge variant={isPreLaunch ? 'gold' : 'outline'}>
                  {ProjectStatus.label(project.status)}
                </Badge>
                {!project.isPublished ? <Badge variant="muted">Draft</Badge> : null}
                {project.isGated ? <Badge variant="outline">Gated</Badge> : null}
              </div>
              <p className="tabular mt-1 text-[12.5px] text-ink-500">
                {project.developer} · {PropertyLocation.label(project.location)}
                {project.sector ? `, ${project.sector}` : ''} ·{' '}
                {isPreLaunch
                  ? `${formatIndianPrice(project.startingPrice)} onwards`
                  : formatPriceRange(project.priceMin, project.priceMax)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <form action={toggleProjectFlag}>
                <input type="hidden" name="id" value={project.id} />
                <input type="hidden" name="field" value="isFeatured" />
                <button
                  type="submit"
                  title={project.isFeatured ? 'Remove from featured' : 'Mark as featured'}
                  aria-label={project.isFeatured ? 'Remove from featured' : 'Mark as featured'}
                  className="rounded p-2 transition-colors hover:bg-cream-50"
                >
                  <Star
                    className={
                      project.isFeatured ? 'size-4 fill-gold-500 text-gold-500' : 'size-4 text-ink-500'
                    }
                  />
                </button>
              </form>

              <form action={toggleProjectFlag}>
                <input type="hidden" name="id" value={project.id} />
                <input type="hidden" name="field" value="isPublished" />
                <button
                  type="submit"
                  title={project.isPublished ? 'Unpublish' : 'Publish'}
                  aria-label={project.isPublished ? 'Unpublish' : 'Publish'}
                  className="rounded p-2 transition-colors hover:bg-cream-50"
                >
                  {project.isPublished ? (
                    <Eye className="size-4 text-maroon-700" />
                  ) : (
                    <EyeOff className="size-4 text-ink-500" />
                  )}
                </button>
              </form>

              <Link
                href={`/projects/${project.slug}`}
                target="_blank"
                className="rounded px-2.5 py-1.5 text-[12.5px] font-medium text-ink-500 hover:bg-cream-50"
              >
                View
              </Link>
              <Link
                href={`/admin/projects/${project.id}`}
                className="rounded px-2.5 py-1.5 text-[12.5px] font-medium text-maroon-700 hover:bg-cream-50"
              >
                Edit
              </Link>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
