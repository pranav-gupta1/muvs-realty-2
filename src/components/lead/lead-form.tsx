'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { OtpInput } from '@/components/lead/otp-input'
import { PhoneField } from '@/components/lead/phone-field'
import { leadClientSchema, type LeadClientValues } from '@/lib/validators'
import { BudgetRange, InterestType, PropertyLocation } from '@/lib/taxonomy'
import { getCountry, maskPhone } from '@/lib/phone'
import { cn } from '@/lib/utils'

type Step = 'details' | 'verify' | 'done'

export type LeadFormProps = {
  /** Page the enquiry came from; stored on the lead and shown in the admin. */
  source: string
  relatedType?: 'project' | 'inventory'
  relatedId?: string
  relatedTitle?: string
  defaultInterest?: string
  defaultLocation?: string
  /** Offered as the way forward in error messages. */
  contactPhone?: string | null
  contactPhoneHref?: string | null
  heading?: string
  description?: string
  submitLabel?: string
  /** Pre-launch: refresh server components after success to reveal the content. */
  unlocksGatedContent?: boolean
  className?: string
}

const SELECT_CLASS =
  'h-11 w-full appearance-none rounded border border-maroon-900/15 bg-white bg-[length:12px] bg-[right_0.9rem_center] bg-no-repeat px-3.5 py-2 pr-9 text-sm text-ink-900 shadow-sm transition-colors focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/35 aria-[invalid=true]:border-red-600'

const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237A1220' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")"

