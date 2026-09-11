import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowUpRight, Building2, Home, Rocket, Users } from 'lucide-react'

import { prisma } from '@/lib/prisma'
import { getSiteSettings, isPlaceholder } from '@/lib/site'
import { formatDateTime } from '@/lib/format'
import { formatPhoneForDisplay } from '@/lib/phone'
import { LeadStatus } from '@/lib/taxonomy'
import { env } from '@/lib/env'
import { getSampleContent } from '@/lib/sample-content'
import { AdminPageHeader } from '@/components/admin/page-header'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Dashboard', robots: { index: false } }

const PLACEHOLDER_FIELDS = [
  ['directorName', 'Director name'],
  ['directorBio', 'Director bio'],
  ['phone', 'Phone'],
  ['whatsapp', 'WhatsApp'],
  ['email', 'Email'],
  ['address', 'Office address'],
  ['reraNumber', 'RERA number'],
  ['instagram', 'Instagram'],
  ['facebook', 'Facebook'],
  ['linkedin', 'LinkedIn'],
  ['youtube', 'YouTube'],
] as const

export default async function AdminDashboard() {
  const [settings, leadCount, newLeads, projectCount, preLaunchCount, inventoryCount, recentLeads] =
    await Promise.all([
      getSiteSettings(),
      prisma.lead.count(),
      prisma.lead.count({ where: { status: 'NEW' } }),
      prisma.project.count(),
      prisma.project.count({ where: { status: 'PRE_LAUNCH' } }),
      prisma.inventory.count(),
      prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
    ])

  const sample = await getSampleContent()
  const sampleClaims = sample.filter((group) => group.isClaim)

  const unfilled = PLACEHOLDER_FIELDS.filter(([key]) =>
    isPlaceholder(settings[key as keyof typeof settings] as string),
  )

  const cards = [
    { label: 'Leads', value: leadCount, sub: `${newLeads} new`, href: '/admin/leads', icon: Users },
    { label: 'Projects', value: projectCount, sub: 'published & draft', href: '/admin/projects', icon: Building2 },
    { label: 'Pre-Launch', value: preLaunchCount, sub: 'gated allocations', href: '/admin/pre-launch', icon: Rocket },
    { label: 'Inventory', value: inventoryCount, sub: 'resale listings', href: '/admin/inventory', icon: Home },
  ]

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Everything on the website is managed from here. Changes appear on the live site immediately."
      />

      {unfilled.length > 0 ? (
        <div className="mb-8 rounded border border-gold-500/45 bg-gold-200/25 p-5">
          <p className="text-[13.5px] font-semibold text-maroon-900">
            {unfilled.length} placeholder{unfilled.length === 1 ? '' : 's'} still to fill in
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-900/75">
            These still read “[FILL: …]”. Anything unfilled is hidden on the website so there are
            no broken links, but visitors cannot contact you until the phone, WhatsApp and email are
            set.
          </p>
          <p className="mt-3 flex flex-wrap gap-1.5">
            {unfilled.map(([, label]) => (
              <Badge key={label} variant="outline">
                {label}
              </Badge>
            ))}
          </p>
          <Link
            href="/admin/settings"
            className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-maroon-700 hover:underline"
          >
            Fill them in under Site Settings
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      ) : null}

      {sample.length > 0 ? (
        <div className="mb-8 rounded border border-maroon-900/15 bg-white p-5">
          <p className="text-[13.5px] font-semibold text-maroon-900">
            Sample content still on the site
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-900/75">
            The site was built with stand-in content so it looks complete.{' '}
            {sampleClaims.length > 0 ? (
              <>
                <strong className="font-semibold text-maroon-900">
                  Some of it states things about the business that are not true yet
                </strong>{' '}
                and must be replaced or deleted before the site goes live.
              </>
            ) : (
              'Replace it as the real material comes in.'
            )}
          </p>

          <ul className="mt-4 space-y-2.5">
            {sample.map((group) => (
              <li
                key={group.key}
                className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 border-t border-maroon-900/8 pt-2.5 text-[13px]"
              >
                <Link
                  href={group.href}
                  className="font-medium text-maroon-700 hover:underline"
                >
                  {group.label}
                </Link>
                {group.count !== null ? (
                  <span className="tabular text-ink-500">{group.count}</span>
                ) : null}
                {group.isClaim ? <Badge variant="outline">Do not publish as is</Badge> : null}
                <span className="w-full text-[12.5px] leading-relaxed text-ink-500">
                  {group.note}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded border border-maroon-900/10 bg-white p-5 transition-colors hover:border-gold-500"
          >
            <card.icon className="size-5 text-gold-500" />
            <p className="tabular mt-4 font-serif text-3xl font-semibold text-maroon-900">
              {card.value}
            </p>
            <p className="mt-1 text-[13px] font-medium text-ink-900">{card.label}</p>
            <p className="text-[12px] text-ink-500">{card.sub}</p>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-serif text-xl text-maroon-900">Recent leads</h2>
          <Link href="/admin/leads" className="text-[13px] font-medium text-maroon-700 hover:underline">
            View all →
          </Link>
        </div>

        {recentLeads.length > 0 ? (
          <ul className="divide-y divide-maroon-900/8 overflow-hidden rounded border border-maroon-900/10 bg-white">
            {recentLeads.map((lead) => (
              <li key={lead.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-maroon-900">{lead.name}</p>
                  <p className="tabular truncate text-[12.5px] text-ink-500">
                    {formatPhoneForDisplay(lead.phone)} · {lead.source}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {lead.phoneVerified ? <Badge variant="gold">Verified</Badge> : null}
                  <Badge variant="outline">{LeadStatus.label(lead.status)}</Badge>
                  <span className="tabular hidden text-[12px] text-ink-500 sm:inline">
                    {formatDateTime(lead.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded border border-dashed border-maroon-900/20 bg-white px-5 py-10 text-center text-[13.5px] text-ink-500">
            No leads yet. They will appear here as soon as someone submits a verified enquiry.
          </p>
        )}
      </section>

      <section className="mt-10 rounded border border-maroon-900/10 bg-white p-6">
        <h2 className="font-serif text-lg text-maroon-900">System status</h2>
        <div className="hairline my-4" />
        <dl className="grid gap-4 text-[13px] sm:grid-cols-3">
          <div>
            <dt className="text-ink-500">Phone verification</dt>
            <dd className="mt-1 font-medium text-maroon-900">
              {env.otp.devMode
                ? `Dev mode (fixed code ${env.otp.devCode})`
                : `Live via ${env.sms.provider}`}
            </dd>
          </div>
          <div>
            <dt className="text-ink-500">Email</dt>
            <dd className="mt-1 font-medium text-maroon-900">
              {env.smtp.configured ? `SMTP · ${env.smtp.host}` : 'Not set up yet (emails print to the console)'}
            </dd>
          </div>
          <div>
            <dt className="text-ink-500">Uploads</dt>
            <dd className="mt-1 font-medium text-maroon-900">{env.upload.driver}</dd>
          </div>
        </dl>
      </section>
    </>
  )
}
