import type { Metadata } from 'next'
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'

import { buildWhatsAppLink, getSiteSettings } from '@/lib/site'
import { getTeam } from '@/lib/team'
import { buildMetadata } from '@/lib/seo'

import { PageHero } from '@/components/site/page-hero'
import { Section } from '@/components/site/section'
import { Reveal } from '@/components/site/reveal'
import { MapEmbed } from '@/components/property/map-embed'
import { LeadForm } from '@/components/lead/lead-form'

export const metadata: Metadata = buildMetadata({
  title: 'Contact MUVS Realty',
  description:
    'Talk to a MUVS Realty advisor about buying, selling or investing in Delhi NCR property. Office address, phone, WhatsApp and email.',
  path: '/contact',
})

export default async function ContactPage() {
  const [settings, team] = await Promise.all([getSiteSettings(), getTeam()])
  const { contact, socials } = settings
  const whatsappHref = buildWhatsAppLink(
    contact.whatsapp,
    `Hi ${settings.companyName}, I would like to speak to an advisor.`,
  )

  const channels = [
    contact.phone && contact.telHref
      ? { icon: Phone, label: 'Phone', value: contact.phone, href: contact.telHref, external: false }
      : null,
    whatsappHref
      ? {
          icon: MessageCircle,
          label: 'WhatsApp',
          value: contact.whatsapp ?? 'Chat with us',
          href: whatsappHref,
          external: true,
        }
      : null,
    contact.email && contact.mailtoHref
      ? { icon: Mail, label: 'Email', value: contact.email, href: contact.mailtoHref, external: false }
      : null,
  ].filter(Boolean) as Array<{
    icon: typeof Phone
    label: string
    value: string
    href: string
    external: boolean
  }>

  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        title="Talk to us"
        lede="Tell us what you are looking for, or just ask a question. We confirm every number with a one-time code, and your details are never passed on."
        crumbs={[{ label: 'Contact' }]}
        imageUrl="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2000&q=75"
      />

      <Section className="bg-cream-50">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <h2 className="font-serif text-2xl text-maroon-900">Office</h2>
              <div className="hairline my-5" />

              <ul className="space-y-6">
                {contact.address ? (
                  <li className="flex gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-maroon-900">
                      <MapPin className="size-4 text-gold-200" />
                    </span>
                    <span>
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                        Address
                      </span>
                      <span className="mt-1 block text-[14.5px] leading-relaxed text-ink-900">
                        {contact.address}
                      </span>
                    </span>
                  </li>
                ) : null}

                {channels.map((channel) => (
                  <li key={channel.label} className="flex gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-maroon-900">
                      <channel.icon className="size-4 text-gold-200" />
                    </span>
                    <span>
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                        {channel.label}
                      </span>
                      <a
                        href={channel.href}
                        {...(channel.external
                          ? { target: '_blank', rel: 'noopener noreferrer' }
                          : {})}
                        className="tabular mt-1 block text-[14.5px] font-medium text-maroon-700 transition-colors hover:text-maroon-500"
                      >
                        {channel.value}
                      </a>
                    </span>
                  </li>
                ))}

                {contact.officeHours ? (
                  <li className="flex gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-maroon-900">
                      <Clock className="size-4 text-gold-200" />
                    </span>
                    <span>
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                        Office hours
                      </span>
                      <span className="mt-1 block text-[14.5px] text-ink-900">
                        {contact.officeHours}
                      </span>
                    </span>
                  </li>
                ) : null}
              </ul>

              {team.some((member) => member.telHref) ? (
                <div className="mt-10">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                    Speak to a director
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {team
                      .filter((member) => member.telHref)
                      .map((member) => (
                        <li key={member.id} className="flex items-baseline justify-between gap-4">
                          <span>
                            <span className="block text-[14px] font-medium text-maroon-900">
                              {member.name}
                            </span>
                            <span className="block text-[12.5px] text-ink-500">
                              {member.designation}
                            </span>
                          </span>
                          <a
                            href={member.telHref ?? undefined}
                            className="tabular shrink-0 text-[14px] font-medium text-maroon-700 hover:underline"
                          >
                            {member.phone}
                          </a>
                        </li>
                      ))}
                  </ul>
                </div>
              ) : null}

              {socials.length > 0 ? (
                <div className="mt-10">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                    Follow us
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {socials.map((social) => (
                      <a
                        key={social.key}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-maroon-900/15 bg-white px-4 py-2 text-[13px] font-medium text-maroon-900 transition-colors hover:border-gold-500 hover:bg-gold-200/25"
                      >
                        {social.name}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              {contact.reraNumber ? (
                <p className="tabular mt-10 rounded border border-maroon-900/8 bg-white px-5 py-4 text-[12.5px] text-ink-500">
                  <span className="block font-medium text-maroon-900">RERA Registration</span>
                  {contact.reraNumber}
                </p>
              ) : null}
            </Reveal>

            <Reveal delay={0.08} className="lg:col-span-7">
              <LeadForm
                source="/contact"
                heading="Send us an enquiry"
                description="Fill this in and we will call you back, usually within one working day."
                contactPhone={contact.phone}
                contactPhoneHref={contact.telHref}
              />
            </Reveal>
          </div>
        </div>
      </Section>

      {settings.mapEmbedUrl ? (
        <Section className="bg-white pt-0">
          <div className="container">
            <h2 className="font-serif text-2xl text-maroon-900">Find us</h2>
            <div className="hairline my-5" />
            <MapEmbed url={settings.mapEmbedUrl} title={`${settings.companyName} office`} />
          </div>
        </Section>
      ) : null}
    </>
  )
}
