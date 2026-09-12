import { useEffect, useMemo, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { ChevronDown, X } from 'lucide-react'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'

export const promoCardFormSchema = z.object({
  position: z.enum(['TOP', 'BOTTOM'], { required_error: 'Position is required' }),
  isActive: z.enum(['true', 'false']),
  image: z.string().trim(),
})

export type PromoCardFormValues = z.infer<typeof promoCardFormSchema>

type PromoCardFormSubmitPayload = {
  values: PromoCardFormValues
  imageFile: File | null
}

type PromoCardFormProps = {
  mode: 'create' | 'edit'
  resolver: Resolver<PromoCardFormValues>
  initialValues: PromoCardFormValues
  existingImageUrl?: string | null
  onSubmit: (payload: PromoCardFormSubmitPayload) => Promise<void> | void
  submitLabel: string
  cancelTo: string
  isSubmitting?: boolean
  submitError?: string
}

const PromoCardForm = ({
  mode,
  resolver,
  initialValues,
  existingImageUrl = null,
  onSubmit,
  submitLabel,
  cancelTo,
  isSubmitting = false,
  submitError = '',
}: PromoCardFormProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageError, setImageError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PromoCardFormValues>({
    resolver,
    defaultValues: initialValues,
  })

  const isActive = watch('isActive')

  useEffect(() => {
    const preview = imageFile ? URL.createObjectURL(imageFile) : ''
    setImagePreview(preview)
    setValue('image', imageFile?.name ?? '', { shouldValidate: true })
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [imageFile, setValue])

  const title = useMemo(
    () => (mode === 'create' ? 'New Promo Banner' : 'Edit Promo Banner'),
    [mode],
  )
  const subtitle = useMemo(
    () =>
      mode === 'create'
        ? 'Add a new promo banner slot for the homepage.'
        : 'Update the promo banner details.',
    [mode],
  )

  const handleFormSubmit = async (values: PromoCardFormValues) => {
    await onSubmit({ values, imageFile })
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
                Promo Banner Image
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Recommended size: 800 x 800 pixels. Max 5MB.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="image"
                    className="mb-1.5 block text-xs font-medium text-slate-700"
                  >
                    Banner Image
                  </label>
                  <input
                    id="image"
                    type="file"
                    multiple={false}
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? [])
                      const file = files[0] ?? null

                      if (files.length > 1) {
                        setImageError('Only one image is allowed.')
                      } else {
                        setImageError('')
                      }

                      setImageFile(file)
                      e.currentTarget.value = ''
                    }}
                    className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                  <input type="hidden" {...register('image')} />
                  {imageError && (
                    <p className="mt-1 text-xs text-red-600">{imageError}</p>
                  )}

                  {mode === 'edit' && existingImageUrl && !imagePreview && (
                    <div className="mt-3">
                      <p className="mb-2 text-xs font-medium text-slate-600">Current image</p>
                      <div className="relative inline-block overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                        <img
                          src={productServiceAssetUrl(existingImageUrl)}
                          alt="Current promo banner"
                          className="h-32 w-auto object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {imagePreview && (
                    <div className="mt-3">
                      <p className="mb-2 text-xs font-medium text-slate-600">New image preview</p>
                      <div className="relative inline-block overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                        <img
                          src={imagePreview}
                          alt={imageFile?.name ?? 'Selected banner'}
                          className="h-32 w-auto object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null)
                            setImageError('')
                          }}
                          className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black/80"
                          aria-label="Remove selected image"
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
                    htmlFor="position"
                    className="mb-1.5 block text-xs font-medium text-slate-700"
                  >
                    Position
                  </label>
                  <div className="relative">
                    <select
                      id="position"
                      {...register('position')}
                      className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-emerald-500"
                    >
                      <option value="">Select position</option>
                      <option value="TOP">Top</option>
                      <option value="BOTTOM">Bottom</option>
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                  {errors.position && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.position.message}
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
                        setValue('isActive', e.target.value as PromoCardFormValues['isActive'])
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

export default PromoCardForm
