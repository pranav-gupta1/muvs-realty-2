import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/sidebar'
import { Toaster } from 'sonner'

/**
 * Guarded shell for every admin page. The check runs on the server before any
 * admin markup is produced, so unauthenticated visitors never receive panel
 * content — there is no client-side-only gate anywhere in here.
 */
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  return (
    <div className="min-h-dvh bg-cream-50 lg:flex">
      <AdminSidebar userName={session.user.name ?? session.user.email ?? 'Admin'} />
      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">{children}</div>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  )
}
