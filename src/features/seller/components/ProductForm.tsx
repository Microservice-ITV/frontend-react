import { useEffect, useMemo, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { ChevronDown, Plus, Trash2, X } from 'lucide-react'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import {
  sanitizeIntegerInput,
  sanitizeMoneyInput,
  sanitizePercentInput,
} from '@/utils/decimalInput'
import {
  computeEffectiveSellingPrice,
  computeListPrice,
  parseOptionalPercent,
} from '@/utils/variantPricing'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'

const toSlug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

/** Matches product-service `priceField` / `optionalPercent`: parseFloat, positive base, percent ranges. */
const basePriceField = z
  .string()
  .trim()
  .min(1, 'Base price is required')
  .transform((s) => s.replace(/\.+$/, ''))
  .refine((s) => /^\d+(\.\d{1,2})?$/.test(s), 'Use numbers only, up to 2 decimal places')
  .refine((s) => parseFloat(s) > 0, 'Base price must be greater than 0')

const optionalPercentField = (label: string, max: number) =>
  z
    .string()
    .trim()
    .transform((s) => s.replace(/\.+$/, ''))
    .refine(
      (s) => s === '' || /^\d+(\.\d{1,4})?$/.test(s),
      `${label}: numbers only (decimals allowed, e.g. 0.5)`,
    )
    .refine(
      (s) => s === '' || (parseFloat(s) >= 0 && parseFloat(s) <= max),
      `${label} must be between 0 and ${max}`,
    )

const variantRowSchema = z.object({
  /** Set when editing an existing product variant (PATCH body `variants[].id`). */
  serverVariantId: z
    .union([z.string().uuid(), z.literal('')])
    .optional()
    .transform((v) => (v === '' || v === undefined ? undefined : v)),
  colorId: z.string().trim().min(1, 'Color is required').uuid('Color is required'),
  sizeId: z.string().trim().min(1, 'Size is required').uuid('Size is required'),
  basePrice: basePriceField,
  profitThresholdPercent: optionalPercentField('Markup %', 10000),
  discountPercent: optionalPercentField('Discount %', 100),
  stock: z
    .string()
    .trim()
    .min(1, 'Stock is required')
    .refine((v) => /^\d+$/.test(v), 'Stock must be a whole number')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0 && Number.isInteger(Number(v)), 'Invalid stock'),
})

export const productFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    description: z.string().trim().optional(),
    slug: z
      .string()
      .trim()
      .min(1, 'Slug is required')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug format is invalid'),
    categoryId: z.string().trim().min(1, 'Category is required').uuid('Category is required'),
    brandId: z.string().trim().min(1, 'Brand is required').uuid('Brand is required'),
    primaryVariantIndex: z.number().int().min(0),
    variants: z.array(variantRowSchema).min(1, 'Add at least one variant'),
    shopId: z.string().trim().min(1, 'Shop context is missing'),
    images: z.string().trim(),
    isActive: z.enum(['true', 'false']),
  })
  .superRefine((data, ctx) => {
    const pairs = new Set<string>()
    data.variants.forEach((row, index) => {
      const k = `${row.colorId}:${row.sizeId}`
      if (pairs.has(k)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Duplicate color and size combination',
          path: ['variants', index, 'sizeId'],
        })
      }
      pairs.add(k)
    })
    if (data.primaryVariantIndex >= data.variants.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select a primary variant',
        path: ['primaryVariantIndex'],
      })
    }
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

