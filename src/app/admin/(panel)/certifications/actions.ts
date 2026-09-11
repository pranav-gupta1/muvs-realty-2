'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { bool, int, optionalStr, str, uniqueSlug } from '@/lib/admin-forms'

async function assertAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error('Not authorised.')
}

function revalidateAll() {
  revalidatePath('/')
  revalidatePath('/certifications')
  revalidatePath('/admin/certifications')
}

export async function saveCertification(form: FormData) {
  await assertAdmin()

  const id = str(form, 'id')
  const title = str(form, 'title') || 'Untitled certification'

  const data = {
    title,
    slug: await uniqueSlug('certification', str(form, 'slug'), title, id || undefined),
    issuingBody: str(form, 'issuingBody') || 'Issuing body',
    year: int(form, 'year', new Date().getFullYear()),
    number: optionalStr(form, 'number'),
    imageUrl: str(form, 'imageUrl'),
    description: str(form, 'description'),
    sortOrder: int(form, 'sortOrder', 0),
    isPublished: bool(form, 'isPublished'),
  }

  if (id) await prisma.certification.update({ where: { id }, data })
  else await prisma.certification.create({ data })

  revalidateAll()
  redirect('/admin/certifications?saved=1')
}

export async function deleteCertification(form: FormData) {
  await assertAdmin()
  const id = str(form, 'id')
  if (!id) return

  await prisma.certification.delete({ where: { id } })
  revalidateAll()
  redirect('/admin/certifications')
}
