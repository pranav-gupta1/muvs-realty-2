import { Quote, Star } from 'lucide-react'
import type { Testimonial } from '@prisma/client'
import { RevealGroup, RevealItem } from '@/components/site/reveal'

/** Initials avatar — no stock photos of people who did not consent to be here. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null

  return (
    <RevealGroup className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {testimonials.map((testimonial) => (
        <RevealItem key={testimonial.id} className="h-full">
          <figure className="flex h-full flex-col rounded border border-maroon-900/8 bg-white p-6 shadow-card transition-all duration-300 hover:border-gold-500/60 hover:shadow-card-hover">
            <Quote className="size-6 shrink-0 text-gold-500" aria-hidden="true" />

            <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink-900/85">
              {testimonial.quote}
            </blockquote>

            <div
              className="mt-5 flex items-center gap-1"
              aria-label={`${testimonial.rating} out of 5`}
            >
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  className={
                    index < testimonial.rating
                      ? 'size-3.5 fill-gold-500 text-gold-500'
                      : 'size-3.5 text-ink-500/30'
                  }
                  aria-hidden="true"
                />
              ))}
            </div>

            <figcaption className="mt-4 flex items-center gap-3 border-t border-gold-500/20 pt-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-maroon-900 text-[13px] font-semibold text-gold-200">
                {initials(testimonial.name)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-semibold text-maroon-900">
                  {testimonial.name}
                </span>
                <span className="block truncate text-[12.5px] text-ink-500">
                  {[testimonial.role, testimonial.location].filter(Boolean).join(' · ')}
                </span>
              </span>
            </figcaption>
          </figure>
        </RevealItem>
      ))}
    </RevealGroup>
  )
}