export const defaultVariantRow = (): ProductFormValues['variants'][number] => ({
  serverVariantId: undefined,
  colorId: '',
  sizeId: '',
  basePrice: '',
  profitThresholdPercent: '0',
  discountPercent: '0',
  stock: '',
})

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
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialValues,
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'variants' })

  useEffect(() => {
    reset(initialValues)
  }, [initialValuesKey, initialValues, reset])

  useEffect(() => {
    setEditableExistingImages((prev) =>
      areStringArraysEqual(prev, existingImageUrls) ? prev : existingImageUrls,
    )
  }, [existingImageUrlsKey, existingImageUrls])

  const [isActive, name, variantsWatched, primaryVariantIndex] = watch([
    'isActive',
    'name',
    'variants',
    'primaryVariantIndex',
  ])

  // Slug is read-only; keep it in sync with the name on both create and edit.
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

  const removeVariantAt = (index: number) => {
    const nextLen = fields.length - 1
    remove(index)
    if (nextLen <= 0) return
    const currentPrimary = primaryVariantIndex ?? 0
    if (index === currentPrimary) {
      setValue('primaryVariantIndex', 0)
    } else if (index < currentPrimary) {
      setValue('primaryVariantIndex', Math.max(0, currentPrimary - 1))
    }
  }

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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          <div>
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
                              src={productServiceAssetUrl(imageUrl)}
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
              <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                <p className="font-medium text-slate-800">How pricing works (each variant)</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-4 text-slate-600 marker:text-slate-400">
                  <li>
                    <span className="font-medium text-slate-700">List price</span> — your base price plus
                    markup (shown before any sale).
                  </li>
                  <li>
                    <span className="font-medium text-slate-700">Customer price</span> — list price minus
                    discount; this is what the buyer pays per unit.
                  </li>
                </ul>
                <p className="mt-2 border-t border-slate-200/80 pt-2 text-slate-500">
                  You only enter base, markup, and discount here. The customer price is calculated when you
                  save.
                </p>
                <p className="mt-2 text-slate-500">
                  Markup and discount accept decimals (e.g. <span className="font-mono text-slate-600">0.5</span>{' '}
                  for half a percent), matching the product API. Base price uses up to two decimal places.
                </p>
              </div>
              <div className="mt-6 space-y-4">
                <div>
                  <p className="mb-1.5 block text-xs font-medium text-slate-700">Category</p>
                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        id="categoryId"
                        value={field.value}
                        onChange={(v) => field.onChange(v)}
                        onBlur={field.onBlur}
                        options={categoryOptions.map((cat) => ({
                          value: cat.id,
                          label: cat.name,
                        }))}
                        mode="search-and-scroll"
                        emptyLabel="Select category"
                        placeholder="Search categories…"
                        aria-invalid={!!errors.categoryId}
                      />
                    )}
                  />
                  {errors.categoryId && <p className="mt-1 text-xs text-red-600">{errors.categoryId.message}</p>}
                </div>

                <div>
                  <p className="mb-1.5 block text-xs font-medium text-slate-700">Brand</p>
                  <Controller
                    name="brandId"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        id="brandId"
                        value={field.value}
                        onChange={(v) => field.onChange(v)}
                        onBlur={field.onBlur}
                        options={brandOptions.map((item) => ({
                          value: item.id,
                          label: item.name,
                        }))}
                        mode="search-and-scroll"
                        emptyLabel="Select brand"
                        placeholder="Search brands…"
                        aria-invalid={!!errors.brandId}
                      />
                    )}
                  />
                  {errors.brandId && <p className="mt-1 text-xs text-red-600">{errors.brandId.message}</p>}
                </div>

                <div>
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-medium text-slate-700">Variants (color × size)</p>
                    <button
                      type="button"
                      onClick={() => {
                        append(defaultVariantRow())
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <Plus size={14} />
                      Add variant
                    </button>
                  </div>

                  <div className="space-y-4">
                    {fields.map((field, index) => {
                      const row = variantsWatched?.[index]
                      const base = row?.basePrice ? Number(row.basePrice) : NaN
                      const markup = parseOptionalPercent(row?.profitThresholdPercent ?? '')
                      const disc = parseOptionalPercent(row?.discountPercent ?? '')
                      const listOk = !Number.isNaN(base) && base > 0
                      const listPrice = listOk ? computeListPrice(base, markup) : null
                      const effective = listOk
                        ? computeEffectiveSellingPrice(base, markup, disc)
                        : null

                      return (
                        <div
                          key={field.id}
                          className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 sm:p-4"
                        >
                          <input type="hidden" {...register(`variants.${index}.serverVariantId`)} />
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-800">
                              <input
                                type="radio"
                                name="primaryVariant"
                                checked={primaryVariantIndex === index}
                                onChange={() => setValue('primaryVariantIndex', index, { shouldValidate: true })}
                                className="h-4 w-4 accent-emerald-600"
                              />
                              Primary variant (catalog price / SKU display)
                            </label>
                            <button
                              type="button"
                              disabled={fields.length <= 1}
                              onClick={() => removeVariantAt(index)}
                              className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                              title={fields.length <= 1 ? 'At least one variant is required' : 'Remove variant'}
                            >
                              <Trash2 size={14} />
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <p className="mb-1 block text-xs font-medium text-slate-700">Color</p>
                              <Controller
                                name={`variants.${index}.colorId`}
                                control={control}
                                render={({ field: f }) => (
                                  <SearchableSelect
                                    value={f.value}
                                    onChange={f.onChange}
                                    onBlur={f.onBlur}
                                    options={colorOptions.map((item) => ({
                                      value: item.id,
                                      label: item.name,
                                    }))}
                                    mode="scroll-only"
                                    emptyLabel="Select color"
                                    aria-invalid={!!errors.variants?.[index]?.colorId}
                                  />
                                )}
                              />
                              {errors.variants?.[index]?.colorId && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errors.variants[index]?.colorId?.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="mb-1 block text-xs font-medium text-slate-700">Size</p>
                              <Controller
                                name={`variants.${index}.sizeId`}
                                control={control}
                                render={({ field: f }) => (
                                  <SearchableSelect
                                    value={f.value}
                                    onChange={f.onChange}
                                    onBlur={f.onBlur}
                                    options={sizeOptions.map((item) => ({
                                      value: item.id,
                                      label: item.name,
                                    }))}
                                    mode="scroll-only"
                                    emptyLabel="Select size"
                                    aria-invalid={!!errors.variants?.[index]?.sizeId}
                                  />
                                )}
                              />
                              {errors.variants?.[index]?.sizeId && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errors.variants[index]?.sizeId?.message}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="min-w-0">
                              <label
                                className="mb-1 block text-xs font-medium text-slate-700"
                                htmlFor={`basePrice-${index}`}
                              >
                                Base price ($)
                              </label>
                              <Controller
                                name={`variants.${index}.basePrice`}
                                control={control}
                                render={({ field }) => (
                                  <input
                                    id={`basePrice-${index}`}
                                    type="text"
                                    inputMode="decimal"
                                    autoComplete="off"
                                    spellCheck={false}
                                    placeholder="0.00"
                                    className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                    name={field.name}
                                    ref={field.ref}
                                    value={field.value}
                                    onBlur={field.onBlur}
                                    onChange={(e) => field.onChange(sanitizeMoneyInput(e.target.value))}
                                  />
                                )}
                              />
                              {errors.variants?.[index]?.basePrice && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errors.variants[index]?.basePrice?.message}
                                </p>
                              )}
                            </div>
                            <div className="min-w-0">
                              <label
                                className="mb-1 block text-xs font-medium text-slate-700"
                                htmlFor={`markup-${index}`}
                              >
                                Markup %
                              </label>
                              <Controller
                                name={`variants.${index}.profitThresholdPercent`}
                                control={control}
                                render={({ field }) => (
                                  <input
                                    id={`markup-${index}`}
                                    type="text"
                                    inputMode="decimal"
                                    autoComplete="off"
                                    spellCheck={false}
                                    placeholder="0"
                                    className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                    name={field.name}
                                    ref={field.ref}
                                    value={field.value}
                                    onBlur={field.onBlur}
                                    onChange={(e) => field.onChange(sanitizePercentInput(e.target.value))}
                                  />
                                )}
                              />
                              {errors.variants?.[index]?.profitThresholdPercent && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errors.variants[index]?.profitThresholdPercent?.message}
                                </p>
                              )}
                            </div>
                            <div className="min-w-0">
                              <label
                                className="mb-1 block text-xs font-medium text-slate-700"
                                htmlFor={`discount-${index}`}
                              >
                                Discount %
                              </label>
                              <Controller
                                name={`variants.${index}.discountPercent`}
                                control={control}
                                render={({ field }) => (
                                  <input
                                    id={`discount-${index}`}
                                    type="text"
                                    inputMode="decimal"
                                    autoComplete="off"
                                    spellCheck={false}
                                    placeholder="0"
                                    className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                    name={field.name}
                                    ref={field.ref}
                                    value={field.value}
                                    onBlur={field.onBlur}
                                    onChange={(e) => field.onChange(sanitizePercentInput(e.target.value))}
                                  />
                                )}
                              />
                              {errors.variants?.[index]?.discountPercent && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errors.variants[index]?.discountPercent?.message}
                                </p>
                              )}
                            </div>
                            <div className="min-w-0">
                              <label
                                className="mb-1 block text-xs font-medium text-slate-700"
                                htmlFor={`stock-${index}`}
                              >
                                Stock
                              </label>
                              <Controller
                                name={`variants.${index}.stock`}
                                control={control}
                                render={({ field }) => (
                                  <input
                                    id={`stock-${index}`}
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    spellCheck={false}
                                    placeholder="0"
                                    className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                    name={field.name}
                                    ref={field.ref}
                                    value={field.value}
                                    onBlur={field.onBlur}
                                    onChange={(e) => field.onChange(sanitizeIntegerInput(e.target.value))}
                                  />
                                )}
                              />
                              {errors.variants?.[index]?.stock && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errors.variants[index]?.stock?.message}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-4 border-t border-slate-200 pt-3 text-xs text-slate-600">
                            <span>
                              List price:{' '}
                              <strong className="text-slate-900">
                                {listPrice != null ? `$${listPrice.toFixed(2)}` : '—'}
                              </strong>
                            </span>
                            <span>
                              Customer price (effective):{' '}
                              <strong className="text-emerald-700">
                                {effective != null ? `$${effective.toFixed(2)}` : '—'}
                              </strong>
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
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

export default ProductForm
