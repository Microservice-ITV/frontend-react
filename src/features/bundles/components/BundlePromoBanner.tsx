import { useEffect, useState } from 'react'
import { Check, Gift, X } from 'lucide-react'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'
import { formatKsPrice } from '@/features/products/utils/formatProductPrice'

export interface BundlePromoItem {
  productId: string
  name: string
  image: string | null
  price: number
  inCart?: boolean
}

export interface BundlePromoModel {
  id: string
  title: string
  description?: string | null
  bundlePrice: number
  individualTotal: number
  savings: number
  complete?: boolean
  items: BundlePromoItem[]
}

interface BundlePromoBannerProps {
  bundles: BundlePromoModel[]
  addingId?: string
  onAdd?: (bundle: BundlePromoModel, productIds: string[]) => void
}

const BundlePromoBanner = ({ bundles, addingId, onAdd }: BundlePromoBannerProps) => {
  const [openId, setOpenId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const openBundle = bundles.find((bundle) => bundle.id === openId) ?? null
  const missingItems = openBundle?.items.filter((item) => !item.inCart) ?? []
  const selectedMissing = missingItems.filter((item) => selectedIds.includes(item.productId))

  const openOffer = (bundle: BundlePromoModel) => {
    setOpenId(bundle.id)
    setSelectedIds(bundle.items.filter((item) => !item.inCart).map((item) => item.productId))
  }

  useEffect(() => {
    if (!openBundle) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openBundle])

  const toggleProduct = (productId: string) => {
    setSelectedIds((current) => (
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    ))
  }

  if (bundles.length === 0) return null

  return (
    <>
      <div className="space-y-2">
        {bundles.map((bundle) => {
          const amount = formatKsPrice(bundle.savings)
          const name = bundle.title.trim()
          const description = bundle.description?.trim()
          const showDescription = Boolean(description && description !== name)
          return (
            <button
              key={bundle.id}
              type="button"
              onClick={() => openOffer(bundle)}
              className="group relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-left transition-colors duration-300 hover:border-emerald-300 hover:bg-emerald-100/80 motion-safe:animate-[bundle-offer-in_420ms_ease-out] sm:px-4"
            >
              <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent motion-reduce:hidden motion-safe:animate-[bundle-offer-shine_4.8s_ease-in-out_infinite]" />
              <span className="relative flex min-w-0 items-center gap-3">
                {bundle.complete ? (
                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white motion-safe:animate-[bundle-offer-in_280ms_ease-out]">
                    <Check className="h-4 w-4" strokeWidth={2.75} />
                  </span>
                ) : (
                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 shadow-[0_4px_12px_rgba(5,150,105,0.16)]">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-300/35 motion-reduce:hidden motion-safe:animate-ping" />
                    <Gift className="relative h-4 w-4 motion-safe:animate-[bundle-offer-icon_2.6s_ease-in-out_infinite]" />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                    {name && (
                      <span className="truncate text-base font-semibold text-emerald-950">{name}</span>
                    )}
                    <span className="text-sm text-emerald-900">
                      {bundle.complete ? 'You save ' : 'If you buy these products you can save '}
                      <span className="font-semibold">{amount}</span>
                      {bundle.complete ? ' on these products.' : '.'}
                    </span>
                  </span>
                  {showDescription && (
                    <span className="mt-0.5 block truncate text-sm text-emerald-800">{description}</span>
                  )}
                </span>
              </span>
              <span className="relative shrink-0 text-sm font-semibold text-emerald-800 transition-opacity duration-300 group-hover:opacity-70">View Offer</span>
            </button>
          )
        })}
      </div>

      {openBundle && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 motion-safe:animate-[bundle-offer-fade_180ms_ease-out] sm:items-center" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0" aria-label="Close bundle offer" onClick={() => setOpenId(null)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-sm bg-white shadow-xl motion-safe:animate-[bundle-offer-pop_220ms_ease-out]">
            <div className="flex items-start justify-between gap-3 border-b border-emerald-100 bg-emerald-50 px-4 py-3">
              <div className="min-w-0">
                {openBundle.title.trim() && (
                  <p className="truncate text-md font-semibold text-emerald-950">{openBundle.title.trim()}</p>
                )}
                <p className="mt-0.5 text-sm text-emerald-900">
                  {openBundle.complete
                    ? `You save ${formatKsPrice(openBundle.savings)} on these products.`
                    : `If you buy these products you can save ${formatKsPrice(openBundle.savings)}.`}
                </p>
              </div>
              <button type="button" onClick={() => setOpenId(null)} className="rounded p-1 text-emerald-800" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            {openBundle.description?.trim() && openBundle.description.trim() !== openBundle.title.trim() && (
              <div className="mx-4 mt-3 rounded-sm border border-emerald-100 bg-emerald-50 px-3 py-2">
                <p className="text-sm leading-5 text-emerald-950">{openBundle.description.trim()}</p>
              </div>
            )}
            <ul className="px-4 py-3">
              {openBundle.items.map((item) => {
                const canSelect = Boolean(onAdd) && !openBundle.complete && !item.inCart
                const checked = item.inCart || selectedIds.includes(item.productId)
                return (
                  <li key={item.productId} className="flex items-center gap-3 border-b border-gray-100 py-2.5 last:border-b-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!canSelect}
                      onChange={() => toggleProduct(item.productId)}
                      className="h-4 w-4 shrink-0 accent-emerald-600 disabled:opacity-70"
                      aria-label={`Select ${item.name}`}
                    />
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-slate-100">
                      {item.image && (
                        <img
                          src={productServiceAssetUrl(item.image)}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-gray-900">{item.name}</p>
                      {item.inCart && <p className="text-[11px] font-medium text-emerald-700">In cart</p>}
                    </div>
                    <span className="text-sm tabular-nums text-gray-700">{formatKsPrice(item.price)}</span>
                  </li>
                )
              })}
            </ul>
            <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
              <div>
                <p className="text-xs text-gray-500">
                  Separate total <span className="line-through">{formatKsPrice(openBundle.individualTotal)}</span>
                </p>
                <p className="text-base font-semibold text-emerald-700">{formatKsPrice(openBundle.bundlePrice)}</p>
              </div>
              {onAdd && !openBundle.complete && missingItems.length > 0 && (
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={addingId === openBundle.id || selectedMissing.length === 0}
                    onClick={() => onAdd(openBundle, selectedMissing.map((item) => item.productId))}
                    className="rounded-sm border border-emerald-600 px-3 py-2 text-sm font-medium text-emerald-700 disabled:opacity-50"
                  >
                    {addingId === openBundle.id ? 'Adding…' : 'Add selected'}
                  </button>
                  <button
                    type="button"
                    disabled={addingId === openBundle.id}
                    onClick={() => {
                      const productIds = missingItems.map((item) => item.productId)
                      setOpenId(null)
                      onAdd(openBundle, productIds)
                    }}
                    className="rounded-sm bg-[var(--dni-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {addingId === openBundle.id
                      ? 'Adding…'
                      : openBundle.items.some((item) => item.inCart)
                        ? 'Add the rest'
                        : 'Add bundle'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BundlePromoBanner
