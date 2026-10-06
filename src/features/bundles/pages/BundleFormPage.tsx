import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { selectAuthUser } from '@/features/auth/store/authSelectors'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { formatKsPrice } from '@/features/products/utils/formatProductPrice'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'
import { bundleApi, bundleErrorMessage, type BundleProductOption } from '../api/bundleApi'
import { useBundlePaths } from '../config/bundlePaths'

const BundleFormPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const paths = useBundlePaths()
  const authUser = useAppSelector(selectAuthUser)
  const isSellerArea = paths.area === 'seller'
  const shopScopeId = isSellerArea ? authUser?.active_shop_id ?? null : null
  const missingShopScope = isSellerArea && !shopScopeId

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [bundlePrice, setBundlePrice] = useState('')
  const [items, setItems] = useState<BundleProductOption[]>([])
  const [options, setOptions] = useState<BundleProductOption[]>([])
  const [searching, setSearching] = useState(false)
  const knownProducts = useRef(new Map<string, BundleProductOption>())
  const searchRequest = useRef(0)
  const [shopId, setShopId] = useState(shopScopeId ?? '')
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void bundleApi.get(id).then((bundle) => {
      if (cancelled) return
      setTitle(bundle.title)
      setDescription(bundle.description?.trim() || '')
      setBundlePrice(bundle.bundlePrice == null ? '' : String(bundle.bundlePrice))
      setShopId(bundle.shopId)
      const loaded = bundle.items.filter((item) => item.role === 'INCLUDED').map((item) => ({
        id: item.productId,
        name: item.product?.name || 'Product',
        price: item.product?.price ?? 0,
        image: item.product?.image ?? null,
        shopId: item.product?.shopId ?? bundle.shopId,
      }))
      for (const product of loaded) knownProducts.current.set(product.id, product)
      setItems(loaded)
      setLoading(false)
    }).catch((err) => {
      if (!cancelled) {
        setError(bundleErrorMessage(err))
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [id])

  const loadProducts = (search?: string) => {
    if (missingShopScope) return
    const requestId = ++searchRequest.current
    setSearching(true)
    void bundleApi.searchProducts({
      search: search?.trim() || undefined,
      limit: 50,
      shopId: shopScopeId ?? undefined,
    }).then((rows) => {
      if (requestId !== searchRequest.current) return
      for (const product of rows) knownProducts.current.set(product.id, product)
      setOptions(rows)
    }).catch(() => {
      if (requestId === searchRequest.current) setOptions([])
    }).finally(() => {
      if (requestId === searchRequest.current) setSearching(false)
    })
  }

  useEffect(() => {
    if (missingShopScope) return
    const timer = window.setTimeout(() => loadProducts(), 0)
    return () => window.clearTimeout(timer)
  }, [missingShopScope, shopScopeId])

  const separateTotal = useMemo(() => items.reduce((sum, item) => sum + item.price, 0), [items])
  const priceNumber = Number(bundlePrice)
  const savings = Number.isFinite(priceNumber) ? Math.max(0, separateTotal - priceNumber) : 0
  const selectOptions = options.map((product) => ({
    value: product.id,
    label: `${product.name} · ${formatKsPrice(product.price)}`,
    image: product.image ? productServiceAssetUrl(product.image) : null,
    disabled: items.some((item) => item.id === product.id),
  }))

  const addProduct = (productId: string) => {
    const product = knownProducts.current.get(productId) ?? options.find((item) => item.id === productId)
    if (!product || items.some((item) => item.id === product.id)) return
    if (shopId && product.shopId && product.shopId !== shopId) {
      setError('Choose products from the same shop.')
      return
    }
    if (!shopId && product.shopId) setShopId(product.shopId)
    setError('')
    setItems((current) => [...current, product])
    loadProducts()
  }

  const onSubmit = async () => {
    const name = title.trim()
    const text = description.trim()
    const resolvedShop = shopScopeId || shopId || items[0]?.shopId || ''
    if (name.length < 3) {
      setError('Enter a bundle name of at least 3 characters.')
      return
    }
    if (name.length > 150) {
      setError('Bundle name must be 150 characters or fewer.')
      return
    }
    if (text.length < 3) {
      setError('Enter a description of at least 3 characters.')
      return
    }
    if (text.length > 500) {
      setError('Description must be 500 characters or fewer.')
      return
    }
    if (items.length < 2) {
      setError('Add at least two products.')
      return
    }
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      setError('Enter a bundle price.')
      return
    }
    if (!resolvedShop) {
      setError('Choose a product so the bundle knows which shop it belongs to.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        shopId: resolvedShop,
        title: name,
        description: text,
        kind: 'FIXED' as const,
        bundlePrice: priceNumber,
        items: items.map((item, index) => ({
          productId: item.id,
          quantity: 1,
          role: 'INCLUDED' as const,
          sortOrder: index,
        })),
      }
      if (id) await bundleApi.update(id, payload)
      else await bundleApi.create(payload)
      navigate(paths.list)
    } catch (err) {
      setError(bundleErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading bundle...</p>

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to={paths.overview} className="no-underline hover:text-slate-700 hover:no-underline">Dashboard</Link>
        <span className="mx-1">/</span>
        <Link to={paths.list} className="no-underline hover:text-slate-700 hover:no-underline">Bundles</Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">{id ? 'Edit Bundle' : 'New Bundle'}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--dni-border)] bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">Bundle details</h2>
          <p className="mt-0.5 text-xs text-slate-500">Name the set, describe it, and choose the price for buying every product together.</p>
          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Bundle name</label>
              <input
                type="text"
                value={title}
                maxLength={150}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Daily Hair Care Set"
                className="w-full rounded-lg border border-[var(--dni-border)] px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--dni-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Description</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="Shampoo, conditioner, and hair oil together"
                className="w-full rounded-lg border border-[var(--dni-border)] px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--dni-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Bundle price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={bundlePrice}
                onChange={(event) => setBundlePrice(event.target.value)}
                className="w-full rounded-lg border border-[var(--dni-border)] px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--dni-primary)]"
              />
            </div>
            {items.length > 0 && (
              <div className="rounded-lg border border-[var(--dni-primary-200)] bg-[var(--dni-primary-50)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--dni-primary-700)]">Price preview</p>
                <p className="mt-1.5 text-sm text-slate-700">Sold separately {formatKsPrice(separateTotal)}</p>
                <p className="text-sm text-slate-700">Bundle price {formatKsPrice(priceNumber || 0)}</p>
                <p className="text-sm font-semibold text-emerald-700">Save {formatKsPrice(savings)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--dni-border)] bg-white p-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Products</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {isSellerArea
                ? 'Add at least 2 products from your shop. You can add as many as you want.'
                : 'Add at least 2 products from the same shop. You can add as many as you want.'}
            </p>
            <span className="mt-2 inline-flex whitespace-nowrap rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {items.length} products selected.
            </span>
          </div>

          {missingShopScope ? (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs text-amber-700">
                Your account is not linked to a shop yet, so there are no products to search. Open your shop settings first.
              </p>
            </div>
          ) : (
            <div className="mt-5">
              <SearchableSelect
                value=""
                onChange={addProduct}
                options={selectOptions}
                mode="search-and-scroll"
                emptyLabel="Select product"
                placeholder="Search products…"
                onQueryChange={loadProducts}
                loading={searching}
                filterLocally={false}
              />
              {items.length > 0 && (
                <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {items.map((item, index) => (
                    <li key={item.id} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-800">
                      <span className="w-5 shrink-0 text-xs font-medium text-slate-400">{index + 1}</span>
                      <span className="min-w-0 flex-1 truncate">{item.name}</span>
                      <span className="shrink-0 text-xs text-slate-500">{formatKsPrice(item.price)}</span>
                      <button
                        type="button"
                        className="shrink-0 text-slate-500"
                        onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))}
                        aria-label={`Remove ${item.name}`}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Link
          to={paths.list}
          className="inline-flex items-center justify-center rounded-lg border border-[var(--dni-border)] bg-white px-5 py-2 text-sm font-medium text-slate-700 no-underline hover:bg-slate-50 hover:no-underline"
        >
          Cancel
        </Link>
        <button
          type="button"
          disabled={saving}
          onClick={() => void onSubmit()}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--dni-primary)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--dni-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          {id ? 'Save changes' : 'Save as Draft'}
        </button>
      </div>
    </div>
  )
}

export default BundleFormPage
