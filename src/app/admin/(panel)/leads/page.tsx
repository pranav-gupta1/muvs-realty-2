import type { Metadata } from 'next'
import Link from 'next/link'
import { Download, Phone, Search } from 'lucide-react'
import type { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { BudgetRange, InterestType, LeadStatus, PropertyLocation } from '@/lib/taxonomy'
import { formatDateTime } from '@/lib/format'
import { formatPhoneForDisplay, toWhatsAppNumber } from '@/lib/phone'
import type { SearchParams } from '@/lib/inventory'

import { AdminPageHeader } from '@/components/admin/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TextInput, TextArea, SubmitButton, DeleteButton } from '@/components/admin/form-fields'
import { deleteLead, updateLeadNotes, updateLeadStatus } from './actions'

export const metadata: Metadata = { title: 'Leads', robots: { index: false } }

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const q = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? ''
  const status = LeadStatus.parse(Array.isArray(params.status) ? params.status[0] : params.status)

  const where: Prisma.LeadWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { phone: { contains: q } },
            { email: { contains: q } },
            { requirements: { contains: q } },
            { relatedTitle: { contains: q } },
          ],
        }
      : {}),
  }

  const [leads, counts] = await Promise.all([
    prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 }),
    prisma.lead.groupBy({ by: ['status'], _count: { _all: true } }),
  ])

  const countByStatus = Object.fromEntries(counts.map((row) => [row.status, row._count._all]))
  const exportHref = `/api/admin/leads/export${q || status ? `?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}) })}` : ''}`

  return (
    <>
      <AdminPageHeader
        title="Leads"
        description="Every enquiry with a phone number verified by one-time code. Search, set a status, add notes, or export the list."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <form method="get" className="relative min-w-[240px] flex-1">
          <TextInput
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name, phone, email or requirement"
            className="pl-9"
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
          {status ? <input type="hidden" name="status" value={status} /> : null}
        </form>

        <Button asChild variant="outline" size="sm">
          <a href={exportHref}>
            <Download className="size-4" />
            Export to CSV
          </a>
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <StatusChip href={`/admin/leads${q ? `?q=${encodeURIComponent(q)}` : ''}`} active={!status}>
          All
        </StatusChip>
        {LeadStatus.options.map((option) => (
          <StatusChip
            key={option.value}
            href={`/admin/leads?${new URLSearchParams({ ...(q ? { q } : {}), status: option.value })}`}
            active={status === option.value}
          >
            {option.label}
            <span className="tabular ml-1.5 opacity-70">{countByStatus[option.value] ?? 0}</span>
          </StatusChip>
        ))}
      </div>

      {leads.length === 0 ? (
        <p className="rounded border border-dashed border-maroon-900/20 bg-white px-5 py-12 text-center text-[13.5px] text-ink-500">
          {q || status ? 'No leads match that search.' : 'No leads yet.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {leads.map((lead) => (
            <li key={lead.id} className="rounded border border-maroon-900/10 bg-white">
              <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[15px] font-semibold text-maroon-900">{lead.name}</p>
                    {lead.phoneVerified ? <Badge variant="gold">Verified</Badge> : null}
                  </div>

                  <p className="tabular mt-1.5 flex flex-wrap items-center gap-x-3 text-[13px] text-ink-900">
                    <a href={`tel:${lead.phone}`} className="font-medium text-maroon-700 hover:underline">
                      {formatPhoneForDisplay(lead.phone)}
                    </a>
                    <a
                      href={`https://wa.me/${toWhatsAppNumber(lead.phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12.5px] text-maroon-700 hover:underline"
                    >
                      WhatsApp
                    </a>
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} className="text-[12.5px] text-ink-500 hover:underline">
                        {lead.email}
                      </a>
                    ) : null}
                  </p>

                  <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px] text-ink-500">
                    {lead.propertyTypeInterest ? (
                      <div>
                        <dt className="inline">Interest: </dt>
                        <dd className="inline text-ink-900">
                          {InterestType.label(lead.propertyTypeInterest)}
                        </dd>
                      </div>
                    ) : null}
                    {lead.budgetRange ? (
                      <div>
                        <dt className="inline">Budget: </dt>
                        <dd className="inline text-ink-900">{BudgetRange.label(lead.budgetRange)}</dd>
                      </div>
                    ) : null}
                    {lead.preferredLocation ? (
                      <div>
                        <dt className="inline">Location: </dt>
                        <dd className="inline text-ink-900">
                          {PropertyLocation.label(lead.preferredLocation)}
                        </dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="inline">Source: </dt>
                      <dd className="inline text-ink-900">{lead.source}</dd>
                    </div>
                    <div>
                      <dt className="inline">Received: </dt>
                      <dd className="tabular inline text-ink-900">{formatDateTime(lead.createdAt)}</dd>
                    </div>
                  </dl>

                  {lead.relatedTitle ? (
                    <p className="mt-2 text-[12.5px] text-ink-500">
                      Enquired about <span className="text-maroon-900">{lead.relatedTitle}</span>
                    </p>
                  ) : null}

                  {lead.requirements ? (
                    <p className="mt-3 rounded border border-maroon-900/8 bg-cream-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-900/85">
                      {lead.requirements}
                    </p>
                  ) : null}
                </div>

                <form action={updateLeadStatus} className="shrink-0">
                  <input type="hidden" name="id" value={lead.id} />
                  <label htmlFor={`status-${lead.id}`} className="sr-only">
                    Lead status
                  </label>
                  <select
                    id={`status-${lead.id}`}
                    name="status"
                    defaultValue={lead.status}
                    className="h-9 cursor-pointer rounded border border-maroon-900/15 bg-white px-2.5 text-[13px] focus:border-gold-500 focus:outline-none"
                  >
                    {LeadStatus.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <SubmitButton>
                    <span className="text-[12.5px]">Update</span>
                  </SubmitButton>
                </form>
              </div>

              <details className="border-t border-maroon-900/8 px-5 py-3">
                <summary className="cursor-pointer text-[12.5px] font-medium text-maroon-700">
                  Notes {lead.notes ? '(saved)' : ''}
                </summary>
                <form action={updateLeadNotes} className="mt-3 space-y-3">
                  <input type="hidden" name="id" value={lead.id} />
                  <TextArea
                    name="notes"
                    defaultValue={lead.notes}
                    rows={3}
                    placeholder="Call notes, follow-up date, what they are really after…"
                  />
                  <div className="flex items-center justify-between">
                    <SubmitButton>Save notes</SubmitButton>
                    <span />
                  </div>
                </form>
                <form action={deleteLead} className="mt-3 border-t border-maroon-900/8 pt-3">
                  <input type="hidden" name="id" value={lead.id} />
                  <DeleteButton
                    label="Delete this lead"
                    confirmMessage={`Delete the lead from ${lead.name}? This cannot be undone.`}
                  />
                </form>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function StatusChip({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? 'rounded-full border border-maroon-700 bg-maroon-700 px-3.5 py-1.5 text-[12.5px] font-medium text-cream-50'
          : 'rounded-full border border-maroon-900/15 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-ink-900 transition-colors hover:border-gold-500'
      }
    >
      {children}
    </Link>
  )
}
