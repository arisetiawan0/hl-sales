'use client'

import * as React from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'

import { cn } from '@/lib/utils'

const idNumberFormatter = new Intl.NumberFormat('id-ID')

/**
 * Input for Rupiah amounts. Holds the raw numeric string in state but displays
 * it with id-ID thousand separators (e.g. `1500000` -> `1.500.000`).
 *
 * The `value`/`onValueChange` pair always carries the raw digit string so
 * callers can keep using `Number(value)` for math and submission unchanged.
 */
function CurrencyInput({
  className,
  value,
  onValueChange,
  ...props
}: Omit<React.ComponentProps<'input'>, 'onChange' | 'value'> & {
  /** Raw numeric string (digits only), e.g. "1500000". May be empty. */
  value: string
  /** Called with the raw digit string on every change. */
  onValueChange: (rawDigits: string) => void
}) {
  const rawDigits = (value || '').replace(/[^\d]/g, '')
  const display = rawDigits ? idNumberFormatter.format(Number(rawDigits)) : ''

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value.replace(/[^\d]/g, '')
    onValueChange(next)
  }

  return (
    <InputPrimitive
      data-slot="currency-input"
      inputMode="numeric"
      className={cn(
        'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm tabular-nums dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
        className
      )}
      {...props}
      value={display}
      onChange={handleChange}
    />
  )
}

export { CurrencyInput }
