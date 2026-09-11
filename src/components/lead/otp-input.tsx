'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Six-box verification code input.
 *
 * Handles the interactions people actually use:
 *   • typing advances, and overtyping a filled box replaces it
 *   • Backspace clears the current box, or steps back when already empty
 *   • ArrowLeft/ArrowRight and Home/End move between boxes
 *   • pasting a whole code fills every box, wherever the caret is
 *   • autocomplete="one-time-code" lets iOS/Android offer the SMS code
 *
 * The value is controlled by the parent, which owns validation and submission.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  invalid = false,
  autoFocus = true,
  describedBy,
}: {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  length?: number
  disabled?: boolean
  invalid?: boolean
  autoFocus?: boolean
  describedBy?: string
}) {
  const inputs = React.useRef<Array<HTMLInputElement | null>>([])
  const digits = React.useMemo(
    () => Array.from({ length }, (_, index) => value[index] ?? ''),
    [value, length],
  )

  React.useEffect(() => {
    if (autoFocus) inputs.current[0]?.focus()
  }, [autoFocus])

  const focusBox = (index: number) => {
    const clamped = Math.max(0, Math.min(length - 1, index))
    const input = inputs.current[clamped]
    input?.focus()
    input?.select()
  }

  const commit = (next: string) => {
    const cleaned = next.replace(/\D/g, '').slice(0, length)
    onChange(cleaned)
    if (cleaned.length === length) onComplete?.(cleaned)
    return cleaned
  }

  const handleChange = (index: number, raw: string) => {
    const typed = raw.replace(/\D/g, '')
    if (!typed) return

    // Multiple characters at once (autofill, or a fast paste into one box).
    if (typed.length > 1) {
      const next = commit(value.slice(0, index) + typed)
      focusBox(Math.min(next.length, length - 1))
      return
    }

    const chars = digits.slice()
    chars[index] = typed
    commit(chars.join(''))
    if (index < length - 1) focusBox(index + 1)
  }

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'Backspace': {
        event.preventDefault()
        const chars = digits.slice()
        if (chars[index]) {
          chars[index] = ''
          commit(chars.join(''))
        } else if (index > 0) {
          chars[index - 1] = ''
          commit(chars.join(''))
          focusBox(index - 1)
        }
        break
      }
      case 'Delete': {
        event.preventDefault()
        const chars = digits.slice()
        chars[index] = ''
        commit(chars.join(''))
        break
      }
      case 'ArrowLeft':
        event.preventDefault()
        focusBox(index - 1)
        break
      case 'ArrowRight':
        event.preventDefault()
        focusBox(index + 1)
        break
      case 'Home':
        event.preventDefault()
        focusBox(0)
        break
      case 'End':
        event.preventDefault()
        focusBox(length - 1)
        break
      default:
        break
    }
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text')
    const next = commit(pasted)
    focusBox(Math.min(next.length, length - 1))
  }

  return (
    <div
      className="flex items-center gap-2 sm:gap-2.5"
      role="group"
      aria-label={`${length}-digit verification code`}
      aria-describedby={describedBy}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputs.current[index] = element
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          pattern="\d*"
          maxLength={length}
          value={digit}
          disabled={disabled}
          aria-invalid={invalid}
          aria-label={`Digit ${index + 1}`}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.currentTarget.select()}
          className={cn(
            'tabular h-13 w-full min-w-0 rounded border bg-white text-center text-xl font-semibold text-maroon-900 shadow-sm transition-all',
            'h-12 sm:h-14 sm:text-2xl',
            'focus:outline-none focus:ring-2 focus:ring-gold-500/40',
            invalid
              ? 'border-red-600 focus:border-red-600'
              : digit
                ? 'border-gold-500 focus:border-gold-500'
                : 'border-maroon-900/18 focus:border-gold-500',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        />
      ))}
    </div>
  )
}
