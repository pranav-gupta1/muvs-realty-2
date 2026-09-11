import type { Metadata } from 'next'
import { getSiteSettings } from '@/lib/site'
import { getProjects, getProjectStatusCounts, parseProjectFilters } from '@/lib/projects'
import { buildMetadata } from '@/lib/seo'
import type { SearchParams } from '@/lib/inventory'

import { PageHero } from '@/components/site/page-hero'
import { Section } from '@/components/site/section'
import { RevealGroup, RevealItem } from '@/components/site/reveal'
import { ProjectCard } from '@/components/property/project-card'
import { ProjectFiltersBar } from '@/components/property/project-filters'
import { EmptyState } from '@/components/site/empty-state'
import { LeadForm } from '@/components/lead/lead-form'

export const metadata: Metadata = buildMetadata({
  title: 'Projects',
  description:
    'New launches, under-construction and ready-to-move developments across Noida, Greater Noida and the Yamuna Expressway, advised on by MUVS Realty.',
  path: '/projects',
})

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const filters = parseProjectFilters(params)

  const [projects, statusCounts, settings] = await Promise.all([
    getProjects(filters),
    getProjectStatusCounts(),
    getSiteSettings(),
  ])

  return (
    <>
      <PageHero
        eyebrow="Developments we represent"
        title="Projects"
        lede="Projects we are selling right now. Filter by construction status or location to narrow them down."
        crumbs={[{ label: 'Projects' }]}
        imageUrl="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=2000&q=75"
      />

      <Section className="bg-cream-50">
        <div className="container">
          <ProjectFiltersBar filters={filters} statusCounts={statusCounts} />

          <p className="tabular mt-8 text-[13px] text-ink-500">
            {projects.length} project{projects.length === 1 ? '' : 's'}
            {filters.statuses.length === 0 ? ' · pre-launch projects are listed separately' : ''}
          </p>

          {projects.length > 0 ? (
            <RevealGroup className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <RevealItem key={project.id} className="h-full">
                  <ProjectCard project={project} className="h-full" />
                </RevealItem>
              ))}
            </RevealGroup>
          ) : (
            <EmptyState
              title="No projects match those filters"
              description="Try a different status or location, or tell us what you are looking for and we will find it for you."
              actionHref="/projects"
              actionLabel="Clear filters"
            />
          )}
        </div>
      </Section>

      <Section className="border-t border-gold-500/20 bg-white">
        <div className="container max-w-2xl">
          <LeadForm
            source="/projects"
            heading="Looking for something specific?"
            description="Tell us the size, budget and possession date you have in mind, and we will come back with projects that fit."
            contactPhone={settings.contact.phone}
            contactPhoneHref={settings.contact.telHref}
          />
        </div>
      </Section>
    </>
  )
}
