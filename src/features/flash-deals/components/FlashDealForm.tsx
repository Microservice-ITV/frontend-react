import { useEffect, useMemo, useState } from 'react'
import { useForm, useFieldArray, type FieldArrayWithId, type UseFormRegister, type UseFormSetValue, type UseFormWatch } from 'react-hook-form'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Plus, Trash2, Loader2, Calendar, Clock, Flame, X, Search, ChevronDown } from 'lucide-react'

import { productServiceAssetUrl } from '@/lib/api/apiConfig'
import { productClient } from '@/lib/api/productClient'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import type { FlashDealFormItem } from '../types/flashDealTypes'

export const flashDealFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  description: z.string().max(5000).nullable().optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED', 'PAUSED']),
  slotTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).nullable().optional(),
  startAt: z.string().min(1, 'Start date/time is required'),
  endAt: z.string().min(1, 'End date/time is required'),
  items: z.array(z.object({
    productId: z.string().uuid('Invalid product ID'),
    productName: z.string(),
    variantId: z.string().uuid().nullable().optional(),
    originalPrice: z.number().positive('Original price must be positive'),
    dealPrice: z.number().positive('Deal price must be positive'),
    allocatedQuantity: z.number().int().min(1, 'Allocated quantity must be at least 1'),
    purchaseLimit: z.number().int().min(1, 'Purchase limit must be at least 1'),
    sortOrder: z.number().int().min(0),
    discountPercent: z.number(),
  })).min(1, 'At least one product is required'),
}).refine((data) => new Date(data.startAt) < new Date(data.endAt), {
  message: 'Start date must be before end date',
  path: ['endAt'],
}).refine((data) => {
  if (!data.items) return true
  const productIds = data.items.map((item) => item.productId)
  return new Set(productIds).size === productIds.length
}, {
  message: 'A product can only appear once in the same flash deal',
  path: ['items'],
})

export type FlashDealFormValues = z.infer<typeof flashDealFormSchema>

type FlashDealFormProps = {
  mode: 'create' | 'edit'
  resolver: any
  initialValues: FlashDealFormValues
  existingFlashDeal?: FlashDealFormValues | null
  onSubmit: (values: FlashDealFormValues) => Promise<void> | void
  submitLabel: string
  cancelTo: string
  isSubmitting?: boolean
  submitError?: string
}

