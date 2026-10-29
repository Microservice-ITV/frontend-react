import { useState, type ReactNode } from 'react'
import {
  dangerButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
  sectionClass,
} from './FormField'

export type EmployeeStyleFormOptions = {
  title: string
  content: ReactNode
  primaryLabel: string
  primaryVariant?: 'default' | 'success' | 'danger'
  onPrimary: () => void | Promise<void>
}

type EmployeeStyleFormPageProps = EmployeeStyleFormOptions & {
  onCancel: () => void
  onComplete: () => void
}

const EmployeeStyleFormPage = ({
  title,
  content,
  primaryLabel,
  primaryVariant,
  onPrimary,
  onCancel,
  onComplete,
}: EmployeeStyleFormPageProps) => {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = title.startsWith('Edit ')

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await onPrimary()
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <nav className="text-xs text-slate-500">
        <span>Management</span>
        <span className="mx-1">/</span>
        <span className="text-slate-700">{isEdit ? 'Edit' : 'New'}</span>
      </nav>

      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">
          {isEdit
            ? 'Update the details below.'
            : title.startsWith('New ')
              ? 'Create a new record.'
              : 'Complete the details below to continue.'}
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <section className={sectionClass}>{content}</section>

        <div className="flex items-center justify-end gap-3">
          <button type="button" className={secondaryButtonClass} onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button
            type="submit"
            className={primaryVariant === 'danger' ? dangerButtonClass : primaryButtonClass}
            disabled={submitting}
          >
            {submitting ? 'Saving…' : primaryLabel}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EmployeeStyleFormPage
