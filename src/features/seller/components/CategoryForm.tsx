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
  imageFiles: File[]
  existingImageUrls: string[]
}

type CategoryFormProps = {
  mode: 'create' | 'edit'
  resolver: Resolver<CategoryFormValues>
  initialValues: CategoryFormValues
  existingImageUrls?: string[]
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
  existingImageUrls = [],
  parentCategories,
  parentCategoriesLoading = false,
  onSubmit,
  submitLabel,
  cancelTo,
  isSubmitting = false,
  submitError = '',
  autoSlug = true,
}: CategoryFormProps) => {
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [imageError, setImageError] = useState('')
  const [editableExistingImages, setEditableExistingImages] = useState<string[]>(existingImageUrls)

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
    setEditableExistingImages(existingImageUrls)
  }, [existingImageUrls])

  useEffect(() => {
    if (!autoSlug) return
    const newSlug = toSlug(name || '')
    setValue('slug', newSlug)
  }, [autoSlug, name, setValue])

  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file))
    setImagePreviews(urls)
    setValue(
      'image',
      imageFiles.map((f) => f.name).join(','),
      { shouldValidate: true },
    )
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [imageFiles, setValue])

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
    if (imageFiles.length > 3) {
      setImageError('You can upload up to 3 images only.')
      return
    }
    await onSubmit({ values, imageFiles, existingImageUrls: editableExistingImages })
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
                    Images (max 3)
                  </label>
                  <input
                    id="image"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const incomingFiles = Array.from(e.target.files ?? [])
                      const merged = [...imageFiles, ...incomingFiles]
                      const uniqueByKey = merged.filter(
                        (file, index, arr) =>
                          arr.findIndex(
                            (item) =>
                              item.name === file.name &&
                              item.size === file.size &&
                              item.lastModified === file.lastModified,
                          ) === index,
                      )

                      if (uniqueByKey.length > 3) {
                        setImageError('You can upload up to 3 images only.')
                      } else {
                        setImageError('')
                      }

                      setImageFiles(uniqueByKey.slice(0, 3))
                      e.currentTarget.value = ''
                    }}
                    className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                  <input type="hidden" {...register('image')} />
                  {editableExistingImages.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-2 text-xs font-medium text-slate-600">Current images</p>
                      <div className="grid grid-cols-3 gap-2">
                        {editableExistingImages.map((url, index) => (
                          <div
                            key={`${url}-${index}`}
                            className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                          >
                            <img
                              src={url}
                              alt={`Current category image ${index + 1}`}
                              className="h-24 w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setEditableExistingImages((prev) =>
                                  prev.filter((_, imageIndex) => imageIndex !== index),
                                )
                              }
                              className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black/80"
                              aria-label="Remove existing image"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {imageError && (
                    <p className="mt-1 text-xs text-red-600">{imageError}</p>
                  )}
                  {imagePreviews.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {imagePreviews.map((preview, index) => (
                        <div
                          key={`${imageFiles[index]?.name ?? 'preview'}-${index}`}
                          className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                        >
                          <img
                            src={preview}
                            alt={imageFiles[index]?.name ?? `Image ${index + 1}`}
                            className="h-24 w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImageFiles((prev) =>
                                prev.filter((_, fileIndex) => fileIndex !== index),
                              )
                              setImageError('')
                            }}
                            className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black/80"
                            aria-label="Remove image"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
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
                      <option value="">None</option>
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