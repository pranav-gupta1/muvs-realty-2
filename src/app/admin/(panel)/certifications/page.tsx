import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { prisma } from '@/lib/prisma'
import { BLUR_DATA_URL } from '@/lib/images'
import { AdminPageHeader } from '@/components/admin/page-header'
import { Badge } from '@/components/ui/badge'
import {
  AdminField,
  DeleteButton,
  FormSection,
  SubmitButton,
  TextArea,
  TextInput,
  Toggle,
} from '@/components/admin/form-fields'
import { SingleImagePicker } from '@/components/admin/single-image-picker'
import { SavedNotice } from '@/components/admin/saved-notice'
import { deleteCertification, saveCertification } from './actions'

export const metadata: Metadata = { title: 'Certifications', robots: { index: false } }

export default async function AdminCertificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; saved?: string }>
}) {
  const { edit, saved } = await searchParams

  const [certifications, editing] = await Promise.all([
    prisma.certification.findMany({ orderBy: { sortOrder: 'asc' } }),
    edit ? prisma.certification.findUnique({ where: { id: edit } }) : null,
  ])

  return (
    <>
      <AdminPageHeader
        title="Certifications"
        description="Registrations and accreditations shown on /certifications and in the home page trust strip."
      />

      {saved ? <SavedNotice>Saved.</SavedNotice> : null}

      <form action={saveCertification} className="mb-8">
        {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

        <FormSection title={editing ? `Edit “${editing.title}”` : 'Add a certification'}>
          <div className="grid gap-5 sm:grid-cols-2">
            <AdminField label="Title" htmlFor="title" required className="sm:col-span-2">
              <TextInput id="title" name="title" defaultValue={editing?.title} required />
            </AdminField>

            <AdminField label="Issuing body" htmlFor="issuingBody" required>
              <TextInput id="issuingBody" name="issuingBody" defaultValue={editing?.issuingBody} required />
            </AdminField>

            <AdminField label="Year" htmlFor="year" required>
              <TextInput
                id="year"
                name="year"
                inputMode="numeric"
                defaultValue={editing?.year ?? new Date().getFullYear()}
                required
              />
            </AdminField>

            <AdminField label="Certificate number" htmlFor="number">
              <TextInput id="number" name="number" defaultValue={editing?.number ?? ''} />
            </AdminField>

            <AdminField label="Sort order" htmlFor="sortOrder" hint="Lower numbers appear first.">
              <TextInput
                id="sortOrder"
                name="sortOrder"
                inputMode="numeric"
                defaultValue={editing?.sortOrder ?? 0}
              />
            </AdminField>

            <AdminField label="Description" htmlFor="description" className="sm:col-span-2">
              <TextArea id="description" name="description" rows={3} defaultValue={editing?.description ?? ''} />
            </AdminField>
          </div>

          <AdminField label="Certificate scan or photo" hint="Shown as a thumbnail, and full size in the lightbox.">
            <SingleImagePicker name="imageUrl" initialUrl={editing?.imageUrl ?? ''} />
          </AdminField>

          <Toggle name="isPublished" label="Published" defaultChecked={editing?.isPublished ?? true} />

          <div className="flex justify-end gap-3">
            {editing ? (
              <Link
                href="/admin/certifications"
                className="rounded px-4 py-2 text-[13px] font-medium text-ink-500 hover:bg-cream-50"
              >
                Cancel
              </Link>
            ) : null}
            <SubmitButton>{editing ? 'Save changes' : 'Add certification'}</SubmitButton>
          </div>
        </FormSection>
      </form>

      <ul className="space-y-3">
        {certifications.map((certification) => (
          <li
            key={certification.id}
            className="flex flex-wrap items-center gap-4 rounded border border-maroon-900/10 bg-white p-4"
          >
            <span className="relative size-14 shrink-0 overflow-hidden rounded bg-cream-50">
              {certification.imageUrl ? (
                <Image
                  src={certification.imageUrl}
                  alt=""
                  fill
                  sizes="56px"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className="object-cover"
                />
              ) : null}
            </span>

            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-maroon-900">
                {certification.title}
                {!certification.isPublished ? <Badge variant="muted">Hidden</Badge> : null}
              </p>
              <p className="tabular mt-0.5 text-[12.5px] text-ink-500">
                {certification.issuingBody} · {certification.year}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Link
                href={`/admin/certifications?edit=${certification.id}`}
                className="rounded px-2.5 py-1.5 text-[12.5px] font-medium text-maroon-700 hover:bg-cream-50"
              >
                Edit
              </Link>
              <form action={deleteCertification}>
                <input type="hidden" name="id" value={certification.id} />
                <DeleteButton confirmMessage={`Delete “${certification.title}”?`} />
              </form>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
