import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Building2, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { BLUR_DATA_URL, primaryImageUrl } from '@/lib/images'
import { formatAreaRange, formatIndianPrice, formatMonthYear, formatPriceRange } from '@/lib/format'
import { ProjectStatus, ProjectType, PropertyLocation } from '@/lib/taxonomy'
import type { ProjectCard as ProjectCardData } from '@/lib/projects'
import { cn } from '@/lib/utils'

const STATUS_VARIANT: Record<string, 'gold' | 'maroon' | 'outline'> = {
  PRE_LAUNCH: 'gold',
  NEW_LAUNCH: 'maroon',
  UNDER_CONSTRUCTION: 'outline',
  READY_TO_MOVE: 'maroon',
}

export function ProjectCard({
  project,
  className,
}: {
  project: ProjectCardData
  className?: string
}) {
  const href = `/projects/${project.slug}`
  const isPreLaunch = project.status === 'PRE_LAUNCH'

  // Pre-launch projects advertise a starting price rather than a range.
  const price = isPreLaunch
    ? project.startingPrice
      ? `${formatIndianPrice(project.startingPrice)} onwards`
      : 'Price on request'
    : formatPriceRange(project.priceMin, project.priceMax)

  return (
    <article
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded border border-maroon-900/8 bg-white shadow-card transition-all duration-300 hover:border-gold-500/60 hover:shadow-card-hover',
        className,
      )}
    >
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden">
        <Image
          src={primaryImageUrl(project.images)}
          alt={project.images[0]?.alt || project.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-maroon-900/55 via-transparent to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge variant={STATUS_VARIANT[project.status] ?? 'gold'}>
            {ProjectStatus.label(project.status)}
          </Badge>
          {project.isFeatured ? <Badge variant="light">Featured</Badge> : null}
        </div>

        <p className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[12.5px] font-medium text-cream-50">
          <MapPin className="size-3.5 text-gold-500" />
          {PropertyLocation.label(project.location)}
          {project.sector ? ` · ${project.sector}` : ''}
        </p>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-1.5 text-[12px] uppercase tracking-[0.1em] text-ink-500">
          <Building2 className="size-3.5 text-gold-500" />
          {project.developer}
        </p>

        <h3 className="mt-2 font-serif text-[19px] leading-snug text-maroon-900">
          <Link href={href} className="transition-colors hover:text-maroon-500">
            {project.title}
          </Link>
        </h3>

        <p className="mt-1 text-[13px] text-ink-500">{ProjectType.label(project.projectType)}</p>

        <dl className="mt-4 space-y-1.5 border-t border-gold-500/20 pt-4 text-[13.5px]">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-ink-500">Price</dt>
            <dd className="tabular text-right font-semibold text-maroon-900">{price}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-ink-500">Area</dt>
            <dd className="tabular text-right text-ink-900">
              {formatAreaRange(project.areaMin, project.areaMax, project.areaUnit)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-ink-500">{isPreLaunch ? 'Expected launch' : 'Possession'}</dt>
            <dd className="tabular text-right text-ink-900">
              {isPreLaunch
                ? project.expectedLaunch || 'To be announced'
                : formatMonthYear(project.possessionDate, 'To be confirmed')}
            </dd>
          </div>
        </dl>

        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-1.5 self-start text-[13.5px] font-semibold text-maroon-700 transition-colors hover:text-maroon-500"
        >
          {isPreLaunch ? 'View pre-launch details' : 'View project'}
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </article>
  )
}
