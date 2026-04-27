import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, DollarSign, Package, Package2, Pencil, Trash2 } from 'lucide-react'
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

const normalizeProductImage = (item: ProductDetailReadItem): string => {
  const candidates = [...(Array.isArray(item.images) ? item.images : []), item.imageUrl]
  return (
    candidates.find((value) => typeof value === 'string' && value.trim().length > 0) ?? ''
  )
}

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

  const primaryVariant = useMemo(() => {
    const variants = Array.isArray(item?.variants) ? item.variants : []
    return variants.find((variant) => variant.isPrimary) ?? variants[0] ?? null
  }, [item])

  const displayName = (item?.name ?? item?.title ?? 'Untitled Product').trim()
  const displayDescription = (item?.description ?? 'No description').trim()
  const displayCategory = item?.category?.name ?? item?.category?.title ?? item?.categoryId ?? '—'
  const displayStatus = item?.isActive ? 'Active' : 'Inactive'
  const displayDate = formatDate((item as any)?.createdAt)
  const imageUrls = useMemo(() => (item ? normalizeProductImages(item) : []), [item])
  const imageUrl = item ? normalizeProductImage(item) : ''

  useEffect(() => {
    if (imageUrls.length === 0) {
      setSelectedImage('')
      return
    }
    setSelectedImage((prev) => (imageUrls.includes(prev) ? prev : imageUrls[0]))
  }, [imageUrls])
  const displayPrice = Number(primaryVariant?.price ?? 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  })
  const displayStock = Number(primaryVariant?.stock ?? primaryVariant?.shopStock ?? 0)

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
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading product details...
        </div>
      )}

      {!loading && loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
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
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900">Product Details</h2>
              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-xs font-medium text-slate-500">Name</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{displayName}</p>
                </div>
                <div className="h-px bg-slate-200" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Description</p>
                  <p className="mt-1 text-xs text-slate-800">{displayDescription}</p>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Status</p>
                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {displayStatus}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Category</p>
                    <span className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {displayCategory}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Created</p>
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                      <CalendarDays size={16} className="text-slate-500" />
                      {displayDate}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="text-base font-bold text-slate-900">Image</h2>
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
                  {selectedImage || imageUrl ? (
                    <img
                      src={productServiceAssetUrl(selectedImage || imageUrl)}
                      alt={displayName}
                      className="h-[280px] w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-[280px] items-center justify-center">
                      <Package size={64} className="text-slate-500" />
                    </div>
                  )}
                </div>
                {imageUrls.length > 1 && (
                  <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {imageUrls.map((url, index) => (
                      <button
                        key={`${url}-${index}`}
                        type="button"
                        onClick={() => setSelectedImage(url)}
                        className={`overflow-hidden rounded-lg border ${
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

              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="text-base font-bold text-slate-900">Pricing &amp; Inventory</h2>
                <div className="mt-4 divide-y divide-slate-200">
                  <div className="flex items-center justify-between py-4">
                    <p className="flex items-center gap-2 text-sm text-slate-500">
                      <DollarSign size={18} />
                      Price
                    </p>
                    <p className="text-lg font-bold tracking-tight text-slate-900">{displayPrice}</p>
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <p className="flex items-center gap-2 text-sm text-slate-500">
                      <Package2 size={18} />
                      Stock
                    </p>
                    <p className="text-lg font-bold tracking-tight text-slate-900">{displayStock}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SellerProductDetailPage