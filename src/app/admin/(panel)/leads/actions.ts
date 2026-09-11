'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { LeadStatus } from '@/lib/taxonomy'
import { str } from '@/lib/admin-forms'

/** Every admin server action re-checks the session; the layout guard is not enough. */
async function assertAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error('Not authorised.')
}

export async function updateLeadStatus(formData: FormData) {
  await assertAdmin()

  const id = str(formData, 'id')
  const status = LeadStatus.parse(str(formData, 'status'))
  if (!id || !status) return

  await prisma.lead.update({ where: { id }, data: { status } })
  revalidatePath('/admin/leads')
  revalidatePath('/admin')
}

export async function updateLeadNotes(formData: FormData) {
  await assertAdmin()

  const id = str(formData, 'id')
  if (!id) return

  await prisma.lead.update({
    where: { id },
    data: { notes: str(formData, 'notes').slice(0, 4000) },
  })
  revalidatePath('/admin/leads')
}

export async function deleteLead(formData: FormData) {
  await assertAdmin()

  const id = str(formData, 'id')
  if (!id) return

  await prisma.lead.delete({ where: { id } })
  revalidatePath('/admin/leads')
  revalidatePath('/admin')
}
