'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { int, list, str } from '@/lib/admin-forms'

async function assertAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error('Not authorised.')
}

/**
 * Site settings appear on every page, so saving them revalidates the whole
 * site rather than one path.
 */
export async function saveSettings(form: FormData) {
  await assertAdmin()

  const data = {
    companyName: str(form, 'companyName') || 'MUVS Realty',
    tagline: str(form, 'tagline'),

    phone: str(form, 'phone'),
    whatsapp: str(form, 'whatsapp'),
    email: str(form, 'email'),
    address: str(form, 'address'),
    officeHours: str(form, 'officeHours'),
    reraNumber: str(form, 'reraNumber'),

    instagram: str(form, 'instagram'),
    facebook: str(form, 'facebook'),
    linkedin: str(form, 'linkedin'),
    youtube: str(form, 'youtube'),

    heroTitle: str(form, 'heroTitle'),
    heroSubtitle: str(form, 'heroSubtitle'),
    heroImageUrl: str(form, 'heroImageUrl'),

    directorName: str(form, 'directorName'),
    directorDesignation: str(form, 'directorDesignation'),
    directorBio: str(form, 'directorBio'),
    directorQuote: str(form, 'directorQuote'),
    directorImageUrl: str(form, 'directorImageUrl'),
    directorCredentials: list(form, 'directorCredentials'),

    aboutStory: str(form, 'aboutStory'),
    aboutMission: str(form, 'aboutMission'),
    mapEmbedUrl: str(form, 'mapEmbedUrl'),

    statYears: int(form, 'statYears', 0),
    statProperties: int(form, 'statProperties', 0),
    statCities: int(form, 'statCities', 0),
    statClients: int(form, 'statClients', 0),
  }

  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    create: { id: 'default', ...data },
    update: data,
  })

  revalidatePath('/', 'layout')
  redirect('/admin/settings?saved=1')
}
