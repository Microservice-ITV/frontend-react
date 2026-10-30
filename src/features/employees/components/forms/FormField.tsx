import type { ReactNode } from 'react'
import clsx from 'clsx'

export const textInputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[var(--dni-primary)] focus:ring-1 focus:ring-[var(--dni-primary)] disabled:cursor-not-allowed disabled:bg-slate-50'

export const invalidTextInputClass =
  'border-rose-300 focus:border-rose-400 focus:ring-rose-300'

export const primaryButtonClass =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[var(--dni-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--dni-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50'

export const secondaryButtonClass =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'

export const dangerButtonClass =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50'

export const labelClass = 'block text-xs font-medium text-slate-600'
export const sectionClass = 'rounded-xl border border-slate-200 bg-white p-4 sm:p-5'

type FormFieldProps = {
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: ReactNode
  className?: string
}

export const FormField = ({
  label,
  required = false,
  hint,
  error,
  children,
  className,
}: FormFieldProps) => (
  <div className={clsx('space-y-1', className)}>
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {required && <span className="ml-0.5 text-rose-500">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    {error && <p className="text-xs text-rose-600">{error}</p>}
  </div>
)