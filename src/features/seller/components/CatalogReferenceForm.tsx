import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import type { CatalogEntityConfig } from '../config/catalogEntityConfig'
import { toEntityCode, toEntitySlug } from '../config/catalogEntityConfig'

type FormValues = {
  name: string
  code: string
  slug: string
}

type CatalogReferenceFormProps = {
  config: CatalogEntityConfig
  mode: 'create' | 'edit'
  initialValues?: Partial<FormValues>
  isSubmitting?: boolean
  submitError?: string
  submitLabel: string
  cancelTo: string
  onSubmit: (payload: { name: string; code: string; slug?: string }) => Promise<void> | void
}

const emptyValues: FormValues = { name: '', code: '', slug: '' }

const CatalogReferenceForm = ({
  config,
  mode,
  initialValues = {},
  isSubmitting = false,
  submitError = '',
  submitLabel,
  cancelTo,
  onSubmit,
}: CatalogReferenceFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting: formSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      ...emptyValues,
      ...initialValues,
    },
  })

  const name = watch('name')
  const code = watch('code')
  const slug = watch('slug')

  const [codeTouched, setCodeTouched] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)

  // Auto-uppercase the code as the user types.
  useEffect(() => {
    const next = toEntityCode(code)
    if (next !== code) {
      setValue('code', next, { shouldDirty: true })
      if (codeTouched) {
        trigger('code')
      }
    }
  }, [code, codeTouched, setValue, trigger])

  // Auto-generate the slug from the name while editing (brand only).
  useEffect(() => {
    if (!config.hasSlug) return
    const next = toEntitySlug(name || '')
    if (next !== slug && !slugTouched) {
      setValue('slug', next, { shouldDirty: true })
    }
  }, [config.hasSlug, name, setValue, slug, slugTouched])

  const handleFormSubmit = (values: FormValues) => {
    const payload: { name: string; code: string; slug?: string } = {
      name: values.name.trim(),
      code: toEntityCode(values.code),
    }
    if (config.hasSlug) {
      payload.slug = toEntitySlug(values.slug)
    }
    return onSubmit(payload)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          {mode === 'create' ? `New ${config.labelSingular}` : `Edit ${config.labelSingular}`}
        </h1>
        <p className="mt-0.5 text-sm text-slate-600">
          {mode === 'create'
            ? `Add a new ${config.labelSingular.toLowerCase()} to the catalog.`
            : `Update ${config.labelSingular.toLowerCase()} details in the catalog.`}
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base font-bold text-slate-900">
                {config.labelSingular} Information
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Enter the details for this {config.labelSingular.toLowerCase()}.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-xs font-medium text-slate-700"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder={`${config.labelSingular} name`}
                    {...register('name', {
                      required: 'Name is required',
                      maxLength: { value: 100, message: 'Name must be 100 characters or fewer' },
                    })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="code"
                    className="mb-1.5 block text-xs font-medium text-slate-700"
                  >
                    Code
                  </label>
                  <input
                    id="code"
                    type="text"
                    placeholder={mode === 'create' ? 'e.g. NIK' : undefined}
                    {...register('code', {
                      required: 'Code is required',
                      onChange: (e) => {
                        setCodeTouched(true)
                        setValue('code', toEntityCode(e.target.value), {
                          shouldDirty: true,
                        })
                      },
                    })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm uppercase outline-none placeholder:normal-case placeholder:text-slate-400 focus:border-emerald-500"
                  />
                  {errors.code && (
                    <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>
                  )}
                  {!errors.code && (
                    <p className="mt-1 text-xs text-slate-500">
                      Short reference used in SKUs (max 16 characters).
                    </p>
                  )}
                </div>

                {config.hasSlug && (
                  <div>
                    <label
                      htmlFor="slug"
                      className="mb-1.5 block text-xs font-medium text-slate-700"
                    >
                      Slug
                    </label>
                    <input
                      id="slug"
                      type="text"
                      placeholder="brand-slug"
                      {...register('slug', {
                        required: 'Slug is required',
                        pattern: {
                          value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                          message: 'Slug must be lowercase alphanumeric with hyphens',
                        },
                        onBlur: () => setSlugTouched(true),
                      })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                    />
                    {errors.slug && (
                      <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>
                    )}
                    {!errors.slug && (
                      <p className="mt-1 text-xs text-slate-500">
                        Auto-generated from the name. Used in brand URLs and tags.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {config.hasSlug && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
                <h2 className="text-base font-bold text-slate-900">Preview</h2>
                <p className="mt-0.5 text-xs text-slate-600">
                  How this {config.labelSingular.toLowerCase()} will appear.
                </p>
                <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4">
                  <config.icon size={24} className="text-slate-400" />
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {name || 'Untitled'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Slug: {toEntitySlug(slug) || '—'}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {submitError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {submitError}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting || formSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
              >
                {isSubmitting || formSubmitting ? 'Processing...' : submitLabel}
              </button>
              <Link
                to={cancelTo}
                className="flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default CatalogReferenceForm