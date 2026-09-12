'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { bool, int, list, str, uniqueSlug } from '@/lib/admin-forms'

async function assertAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error('Not authorised.')
}

/** Leadership shows on /about and is previewed on the home page. */
function revalidateAll() {
  revalidatePath('/')
  revalidatePath('/about')
  revalidatePath('/admin/leadership')
}

export async function saveTeamMember(form: FormData) {
  await assertAdmin()

  const id = str(form, 'id')
  const name = str(form, 'name') || 'Unnamed'

  const data = {
    name,
    slug: await uniqueSlug('teamMember', str(form, 'slug'), name, id || undefined),
    designation: str(form, 'designation') || 'Director, MUVS Realty',
    bio: str(form, 'bio'),
    quote: str(form, 'quote'),
    credentials: list(form, 'credentials'),
    imageUrl: str(form, 'imageUrl'),
    phone: str(form, 'phone'),
    sortOrder: int(form, 'sortOrder', 0),
    isPublished: bool(form, 'isPublished'),
  }

  if (id) await prisma.teamMember.update({ where: { id }, data })
  else await prisma.teamMember.create({ data })

  revalidateAll()
  redirect('/admin/leadership?saved=1')
}

export async function deleteTeamMember(form: FormData) {
  await assertAdmin()

  const id = str(form, 'id')
  if (!id) return

  await prisma.teamMember.delete({ where: { id } })
  revalidateAll()
  redirect('/admin/leadership')
}
