import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { AdminPageHeader } from '@/components/admin/page-header'
import { AdminProjectList } from '@/components/admin/project-list'

export const metadata: Metadata = { title: 'Pre-Launch', robots: { index: false } }

/**
 * Pre-Launch is deliberately NOT a separate model — this is the Projects table
 * filtered to status = PRE_LAUNCH. Changing a project's status here moves it
 * between /projects and /pre-launch on the website with no data migration.
 */
export default async function AdminPreLaunchPage() {
  const projects = await prisma.project.findMany({
    where: { status: 'PRE_LAUNCH' },
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
  })

  return (
    <>
      <AdminPageHeader
        title="Pre-Launch"
        description="Projects whose status is “Pre-Launch”. This is a filtered view of Projects, so to move a project in or out of /pre-launch, change its status."
        action={{ href: '/admin/projects/new', label: 'New project' }}
      />
      <AdminProjectList
        projects={projects}
        emptyMessage="No pre-launch projects. Set a project’s status to “Pre-Launch” to list it here and on /pre-launch."
      />
    </>
  )
}
