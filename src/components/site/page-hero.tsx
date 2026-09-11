import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BLUR_DATA_URL } from '@/lib/images'
import { Reveal } from '@/components/site/reveal'

export type Crumb = { label: string; href?: string }

/**
 * The dark band every non-home page opens with. It sits under the fixed header,
 * which is transparent at the top of the page — so this guarantees the header
 * always has contrast behind it.
 */
export function PageHero({
  eyebrow,
  title,
  lede,
  imageUrl,
  crumbs,
  children,
  size = 'md',
}: {
  eyebrow?: string
  title: string
  lede?: string
  imageUrl?: string | null
  crumbs?: Crumb[]
  children?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <section
      className={cn(
        'relative isolate overflow-hidden bg-maroon-900',
        size === 'sm' && 'pb-10 pt-[calc(var(--header-height)+2rem)] sm:pb-12 sm:pt-[calc(var(--header-height)+3rem)]',
        size === 'md' && 'pb-14 pt-[calc(var(--header-height)+3rem)] sm:pb-20 sm:pt-[calc(var(--header-height)+5rem)]',
        size === 'lg' && 'pb-20 pt-[calc(var(--header-height)+4rem)] sm:pb-28 sm:pt-[calc(var(--header-height)+7rem)]',
      )}
    >
      {imageUrl ? (
        <>
          <Image
            src={imageUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-maroon-900/85 via-maroon-900/70 to-maroon-900" />
        </>
      ) : (
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(1000px 400px at 15% -10%, rgba(163,30,48,0.55), transparent 60%), radial-gradient(700px 340px at 90% 0%, rgba(201,162,39,0.18), transparent 60%)',
          }}
        />
      )}

      <div className="container relative">
        {crumbs && crumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1 text-[12.5px] text-cream-50/60">
              <li>
                <Link href="/" className="transition-colors hover:text-gold-200">
                  Home
                </Link>
              </li>
              {crumbs.map((crumb) => (
                <li key={crumb.label} className="flex items-center gap-1">
                  <ChevronRight className="size-3.5 text-cream-50/35" aria-hidden="true" />
                  {crumb.href ? (
                    <Link href={crumb.href} className="transition-colors hover:text-gold-200">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-cream-50/85">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <Reveal className="max-w-3xl">
          {eyebrow ? <p className="eyebrow text-gold-200">{eyebrow}</p> : null}
          <h1
            className={cn(
              'mt-3 text-balance font-serif font-semibold text-cream-50',
              size === 'lg'
                ? 'text-[34px] leading-[1.1] sm:text-5xl lg:text-[56px]'
                : 'text-[30px] leading-[1.12] sm:text-4xl lg:text-[46px]',
            )}
          >
            {title}
          </h1>
          {lede ? (
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-cream-50/75 sm:text-base">
              {lede}
            </p>
          ) : null}
          {children ? <div className="mt-8">{children}</div> : null}
        </Reveal>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />
    </section>
  )
}
