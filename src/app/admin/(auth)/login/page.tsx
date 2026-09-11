import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'
import { auth, signIn } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const metadata: Metadata = {
  title: 'Admin sign in',
  robots: { index: false, follow: false },
}

/** Signs the admin in. Errors come back as a query param, never as a crash. */
async function signInAction(formData: FormData) {
  'use server'

  try {
    await signIn('credentials', {
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
      redirectTo: '/admin',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/admin/login?error=1')
    }
    // next-auth signals a successful redirect by throwing; let that through.
    throw error
  }
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const [session, params] = await Promise.all([auth(), searchParams])
  if (session?.user) redirect('/admin')

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center">
          <span className="font-serif text-2xl font-semibold text-cream-50">
            MUVS <span className="text-gold-500">Realty</span>
          </span>
        </Link>
        <p className="mt-2 text-center text-[13px] uppercase tracking-[0.16em] text-gold-200/80">
          Admin panel
        </p>

        <form
          action={signInAction}
          className="mt-8 space-y-5 rounded border border-gold-500/25 bg-cream-50 p-7 shadow-card-hover"
        >
          {params.error ? (
            <p role="alert" className="rounded border border-red-600/30 bg-red-50 px-4 py-3 text-[13px] text-red-800">
              That email and password did not match. Please try again.
            </p>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="email" required>
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              placeholder="admin@muvsrealty.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" required>
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          <Button type="submit" size="lg" className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-[12.5px] text-cream-50/50">
          <Link href="/" className="hover:text-gold-200">
            ← Back to the website
          </Link>
        </p>
      </div>
    </div>
  )
}
