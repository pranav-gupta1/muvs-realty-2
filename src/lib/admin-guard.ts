import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

/**
 * Guard for /api/admin routes. Returns a 401 response when there is no session,
 * or null when the request may proceed:
 *
 *   const denied = await requireAdmin()
 *   if (denied) return denied
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 401 })
  }
  return null
}
