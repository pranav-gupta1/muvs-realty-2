import { z } from 'zod'
import { validatePhone, countryCodeSchema } from '@/lib/phone'
import { BudgetRange, InterestType, PropertyLocation } from '@/lib/taxonomy'

/**
 * Request schemas shared by the client form and the API routes, so the browser
 * and the server apply exactly the same rules. The server always re-validates —
 * client validation is a convenience, never a control.
 */

/** Blank optional select/text values arrive as "" from HTML forms. */
const optionalString = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined))

const optionalEnum = <T extends z.ZodTypeAny>(schema: T) =>
  z
    .union([schema, z.literal('')])
    .optional()
    .transform((value) => (value === '' || value === undefined ? undefined : value))

/**
 * Anti-bot fields, present on every public form.
 *  • `company` is a honeypot: hidden from humans, irresistible to bots.
 *  • `startedAt` is when the form mounted; a submission faster than
 *    LEAD_MIN_FILL_SECONDS did not involve a human reading the page.
 * Both are handled server-side by returning 200 and discarding, so a bot gets
 * no signal about what tripped it.
 */
const botFields = {
  company: z.string().max(200).optional(),
  startedAt: z.coerce.number().int().nonnegative().optional(),
}

const phoneFields = {
  countryCode: countryCodeSchema,
  phone: z.string().trim().min(1, 'Enter your mobile number.').max(24),
}

/** Adds the per-country rule and attaches the derived E.164 as `phoneE164`. */
function withPhoneRule<T extends z.ZodRawShape>(shape: T) {
  return z
    .object(shape)
    .transform((data, ctx) => {
      const result = validatePhone(
        (data as { phone: string }).phone,
        (data as { countryCode: string }).countryCode,
      )
      if (!result.ok) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phone'], message: result.message })
        return z.NEVER
      }
      return { ...data, phoneE164: result.e164 }
    })
}

/** POST /api/otp/send */
export const otpSendSchema = withPhoneRule({
  ...phoneFields,
  ...botFields,
})
export type OtpSendInput = z.input<typeof otpSendSchema>

/** The visible lead fields — also used to type the react-hook-form values. */
export const leadFieldsSchema = z.object({
  ...phoneFields,
  name: z
    .string()
    .trim()
    .min(2, 'Please enter your name.')
    .max(80, 'That name is too long.')
    // Keeps out URL-stuffing spam without rejecting real Indian names.
    .regex(/^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*$/u, 'Please enter your name using letters only.'),
  email: z
    .union([z.string().trim().email('That email address does not look right.'), z.literal('')])
    .optional()
    .transform((value) => (value ? value : undefined)),
  propertyTypeInterest: optionalEnum(InterestType.schema),
  budgetRange: optionalEnum(BudgetRange.schema),
  preferredLocation: optionalEnum(PropertyLocation.schema),
  requirements: optionalString(1500),
  source: optionalString(200),
  relatedType: optionalEnum(z.enum(['project', 'inventory'])),
  relatedId: optionalString(40),
  ...botFields,
})

/** POST /api/leads — the visible fields plus the OTP proof. */
export const leadSubmitSchema = withPhoneRule({
  ...leadFieldsSchema.shape,
  challengeId: z.string().trim().min(1, 'Request a verification code first.').max(40),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code we sent you.'),
})
export type LeadSubmitInput = z.input<typeof leadSubmitSchema>

/**
 * Client-side schema for react-hook-form. Deliberately flat and transform-free
 * so the form's value type is plain strings; the server re-validates with
 * `leadSubmitSchema` above, which is the schema that actually protects the
 * database.
 */
export const leadClientSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Please enter your name.')
      .max(80, 'That name is too long.')
      .regex(/^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*$/u, 'Please enter your name using letters only.'),
    countryCode: z.string().min(2),
    phone: z.string().min(1, 'Enter your mobile number.'),
    email: z.union([z.string().trim().email('That email address does not look right.'), z.literal('')]),
    propertyTypeInterest: z.string(),
    budgetRange: z.string(),
    preferredLocation: z.string(),
    requirements: z.string().max(1500, 'Please keep this under 1500 characters.'),
    /** Honeypot — must stay empty. */
    company: z.string(),
  })
  .superRefine((data, ctx) => {
    const result = validatePhone(data.phone, data.countryCode)
    if (!result.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phone'], message: result.message })
    }
  })

export type LeadClientValues = z.infer<typeof leadClientSchema>
