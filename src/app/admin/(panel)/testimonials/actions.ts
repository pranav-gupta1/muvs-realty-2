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
  revalidatePath('/admin/testimonials')
}

export async function saveTestimonial(form: FormData) {
  await assertAdmin()

  const id = str(form, 'id')
  const name = str(form, 'name') || 'Anonymous'

  const data = {
    name,
    slug: await uniqueSlug('testimonial', str(form, 'slug'), name, id || undefined),
    role: str(form, 'role'),
    location: str(form, 'location'),
    quote: str(form, 'quote'),
    rating: Math.min(5, Math.max(1, int(form, 'rating', 5))),
    imageUrl: optionalStr(form, 'imageUrl'),
    sortOrder: int(form, 'sortOrder', 0),
    isPublished: bool(form, 'isPublished'),
  }

  if (id) await prisma.testimonial.update({ where: { id }, data })
  else await prisma.testimonial.create({ data })

  revalidateAll()
  redirect('/admin/testimonials?saved=1')
}

export async function deleteTestimonial(form: FormData) {
  await assertAdmin()
  const id = str(form, 'id')
  if (!id) return

  await prisma.testimonial.delete({ where: { id } })
  revalidateAll()
  redirect('/admin/testimonials')
}
