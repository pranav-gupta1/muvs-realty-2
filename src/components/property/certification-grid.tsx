'use client'

import * as React from 'react'
import Image from 'next/image'
import type { Certification } from '@prisma/client'
import { Expand } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { BLUR_DATA_URL } from '@/lib/images'
import { isPlaceholder } from '@/lib/site'

/** Certification cards; clicking one opens the scan full-size in a lightbox. */
export function CertificationGrid({ certifications }: { certifications: Certification[] }) {
  const [active, setActive] = React.useState<Certification | null>(null)

  return (
    <>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {certifications.map((certification) => (
          <li key={certification.id}>
            <button
              type="button"
              onClick={() => setActive(certification)}
              className="group flex h-full w-full flex-col overflow-hidden rounded border border-maroon-900/8 bg-white text-left shadow-card transition-all duration-300 hover:border-gold-500/60 hover:shadow-card-hover"
            >
              <span className="relative block aspect-[4/3] overflow-hidden bg-cream-50">
                <Image
                  src={certification.imageUrl}
                  alt={`${certification.title} certificate`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                />
                <span className="absolute inset-0 bg-maroon-900/0 transition-colors group-hover:bg-maroon-900/20" />
                <span className="absolute right-3 top-3 rounded-full bg-maroon-900/60 p-2 text-cream-50 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                  <Expand className="size-4" />
                </span>
              </span>

              <span className="flex flex-1 flex-col p-5">
                <span className="tabular text-[11px] uppercase tracking-[0.1em] text-gold-500">
                  {certification.year}
                </span>
                <span className="mt-2 block font-serif text-[16px] leading-snug text-maroon-900">
                  {certification.title}
                </span>
                <span className="mt-1.5 block text-[13px] text-ink-500">
                  {certification.issuingBody}
                </span>
                {certification.number && !isPlaceholder(certification.number) ? (
                  <span className="tabular mt-3 block text-[12px] text-ink-500">
                    No. {certification.number}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent bare className="max-w-4xl">
          <DialogTitle className="sr-only">{active?.title ?? 'Certificate'}</DialogTitle>
          {active ? (
            <figure className="overflow-hidden rounded bg-cream-50">
              <div className="relative aspect-[4/3] w-full bg-maroon-900">
                <Image
                  src={active.imageUrl}
                  alt={`${active.title} certificate`}
                  fill
                  sizes="100vw"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className="object-contain"
                />
              </div>
              <figcaption className="p-5">
                <p className="font-serif text-lg text-maroon-900">{active.title}</p>
                <p className="tabular mt-1 text-[13px] text-ink-500">
                  {active.issuingBody} · {active.year}
                  {active.number && !isPlaceholder(active.number) ? ` · No. ${active.number}` : ''}
                </p>
                {active.description ? (
                  <p className="mt-3 text-[14px] leading-relaxed text-ink-900/80">
                    {active.description}
                  </p>
                ) : null}
              </figcaption>
            </figure>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
