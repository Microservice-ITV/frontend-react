import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { voucherIcon } from '@/assets/icons'
import { Trash2 } from 'lucide-react'
import type { CartItem } from '../types/cartTypes'
import { selectShopSelectionMap } from '../store/cartSelectors'
import { removeFromCart, toggleItemSelection, toggleShopSelection } from '../store/cartSlice'
import { formatProductPrice } from '@/features/products/utils/formatProductPrice'
import { useState } from 'react'
import type { CustomerVoucher } from '@/features/account/api/vouchersApi'
import CartQuantityInput from './CartQuantityInput'
import placeholderImage from '@/public/placeholder.svg'

const formatCartPrice = (amount: number) => formatProductPrice(amount).replace('MMK', 'Ks')

interface CartItemListProps {
  items: CartItem[]
  bundleMinimumQty?: ReadonlyMap<string, number>
  vouchers?: CustomerVoucher[]
  selectedVoucherCodes?: string[]
  voucherLoadError?: boolean
  voucherLoading?: boolean
  onVoucherSelectionChange?: (codes: string[]) => void
}

const CartItemLists = ({ items, bundleMinimumQty, vouchers = [], selectedVoucherCodes = [], voucherLoadError = false, voucherLoading = false, onVoucherSelectionChange }: CartItemListProps) => {
  const dispatch = useAppDispatch()
  const shopSelectionMap = useAppSelector(selectShopSelectionMap)
  const [voucherShop, setVoucherShop] = useState<{ id: string; name: string } | null>(null)
  const [draftCodes, setDraftCodes] = useState<string[]>([])

  const groupedByShop = items.reduce<Record<
    string,
    { shopId: string; shopName: string; items: CartItem[] }
  >>((acc, item) => {
    acc[item.shopId] ??= {
      shopId: item.shopId,
      shopName: item.shopName,
      items: [],
    }
    acc[item.shopId].items.push(item)
    return acc
  }, {})

  return (
    <div className="space-y-3">
      <div className="hidden items-center gap-3.5 rounded-sm border border-[var(--dni-cart-border)] bg-white px-3 py-2.5 text-sm text-gray-500 sm:px-4 md:grid md:grid-cols-[1rem_3.5rem_minmax(0,1fr)_7.5rem_8.5rem_8.5rem_4.75rem]">
        <span className="col-span-3 text-gray-900">Product</span>
        <span className="whitespace-nowrap">Unit Price</span>
        <span className="text-center">Quantity</span>
        <span className="whitespace-nowrap text-right">Total Price</span>
        <span aria-hidden="true" />
      </div>

      {Object.values(groupedByShop).map(shop => (
        <section
          key={shop.shopId}
          className="overflow-hidden rounded-sm border border-[var(--dni-cart-border)] bg-white"
        >
          <div className="flex items-center gap-2.5 border-b border-[var(--dni-cart-border)] px-3 py-2.5 sm:px-4">
            <input
              type="checkbox"
              checked={shopSelectionMap[shop.shopId]?.checked ?? false}
              ref={el => {
                if (el) {
                  el.indeterminate = shopSelectionMap[shop.shopId]?.indeterminate ?? false
                }
              }}
              onChange={e =>
                dispatch(toggleShopSelection({ shopId: shop.shopId, selected: e.target.checked }))
              }
              className="h-4 w-4 accent-emerald-600"
              aria-label={`Select all items from ${shop.shopName}`}
            />
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 sm:text-[15px]">
              {shop.shopName}
            </p>
          </div>

          <ul>
            {shop.items.map(item => (
              <li
                key={`${item.productId}::${item.variantId ?? ''}`}
                className="flex flex-col gap-2.5 border-b border-[var(--dni-cart-border)] px-3 py-3 last:border-b-0 sm:px-4 md:grid md:grid-cols-[1rem_3.5rem_minmax(0,1fr)_7.5rem_8.5rem_8.5rem_4.75rem] md:items-center md:gap-3.5"
              >
                <div className="flex min-w-0 items-center gap-3 md:contents">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() =>
                      dispatch(toggleItemSelection({ productId: item.productId, variantId: item.variantId }))
                    }
                    className="h-4 w-4 shrink-0 accent-emerald-600"
                    aria-label={`Select ${item.name}`}
                  />

                  <img
                    src={item.image || placeholderImage}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const img = e.currentTarget
                      img.onerror = null
                      img.src = placeholderImage
                    }}
                    className="h-16 w-16 shrink-0 object-cover md:h-14 md:w-14"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-gray-900 sm:text-[15px]">
                      {item.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      Variation : {item.variantLabel?.trim() || 'Standard'}
                    </p>
                    <p className="mt-1 whitespace-nowrap text-sm font-medium text-emerald-700 md:hidden">
                      {formatCartPrice(item.price)}
                    </p>
                  </div>
                </div>

                <p className="hidden whitespace-nowrap text-[15px] tabular-nums text-gray-700 md:block">
                  {formatCartPrice(item.price)}
                </p>

                <div className="flex items-center justify-between gap-2 pl-7 md:contents">
                  <div className="md:flex md:justify-center">
                    <CartQuantityInput
                      item={item}
                      minimumQuantity={bundleMinimumQty?.get(item.productId)}
                    />
                  </div>
                  <p className="shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums text-emerald-700 md:w-full md:text-right md:text-[15px]">
                    {formatCartPrice(item.price * item.quantity)}
                  </p>
                  <button
                    type="button"
                    aria-label="Remove item from cart"
                    className="inline-flex shrink-0 items-center gap-1 text-sm text-gray-500 hover:text-red-500 md:justify-self-end"
                    onClick={() =>
                      dispatch(removeFromCart({ productId: item.productId, variantId: item.variantId }))
                    }
                  >
                    <Trash2 size={15} />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between gap-3 border-t border-[var(--dni-cart-border)] px-3 py-2.5 text-sm sm:px-4">
            <div className="flex min-w-0 items-center gap-2">
              <img src={voucherIcon} alt="" className="h-5 w-5" />
              <span className="text-gray-700">Shop Voucher</span>
            </div>
            <button type="button" onClick={() => { setVoucherShop({ id: shop.shopId, name: shop.shopName }); setDraftCodes(selectedVoucherCodes) }} className="shrink-0 text-[#0055aa] hover:underline">
              {selectedVoucherCodes.length ? `Vouchers selected (${selectedVoucherCodes.length}) · Select Voucher` : 'Select Voucher'}
            </button>
          </div>
        </section>
      ))}
      {voucherShop && <VoucherPicker
        shopId={voucherShop.id}
        shopName={voucherShop.name}
        vouchers={vouchers}
        selectedCodes={draftCodes}
        loadingError={voucherLoadError}
        loading={voucherLoading}
        onChange={setDraftCodes}
        onClose={() => setVoucherShop(null)}
        onSave={() => { onVoucherSelectionChange?.(draftCodes); setVoucherShop(null) }}
      />}
    </div>
  )
}

function VoucherPicker({ shopId, shopName, vouchers, selectedCodes, loadingError, loading, onChange, onClose, onSave }: {
  shopId: string
  shopName: string
  vouchers: CustomerVoucher[]
  selectedCodes: string[]
  loadingError: boolean
  loading: boolean
  onChange: (codes: string[]) => void
  onClose: () => void
  onSave: () => void
}) {
  const available = vouchers.filter(voucher => !voucher.expires_at || new Date(voucher.expires_at).getTime() > Date.now())
    .filter(voucher => voucher.promotion?.owner_type !== 'SELLER' || voucher.promotion.shop_id === shopId)
  const selectedForShop = selectedCodes.filter(code => available.some(voucher => voucher.code === code))
  const toggle = (voucher: CustomerVoucher) => {
    const exists = selectedCodes.includes(voucher.code)
    if (exists) { onChange(selectedCodes.filter(code => code !== voucher.code)); return }
    const samePromotionCodes = available.filter(row => row.promotion_id === voucher.promotion_id).map(row => row.code)
    onChange([...selectedCodes.filter(code => !samePromotionCodes.includes(code)), voucher.code])
  }
  const selectAll = () => {
    const byPromotion = new Map<string, CustomerVoucher>()
    for (const voucher of available) {
      if (!byPromotion.has(voucher.promotion_id)) byPromotion.set(voucher.promotion_id, voucher)
    }
    const codes = [...byPromotion.values()].map(voucher => voucher.code)
    onChange([...new Set([...selectedCodes.filter(code => !available.some(v => v.code === code)), ...codes])])
  }

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="voucher-picker-title" className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
      <header className="border-b border-gray-100 px-5 py-4">
        <h2 id="voucher-picker-title" className="font-semibold text-gray-900">Select vouchers</h2>
        <p className="mt-1 text-sm text-gray-500">Available for {shopName}</p>
      </header>
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 text-sm">
        <span className="text-gray-600">{selectedForShop.length} selected</span>
        <button type="button" onClick={selectAll} disabled={!available.length} className="font-medium text-emerald-700 disabled:text-gray-400">Select all</button>
      </div>
      <div className="max-h-[55vh] overflow-y-auto p-4">
        {loading ? <p className="py-8 text-center text-sm text-gray-500">Loading your vouchers…</p>
          : loadingError ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Could not load your vouchers. Please try again.</p>
          : available.length === 0 ? <p className="py-8 text-center text-sm text-gray-500">No available vouchers for this shop.</p>
            : <ul className="space-y-2">{available.map(voucher => {
              const checked = selectedCodes.includes(voucher.code)
              return <li key={voucher.id}>
                <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${checked ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(voucher)} className="mt-1 h-4 w-4 accent-emerald-600" />
                  <span className="min-w-0 flex-1"><span className="block font-semibold tracking-wide text-gray-900">{voucher.code}</span>
                    <span className="mt-0.5 block text-sm text-gray-600">{voucher.promotion?.name ?? 'Promotion voucher'}</span>
                    {voucher.expires_at && <span className="mt-1 block text-xs text-gray-500">Expires {new Date(voucher.expires_at).toLocaleDateString()}</span>}
                  </span>
                </label>
              </li>
            })}</ul>}
        <p className="mt-3 text-xs text-gray-500">Only one voucher from each promotion can be used in one order.</p>
      </div>
      <footer className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
        <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700">Cancel</button>
        <button type="button" onClick={onSave} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">Use selected</button>
      </footer>
    </section>
  </div>
}

export default CartItemLists
