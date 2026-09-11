import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { prisma } from '@/lib/prisma'
import { VideoCategory } from '@/lib/taxonomy'
import { BLUR_DATA_URL, youtubeThumbnail, youtubeWatchUrl } from '@/lib/images'
import { AdminPageHeader } from '@/components/admin/page-header'
import { Badge } from '@/components/ui/badge'
import {
  AdminField,
  DeleteButton,
  FormSection,
  SelectInput,
  SubmitButton,
  TextArea,
  TextInput,
  Toggle,
} from '@/components/admin/form-fields'
import { SavedNotice } from '@/components/admin/saved-notice'
import { deleteVideo, saveVideo } from './actions'

export const metadata: Metadata = { title: 'Videos', robots: { index: false } }

export default async function AdminVideosPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; saved?: string; error?: string }>
}) {
  const { edit, saved, error } = await searchParams

  const [videos, editing] = await Promise.all([
    prisma.video.findMany({ orderBy: { sortOrder: 'asc' } }),
    edit ? prisma.video.findUnique({ where: { id: edit } }) : null,
  ])

  return (
    <>
      <AdminPageHeader
        title="Videos"
        description="Only the YouTube ID is saved, never the video file. The thumbnail loads with the page, and the player loads when someone clicks it."
      />

      {saved ? <SavedNotice>Saved.</SavedNotice> : null}
      {error === 'youtube' ? (
        <p className="mb-6 rounded border border-red-600/30 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          That did not look like a YouTube video. Paste the full watch URL or the 11-character ID.
        </p>
      ) : null}

      <form action={saveVideo} className="mb-8">
        {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

        <FormSection title={editing ? `Edit “${editing.title}”` : 'Add a video'}>
          <div className="grid gap-5 sm:grid-cols-2">
            <AdminField
              label="YouTube URL or ID"
              htmlFor="youtubeId"
              required
              className="sm:col-span-2"
              hint="e.g. https://www.youtube.com/watch?v=Fsaw4JuigaA, or just Fsaw4JuigaA"
            >
              <TextInput id="youtubeId" name="youtubeId" defaultValue={editing?.youtubeId} required />
            </AdminField>

            <AdminField label="Title" htmlFor="title" required>
              <TextInput id="title" name="title" defaultValue={editing?.title} required />
            </AdminField>

            <AdminField label="Category" htmlFor="category">
              <SelectInput
                id="category"
                name="category"
                options={VideoCategory.options}
                defaultValue={editing?.category ?? 'PROPERTY_TOUR'}
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

            <AdminField label="Description" htmlFor="description" className="sm:col-span-2">
              <TextArea id="description" name="description" rows={3} defaultValue={editing?.description ?? ''} />
            </AdminField>
          </div>

          <Toggle name="isPublished" label="Published" defaultChecked={editing?.isPublished ?? true} />

          <div className="flex justify-end gap-3">
            {editing ? (
              <Link
                href="/admin/videos"
                className="rounded px-4 py-2 text-[13px] font-medium text-ink-500 hover:bg-cream-50"
              >
                Cancel
              </Link>
            ) : null}
            <SubmitButton>{editing ? 'Save changes' : 'Add video'}</SubmitButton>
          </div>
        </FormSection>
      </form>

      <ul className="space-y-3">
        {videos.map((video) => (
          <li
            key={video.id}
            className="flex flex-wrap items-center gap-4 rounded border border-maroon-900/10 bg-white p-4"
          >
            <a
              href={youtubeWatchUrl(video.youtubeId)}
              target="_blank"
              rel="noopener noreferrer"
              className="relative h-14 w-24 shrink-0 overflow-hidden rounded bg-cream-50"
            >
              <Image
                src={youtubeThumbnail(video.youtubeId)}
                alt=""
                fill
                sizes="96px"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="object-cover"
              />
            </a>

            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-maroon-900">
                {video.title}
                {!video.isPublished ? <Badge variant="muted">Hidden</Badge> : null}
              </p>
              <p className="tabular mt-0.5 text-[12.5px] text-ink-500">
                {VideoCategory.label(video.category)} · {video.youtubeId}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Link
                href={`/admin/videos?edit=${video.id}`}
                className="rounded px-2.5 py-1.5 text-[12.5px] font-medium text-maroon-700 hover:bg-cream-50"
              >
                Edit
              </Link>
              <form action={deleteVideo}>
                <input type="hidden" name="id" value={video.id} />
                <DeleteButton confirmMessage={`Delete “${video.title}”?`} />
              </form>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