const FlashDealForm = ({
  mode,
  resolver,
  initialValues,
  existingFlashDeal = null,
  onSubmit,
  submitLabel,
  cancelTo,
  isSubmitting = false,
  submitError = '',
}: FlashDealFormProps) => {
  const { openModal } = useGlobalModal()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useForm<FlashDealFormValues>({
    resolver,
    defaultValues: initialValues,
    mode: 'onBlur',
  })

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'items',
  })

  const items = watch('items') ?? []
  const startAt = watch('startAt')
  const endAt = watch('endAt')
  const status = watch('status')

  const title = useMemo(
    () => (mode === 'create' ? 'New Flash Deal' : 'Edit Flash Deal'),
    [mode],
  )
  const subtitle = useMemo(
    () =>
      mode === 'create'
        ? 'Create a new time-limited flash sale campaign.'
        : 'Update the flash deal details.',
    [mode],
  )

  const handleFormSubmit = async (values: FlashDealFormValues) => {
    await onSubmit(values)
  }

  const openProductPicker = (index: number) => {
    const excludedIds = items
      .filter((_, itemIndex) => itemIndex !== index)
      .map((item) => item.productId)
      .filter(Boolean)
    openModal({
      title: 'Select Product',
      content: (
        <ProductPickerModal
          excludedProductIds={excludedIds}
          onSelect={(product) => {
            setValue(`items.${index}.productId`, product.id)
            setValue(`items.${index}.productName`, product.name)
            setValue(`items.${index}.originalPrice`, product.price)
            setValue(`items.${index}.dealPrice`, Math.round(product.price * 0.5 * 100) / 100)
          }}
        />
      ),
      primaryLabel: 'Done',
      secondaryLabel: '',
    })
  }

  const removeItem = (index: number) => {
    remove(index)
  }

  const calculateDiscount = (originalPrice: number, dealPrice: number) => {
    if (originalPrice <= 0) return 0
    return Math.round(((originalPrice - dealPrice) / originalPrice) * 100)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
            <h2 className="text-base font-bold text-slate-900">Basic Information</h2>
            <p className="mt-0.5 text-xs text-slate-600">Configure the flash deal identity and scheduling.</p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-slate-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name')}
                  placeholder="e.g., Weekend Flash Sale"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="description" className="mb-1.5 block text-xs font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  id="description"
                  {...register('description')}
                  rows={3}
                  placeholder="Optional description for internal reference"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="status" className="mb-1.5 block text-xs font-medium text-slate-700">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  {...register('status')}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="SCHEDULED">Scheduled</option>
                </select>
              </div>

              <div>
                <label htmlFor="slotTime" className="mb-1.5 block text-xs font-medium text-slate-700">
                  Slot Time (HH:MM)
                </label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="slotTime"
                    type="time"
                    {...register('slotTime')}
                    className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="startAt" className="mb-1.5 block text-xs font-medium text-slate-700">
                  Start At <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="startAt"
                    type="datetime-local"
                    {...register('startAt')}
                    className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                {errors.startAt && <p className="mt-1 text-xs text-red-600">{errors.startAt.message}</p>}
              </div>

              <div>
                <label htmlFor="endAt" className="mb-1.5 block text-xs font-medium text-slate-700">
                  End At <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="endAt"
                    type="datetime-local"
                    {...register('endAt')}
                    className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                {errors.endAt && <p className="mt-1 text-xs text-red-600">{errors.endAt.message}</p>}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Products</h2>
                <p className="mt-0.5 text-xs text-slate-600">Add products to this flash deal.</p>
              </div>
              <button
                type="button"
                onClick={() => append({
                  productId: '',
                  productName: '',
                  variantId: null,
                  originalPrice: 0,
                  dealPrice: 0,
                  allocatedQuantity: 1,
                  purchaseLimit: 1,
                  sortOrder: fields.length,
                  discountPercent: 0,
                })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
              >
                <Plus size={14} /> Add Product
              </button>
            </div>

            {fields.length === 0 && (
              <div className="mt-6 text-center py-8">
                <Flame className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">No products added yet</p>
                <p className="mt-1 text-xs text-slate-400">Click "Add Product" to start building your flash deal</p>
              </div>
            )}

            <div className="mt-6 space-y-4">
              {fields.map((field: FieldArrayWithId<FlashDealFormValues, 'items', 'id'>, index: number) => (
                <FlashDealItemRow
                  key={field.id}
                  index={index}
                  field={field}
                  fields={fields}
                  register={register}
                  setValue={setValue}
                  watch={watch}
                  getValues={getValues}
                  removeItem={removeItem}
                  openProductPicker={openProductPicker}
                  calculateDiscount={calculateDiscount}
                />
              ))}
            </div>

            {errors.items && (
              <p className="mt-3 text-xs text-red-600">{errors.items.message}</p>
            )}
          </div>
        </div>

        {submitError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {submitError}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            to={cancelTo}
            className="flex w-full sm:w-auto items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

interface FlashDealItemRowProps {
  index: number
  field: FieldArrayWithId<FlashDealFormValues, 'items', 'id'>
  fields: FieldArrayWithId<FlashDealFormValues, 'items', 'id'>[]
  register: UseFormRegister<FlashDealFormValues>
  setValue: UseFormSetValue<FlashDealFormValues>
  watch: UseFormWatch<FlashDealFormValues>
  getValues: () => FlashDealFormValues
  removeItem: (index: number) => void
  openProductPicker: (index: number) => void
  calculateDiscount: (originalPrice: number, dealPrice: number) => number
}

const FlashDealItemRow = ({
  index,
  field,
  fields,
  register,
  setValue,
  watch,
  getValues,
  removeItem,
  openProductPicker,
  calculateDiscount,
}: FlashDealItemRowProps) => {
  const originalPrice = watch(`items.${index}.originalPrice`) ?? 0
  const dealPrice = watch(`items.${index}.dealPrice`) ?? 0
  const productId = watch(`items.${index}.productId`) ?? ''
  const productName = watch(`items.${index}.productName`) ?? ''
  const variantId = watch(`items.${index}.variantId`) ?? ''
  const allocatedQuantity = watch(`items.${index}.allocatedQuantity`) ?? 1
  const purchaseLimit = watch(`items.${index}.purchaseLimit`) ?? 1

  const discountPercent = calculateDiscount(originalPrice, dealPrice)

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900">
            Product #{index + 1}
            {productName && <span className="ml-2 text-slate-500">— {productName}</span>}
          </p>
          {!productId && <p className="mt-0.5 text-xs text-amber-600">Please select a product</p>}
        </div>
        <button
          type="button"
          onClick={() => removeItem(index)}
          disabled={fields.length === 1}
          className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Remove product"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-slate-700">
            Product <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={productId}
              readOnly
              placeholder="Click to select product"
              onClick={() => openProductPicker(index)}
              className="flex-1 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={() => openProductPicker(index)}
              className="flex shrink-0 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-emerald-700 hover:bg-emerald-100"
              aria-label="Select product"
            >
              <Search size={16} />
            </button>
          </div>
          <input type="hidden" {...register(`items.${index}.productId`)} />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">
            Original Price
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            {...register(`items.${index}.originalPrice`, { valueAsNumber: true })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
            readOnly
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">
            Deal Price <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            {...register(`items.${index}.dealPrice`, { valueAsNumber: true })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">
            Allocated Qty <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            {...register(`items.${index}.allocatedQuantity`, { valueAsNumber: true })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">
            Purchase Limit <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            {...register(`items.${index}.purchaseLimit`, { valueAsNumber: true })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <label className="mb-1.5 block text-xs font-medium text-slate-700">
            Sort Order
          </label>
          <input
            type="number"
            min="0"
            {...register(`items.${index}.sortOrder`, { valueAsNumber: true })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-1 flex items-end">
          <div className="w-full">
            <label className="mb-1.5 block text-xs font-medium text-slate-700">Discount</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-700">
                -{discountPercent}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ProductPickerModalProps {
  onSelect: (product: { id: string; name: string; price: number; image: string }) => void
  excludedProductIds?: string[]
}

const ProductPickerModal = ({ onSelect, excludedProductIds = [] }: ProductPickerModalProps) => {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Array<{ id: string; name: string; price: number; image: string }>>([])
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string; price: number; image: string } | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const res = await productClient.get('/products', { params: { limit: 50 } })
        const data = res.data
        if (data.data) {
          setProducts(data.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
            image: p.images?.[0] ?? '',
          })))
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    !excludedProductIds.includes(p.id)
  )

  const handleSelect = (product: { id: string; name: string; price: number; image: string }) => {
    setSelectedProduct(product)
    onSelect(product)
  }

  return (
    <div className="max-h-[60vh] overflow-hidden">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
        />
      </div>
      <div className="max-h-[40vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-emerald-600" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">No products found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => handleSelect(product)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  selectedProduct?.id === product.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded bg-slate-100 shrink-0">
                  {product.image ? (
                    <img src={productServiceAssetUrl(product.image)} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-400">No image</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                  <p className="text-xs text-slate-500">${product.price.toFixed(2)}</p>
                </div>
                {selectedProduct?.id === product.id && (
                  <svg className="h-5 w-5 text-emerald-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FlashDealForm