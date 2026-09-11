import { z } from 'zod'

/**
 * Phone handling for an Indian real-estate business with a real NRI segment.
 *
 * Numbers are stored in E.164 everywhere — database, emails, CSV export — and
 * only ever formatted for display at render time. Validation is per country,
 * because "10 digits" is wrong for the UAE and "any 10 digits" is wrong for
 * India (mobiles start 6–9) and for the US (area codes start 2–9).
 *
 * This is a deliberately small, dependency-free rule set covering the markets
 * MUVS actually sells to, rather than pulling in a full libphonenumber build.
 */

export type CountryCode = 'IN' | 'US' | 'CA' | 'AE' | 'GB' | 'SG' | 'AU' | 'SA' | 'QA' | 'OM'

export type Country = {
  code: CountryCode
  name: string
  /** Dial prefix including the plus, e.g. "+91". */
  dial: string
  flag: string
  /** Number of digits in the national (subscriber) number. */
  length: number
  /** Full national-number rule, including valid leading digits. */
  pattern: RegExp
  /** Shown as the input placeholder. */
  example: string
  /** Human-readable grouping, e.g. 9810202834 → "98102 02834". */
  groups: number[]
  /** Explains the rule when validation fails. */
  hint: string
}

export const COUNTRIES: readonly Country[] = [
  {
    code: 'IN',
    name: 'India',
    dial: '+91',
    flag: '🇮🇳',
    length: 10,
    pattern: /^[6-9]\d{9}$/,
    example: '98102 02834',
    groups: [5, 5],
    hint: 'Indian mobile numbers are 10 digits starting with 6, 7, 8 or 9.',
  },
  {
    code: 'US',
    name: 'United States',
    dial: '+1',
    flag: '🇺🇸',
    length: 10,
    pattern: /^[2-9]\d{2}[2-9]\d{6}$/,
    example: '415 555 0132',
    groups: [3, 3, 4],
    hint: 'US numbers are 10 digits, and both the area code and the exchange code start with 2 to 9.',
  },
  {
    code: 'CA',
    name: 'Canada',
    dial: '+1',
    flag: '🇨🇦',
    length: 10,
    pattern: /^[2-9]\d{2}[2-9]\d{6}$/,
    example: '416 555 0132',
    groups: [3, 3, 4],
    hint: 'Canadian numbers are 10 digits, and both the area code and the exchange code start with 2 to 9.',
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    dial: '+971',
    flag: '🇦🇪',
    length: 9,
    pattern: /^5[0246-8]\d{7}$/,
    example: '50 123 4567',
    groups: [2, 3, 4],
    hint: 'UAE mobile numbers are 9 digits starting with 50, 52, 54, 55, 56, 57 or 58.',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    dial: '+44',
    flag: '🇬🇧',
    length: 10,
    pattern: /^7[1-9]\d{8}$/,
    example: '7911 123456',
    groups: [4, 6],
    hint: 'UK mobile numbers are 10 digits starting with 7 (drop the leading 0).',
  },
  {
    code: 'SG',
    name: 'Singapore',
    dial: '+65',
    flag: '🇸🇬',
    length: 8,
    pattern: /^[89]\d{7}$/,
    example: '8123 4567',
    groups: [4, 4],
    hint: 'Singapore mobile numbers are 8 digits starting with 8 or 9.',
  },
  {
    code: 'AU',
    name: 'Australia',
    dial: '+61',
    flag: '🇦🇺',
    length: 9,
    pattern: /^4\d{8}$/,
    example: '412 345 678',
    groups: [3, 3, 3],
    hint: 'Australian mobile numbers are 9 digits starting with 4 (drop the leading 0).',
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    dial: '+966',
    flag: '🇸🇦',
    length: 9,
    pattern: /^5\d{8}$/,
    example: '50 123 4567',
    groups: [2, 3, 4],
    hint: 'Saudi mobile numbers are 9 digits starting with 5.',
  },
  {
    code: 'QA',
    name: 'Qatar',
    dial: '+974',
    flag: '🇶🇦',
    length: 8,
    pattern: /^[3567]\d{7}$/,
    example: '3312 3456',
    groups: [4, 4],
    hint: 'Qatari mobile numbers are 8 digits starting with 3, 5, 6 or 7.',
  },
  {
    code: 'OM',
    name: 'Oman',
    dial: '+968',
    flag: '🇴🇲',
    length: 8,
    pattern: /^[79]\d{7}$/,
    example: '9123 4567',
    groups: [4, 4],
    hint: 'Omani mobile numbers are 8 digits starting with 7 or 9.',
  },
] as const

