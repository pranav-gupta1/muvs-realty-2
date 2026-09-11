'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { VideoCategory } from '@/lib/taxonomy'
import { bool, int, str } from '@/lib/admin-forms'
import { extractYouTubeId } from '@/lib/images'

async function assertAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error('Not authorised.')
}

function revalidateAll() {
  revalidatePath('/')
  revalidatePath('/videos')
  revalidatePath('/admin/videos')
}

export async function saveVideo(form: FormData) {
  await assertAdmin()

  const id = str(form, 'id')
  const youtubeId = extractYouTubeId(str(form, 'youtubeId'))
  if (!youtubeId) redirect('/admin/videos?error=youtube')

  const data = {
    youtubeId,
    title: str(form, 'title') || 'Untitled video',
    description: str(form, 'description'),
    category: VideoCategory.parse(str(form, 'category')) ?? 'PROPERTY_TOUR',
    sortOrder: int(form, 'sortOrder', 0),
    isPublished: bool(form, 'isPublished'),
  }

  // youtubeId is unique, so an existing row for the same video is updated
  // rather than rejected.
  if (id) await prisma.video.update({ where: { id }, data })
  else await prisma.video.upsert({ where: { youtubeId }, create: data, update: data })

  revalidateAll()
  redirect('/admin/videos?saved=1')
}

export async function deleteVideo(form: FormData) {
  await assertAdmin()
  const id = str(form, 'id')
  if (!id) return

  await prisma.video.delete({ where: { id } })
  revalidateAll()
  redirect('/admin/videos')
}
