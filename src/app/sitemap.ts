import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { SITE_URL } from '@/lib/seo'

/** Static pages plus every published project and listing. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, listings] = await Promise.all([
    prisma.project.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.inventory.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
  ])

  const staticRoutes: MetadataRoute.Sitemap = (
    [
      { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
      { url: `${SITE_URL}/projects`, changeFrequency: 'weekly', priority: 0.9 },
      { url: `${SITE_URL}/inventory`, changeFrequency: 'daily', priority: 0.9 },
      { url: `${SITE_URL}/pre-launch`, changeFrequency: 'weekly', priority: 0.8 },
      { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.6 },
      { url: `${SITE_URL}/certifications`, changeFrequency: 'yearly', priority: 0.4 },
      { url: `${SITE_URL}/videos`, changeFrequency: 'weekly', priority: 0.5 },
      { url: `${SITE_URL}/contact`, changeFrequency: 'monthly', priority: 0.7 },
      { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    ] satisfies MetadataRoute.Sitemap
  ).map((route) => ({ ...route, lastModified: new Date() }))

  return [
    ...staticRoutes,
    ...projects.map((project) => ({
      url: `${SITE_URL}/projects/${project.slug}`,
      lastModified: project.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...listings.map((listing) => ({
      url: `${SITE_URL}/inventory/${listing.slug}`,
      lastModified: listing.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]
}
