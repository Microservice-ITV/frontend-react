import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
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

export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional(),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug format is invalid'),
  categoryId: z.string().trim().min(1, 'Category is required').uuid('Category is required'),
  brandId: z.string().trim().min(1, 'Brand is required').uuid('Brand is required'),
  colorId: z.string().trim().min(1, 'Color is required').uuid('Color is required'),
  sizeId: z.string().trim().min(1, 'Size is required').uuid('Size is required'),
  price: z
    .string()
    .min(1, 'Price is required')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Price must be greater than 0'),
  stock: z
    .string()
    .min(1, 'Stock is required')
    .refine(
      (v) => !Number.isNaN(Number(v)) && Number(v) >= 0 && Number.isInteger(Number(v)),
      'Stock must be a whole number',
    ),
  shopId: z.string().trim().min(1, 'Shop context is missing'),
  images: z.string().trim(),
  isActive: z.enum(['true', 'false']),
})

export type ProductFormValues = z.infer<typeof productFormSchema>
type Option = { id: string; name: string }

type ProductFormProps = {
  mode: 'create' | 'edit'
  initialValues: ProductFormValues
  categoryOptions: Option[]
  brandOptions: Option[]
  colorOptions: Option[]
  sizeOptions: Option[]
  existingImageUrls?: string[]
  referencesLoading?: boolean
  referencesError?: string
  isSubmitting?: boolean
  submitError?: string
  submitLabel: string
  cancelTo: string
  disableSubmit?: boolean
  onSubmit: (payload: {
    values: ProductFormValues
    imageFiles: File[]
    existingImageUrls: string[]
  }) => Promise<void> | void
}

const EMPTY_IMAGE_URLS: string[] = []

const areStringArraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

