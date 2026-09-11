import type { Metadata } from 'next'
import Link from 'next/link'
import { Star } from 'lucide-react'

import { prisma } from '@/lib/prisma'
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
import { SavedNotice } from '@/components/admin/saved-notice'
import { deleteTestimonial, saveTestimonial } from './actions'

export const metadata: Metadata = { title: 'Testimonials', robots: { index: false } }

export default async function AdminTestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; saved?: string }>
}) {
  const { edit, saved } = await searchParams

  const [testimonials, editing] = await Promise.all([
    prisma.testimonial.findMany({ orderBy: { sortOrder: 'asc' } }),
    edit ? prisma.testimonial.findUnique({ where: { id: edit } }) : null,
  ])

  return (
    <>
      <AdminPageHeader
        title="Testimonials"
        description="Client quotes shown on the home page. Initials are used as the avatar, so no photo is required."
      />

      {saved ? <SavedNotice>Saved.</SavedNotice> : null}

      <form action={saveTestimonial} className="mb-8">
        {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

        <FormSection title={editing ? `Edit “${editing.name}”` : 'Add a testimonial'}>
          <div className="grid gap-5 sm:grid-cols-2">
            <AdminField label="Client name" htmlFor="name" required>
              <TextInput id="name" name="name" defaultValue={editing?.name} required />
            </AdminField>

            <AdminField label="What they did" htmlFor="role" hint="e.g. Bought a 3 BHK in Sector 150">
              <TextInput id="role" name="role" defaultValue={editing?.role ?? ''} />
            </AdminField>

            <AdminField label="Location" htmlFor="location">
              <TextInput id="location" name="location" defaultValue={editing?.location ?? ''} />
            </AdminField>

            <AdminField label="Rating (1 to 5)" htmlFor="rating">
              <TextInput
                id="rating"
                name="rating"
                inputMode="numeric"
                defaultValue={editing?.rating ?? 5}
              />
            </AdminField>

            <AdminField label="Sort order" htmlFor="sortOrder" hint="Lower numbers appear first.">
              <TextInput
                id="sortOrder"
                name="sortOrder"
                inputMode="numeric"
                defaultValue={editing?.sortOrder ?? 0}
              />
            </AdminField>

            <AdminField label="Quote" htmlFor="quote" required className="sm:col-span-2">
              <TextArea id="quote" name="quote" rows={4} defaultValue={editing?.quote} required />
            </AdminField>
          </div>

          <Toggle name="isPublished" label="Published" defaultChecked={editing?.isPublished ?? true} />

          <div className="flex justify-end gap-3">
            {editing ? (
              <Link
                href="/admin/testimonials"
                className="rounded px-4 py-2 text-[13px] font-medium text-ink-500 hover:bg-cream-50"
              >
                Cancel
              </Link>
            ) : null}
            <SubmitButton>{editing ? 'Save changes' : 'Add testimonial'}</SubmitButton>
          </div>
        </FormSection>
      </form>

      <ul className="space-y-3">
        {testimonials.map((testimonial) => (
          <li key={testimonial.id} className="rounded border border-maroon-900/10 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-maroon-900">
                  {testimonial.name}
                  {!testimonial.isPublished ? <Badge variant="muted">Hidden</Badge> : null}
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: testimonial.rating }, (_, index) => (
                      <Star key={index} className="size-3 fill-gold-500 text-gold-500" />
                    ))}
                  </span>
                </p>
                <p className="mt-0.5 text-[12.5px] text-ink-500">
                  {[testimonial.role, testimonial.location].filter(Boolean).join(' · ')}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-900/80">
                  “{testimonial.quote}”
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href={`/admin/testimonials?edit=${testimonial.id}`}
                  className="rounded px-2.5 py-1.5 text-[12.5px] font-medium text-maroon-700 hover:bg-cream-50"
                >
                  Edit
                </Link>
                <form action={deleteTestimonial}>
                  <input type="hidden" name="id" value={testimonial.id} />
                  <DeleteButton confirmMessage={`Delete the testimonial from ${testimonial.name}?`} />
                </form>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
