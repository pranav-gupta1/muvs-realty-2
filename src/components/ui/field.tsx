import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

/**
 * Label + control + help/error, with the wiring (htmlFor, aria-describedby,
 * aria-invalid) done once so every form in the app is accessible by default.
 */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: (props: {
    id: string
    'aria-invalid': boolean
    'aria-describedby': string | undefined
  }) => React.ReactNode
}) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {error ? (
        <p id={errorId} role="alert" className="text-[13px] font-medium text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[12px] leading-relaxed text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
