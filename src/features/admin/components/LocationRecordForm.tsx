import { Link } from 'react-router-dom'
import SearchableSelect from '@/components/ui/SearchableSelect'

export type LocationParentField = {
  id: string
  label: string
  value: string
  placeholder: string
  emptyLabel: string
  options: { value: string; label: string }[]
  disabled?: boolean
  onChange: (value: string) => void
}

type LocationRecordFormProps = {
  title: string
  description: string
  listLabel: string
  listTo: string
  fields: LocationParentField[]
  name: string
  nameLabel: string
  onNameChange: (value: string) => void
  onSubmit: () => Promise<void>
  submitLabel: string
  cancelTo: string
  loading?: boolean
  missingMessage?: string | null
  error?: string | null
  submitting?: boolean
}

const LocationRecordForm = ({
  title,
  description,
  listLabel,
  listTo,
  fields,
  name,
  nameLabel,
  onNameChange,
  onSubmit,
  submitLabel,
  cancelTo,
  loading = false,
  missingMessage = null,
  error = null,
  submitting = false,
}: LocationRecordFormProps) => (
  <div className="space-y-6">
    <nav className="text-xs text-slate-500">
      <Link to="/super-admin/overview" className="hover:text-slate-700">
        Dashboard
      </Link>
      <span className="mx-1">/</span>
      <Link to={listTo} className="hover:text-slate-700">
        {listLabel}
      </Link>
      <span className="mx-1">/</span>
      <span className="text-slate-900">{title}</span>
    </nav>

    <div>
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      <p className="mt-0.5 text-sm text-slate-600">{description}</p>
    </div>

    {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

    {loading ? (
      <p className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
        Loading...
      </p>
    ) : missingMessage ? (
      <p className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
        {missingMessage}
      </p>
    ) : (
      <form
        className="max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-6"
        onSubmit={(event) => {
          event.preventDefault()
          void onSubmit()
        }}
      >
        {fields.map((field) => (
          <label key={field.id} className="block text-sm font-medium text-slate-700">
            {field.label}
            <div className="mt-1.5">
              <SearchableSelect
                id={field.id}
                placeholder={field.placeholder}
                emptyLabel={field.emptyLabel}
                options={field.options}
                value={field.value}
                disabled={field.disabled}
                onChange={field.onChange}
              />
            </div>
          </label>
        ))}
        <label className="block text-sm font-medium text-slate-700">
          {nameLabel}
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
            placeholder={nameLabel}
          />
        </label>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Link
            to={cancelTo}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : submitLabel}
          </button>
        </div>
      </form>
    )}
  </div>
)

export default LocationRecordForm
