'use client'

import * as React from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TaxonomyEntry } from '@/lib/taxonomy'

/**
 * Thin form primitives for the admin. Deliberately uncontrolled and native —
 * every admin form is a plain <form action={serverAction}>, so it works before
 * hydration and there is no client form state to get out of sync with the row.
 */

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded border border-maroon-900/10 bg-white p-6', className)}>
      <h2 className="font-serif text-lg text-maroon-900">{title}</h2>
      {description ? <p className="mt-1 text-[12.5px] text-ink-500">{description}</p> : null}
      <div className="hairline my-5" />
      <div className="space-y-5">{children}</div>
    </section>
  )
}

export function AdminField({
  label,
  htmlFor,
  hint,
  required,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-maroon-900">
        {label}
        {required ? <span className="ml-0.5 text-maroon-500">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-[12px] leading-relaxed text-ink-500">{hint}</p> : null}
    </div>
  )
}

const CONTROL =
  'w-full rounded border border-maroon-900/15 bg-white px-3 py-2 text-[13.5px] text-ink-900 shadow-sm transition-colors placeholder:text-ink-500/60 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30'

export const TextInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(CONTROL, 'h-10', className)} {...props} />
))
TextInput.displayName = 'TextInput'

export const TextArea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, rows = 4, ...props }, ref) => (
  <textarea ref={ref} rows={rows} className={cn(CONTROL, className)} {...props} />
))
TextArea.displayName = 'TextArea'

export function SelectInput({
  options,
  placeholder,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: readonly TaxonomyEntry[]
  placeholder?: string
}) {
  return (
    <select className={cn(CONTROL, 'h-10 cursor-pointer', className)} {...props}>
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

/** Checkbox with a label, used for the publish/feature flags. */
export function Toggle({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string
  label: string
  hint?: string
  defaultChecked?: boolean
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded border border-maroon-900/10 bg-cream-50 px-4 py-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 shrink-0 accent-[#7A1220]"
      />
      <span>
        <span className="block text-[13.5px] font-medium text-maroon-900">{label}</span>
        {hint ? <span className="mt-0.5 block text-[12px] text-ink-500">{hint}</span> : null}
      </span>
    </label>
  )
}

/** Disables itself while the server action is in flight. */
export function SubmitButton({
  children = 'Save',
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {pending ? 'Saving…' : children}
    </Button>
  )
}

/** Confirm-then-submit, for destructive actions inside a list. */
export function DeleteButton({
  label = 'Delete',
  confirmMessage,
}: {
  label?: string
  confirmMessage: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault()
      }}
      className="rounded px-2.5 py-1.5 text-[12.5px] font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? '…' : label}
    </button>
  )
}
