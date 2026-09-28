import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { voucherIcon } from '@/assets/icons'
import { selectIsAllSelected, selectSelectedItems } from '../store/cartSelectors'
import { removeSelectedItems, toggleAllSelection } from '../store/cartSlice'
import { useNavigate } from 'react-router-dom'
import { selectIsAuthenticated } from '@/features/auth/store/authSelectors'
import { formatProductPrice } from '@/features/products/utils/formatProductPrice'
import { X } from 'lucide-react'

const formatCartPrice = (amount: number) => formatProductPrice(amount).replace('MMK', 'Ks')

interface CartSummaryProps {
  total: number
  selectedCount?: number
  onGuestCheckout?: () => void
}

export const GuestCheckoutModal = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate()

  return (
    <div className="absolute inset-0 z-30" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div className="sticky top-56 flex justify-center px-4 py-8">
        <div className="relative w-full max-w-md rounded-sm bg-white p-5 shadow-xl">
          <button
            type="button"
            className="absolute right-3 top-3 rounded p-1 text-gray-400 hover:text-gray-600"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
          <div className="text-lg font-semibold text-gray-900">Checkout as guest?</div>
          <div className="mt-2 text-sm text-gray-600">
            You’re not logged in. You can continue as a guest or login for discounts and member-only benefits.
          </div>

          <div className="mt-5 grid gap-2">
            <button
              type="button"
              className="w-full rounded-sm bg-[var(--dni-primary)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
              onClick={() => {
                onClose()
                try {
                  sessionStorage.setItem('dni.guest_checkout.entry_ok', '1')
                } catch {
                  // ignore
                }
                navigate('/checkout/guest')
              }}
            >
              Check out as guest
            </button>
            <button
              type="button"
              className="w-full rounded-sm border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-400"
              onClick={() => {
                onClose()
                navigate('/login', { state: { from: { pathname: '/checkout' } } as any })
              }}
            >
              Sign in to check out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const CartSummary = ({ total, onGuestCheckout }: CartSummaryProps) => {
  const dispatch = useAppDispatch()
  const isAllSelected = useAppSelector(selectIsAllSelected)
  const selectedCount = useAppSelector(selectSelectedItems).length
  const itemLabel = selectedCount <= 1 ? 'item' : 'items'
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isCheckoutDisabled = selectedCount === 0
  const navigate = useNavigate()

  const onCheckoutClick = () => {
    if (isCheckoutDisabled) return
    if (isAuthenticated) {
      navigate('/checkout')
      return
    }
    onGuestCheckout?.()
  }

  return (
    <section
      className="overflow-visible rounded-sm border border-[var(--dni-cart-border)] bg-white"
      role="contentinfo"
    >
      <div className="border-b border-[var(--dni-cart-border)] px-4 py-3 sm:px-5 sm:py-3.5">
        <h2 className="text-sm font-semibold text-gray-900 sm:text-base">Order summary</h2>
      </div>

      <div className="flex items-center gap-2.5 border-b border-[var(--dni-cart-border)] px-4 py-2.5 text-sm sm:px-5 sm:py-3 sm:text-[15px]">
        <img src={voucherIcon} alt="" className="h-5 w-5" />
        <span className="flex-1 text-gray-700">Platform voucher</span>
        <button type="button" className="font-medium text-emerald-700 hover:text-emerald-800">
          Select
        </button>
      </div>

      <div className="flex items-center gap-2.5 border-b border-dashed border-[var(--dni-cart-border)] px-4 py-2.5 text-sm text-gray-400 sm:px-5 sm:py-3 sm:text-[15px]">
        <input type="checkbox" disabled className="h-4 w-4" />
        <span className="text-emerald-400">Ⓢ</span>
        <span className="flex-1">DNI Coins</span>
        <span className="whitespace-nowrap tabular-nums">-{formatCartPrice(0)}</span>
      </div>

      <div className="space-y-3 px-4 py-4 sm:space-y-3.5 sm:px-5 sm:py-5">
        <div className="flex items-center justify-between text-sm sm:text-[15px]">
          <label className="flex items-center gap-2.5 text-gray-700">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={e => dispatch(toggleAllSelection(e.target.checked))}
              className="h-4 w-4 accent-emerald-600"
            />
            Select all ({selectedCount})
          </label>
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={() => dispatch(removeSelectedItems())}
            className={`text-sm sm:text-[15px] ${selectedCount === 0 ? 'cursor-not-allowed text-gray-300' : 'text-gray-600 hover:text-red-500'}`}
          >
            Delete
          </button>
        </div>

        <div className="flex items-end justify-between gap-3">
          <span className="shrink-0 text-sm text-gray-500 sm:text-[15px]">
            Total ({selectedCount} {itemLabel})
          </span>
          <span className="whitespace-nowrap text-right text-xl font-semibold tabular-nums text-emerald-700 sm:text-2xl">
            {formatCartPrice(total)}
          </span>
        </div>
        <p className="text-xs text-gray-500">Shipping fees are estimated at checkout.</p>

        <button
          type="button"
          disabled={isCheckoutDisabled}
          onClick={onCheckoutClick}
          className={`w-full rounded-sm py-3 text-[15px] font-medium ${
            isCheckoutDisabled
              ? 'cursor-not-allowed bg-emerald-300 text-emerald-500'
              : 'bg-[var(--dni-primary)] text-white hover:opacity-90'
          }`}
        >
          {isCheckoutDisabled ? 'Select item(s)' : 'Check Out'}
        </button>
      </div>
    </section>
  )
}

export default CartSummary
