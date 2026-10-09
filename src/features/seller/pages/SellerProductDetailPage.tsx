import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, Package, Pencil, Trash2 } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectAuthUser } from '@/features/auth/store/authSelectors'
import { fetchSellerProductsByShop } from '@/features/seller/store'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { sellerProductApi, type ProductDetailReadItem } from '@/features/seller/api/sellerProductApi'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'

const formatDate = (value?: string) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatKs = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—'
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return `Ks ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const formatMeasure = (value: unknown, unit: string) => {
  if (value === null || value === undefined || value === '') return '—'
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return `${amount} ${unit}`
}

const formatPercent = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—'
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return `${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}%`
}

const DetailField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <p className="mt-1 text-sm text-slate-900">{value || '—'}</p>
  </div>
)

const normalizeProductImages = (item: ProductDetailReadItem): string[] => {
  const candidates = [...(Array.isArray(item.images) ? item.images : []), item.imageUrl]
  return candidates
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .filter((value, index, arr) => arr.indexOf(value) === index)
}

const SellerProductDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { openModal } = useGlobalModal()
  const authUser = useAppSelector(selectAuthUser)
  const activeShopId = authUser?.active_shop_id ?? null

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [item, setItem] = useState<ProductDetailReadItem | null>(null)
  const [selectedImage, setSelectedImage] = useState('')

  useEffect(() => {
    if (!id) {
      setLoadError('Invalid product id.')
      setLoading(false)
      return
    }

    let isCancelled = false
    const fetchProduct = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const response = await sellerProductApi.getProductById(id)
        const data = response.data?.data ?? null
        if (!isCancelled) {
          setItem(data)
          if (!data) {
            setLoadError('Product not found.')
          }
        }
      } catch (error: any) {
        if (!isCancelled) {
          setLoadError(error?.response?.data?.message ?? 'Failed to load product details.')
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    void fetchProduct()
    return () => {
      isCancelled = true
    }
  }, [id])

  const variants = useMemo(
    () => (Array.isArray(item?.variants) ? item.variants : []),
    [item],
  )
  const displayName = (item?.name ?? item?.title ?? 'Untitled Product').trim()
  const displayDescription = (item?.description ?? '').trim()
  const categoryName = item?.category?.name ?? item?.category?.title ?? item?.categoryId ?? '—'
  const parentCategory = item?.category?.parent?.name?.trim()
  const displayCategory = parentCategory ? `${parentCategory} / ${categoryName}` : categoryName
  const displayBrand = item?.brand?.name
    ? item.brand.code
      ? `${item.brand.name} (${item.brand.code})`
      : item.brand.name
    : '—'
  const displayStatus = item?.isActive ? 'Active' : 'Inactive'
  const displayDate = formatDate(item?.createdAt)
  const displayUpdated = formatDate(item?.updatedAt)
  const totalStock = variants.reduce((sum, variant) => {
    const stock = Number(variant.stock ?? variant.shopStock ?? 0)
    return sum + (Number.isFinite(stock) ? stock : 0)
  }, 0)
  const imageUrls = useMemo(() => (item ? normalizeProductImages(item) : []), [item])
  const imageUrl = imageUrls[0] ?? ''

  useEffect(() => {
    if (imageUrls.length === 0) {
      setSelectedImage('')
      return
    }
    setSelectedImage((prev) => (imageUrls.includes(prev) ? prev : imageUrls[0]))
  }, [imageUrls])
  const confirmDelete = () => {
    if (!id || !item) return

    openModal({
      title: 'Delete product?',
      content: (
        <p>
          Are you sure you want to delete <strong>{displayName}</strong>? This action cannot be undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'success',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await sellerProductApi.deleteProduct(id)
        if (activeShopId) {
          try {
            await dispatch(fetchSellerProductsByShop({ shopId: activeShopId })).unwrap()
          } catch {
            // Keep delete flow successful even if list refresh fails.
          }
        }
        navigate('/seller/products')
      },
    })
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/seller/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <Link to="/seller/products" className="hover:text-slate-700">
          Products
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">{displayName}</span>
      </nav>

      {loading && (
        <div className="rounded-sm border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading product details...
        </div>
      )}

      {!loading && loadError && (
        <div className="rounded-sm border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          {loadError}
        </div>
      )}

      {!loading && !loadError && item && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {displayName}
            </h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(`/seller/products/${id}/edit`)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Pencil size={16} />
                Edit
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 cursor-pointer"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="rounded-sm border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900">Product Details</h2>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailField label="Name" value={displayName} />
                  <DetailField label="Slug" value={item.slug?.trim() || '—'} />
                  <DetailField label="SKU" value={item.sku?.trim() || '—'} />
                  <DetailField label="Brand" value={displayBrand} />
                  <DetailField label="Category" value={displayCategory} />
                  <DetailField label="Shop" value={item.shop?.name?.trim() || '—'} />
                </div>
                <div className="h-px bg-slate-200" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Description</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                    {displayDescription || 'No description'}
                  </p>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-slate-500">Status</p>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {displayStatus}
                    </span>
                  </div>
                  {(
                    [
                      ['Created', displayDate],
                      ['Updated', displayUpdated],
                    ] as const
                  ).map(([label, value]) => (
                    <p key={label} className="flex items-center gap-1.5 text-sm text-slate-700">
                      <span className="text-xs font-medium text-slate-500">{label}</span>
                      <CalendarDays size={14} className="text-slate-500" />
                      {value}
                    </p>
                  ))}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-xs font-medium text-slate-500">Tags</p>
                    {item.tags && item.tags.length > 0 ? (
                      item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-900">—</span>
                    )}
                  </div>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
                  <DetailField label="Variants" value={String(variants.length)} />
                  <DetailField label="Total stock" value={String(totalStock)} />
                </div>
              </div>
            </section>

            <section className="flex h-full flex-col rounded-sm border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="text-base font-bold text-slate-900">Image</h2>
                <div className="relative mt-4 min-h-[280px] flex-1 overflow-hidden rounded-sm border border-slate-100 bg-slate-100">
                  {selectedImage || imageUrl ? (
                    <img
                      src={productServiceAssetUrl(selectedImage || imageUrl)}
                      alt={displayName}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-[280px] items-center justify-center">
                      <Package size={64} className="text-slate-500" />
                    </div>
                  )}
                </div>
                {imageUrls.length > 1 && (
                  <div className="mt-3 shrink-0 grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {imageUrls.map((url, index) => (
                      <button
                        key={`${url}-${index}`}
                        type="button"
                        onClick={() => setSelectedImage(url)}
                        className={`overflow-hidden rounded-sm border ${
                          (selectedImage || imageUrl) === url
                            ? 'border-emerald-500 ring-2 ring-emerald-200'
                            : 'border-slate-200'
                        }`}
                        aria-label={`View product image ${index + 1}`}
                      >
                        <img
                          src={productServiceAssetUrl(url)}
                          alt={`${displayName} thumbnail ${index + 1}`}
                          className="h-14 w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
            </section>
          </div>

          <section className="rounded-sm border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-base font-bold text-slate-900">Variants</h2>
            {variants.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No variants.</p>
            ) : (
              <div className="mt-5 space-y-4">
                {variants.map((variant, index) => {
                  const colorName = variant.color?.name?.trim() || '—'
                  const sizeName = variant.size?.name?.trim() || '—'
                  const withCode = (name: string, code?: string) =>
                    code?.trim() ? `${name} (${code.trim()})` : name
                  const fields: Array<[string, string]> = [
                    ['Color', withCode(colorName, variant.color?.code)],
                    ['Size', withCode(sizeName, variant.size?.code)],
                    ['SKU', variant.sku?.trim() || '—'],
                    ['Stock', String(variant.stock ?? variant.shopStock ?? '—')],
                    ['Base price', formatKs(variant.basePrice)],
                    ['Selling price', formatKs(variant.listPrice ?? variant.sellingPrice)],
                    ['Markup', formatPercent(variant.profitThresholdPercent)],
                    ['Discount', formatPercent(variant.discountPercent)],
                    ['Customer pays', formatKs(variant.effectiveSellingPrice ?? variant.price)],
                    ['Length', formatMeasure(variant.length, 'cm')],
                    ['Width', formatMeasure(variant.width, 'cm')],
                    ['Height', formatMeasure(variant.height, 'cm')],
                    ['Weight', formatMeasure(variant.weight, 'kg')],
                  ]
                  return (
                    <article
                      key={variant.id ?? variant.variantId ?? `${colorName}-${sizeName}-${index}`}
                      className="rounded-sm border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {colorName} · {sizeName}
                        </h3>
                        {variant.isPrimary ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            Primary
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                        {fields.map(([label, value]) => (
                          <DetailField key={label} label={label} value={value} />
                        ))}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default SellerProductDetailPage