export const DEFAULT_COUNTRY: CountryCode = 'IN'

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]))

export function getCountry(code: string | null | undefined): Country {
  return BY_CODE.get((code ?? '') as CountryCode) ?? BY_CODE.get(DEFAULT_COUNTRY)!
}

export const countryCodeSchema = z.enum(
  COUNTRIES.map((c) => c.code) as [CountryCode, ...CountryCode[]],
)

/**
 * Cleans whatever the user typed or pasted into a bare national number:
 * strips spaces/dashes/parens, a pasted country code, and the trunk "0"
 * that Indian, UK and Australian users habitually include.
 */
export function normalizeNationalNumber(input: string, country: Country): string {
  let digits = (input ?? '').replace(/\D/g, '')
  const dial = country.dial.slice(1)

  if (digits.startsWith('00' + dial)) digits = digits.slice(2 + dial.length)
  else if (digits.length > country.length && digits.startsWith(dial)) {
    digits = digits.slice(dial.length)
  }
  while (digits.length > country.length && digits.startsWith('0')) digits = digits.slice(1)

  return digits.slice(0, country.length)
}

export type PhoneValidation =
  | { ok: true; e164: string; country: Country; national: string }
  | { ok: false; message: string }

export function validatePhone(input: string, countryCode: string): PhoneValidation {
  const country = getCountry(countryCode)
  const national = normalizeNationalNumber(input, country)

  if (national.length === 0) {
    return { ok: false, message: 'Enter your mobile number so we can verify it.' }
  }
  if (national.length < country.length) {
    const missing = country.length - national.length
    return {
      ok: false,
      message: `That number is ${missing} digit${missing === 1 ? '' : 's'} short. ${country.hint}`,
    }
  }
  if (!country.pattern.test(national)) {
    return { ok: false, message: country.hint }
  }

  return { ok: true, e164: `${country.dial}${national}`, country, national }
}

/** Strict E.164 for anything crossing a trust boundary (API bodies, DB writes). */
export const e164Schema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, 'Phone number must be in E.164 format, e.g. +919810202834')

/** Splits a stored E.164 back into a country + national number for display. */
export function parseE164(e164: string): { country: Country | null; national: string } {
  if (!e164?.startsWith('+')) return { country: null, national: e164 ?? '' }

  // Longest dial code first so +971 wins over +9.
  const candidates = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)
  for (const country of candidates) {
    if (e164.startsWith(country.dial)) {
      const national = e164.slice(country.dial.length)
      if (national.length === country.length) return { country, national }
    }
  }
  return { country: null, national: e164.slice(1) }
}

function applyGroups(national: string, groups: number[]): string {
  const parts: string[] = []
  let index = 0
  for (const size of groups) {
    if (index >= national.length) break
    parts.push(national.slice(index, index + size))
    index += size
  }
  if (index < national.length) parts.push(national.slice(index))
  return parts.join(' ')
}

/** Storage is E.164; humans read "+91 98102 02834". */
export function formatPhoneForDisplay(e164: string | null | undefined): string {
  if (!e164) return ''
  const { country, national } = parseE164(e164)
  if (!country) return e164
  return `${country.dial} ${applyGroups(national, country.groups)}`
}

/** Live formatting for the input field as the user types. */
export function formatNationalAsTyped(input: string, country: Country): string {
  return applyGroups(normalizeNationalNumber(input, country), country.groups)
}

/** Digits only — what wa.me and tel: links expect. */
export function toWhatsAppNumber(e164: string | null | undefined): string {
  return (e164 ?? '').replace(/\D/g, '')
}

/** Masks all but the last two digits, for "we sent a code to …" copy. */
export function maskPhone(e164: string): string {
  const { country, national } = parseE164(e164)
  if (!country) return e164
  const masked = national.slice(0, -2).replace(/\d/g, '•') + national.slice(-2)
  return `${country.dial} ${applyGroups(masked, country.groups)}`
}
