'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  Award,
  Building2,
  ExternalLink,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  UserRound,
  Rocket,
  Settings,
  Users,
  Video,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/leads', label: 'Leads', icon: Users },
  { href: '/admin/projects', label: 'Projects', icon: Building2 },
  { href: '/admin/pre-launch', label: 'Pre-Launch', icon: Rocket },
  { href: '/admin/inventory', label: 'Inventory', icon: Home },
  { href: '/admin/certifications', label: 'Certifications', icon: Award },
  { href: '/admin/videos', label: 'Videos', icon: Video },
  { href: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
  { href: '/admin/leadership', label: 'Leadership', icon: UserRound },
  { href: '/admin/settings', label: 'Site Settings', icon: Settings },
] as const

export function AdminSidebar({ userName }: { userName: string }) {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => setOpen(false), [pathname])

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  const nav = (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Admin">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'flex items-center gap-3 rounded px-3 py-2.5 text-[13.5px] font-medium transition-colors',
            isActive(link.href, 'exact' in link ? link.exact : false)
              ? 'bg-gold-500/15 text-gold-200'
              : 'text-cream-50/65 hover:bg-cream-50/8 hover:text-cream-50',
          )}
        >
          <link.icon className="size-4 shrink-0" />
          {link.label}
        </Link>
      ))}
    </nav>
  )

  const footer = (
    <div className="mt-6 border-t border-cream-50/12 pt-5">
      <p className="truncate px-3 text-[12px] text-cream-50/50">Signed in as {userName}</p>
      <Link
        href="/"
        target="_blank"
        className="mt-2 flex items-center gap-3 rounded px-3 py-2 text-[13px] text-cream-50/65 transition-colors hover:bg-cream-50/8 hover:text-cream-50"
      >
        <ExternalLink className="size-4" />
        View website
      </Link>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/admin/login' })}
        className="flex w-full items-center gap-3 rounded px-3 py-2 text-[13px] text-cream-50/65 transition-colors hover:bg-cream-50/8 hover:text-cream-50"
      >
        <LogOut className="size-4" />
        Sign out
      </button>
    </div>
  )

  return (
    <>
      {/* Mobile bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gold-500/20 bg-maroon-900 px-5 py-3 lg:hidden">
        <Link href="/admin" className="font-serif text-lg font-semibold text-cream-50">
          MUVS <span className="text-gold-500">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="rounded p-2 text-cream-50 hover:bg-cream-50/10"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div className="sticky top-[57px] z-20 flex flex-col border-b border-gold-500/20 bg-maroon-900 px-4 py-4 lg:hidden">
          {nav}
          {footer}
        </div>
      ) : null}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-maroon-900 px-4 py-6 lg:flex">
        <Link href="/admin" className="px-3 font-serif text-xl font-semibold text-cream-50">
          MUVS <span className="text-gold-500">Admin</span>
        </Link>
        <div className="mt-8 flex flex-1 flex-col">
          {nav}
          {footer}
        </div>
      </aside>
    </>
  )
}
