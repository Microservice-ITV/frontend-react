import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, X } from 'lucide-react'

const shopIdDefault = 'mock-shop-id'
const nowIso = new Date().toISOString()

const toSlug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const productFormSchema = z.object({
  // product fields
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim(),
  price: z
    .string()
    .min(1, 'Price is required')
    .refine(
      (v) => !Number.isNaN(Number(v)) && Number(v) >= 0,
      'Price must be a valid number',
    ),
  // SKU is required by DB in your schema, but we will auto-fill it from slug.
  sku: z.string().trim().min(1, 'SKU is required'),
  stock: z
    .string()
    .min(1, 'Stock is required')
    .refine(
      (v) =>
        !Number.isNaN(Number(v)) &&
        Number(v) >= 0 &&
        Number.isInteger(Number(v)),
      'Stock must be a whole number',
    ),
  slug: z.string().trim().min(1, 'Slug is required'),

  // relations
  categoryId: z.string().min(1, 'Category is required'),

  // storage fields
  images: z.string().trim(),

  // system fields
  isActive: z.enum(['true', 'false']),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
  shopId: z.string().trim().min(1),
})

type ProductFormValues = z.infer<typeof productFormSchema>

// TODO: Replace with real data from API.
const MOCK_CATEGORIES = [
  { id: 'cat-1', name: 'Modules' },
  { id: 'cat-2', name: 'Templates' },
  { id: 'cat-3', name: 'Plans' },
  { id: 'cat-4', name: 'Licenses' },
  { id: 'cat-5', name: 'Pet Supplies' },
  { id: 'cat-6', name: 'Sports' },
  { id: 'cat-7', name: 'Gaming' },
]

const NewProductPage = () => {
  const navigate = useNavigate()

  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [imageError, setImageError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      sku: '',
      stock: '',
      categoryId: '',
      images: '',
      slug: '',
      isActive: 'false',
      createdAt: nowIso,
      updatedAt: nowIso,
      shopId: shopIdDefault,
    },
  })

  const categoryId = watch('categoryId')
  const isActive = watch('isActive')
  const name = watch('name')

  useEffect(() => {
    const newSlug = toSlug(name || '')
    if (newSlug) {
      // Auto-generate slug and SKU from the product name.
      setValue('slug', newSlug, { shouldValidate: true })
      setValue('sku', newSlug, { shouldValidate: false })
    } else {
      setValue('slug', '')
      setValue('sku', '')
    }
  }, [name, setValue])

  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file))
    setImagePreviews(urls)
    setValue(
      'images',
      imageFiles.map((f) => f.name).join(','),
      { shouldValidate: true },
    )
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [imageFiles, setValue])

  const onSubmit = (data: ProductFormValues) => {
    // TODO: Call API to create product
    const payload = {
      ...data,
      isActive: data.isActive === 'true',
      // For now we store filenames into `images` (string). Replace with real upload (FormData) when wiring API.
      imageFiles,
    }
    console.log('Create product:', payload)
    navigate('/seller/products')
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="text-xs text-slate-500">
        <Link to="/seller/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <Link to="/seller/products" className="hover:text-slate-700">
          Products
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">New Product</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">New Product</h1>
        <p className="mt-0.5 text-sm text-slate-600">
          Add a new product to the catalog.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* shopId is required by DB but hidden in the UI */}
        <input type="hidden" {...register('shopId')} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column: Product Information */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base font-bold text-slate-900">
                Product Information
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Enter the basic details for the new product.
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
                    placeholder="Product name"
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
                    placeholder="product-slug"
                    {...register('slug')}
                    readOnly
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  />
                  {errors.slug && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.slug.message}
                    </p>
                  )}
                </div>

                {/* SKU is DB-required but hidden (auto-filled from slug). */}
                <input type="hidden" {...register('sku')} />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="price"
                      className="mb-1.5 block text-xs font-medium text-slate-700"
                    >
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
                    {errors.price && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.price.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="stock"
                      className="mb-1.5 block text-xs font-medium text-slate-700"
                    >
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
                    {errors.stock && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.stock.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="images"
                    className="mb-1.5 block text-xs font-medium text-slate-700"
                  >
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

                      setImageFiles(uniqueByKey.slice(0, 3))
                      e.currentTarget.value = ''
                    }}
                    className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
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
                    placeholder="Product description"
                    {...register('description')}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Organization & Actions */}
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base font-bold text-slate-900">
                Organization
              </h2>

              <div className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="categoryId"
                    className="mb-1.5 block text-xs font-medium text-slate-700"
                  >
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
                      {MOCK_CATEGORIES.map((cat) => (
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
                  {errors.categoryId && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.categoryId.message}
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
                        setValue('isActive', e.target.value as ProductFormValues['isActive'])
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* createdAt/updatedAt are DB/system fields, keep them hidden */}
                  <input type="hidden" {...register('createdAt')} />
                  <input type="hidden" {...register('updatedAt')} />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Create Product
              </button>
              <Link
                to="/seller/products"
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

export default NewProductPage