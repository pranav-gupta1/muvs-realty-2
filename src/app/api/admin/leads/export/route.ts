import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { BudgetRange, InterestType, LeadStatus, PropertyLocation } from '@/lib/taxonomy'

/**
 * GET /api/admin/leads/export — CSV of the current lead view.
 *
 * Phone numbers are exported in E.164 exactly as stored, so the file can be
 * loaded straight into a dialer or CRM.
 */

/** A bare E.164 number — provably not a formula, so it is exported verbatim. */
const E164 = /^\+[1-9]\d{6,14}$/

/**
 * RFC 4180 quoting, plus a guard against spreadsheet formula injection.
 * E.164 phone numbers are exempt: they all start with "+", and prefixing them
 * would break importing the file into a dialer or CRM.
 */
function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value)
  if (!E164.test(text) && /^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

export async function GET(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  const url = new URL(request.url)
  const q = url.searchParams.get('q')?.trim() ?? ''
  const status = LeadStatus.parse(url.searchParams.get('status'))

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

  const leads = await prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' } })

  const header = [
    'Created (IST)',
    'Name',
    'Phone (E.164)',
    'Phone verified',
    'Email',
    'Interest',
    'Budget',
    'Preferred location',
    'Requirements',
    'Source page',
    'Related listing',
    'Status',
    'Notes',
    'Lead ID',
  ]

  const rows = leads.map((lead) => [
    new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    }).format(lead.createdAt),
    lead.name,
    lead.phone,
    lead.phoneVerified ? 'Yes' : 'No',
    lead.email ?? '',
    lead.propertyTypeInterest ? InterestType.label(lead.propertyTypeInterest) : '',
    lead.budgetRange ? BudgetRange.label(lead.budgetRange) : '',
    lead.preferredLocation ? PropertyLocation.label(lead.preferredLocation) : '',
    lead.requirements ?? '',
    lead.source,
    lead.relatedTitle ?? '',
    LeadStatus.label(lead.status),
    lead.notes,
    lead.id,
  ])

  // BOM so Excel opens the ₹ sign and Devanagari names correctly.
  const csv =
    '﻿' + [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'

  const stamp = new Date().toISOString().slice(0, 10)
  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="muvs-leads-${stamp}.csv"`,
      'cache-control': 'no-store',
    },
  })
}
