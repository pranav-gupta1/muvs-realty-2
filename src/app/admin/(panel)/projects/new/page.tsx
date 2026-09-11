import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/page-header'
import { ProjectForm } from '@/components/admin/project-form'
import { createProject } from '../actions'

export const metadata: Metadata = { title: 'New project', robots: { index: false } }

export default function NewProjectPage() {
  return (
    <>
      <AdminPageHeader
        title="New project"
        description="Add a development you are marketing. You can save it as a draft and publish later."
      />
      <ProjectForm action={createProject} />
    </>
  )
}
