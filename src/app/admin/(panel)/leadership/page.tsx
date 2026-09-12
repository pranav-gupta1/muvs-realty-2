import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { prisma } from '@/lib/prisma'
import { readStringList } from '@/lib/json'
import { initialsOf } from '@/lib/team'
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
import { deleteTeamMember, saveTeamMember } from './actions'

export const metadata: Metadata = { title: 'Leadership', robots: { index: false } }

export default async function AdminLeadershipPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; saved?: string }>
}) {
  const { edit, saved } = await searchParams

  const [team, editing] = await Promise.all([
    prisma.teamMember.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] }),
    edit ? prisma.teamMember.findUnique({ where: { id: edit } }) : null,
  ])

  return (
    <>
      <AdminPageHeader
        title="Leadership"
        description="Directors and senior team, shown in full on /about. The first published profile is the one previewed on the home page."
      />

      {saved ? <SavedNotice>Saved.</SavedNotice> : null}

      <form action={saveTeamMember} className="mb-8">
        {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

        <FormSection title={editing ? `Edit ${editing.name}` : 'Add someone'}>
          <div className="grid gap-5 sm:grid-cols-2">
            <AdminField label="Full name" htmlFor="name" required>
              <TextInput id="name" name="name" defaultValue={editing?.name} required />
            </AdminField>

            <AdminField label="Designation" htmlFor="designation">
              <TextInput
                id="designation"
                name="designation"
                defaultValue={editing?.designation ?? 'Co-Founder and Director'}
              />
            </AdminField>

            <AdminField
              label="Order"
              htmlFor="sortOrder"
              hint="Lower numbers come first. The lowest is previewed on the home page."
            >
              <TextInput
                id="sortOrder"
                name="sortOrder"
                inputMode="numeric"
                defaultValue={editing?.sortOrder ?? 0}
              />
            </AdminField>

            <AdminField label="URL slug" htmlFor="slug" hint="Leave blank to generate from the name.">
              <TextInput id="slug" name="slug" defaultValue={editing?.slug} placeholder="auto" />
            </AdminField>
          </div>

          <AdminField
            label="Biography"
            htmlFor="bio"
            hint="Basic HTML is allowed: wrap paragraphs in <p> tags, and use <ul><li> for a list."
          >
            <TextArea id="bio" name="bio" rows={12} defaultValue={editing?.bio ?? ''} />
          </AdminField>

          <AdminField
            label="Pull quote"
            htmlFor="quote"
            hint="Optional. Shown in gold serif type beside the biography."
          >
            <TextArea id="quote" name="quote" rows={2} defaultValue={editing?.quote ?? ''} />
          </AdminField>

          <AdminField label="Credentials" htmlFor="credentials" hint="One per line.">
            <TextArea
              id="credentials"
              name="credentials"
              rows={5}
              defaultValue={editing ? readStringList(editing.credentials).join('\n') : ''}
            />
          </AdminField>

          <AdminField
            label="Photograph"
            hint="Portrait orientation works best. Until one is added, the site shows the person's initials."
          >
            <SingleImagePicker name="imageUrl" initialUrl={editing?.imageUrl ?? ''} />
          </AdminField>

          <Toggle name="isPublished" label="Published" defaultChecked={editing?.isPublished ?? true} />

          <div className="flex justify-end gap-3">
            {editing ? (
              <Link
                href="/admin/leadership"
                className="rounded px-4 py-2 text-[13px] font-medium text-ink-500 hover:bg-cream-50"
              >
                Cancel
              </Link>
            ) : null}
            <SubmitButton>{editing ? 'Save changes' : 'Add to leadership'}</SubmitButton>
          </div>
        </FormSection>
      </form>

      <ul className="space-y-3">
        {team.map((member) => (
          <li
            key={member.id}
            className="flex flex-wrap items-center gap-4 rounded border border-maroon-900/10 bg-white p-4"
          >
            <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-maroon-900">
              {member.imageUrl ? (
                <Image
                  src={member.imageUrl}
                  alt=""
                  fill
                  sizes="56px"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className="object-cover"
                />
              ) : (
                <span className="font-serif text-[15px] font-semibold text-gold-200">
                  {initialsOf(member.name)}
                </span>
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-maroon-900">
                {member.name}
                {!member.isPublished ? <Badge variant="muted">Hidden</Badge> : null}
                {!member.imageUrl ? <Badge variant="outline">No photo</Badge> : null}
              </p>
              <p className="mt-0.5 text-[12.5px] text-ink-500">{member.designation}</p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Link
                href={`/admin/leadership?edit=${member.id}`}
                className="rounded px-2.5 py-1.5 text-[12.5px] font-medium text-maroon-700 hover:bg-cream-50"
              >
                Edit
              </Link>
              <form action={deleteTeamMember}>
                <input type="hidden" name="id" value={member.id} />
                <DeleteButton confirmMessage={`Remove ${member.name} from the site?`} />
              </form>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
