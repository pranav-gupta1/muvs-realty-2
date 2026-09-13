import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'
import { NAV_LINKS, buildWhatsAppLink, type ResolvedSettings } from '@/lib/site'
import { PropertyType } from '@/lib/taxonomy'
import { serializeInventoryFilters } from '@/lib/inventory'

/**
 * Footer. Every contact detail and social link is omitted entirely when its
 * setting is still an unfilled "[FILL: …]" placeholder, so nothing renders as a
 * dead link. The RERA registration number appears on every page via this block.
 */
export function Footer({ settings }: { settings: ResolvedSettings }) {
  const { contact, socials } = settings
  const whatsappHref = buildWhatsAppLink(contact.whatsapp, 'Hi MUVS Realty, I found you on your website.')
  const year = new Date().getFullYear()

  return (
    <footer className="bg-maroon-900 text-cream-50/75">
      <div className="container py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <p className="font-serif text-2xl font-semibold text-cream-50">
              MUVS <span className="text-gold-500">Realty</span>
            </p>
            <div className="mt-4 h-px w-12 bg-gold-500" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed">
              {settings.tagline ||
                'Residential and commercial property advisors across Delhi NCR.'}
            </p>

            {socials.length > 0 ? (
              <div className="mt-7 flex flex-wrap gap-2">
                {socials.map((social) => (
                  <a
                    key={social.key}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-cream-50/20 px-3.5 py-1.5 text-xs font-medium text-cream-50/85 transition-colors hover:border-gold-500 hover:text-gold-200"
                  >
                    {social.name}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-500">
              Explore
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-gold-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-500">
              Property Types
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              {PropertyType.options.map((option) => (
                <li key={option.value}>
                  <Link
                    href={`/inventory${serializeInventoryFilters({ types: [option.value] })}`}
                    className="transition-colors hover:text-gold-200"
                  >
                    {option.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-500">
              Get in Touch
            </h3>
            <ul className="mt-5 space-y-4 text-sm">
              {contact.address ? (
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-gold-500" />
                  <span className="leading-relaxed">{contact.address}</span>
                </li>
              ) : null}
              {contact.phone && contact.telHref ? (
                <li className="flex gap-3">
                  <Phone className="mt-0.5 size-4 shrink-0 text-gold-500" />
                  <a href={contact.telHref} className="tabular transition-colors hover:text-gold-200">
                    {contact.phone}
                  </a>
                </li>
              ) : null}
              {contact.email && contact.mailtoHref ? (
                <li className="flex gap-3">
                  <Mail className="mt-0.5 size-4 shrink-0 text-gold-500" />
                  <a href={contact.mailtoHref} className="break-all transition-colors hover:text-gold-200">
                    {contact.email}
                  </a>
                </li>
              ) : null}
              {whatsappHref ? (
                <li>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gold-200 transition-colors hover:text-gold-500"
                  >
                    Chat on WhatsApp →
                  </a>
                </li>
              ) : null}
              {contact.officeHours ? (
                <li className="text-cream-50/60">{contact.officeHours}</li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-cream-50/12 pt-7">
          <div className="flex flex-col gap-3 text-xs text-cream-50/55 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {year} {settings.companyName}. All rights reserved.
              <Link
                href="/privacy"
                className="ml-3 border-l border-cream-50/20 pl-3 transition-colors hover:text-gold-200"
              >
                Privacy Policy
              </Link>
            </p>
            {/* Displayed on every page, as required for a registered agent. */}
            {contact.reraNumber ? (
              <p className="tabular">
                <span className="text-gold-500">RERA Registration:</span> {contact.reraNumber}
              </p>
            ) : null}
          </div>
          <p className="mt-4 max-w-4xl text-[11px] leading-relaxed text-cream-50/40">
            Information on this website is for general guidance and does not constitute an offer or
            contract. Prices, areas, plans and availability are indicative and subject to change.
            Buyers should verify all details and approvals independently before transacting.
          </p>
        </div>
      </div>
    </footer>
  )
}
