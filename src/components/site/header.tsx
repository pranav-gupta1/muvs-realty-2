'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Phone, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_LINKS } from '@/lib/site'
import { Button } from '@/components/ui/button'

/**
 * Sticky header. Transparent over the page hero, then cream with a shadow and a
 * gold hairline once the visitor scrolls. Every page begins with a dark hero
 * band so the transparent state always has contrast behind it.
 */
export function Header({ phone, phoneHref }: { phone: string | null; phoneHref: string | null }) {
  const [scrolled, setScrolled] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const pathname = usePathname()

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu on navigation.
  React.useEffect(() => setMenuOpen(false), [pathname])

  // Lock body scroll while the mobile menu is open.
  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const solid = scrolled || menuOpen

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-all duration-300',
        solid ? 'bg-cream-50/95 shadow-header backdrop-blur-md' : 'bg-transparent',
      )}
    >
      <div className="container flex h-[var(--header-height)] items-center justify-between gap-6">
        <Link
          href="/"
          className="group flex shrink-0 flex-col leading-none"
          aria-label="MUVS Realty home"
        >
          <span
            className={cn(
              'font-serif text-[19px] font-semibold tracking-tight transition-colors sm:text-xl',
              solid ? 'text-maroon-900' : 'text-cream-50',
            )}
          >
            MUVS <span className="text-gold-500">Realty</span>
          </span>
          <span
            className={cn(
              'mt-1 h-px w-0 bg-gold-500 transition-all duration-500 group-hover:w-full',
              solid ? 'opacity-100' : 'opacity-80',
            )}
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'relative rounded px-3 py-2 text-[13.5px] font-medium transition-colors',
                solid
                  ? isActive(link.href)
                    ? 'text-maroon-700'
                    : 'text-ink-900/75 hover:text-maroon-700'
                  : isActive(link.href)
                    ? 'text-gold-200'
                    : 'text-cream-50/85 hover:text-cream-50',
              )}
              aria-current={isActive(link.href) ? 'page' : undefined}
            >
              {link.label}
              {isActive(link.href) ? (
                <span className="absolute inset-x-3 -bottom-0.5 h-px bg-gold-500" />
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {phone && phoneHref ? (
            <a
              href={phoneHref}
              className={cn(
                'hidden items-center gap-2 rounded px-3 py-2 text-[13.5px] font-medium transition-colors xl:inline-flex',
                solid ? 'text-maroon-900 hover:text-maroon-500' : 'text-cream-50 hover:text-gold-200',
              )}
            >
              <Phone className="size-3.5" />
              <span className="tabular">{phone}</span>
            </a>
          ) : null}

          <Button
            asChild
            size="sm"
            variant={solid ? 'primary' : 'light'}
            className="hidden sm:inline-flex"
          >
            <Link href="/contact">Talk to Us</Link>
          </Button>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className={cn(
              'inline-flex size-10 items-center justify-center rounded transition-colors lg:hidden',
              solid ? 'text-maroon-900 hover:bg-gold-200/40' : 'text-cream-50 hover:bg-cream-50/15',
            )}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <div className={cn('hairline transition-opacity', solid ? 'opacity-100' : 'opacity-0')} />

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        hidden={!menuOpen}
        className="max-h-[calc(100vh-var(--header-height))] overflow-y-auto border-t border-gold-500/20 bg-cream-50 lg:hidden"
      >
        <nav className="container flex flex-col py-3" aria-label="Mobile">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'border-b border-maroon-900/8 py-3.5 text-[15px] font-medium transition-colors last:border-0',
                isActive(link.href) ? 'text-maroon-700' : 'text-ink-900/80',
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 py-4">
            <Button asChild size="md">
              <Link href="/contact">Talk to Us</Link>
            </Button>
            {phone && phoneHref ? (
              <Button asChild variant="outline" size="md">
                <a href={phoneHref}>
                  <Phone className="size-4" />
                  <span className="tabular">{phone}</span>
                </a>
              </Button>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  )
}
