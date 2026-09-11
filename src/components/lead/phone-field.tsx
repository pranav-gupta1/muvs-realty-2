'use client'

import * as React from 'react'
import { COUNTRIES, getCountry, formatNationalAsTyped } from '@/lib/phone'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

/**
 * Country selector + national number. India is the default; the rest of the
 * list is the NRI markets that actually buy Delhi NCR property.
 *
 * The visible value is grouped for readability ("98102 02834"); the parent
 * always receives the raw digits, and the server derives E.164 from the country
 * plus those digits — the client never supplies an E.164 string of its own.
 */
export function PhoneField({
  id,
  countryCode,
  phone,
  onCountryChange,
  onPhoneChange,
  error,
  disabled,
  required = true,
}: {
  id: string
  countryCode: string
  phone: string
  onCountryChange: (value: string) => void
  onPhoneChange: (value: string) => void
  error?: string
  disabled?: boolean
  required?: boolean
}) {
  const country = getCountry(countryCode)
  const errorId = error ? `${id}-error` : undefined
  const hintId = `${id}-hint`

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} required={required}>
        Phone Number
      </Label>

      <div
        className={cn(
          'flex overflow-hidden rounded border bg-white shadow-sm transition-colors',
          'focus-within:ring-2 focus-within:ring-gold-500/35',
          error ? 'border-red-600' : 'border-maroon-900/15 focus-within:border-gold-500',
          disabled && 'opacity-60',
        )}
      >
        <div className="relative shrink-0">
          <select
            value={countryCode}
            onChange={(event) => onCountryChange(event.target.value)}
            disabled={disabled}
            aria-label="Country code"
            className="h-11 cursor-pointer appearance-none border-0 border-r border-maroon-900/12 bg-cream-50/60 py-2 pl-3 pr-8 text-sm text-ink-900 focus:outline-none disabled:cursor-not-allowed"
          >
            {COUNTRIES.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.flag} {entry.dial}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-maroon-700/60">
            ▼
          </span>
        </div>

        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={formatNationalAsTyped(phone, country)}
          onChange={(event) => onPhoneChange(event.target.value.replace(/\D/g, ''))}
          placeholder={country.example}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          className="tabular h-11 w-full min-w-0 border-0 bg-white px-3.5 py-2 text-sm text-ink-900 placeholder:text-ink-500/60 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-[13px] font-medium text-red-700">
          {error}
        </p>
      ) : (
        <p id={hintId} className="text-[12px] text-ink-500">
          We send a one-time code to confirm this number. {country.hint}
        </p>
      )}
    </div>
  )
}
