'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { AreaUnit, ProjectStatus, ProjectType, PropertyLocation } from '@/lib/taxonomy'
import { configurationListSchema, floorPlanListSchema } from '@/lib/json'
import {
  bool,
  date,
  images,
  jsonField,
  list,
  num,
  optionalStr,
  str,
  uniqueSlug,
} from '@/lib/admin-forms'

async function assertAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error('Not authorised.')
}

/** Every page that can show a project, so an edit is visible immediately. */
function revalidateProject(slug?: string) {
  revalidatePath('/')
  revalidatePath('/projects')
  revalidatePath('/pre-launch')
  revalidatePath('/admin/projects')
  revalidatePath('/admin/pre-launch')
  if (slug) revalidatePath(`/projects/${slug}`)
}

/** Shared field mapping for create and update. */
async function readProjectForm(form: FormData, currentId?: string) {
  const title = str(form, 'title') || 'Untitled project'
  const videoIds = str(form, 'videoIds')
    .split(/[\n,]/)
    .map((id) => id.trim())
    .filter(Boolean)

  return {
    slug: await uniqueSlug('project', str(form, 'slug'), title, currentId),
    title,
    developer: str(form, 'developer') || 'Developer to be confirmed',
    projectType: ProjectType.parse(str(form, 'projectType')) ?? 'RESIDENTIAL_APARTMENT',
    status: ProjectStatus.parse(str(form, 'status')) ?? 'NEW_LAUNCH',
    location: PropertyLocation.parse(str(form, 'location')) ?? 'NOIDA',
    sector: optionalStr(form, 'sector'),
    address: optionalStr(form, 'address'),

    priceMin: num(form, 'priceMin'),
    priceMax: num(form, 'priceMax'),
    areaMin: num(form, 'areaMin'),
    areaMax: num(form, 'areaMax'),
    areaUnit: AreaUnit.parse(str(form, 'areaUnit')) ?? 'SQFT',

    possessionDate: date(form, 'possessionDate'),
    reraNumber: optionalStr(form, 'reraNumber'),
    description: str(form, 'description'),

    highlights: list(form, 'highlights'),
    amenities: list(form, 'amenities'),
    configurations: jsonField(form, 'configurations', configurationListSchema, []),
    floorPlans: jsonField(form, 'floorPlans', floorPlanListSchema, []),
    videoIds: JSON.stringify(videoIds),

    brochureUrl: optionalStr(form, 'brochureUrl'),
    mapEmbedUrl: optionalStr(form, 'mapEmbedUrl'),

    expectedLaunch: optionalStr(form, 'expectedLaunch'),
    startingPrice: num(form, 'startingPrice'),
    earlyBirdNote: optionalStr(form, 'earlyBirdNote'),
    isGated: bool(form, 'isGated'),

    isFeatured: bool(form, 'isFeatured'),
    isPublished: bool(form, 'isPublished'),
  }
}

export async function createProject(form: FormData) {
  await assertAdmin()
  const data = await readProjectForm(form)
  const imageRows = images(form)

  const project = await prisma.project.create({
    data: { ...data, images: { create: imageRows } },
    select: { id: true, slug: true },
  })

  revalidateProject(project.slug)
  redirect(`/admin/projects/${project.id}?saved=1`)
}

export async function updateProject(form: FormData) {
  await assertAdmin()

  const id = str(form, 'id')
  if (!id) throw new Error('Missing project id.')

  const previous = await prisma.project.findUnique({ where: { id }, select: { slug: true } })
  const data = await readProjectForm(form, id)
  const imageRows = images(form)

  await prisma.project.update({
    where: { id },
    // Images are replaced wholesale so order, alt text and the primary flag
    // always match exactly what the editor arranged.
    data: { ...data, images: { deleteMany: {}, create: imageRows } },
  })

  revalidateProject(data.slug)
  if (previous && previous.slug !== data.slug) revalidatePath(`/projects/${previous.slug}`)
  redirect(`/admin/projects/${id}?saved=1`)
}

export async function deleteProject(form: FormData) {
  await assertAdmin()

  const id = str(form, 'id')
  if (!id) return

  const project = await prisma.project.findUnique({ where: { id }, select: { slug: true } })
  await prisma.project.delete({ where: { id } })

  revalidateProject(project?.slug)
  redirect('/admin/projects')
}

/** Quick publish/feature toggles from the list view. */
export async function toggleProjectFlag(form: FormData) {
  await assertAdmin()

  const id = str(form, 'id')
  const field = z.enum(['isPublished', 'isFeatured']).safeParse(str(form, 'field'))
  if (!id || !field.success) return

  const project = await prisma.project.findUnique({
    where: { id },
    select: { slug: true, isPublished: true, isFeatured: true },
  })
  if (!project) return

  await prisma.project.update({
    where: { id },
    data: { [field.data]: !project[field.data] },
  })

  revalidateProject(project.slug)
}
