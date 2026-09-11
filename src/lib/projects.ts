import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ProjectStatus, PropertyLocation } from '@/lib/taxonomy'
import type { SearchParams } from '@/lib/inventory'

/**
 * Project queries. /pre-launch is simply the PRE_LAUNCH slice of this table —
 * there is no separate model — so changing a project's status in the admin
 * moves it between /projects and /pre-launch with no data migration.
 */

export const PRE_LAUNCH_STATUS = 'PRE_LAUNCH'

export const projectCardSelect = {
  id: true,
  slug: true,
  title: true,
  developer: true,
  projectType: true,
  status: true,
  location: true,
  sector: true,
  priceMin: true,
  priceMax: true,
  areaMin: true,
  areaMax: true,
  areaUnit: true,
  possessionDate: true,
  expectedLaunch: true,
  startingPrice: true,
  earlyBirdNote: true,
  isGated: true,
  isFeatured: true,
  reraNumber: true,
  images: { orderBy: { sortOrder: 'asc' }, take: 1 },
} satisfies Prisma.ProjectSelect

export type ProjectCard = Prisma.ProjectGetPayload<{ select: typeof projectCardSelect }>

export type ProjectFilters = {
  statuses: string[]
  locations: string[]
}

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return []
  const list = Array.isArray(value) ? value : value.split(',')
  return list.map((item) => item.trim()).filter(Boolean)
}

export function parseProjectFilters(searchParams: SearchParams): ProjectFilters {
  return {
    statuses: toArray(searchParams.status).filter(ProjectStatus.is),
    locations: toArray(searchParams.location).filter(PropertyLocation.is),
  }
}

export function serializeProjectFilters(filters: Partial<ProjectFilters>): string {
  const params = new URLSearchParams()
  if (filters.statuses?.length) params.set('status', filters.statuses.join(','))
  if (filters.locations?.length) params.set('location', filters.locations.join(','))
  const query = params.toString()
  return query ? `?${query}` : ''
}

/**
 * The /projects list. Pre-launch projects are excluded by default because they
 * have their own page and their own gated treatment; asking for them
 * explicitly via the status filter still returns them.
 */
export async function getProjects(filters: ProjectFilters): Promise<ProjectCard[]> {
  const where: Prisma.ProjectWhereInput = { isPublished: true }

  if (filters.statuses.length) where.status = { in: filters.statuses }
  else where.status = { not: PRE_LAUNCH_STATUS }

  if (filters.locations.length) where.location = { in: filters.locations }

  return prisma.project.findMany({
    where,
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    select: projectCardSelect,
  })
}

export async function getFeaturedProjects(take = 6): Promise<ProjectCard[]> {
  return prisma.project.findMany({
    where: { isPublished: true, isFeatured: true },
    orderBy: { createdAt: 'desc' },
    take,
    select: projectCardSelect,
  })
}

export async function getPreLaunchProjects(take?: number): Promise<ProjectCard[]> {
  return prisma.project.findMany({
    where: { isPublished: true, status: PRE_LAUNCH_STATUS },
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    ...(take ? { take } : {}),
    select: projectCardSelect,
  })
}

export async function getProjectBySlug(slug: string) {
  return prisma.project.findFirst({
    where: { slug, isPublished: true },
    include: { images: { orderBy: { sortOrder: 'asc' } } },
  })
}

/** Count per status, for the filter chips on /projects. */
export async function getProjectStatusCounts(): Promise<Record<string, number>> {
  const rows = await prisma.project.groupBy({
    by: ['status'],
    where: { isPublished: true },
    _count: { _all: true },
  })
  return Object.fromEntries(rows.map((row) => [row.status, row._count._all]))
}