const ProductForm = ({
  mode,
  initialValues,
  categoryOptions,
  brandOptions,
  colorOptions,
  sizeOptions,
  existingImageUrls = EMPTY_IMAGE_URLS,
  referencesLoading = false,
  referencesError = '',
  isSubmitting = false,
  submitError = '',
  submitLabel,
  cancelTo,
  disableSubmit = false,
  onSubmit,
}: ProductFormProps) => {
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [imageError, setImageError] = useState('')
  const [editableExistingImages, setEditableExistingImages] = useState<string[]>(existingImageUrls)
  const initialValuesKey = useMemo(() => JSON.stringify(initialValues), [initialValues])
  const existingImageUrlsKey = useMemo(
    () => JSON.stringify(existingImageUrls),
    [existingImageUrls],
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<ProductFormValues>({
    defaultValues: initialValues,
  })

  useEffect(() => {
    reset(initialValues)
  }, [initialValuesKey, initialValues, reset])

  useEffect(() => {
    setEditableExistingImages((prev) =>
      areStringArraysEqual(prev, existingImageUrls) ? prev : existingImageUrls,
    )
  }, [existingImageUrlsKey, existingImageUrls])

  const [categoryId, brandId, colorId, sizeId, isActive, name] = watch([
    'categoryId',
    'brandId',
    'colorId',
    'sizeId',
    'isActive',
    'name',
  ])

  useEffect(() => {
    const newSlug = toSlug(name || '')
    setValue('slug', newSlug)
  }, [name, setValue])

  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file))
    setImagePreviews(urls)
    const existingImageNames = editableExistingImages.map((url) => {
      const parts = url.split('/')
      return parts[parts.length - 1] ?? url
    })
    setValue('images', [...existingImageNames, ...imageFiles.map((f) => f.name)].join(','), {
      shouldValidate: true,
    })
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [editableExistingImages, imageFiles, setValue])

  const title = useMemo(
    () => (mode === 'create' ? 'New Product' : 'Edit Product'),
    [mode],
  )

  const subtitle = useMemo(
    () =>
      mode === 'create'
        ? 'Add a new product to the catalog.'
        : 'Update product information in the catalog.',
    [mode],
  )

  const handleFormSubmit = async (values: ProductFormValues) => {
    await onSubmit({
      values,
      imageFiles,
      existingImageUrls: imageFiles.length > 0 ? [] : editableExistingImages,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <input type="hidden" {...register('shopId')} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base font-bold text-slate-900">Product Information</h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Enter the basic details for this product.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-slate-700">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Product name"
                    {...register('name')}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                </div>

                <div>
                  <label htmlFor="slug" className="mb-1.5 block text-xs font-medium text-slate-700">
                    Slug
                  </label>
                  <input
                    id="slug"
                    type="text"
                    placeholder="product-slug"
                    {...register('slug')}
                    readOnly
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  />
                  {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="price" className="mb-1.5 block text-xs font-medium text-slate-700">
                      Price ($)
                    </label>
                    <input
                      id="price"
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      {...register('price')}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                    />
                    {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="stock" className="mb-1.5 block text-xs font-medium text-slate-700">
                      Stock
                    </label>
                    <input
                      id="stock"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      {...register('stock')}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                    />
                    {errors.stock && <p className="mt-1 text-xs text-red-600">{errors.stock.message}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="images" className="mb-1.5 block text-xs font-medium text-slate-700">
                    Images (max 3)
                  </label>
                  <input
                    id="images"
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
                      if (incomingFiles.length > 0) {
                        setEditableExistingImages([])
                      }
                      setImageFiles(uniqueByKey.slice(0, 3))
                      e.currentTarget.value = ''
                    }}
                    className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                  {imageError && <p className="mt-1 text-xs text-red-600">{imageError}</p>}
                  {editableExistingImages.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-2 text-xs font-medium text-slate-600">Current images</p>
                      <div className="grid grid-cols-3 gap-2">
                        {editableExistingImages.map((imageUrl, index) => (
                          <div
                            key={`${imageUrl}-${index}`}
                            className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                          >
                            <img
                              src={imageUrl}
                              alt={`Current product image ${index + 1}`}
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
                              setImageFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))
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
                  <label htmlFor="description" className="mb-1.5 block text-xs font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    placeholder="Product description"
                    {...register('description')}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base font-bold text-slate-900">Organization</h2>
              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="categoryId" className="mb-1.5 block text-xs font-medium text-slate-700">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      id="categoryId"
                      {...register('categoryId')}
                      value={categoryId}
                      onChange={(e) => setValue('categoryId', e.target.value)}
                      className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-emerald-500"
                    >
                      <option value="">Select category</option>
                      {categoryOptions.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  {errors.categoryId && <p className="mt-1 text-xs text-red-600">{errors.categoryId.message}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="brandId" className="mb-1.5 block text-xs font-medium text-slate-700">
                      Brand
                    </label>
                    <div className="relative">
                      <select
                        id="brandId"
                        {...register('brandId')}
                        value={brandId}
                        onChange={(e) => setValue('brandId', e.target.value)}
                        className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-emerald-500"
                      >
                        <option value="">Select brand</option>
                        {brandOptions.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                    {errors.brandId && <p className="mt-1 text-xs text-red-600">{errors.brandId.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="colorId" className="mb-1.5 block text-xs font-medium text-slate-700">
                      Color
                    </label>
                    <div className="relative">
                      <select
                        id="colorId"
                        {...register('colorId')}
                        value={colorId}
                        onChange={(e) => setValue('colorId', e.target.value)}
                        className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-emerald-500"
                      >
                        <option value="">Select color</option>
                        {colorOptions.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                    {errors.colorId && <p className="mt-1 text-xs text-red-600">{errors.colorId.message}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="sizeId" className="mb-1.5 block text-xs font-medium text-slate-700">
                    Size
                  </label>
                  <div className="relative">
                    <select
                      id="sizeId"
                      {...register('sizeId')}
                      value={sizeId}
                      onChange={(e) => setValue('sizeId', e.target.value)}
                      className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-emerald-500"
                    >
                      <option value="">Select size</option>
                      {sizeOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  {errors.sizeId && <p className="mt-1 text-xs text-red-600">{errors.sizeId.message}</p>}
                </div>

                <div>
                  <label htmlFor="isActive" className="mb-1.5 block text-xs font-medium text-slate-700">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      id="isActive"
                      {...register('isActive')}
                      value={isActive}
                      onChange={(e) => setValue('isActive', e.target.value as ProductFormValues['isActive'])}
                      className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-emerald-500"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {referencesLoading && <p className="text-xs text-slate-500">Loading reference data...</p>}
                {referencesError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                    {referencesError}
                  </p>
                )}
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
                disabled={isSubmitting || disableSubmit}
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

export default ProductForm