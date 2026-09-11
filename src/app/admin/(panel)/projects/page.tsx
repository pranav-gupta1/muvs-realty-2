import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { AdminPageHeader } from '@/components/admin/page-header'
import { AdminProjectList } from '@/components/admin/project-list'

export const metadata: Metadata = { title: 'Projects', robots: { index: false } }

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
  })

  return (
    <>
      <AdminPageHeader
        title="Projects"
        description="Developments you are marketing. A project with status “Pre-Launch” automatically appears on /pre-launch instead of /projects."
        action={{ href: '/admin/projects/new', label: 'New project' }}
      />
      <AdminProjectList projects={projects} />
    </>
  )
}
