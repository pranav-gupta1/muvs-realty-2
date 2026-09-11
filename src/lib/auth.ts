import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare, hash } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

/**
 * Admin authentication. A Credentials provider backed by the AdminUser table
 * with bcrypt password hashes, and JWT sessions so no session table is needed.
 *
 * Access is enforced in two places, both on the server:
 *   • src/app/admin/layout.tsx redirects unauthenticated visitors to the login
 *     page, which covers every admin page.
 *   • requireAdmin() in src/lib/admin-guard.ts guards every /api/admin route.
 * There is no client-side-only gate anywhere in the admin panel.
 */

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
})

export const PASSWORD_ROUNDS = 12

export function hashPassword(password: string): Promise<string> {
  return hash(password, PASSWORD_ROUNDS)
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 12 },
  pages: { signIn: '/admin/login', error: '/admin/login' },
  providers: [
    Credentials({
      name: 'Admin',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) return null

        const user = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } })
        // Compare even when the user is missing, so a bad email and a bad
        // password take the same amount of time.
        const passwordHash =
          user?.passwordHash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin'
        const valid = await compare(parsed.data.password, passwordHash)

        if (!user || !valid) return null
        return { id: user.id, email: user.email, name: user.name || user.email }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.uid = user.id
      return token
    },
    session({ session, token }) {
      if (session.user && token.uid) session.user.id = token.uid as string
      return session
    },
  },
})
