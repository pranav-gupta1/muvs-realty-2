import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AdminPageHeader } from '@/components/admin/page-header'
import { ProjectForm } from '@/components/admin/project-form'
import { DeleteButton } from '@/components/admin/form-fields'
import { deleteProject, updateProject } from '../actions'

export const metadata: Metadata = { title: 'Edit project', robots: { index: false } }

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string }>
}) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams])

  const project = await prisma.project.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!project) notFound()

  return (
    <>
      <AdminPageHeader
        title="Edit project"
        description={`Editing “${project.title}”.`}
      />

      {saved ? (
        <p className="mb-6 rounded border border-gold-500/45 bg-gold-200/30 px-4 py-3 text-[13px] font-medium text-maroon-900">
          Saved. The website has been updated.{' '}
          <Link href={`/projects/${project.slug}`} target="_blank" className="underline">
            View the live page →
          </Link>
        </p>
      ) : null}

      <ProjectForm project={project} action={updateProject} />

      <form action={deleteProject} className="mt-8 rounded border border-red-600/25 bg-red-50/50 p-5">
        <input type="hidden" name="id" value={project.id} />
        <h2 className="text-[13.5px] font-semibold text-red-800">Delete this project</h2>
        <p className="mt-1 text-[12.5px] text-red-800/75">
          This removes the project, its images and any link from existing leads. It cannot be undone.
        </p>
        <div className="mt-3">
          <DeleteButton
            label="Delete project"
            confirmMessage={`Delete “${project.title}”? This cannot be undone.`}
          />
        </div>
      </form>
    </>
  )
}
