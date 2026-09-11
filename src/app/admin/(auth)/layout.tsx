/**
 * Unauthenticated shell for the login page. It lives in its own route group so
 * the guarded panel layout does not wrap it — otherwise signing in would
 * redirect to itself.
 */
export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-maroon-900">{children}</div>
}