export function LeadForm({
  source,
  relatedType,
  relatedId,
  relatedTitle,
  defaultInterest = '',
  defaultLocation = '',
  contactPhone,
  contactPhoneHref,
  heading = 'Speak to an advisor',
  description = 'Tell us what you are looking for. Once your number is verified, an advisor will call you back, usually within one working day.',
  submitLabel = 'Verify Phone & Submit',
  unlocksGatedContent = false,
  className,
}: LeadFormProps) {
  const router = useRouter()

  const [step, setStep] = React.useState<Step>('details')
  const [pending, setPending] = React.useState(false)
  const [code, setCode] = React.useState('')
  const [codeError, setCodeError] = React.useState<string | null>(null)
  const [challengeId, setChallengeId] = React.useState<string | null>(null)
  const [devCode, setDevCode] = React.useState<string | null>(null)
  const [verifiedPhone, setVerifiedPhone] = React.useState<string>('')
  const [resendIn, setResendIn] = React.useState(0)

  // Minimum-fill-time signal. Set once on mount; the server rejects anything
  // submitted faster than LEAD_MIN_FILL_SECONDS.
  const startedAt = React.useRef<number>(Date.now())

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    getValues,
    formState: { errors },
  } = useForm<LeadClientValues>({
    resolver: zodResolver(leadClientSchema),
    defaultValues: {
      name: '',
      countryCode: 'IN',
      phone: '',
      email: '',
      propertyTypeInterest: defaultInterest,
      budgetRange: '',
      preferredLocation: defaultLocation,
      requirements: '',
      company: '',
    },
  })

  const countryCode = watch('countryCode')
  const phone = watch('phone')

  // Resend cooldown.
  React.useEffect(() => {
    if (resendIn <= 0) return
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendIn])

  /** Appends the "call us instead" way forward to any error we show. */
  const withWayForward = React.useCallback(
    (message: string) =>
      contactPhone ? `${message} You can also call us on ${contactPhone}.` : message,
    [contactPhone],
  )

  async function requestCode(values: LeadClientValues, isResend = false) {
    setPending(true)
    setCodeError(null)

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          countryCode: values.countryCode,
          phone: values.phone,
          company: values.company,
          startedAt: startedAt.current,
        }),
      })
      const data = (await response.json()) as {
        ok?: boolean
        challengeId?: string
        devCode?: string
        maskedPhone?: string
        resendAfterSeconds?: number
        error?: string
        field?: string
      }

      if (!response.ok || !data.ok) {
        const message = withWayForward(data.error ?? 'We could not send the code just now.')
        if (data.field === 'phone') setError('phone', { message })
        else toast.error(message)
        return false
      }

      setChallengeId(data.challengeId ?? null)
      setDevCode(data.devCode ?? null)
      setVerifiedPhone(data.maskedPhone ?? maskPhone(`${getCountry(values.countryCode).dial}${values.phone}`))
      setResendIn(data.resendAfterSeconds ?? 60)
      setCode('')
      setStep('verify')
      if (isResend) toast.success('A new code is on its way.')
      return true
    } catch {
      toast.error(
        withWayForward('We could not reach the server. Check your connection and try again.'),
      )
      return false
    } finally {
      setPending(false)
    }
  }

  async function submitLead(verificationCode: string) {
    if (!challengeId) {
      setCodeError(withWayForward('That verification session has expired. Please request a new code.'))
      return
    }

    setPending(true)
    setCodeError(null)
    const values = getValues()

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...values,
          challengeId,
          code: verificationCode,
          source,
          relatedType,
          relatedId,
          startedAt: startedAt.current,
        }),
      })
      const data = (await response.json()) as {
        ok?: boolean
        error?: string
        reason?: string
        remainingAttempts?: number
      }

      if (!response.ok || !data.ok) {
        setCode('')
        setCodeError(withWayForward(data.error ?? 'We could not verify that code.'))
        // A dead session needs a new code, not another attempt.
        if (data.reason === 'EXPIRED' || data.reason === 'NOT_FOUND' || data.reason === 'ALREADY_USED') {
          setChallengeId(null)
        }
        return
      }

      setStep('done')
      if (unlocksGatedContent) {
        // The unlock cookie is set by the server; refresh so the gated content
        // is re-rendered server-side with access granted.
        router.refresh()
      }
    } catch {
      setCodeError(withWayForward('We could not reach the server. Please try again.'))
    } finally {
      setPending(false)
    }
  }

  if (step === 'done') {
    return (
      <div
        className={cn(
          'rounded border border-gold-500/40 bg-white p-8 text-center shadow-card',
          className,
        )}
      >
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-gold-200/60">
          <CheckCircle2 className="size-7 text-maroon-700" />
        </div>
        <h3 className="mt-5 font-serif text-2xl text-maroon-900">Thank you.</h3>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-500">
          Your number is verified and your enquiry is with our team. An advisor will call you
          shortly{relatedTitle ? ` about ${relatedTitle}` : ''}. We have emailed you a copy of what
          you told us.
        </p>
        {unlocksGatedContent ? (
          <p className="mt-4 text-sm font-medium text-maroon-700">
            Full pre-launch details are now unlocked on this page.
          </p>
        ) : null}
        {contactPhone && contactPhoneHref ? (
          <p className="mt-6 text-sm text-ink-500">
            Need us sooner?{' '}
            <a href={contactPhoneHref} className="font-medium text-maroon-700 hover:underline">
              Call {contactPhone}
            </a>
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className={cn('rounded border border-maroon-900/10 bg-white p-6 shadow-card sm:p-8', className)}>
      <div className="mb-6">
        <h3 className="font-serif text-2xl text-maroon-900">{heading}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">{description}</p>
        {relatedTitle ? (
          <p className="mt-3 rounded border border-gold-500/30 bg-gold-200/25 px-3 py-2 text-[13px] text-maroon-900">
            Enquiring about <strong className="font-semibold">{relatedTitle}</strong>
          </p>
        ) : null}
      </div>

      {step === 'details' ? (
        <form
          noValidate
          onSubmit={handleSubmit((values) => requestCode(values))}
          className="space-y-5"
        >
          {/* Honeypot: off-screen, unlabelled for humans, irresistible to bots. */}
          <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
            <label htmlFor={`${source}-company`}>Company (leave blank)</label>
            <input
              id={`${source}-company`}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              {...register('company')}
            />
          </div>

          <Field id="lead-name" label="Full Name" required error={errors.name?.message}>
            {(props) => (
              <Input {...props} {...register('name')} placeholder="Your name" autoComplete="name" />
            )}
          </Field>

          <PhoneField
            id="lead-phone"
            countryCode={countryCode}
            phone={phone}
            onCountryChange={(value) => setValue('countryCode', value, { shouldValidate: false })}
            onPhoneChange={(value) => setValue('phone', value, { shouldValidate: false })}
            error={errors.phone?.message}
            disabled={pending}
          />

          <Field id="lead-email" label="Email" error={errors.email?.message} hint="We will email you a copy of your enquiry.">
            {(props) => (
              <Input
                {...props}
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
              />
            )}
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lead-interest">Property Type of Interest</Label>
              <select
                id="lead-interest"
                {...register('propertyTypeInterest')}
                className={SELECT_CLASS}
                style={{ backgroundImage: CHEVRON }}
              >
                <option value="">Select a type</option>
                {InterestType.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lead-budget">Budget Range</Label>
              <select
                id="lead-budget"
                {...register('budgetRange')}
                className={SELECT_CLASS}
                style={{ backgroundImage: CHEVRON }}
              >
                <option value="">Select a budget</option>
                {BudgetRange.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lead-location">Preferred Location</Label>
            <select
              id="lead-location"
              {...register('preferredLocation')}
              className={SELECT_CLASS}
              style={{ backgroundImage: CHEVRON }}
            >
              <option value="">Select a location</option>
              {PropertyLocation.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <Field id="lead-requirements" label="Requirements" error={errors.requirements?.message}>
            {(props) => (
              <Textarea
                {...props}
                {...register('requirements')}
                placeholder="Configuration, possession timeline, floor preference, anything else we should know."
                rows={4}
              />
            )}
          </Field>

          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            {pending ? 'Sending code…' : submitLabel}
          </Button>

          <p className="text-center text-[12px] leading-relaxed text-ink-500">
            We confirm every number with a one-time code, and we use your details only to reply to
            this enquiry.
          </p>
        </form>
      ) : (
        <div className="space-y-5">
          <div>
            <p className="text-sm text-ink-900">
              We sent a 6-digit code to <strong className="tabular font-semibold">{verifiedPhone}</strong>.
            </p>
            <button
              type="button"
              onClick={() => {
                setStep('details')
                setCode('')
                setCodeError(null)
              }}
              className="mt-1 text-[13px] font-medium text-maroon-700 underline-offset-4 hover:underline"
            >
              Wrong number? Go back and change it
            </button>
          </div>

          {devCode ? (
            <div className="rounded border border-gold-500/45 bg-gold-200/35 px-4 py-3 text-[13px] text-maroon-900">
              <strong className="font-semibold">Development mode.</strong> No SMS was sent. Your code
              is <span className="tabular text-base font-semibold tracking-widest">{devCode}</span>
              <span className="mt-1 block text-[12px] text-maroon-900/70">
                Set OTP_DEV_MODE=false and configure SMS_PROVIDER to send real messages.
              </span>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="otp-group">Verification Code</Label>
            <OtpInput
              value={code}
              onChange={(next) => {
                setCode(next)
                if (codeError) setCodeError(null)
              }}
              onComplete={(next) => submitLead(next)}
              disabled={pending}
              invalid={Boolean(codeError)}
              describedBy={codeError ? 'otp-error' : undefined}
            />
            {codeError ? (
              <p id="otp-error" role="alert" className="text-[13px] font-medium text-red-700">
                {codeError}
              </p>
            ) : null}
          </div>

          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={pending || code.length !== 6}
            onClick={() => submitLead(code)}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {pending ? 'Verifying…' : 'Confirm & Submit Enquiry'}
          </Button>

          <div className="text-center text-[13px] text-ink-500">
            {resendIn > 0 ? (
              <span className="tabular">
                You can resend the code in {resendIn}s
              </span>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={() => requestCode(getValues(), true)}
                className="font-medium text-maroon-700 underline-offset-4 hover:underline disabled:opacity-60"
              >
                Resend code
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
