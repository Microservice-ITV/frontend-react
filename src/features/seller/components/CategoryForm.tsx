import { useEffect, useMemo, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { ChevronDown, X } from 'lucide-react'

const toSlug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim(),
  slug: z.string().trim().min(1, 'Slug is required'),
  parentId: z.string().optional(),
  isActive: z.enum(['true', 'false']),
  image: z.string().trim(),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

type CategoryFormSubmitPayload = {
  values: CategoryFormValues
  imageFile: File | null
  existingImageUrl: string | null
}

type CategoryFormProps = {
  mode: 'create' | 'edit'
  resolver: Resolver<CategoryFormValues>
  initialValues: CategoryFormValues
  existingImageUrl?: string | null
  parentCategories: Array<{ id: string; name: string }>
  parentCategoriesLoading?: boolean
  onSubmit: (payload: CategoryFormSubmitPayload) => Promise<void> | void
  submitLabel: string
  cancelTo: string
  isSubmitting?: boolean
  submitError?: string
  autoSlug?: boolean
}

const CategoryForm = ({
  mode,
  resolver,
  initialValues,
  existingImageUrl = null,
  parentCategories,
  parentCategoriesLoading = false,
  onSubmit,
  submitLabel,
  cancelTo,
  isSubmitting = false,
  submitError = '',
  autoSlug = true,
}: CategoryFormProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageError, setImageError] = useState('')
  const [editableExistingImage, setEditableExistingImage] = useState<string | null>(existingImageUrl)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CategoryFormValues>({
    resolver,
    defaultValues: initialValues,
  })

  const name = watch('name')
  const parentId = watch('parentId')
  const isActive = watch('isActive')

  useEffect(() => {
    setEditableExistingImage(existingImageUrl)
  }, [existingImageUrl])

  useEffect(() => {
    if (!autoSlug) return
    const newSlug = toSlug(name || '')
    setValue('slug', newSlug)
  }, [autoSlug, name, setValue])

  useEffect(() => {
    const preview = imageFile ? URL.createObjectURL(imageFile) : ''
    setImagePreview(preview)
    setValue('image', imageFile?.name ?? '', { shouldValidate: true })
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [imageFile, setValue])

  const title = useMemo(
    () => (mode === 'create' ? 'New Category' : 'Edit Category'),
    [mode],
  )
  const subtitle = useMemo(
    () =>
      mode === 'create'
        ? 'Add a new category to the catalog.'
        : 'Update category details in the catalog.',
    [mode],
  )

  const handleFormSubmit = async (values: CategoryFormValues) => {
    await onSubmit({ values, imageFile, existingImageUrl: editableExistingImage })
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
                Category Information
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Enter the details for the category.
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
                    placeholder="Category name"
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
                    placeholder="category-slug"
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
                    htmlFor="image"
                    className="mb-1.5 block text-xs font-medium text-slate-700"
                  >
                    Image
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

                      // Edit behavior: new selection replaces existing image.
                      if (file) {
                        setEditableExistingImage(null)
                      }

                      setImageFile(file)
                      e.currentTarget.value = ''
                    }}
                    className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                  <input type="hidden" {...register('image')} />
                  {editableExistingImage && (
                    <div className="mt-3">
                      <p className="mb-2 text-xs font-medium text-slate-600">Current image</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                          <img
                            src={editableExistingImage}
                            alt="Current category image"
                            className="h-24 w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setEditableExistingImage(null)}
                            className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black/80"
                            aria-label="Remove existing image"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {imageError && (
                    <p className="mt-1 text-xs text-red-600">{imageError}</p>
                  )}
                  {imagePreview && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                        <img
                          src={imagePreview}
                          alt={imageFile?.name ?? 'Selected image'}
                          className="h-24 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null)
                            setImageError('')
                          }}
                          className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black/80"
                          aria-label="Remove image"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-1.5 block text-xs font-medium text-slate-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    placeholder="Category description"
                    {...register('description')}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base font-bold text-slate-900">
                Organization
              </h2>

              <div className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="parentId"
                    className="mb-1.5 block text-xs font-medium text-slate-700"
                  >
                    Parent Category
                  </label>
                  <div className="relative">
                    <select
                      id="parentId"
                      {...register('parentId')}
                      value={parentId}
                      onChange={(e) => setValue('parentId', e.target.value)}
                      className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-emerald-500"
                    >
                      <option value="">None (Top-level category)</option>
                      {parentCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                  {parentCategoriesLoading && (
                    <p className="mt-1 text-xs text-slate-500">Loading categories...</p>
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
                        setValue('isActive', e.target.value as CategoryFormValues['isActive'])
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
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
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

export default CategoryForm