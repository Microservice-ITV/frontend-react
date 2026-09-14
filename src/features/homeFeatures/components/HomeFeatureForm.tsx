import { useEffect, useMemo, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { ChevronDown, X } from 'lucide-react'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'

const toSlug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const homeFeatureFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  slug: z.string().trim().min(1, 'Slug is required'),
  sortOrder: z.string().refine(
    (value) => {
      const num = Number(value)
      return value.trim() !== '' && Number.isInteger(num) && num >= 1
    },
    'Sort order must be 1 or greater',
  ),
  isActive: z.enum(['true', 'false']),
  startAt: z.string(),
  endAt: z.string(),
  icon: z.string().trim(),
})

export type HomeFeatureFormValues = z.infer<typeof homeFeatureFormSchema>

type HomeFeatureFormSubmitPayload = {
  values: HomeFeatureFormValues
  iconFile: File | null
  existingIconUrl: string | null
}

type HomeFeatureFormProps = {
  mode: 'create' | 'edit'
  resolver: Resolver<HomeFeatureFormValues>
  initialValues: HomeFeatureFormValues
  existingIconUrl?: string | null
  onSubmit: (payload: HomeFeatureFormSubmitPayload) => Promise<void> | void
  submitLabel: string
  cancelTo: string
  isSubmitting?: boolean
  submitError?: string
  autoSlug?: boolean
}

const HomeFeatureForm = ({
  mode,
  resolver,
  initialValues,
  existingIconUrl = null,
  onSubmit,
  submitLabel,
  cancelTo,
  isSubmitting = false,
  submitError = '',
  autoSlug = true,
}: HomeFeatureFormProps) => {
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [iconPreview, setIconPreview] = useState<string>('')
  const [iconError, setIconError] = useState('')
  const [editableExistingIcon, setEditableExistingIcon] = useState<string | null>(existingIconUrl)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<HomeFeatureFormValues>({
    resolver,
    defaultValues: initialValues,
  })

  const name = watch('name')
  const isActive = watch('isActive')

  useEffect(() => {
    setEditableExistingIcon(existingIconUrl)
  }, [existingIconUrl])

  useEffect(() => {
    if (!autoSlug) return
    const newSlug = toSlug(name || '')
    setValue('slug', newSlug)
  }, [autoSlug, name, setValue])

  useEffect(() => {
    const preview = iconFile ? URL.createObjectURL(iconFile) : ''
    setIconPreview(preview)
    setValue('icon', iconFile?.name ?? '', { shouldValidate: true })
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [iconFile, setValue])

  const title = useMemo(
    () => (mode === 'create' ? 'New Home Feature' : 'Edit Home Feature'),
    [mode],
  )
  const subtitle = useMemo(
    () =>
      mode === 'create'
        ? 'Add a new shortcut feature for the homepage.'
        : 'Update the homepage feature details.',
    [mode],
  )

  const handleFormSubmit = async (values: HomeFeatureFormValues) => {
    await onSubmit({ values, iconFile, existingIconUrl: editableExistingIcon })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base font-bold text-slate-900">
                Home Feature Information
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Enter the details for the home feature.
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
                    placeholder="Feature name"
                    {...register('name')}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

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
                    readOnly
                    placeholder="feature-slug"
                    {...register('slug')}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  />
                  {errors.slug && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.slug.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="icon"
                    className="mb-1.5 block text-xs font-medium text-slate-700"
                  >
                    Icon Image
                  </label>
                  <input
                    id="icon"
                    type="file"
                    multiple={false}
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? [])
                      const file = files[0] ?? null

                      if (files.length > 1) {
                        setIconError('Only one image is allowed.')
                      } else {
                        setIconError('')
                      }

                      // Edit behavior: new selection replaces existing icon.
                      if (file) {
                        setEditableExistingIcon(null)
                      }

                      setIconFile(file)
                      e.currentTarget.value = ''
                    }}
                    className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                  <input type="hidden" {...register('icon')} />
                  {editableExistingIcon && (
                    <div className="mt-3">
                      <p className="mb-2 text-xs font-medium text-slate-600">Current icon</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                          <img
                            src={productServiceAssetUrl(editableExistingIcon)}
                            alt="Current home feature icon"
                            className="h-24 w-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => setEditableExistingIcon(null)}
                            className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black/80"
                            aria-label="Remove existing icon"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {iconError && (
                    <p className="mt-1 text-xs text-red-600">{iconError}</p>
                  )}
                  {iconPreview && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                        <img
                          src={iconPreview}
                          alt={iconFile?.name ?? 'Selected icon'}
                          className="h-24 w-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIconFile(null)
                            setIconError('')
                          }}
                          className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black/80"
                          aria-label="Remove selected icon"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base font-bold text-slate-900">
                Configuration
              </h2>

              <div className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="sortOrder"
                    className="mb-1.5 block text-xs font-medium text-slate-700"
                  >
                    Sort Order
                  </label>
                  <input
                    id="sortOrder"
                    type="number"
                    min={1}
                    placeholder="1"
                    {...register('sortOrder')}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  />
                  {errors.sortOrder && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.sortOrder.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="isActive"
                    className="mb-1.5 block text-xs font-medium text-slate-700"
                  >
                    Status
                  </label>
                  <div className="relative">
                    <select
                      id="isActive"
                      {...register('isActive')}
                      value={isActive}
                      onChange={(e) =>
                        setValue('isActive', e.target.value as HomeFeatureFormValues['isActive'])
                      }
                      className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-emerald-500"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="startAt"
                    className="mb-1.5 block text-xs font-medium text-slate-700"
                  >
                    Start At
                  </label>
                  <input
                    id="startAt"
                    type="datetime-local"
                    {...register('startAt')}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="endAt"
                    className="mb-1.5 block text-xs font-medium text-slate-700"
                  >
                    End At
                  </label>
                  <input
                    id="endAt"
                    type="datetime-local"
                    {...register('endAt')}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {submitError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {submitError}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
              >
                {isSubmitting ? 'Processing...' : submitLabel}
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

export default HomeFeatureForm