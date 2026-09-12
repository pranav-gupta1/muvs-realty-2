import { prisma } from '@/lib/prisma'
import { readStringList } from '@/lib/json'

/**
 * Leadership profiles shown on /about and previewed on the home page.
 *
 * MUVS Realty has two co-founders, so this replaced the single set of
 * director* fields that used to sit on SiteSettings. Order is controlled by
 * sortOrder, and the first published member is the one the home page previews.
 */
export type TeamProfile = {
  id: string
  slug: string
  name: string
  designation: string
  bio: string
  quote: string
  credentials: string[]
  imageUrl: string
  /** Direct line as supplied, e.g. "+91 98102 02834". Empty hides the row. */
  phone: string
  /** tel: href for the direct line, or null when there is none. */
  telHref: string | null
  /** Initials used when no photograph has been supplied yet. */
  initials: string
}

export function initialsOf(name: string): string {
  return name
    .replace(/^(Mr|Mrs|Ms|Dr)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function toProfile(row: {
  id: string
  slug: string
  name: string
  designation: string
  bio: string
  quote: string
  credentials: string
  imageUrl: string
  phone: string
}): TeamProfile {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    designation: row.designation,
    bio: row.bio,
    quote: row.quote,
    credentials: readStringList(row.credentials),
    imageUrl: row.imageUrl,
    phone: row.phone,
    telHref: row.phone ? `tel:${row.phone.replace(/[^\d+]/g, '')}` : null,
    initials: initialsOf(row.name),
  }
}

/** Published leadership profiles, in display order. */
export async function getTeam(): Promise<TeamProfile[]> {
  const rows = await prisma.teamMember.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
  return rows.map(toProfile)
}

/** The profile the home page previews, or null when none is published. */
export async function getLeadProfile(): Promise<TeamProfile | null> {
  const row = await prisma.teamMember.findFirst({
    where: { isPublished: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
  return row ? toProfile(row) : null
}
