import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { voucherIcon } from '@/assets/icons'
import { selectIsAllSelected, selectSelectedItems } from '../store/cartSelectors'
import { removeSelectedItems, toggleAllSelection } from '../store/cartSlice'
import { useNavigate } from 'react-router-dom'
import { selectIsAuthenticated } from '@/features/auth/store/authSelectors'
import { useState } from 'react'
import { X } from 'lucide-react'

interface CartSummaryProps {
  total: number
  selectedCount?: number
}

const CartSummary = ({ total }: CartSummaryProps) => {
  const dispatch = useAppDispatch()
  const isAllSelected = useAppSelector(selectIsAllSelected)
  const selectedCount = useAppSelector(selectSelectedItems).length
  const itemLabel = selectedCount <= 1 ? 'item' : 'items'
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  // Disable "Check Out" button when no items are selected
  const isCheckoutDisabled = selectedCount === 0

  const navigate = useNavigate()
  const [showGuestModal, setShowGuestModal] = useState(false)

  const onCheckoutClick = () => {
    if (isCheckoutDisabled) return
    if (isAuthenticated) {
      navigate('/checkout')
      return
    }
    setShowGuestModal(true)
  }

  return (
    <section
      className="
        bg-white border border-[var(--dni-cart-border)] rounded-sm
        sticky bottom-0 z-20" role="contentinfo"
    >
      {showGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowGuestModal(false)}
            aria-label="Close dialog"
          />
          <div className="relative w-full max-w-md rounded-sm bg-white p-5 shadow-xl">
            <button
              type="button"
              className="absolute right-3 top-3 rounded p-1 text-gray-400 hover:text-gray-600"
              onClick={() => setShowGuestModal(false)}
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
                  setShowGuestModal(false)
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
                  setShowGuestModal(false)
                  navigate('/login', { state: { from: { pathname: '/checkout' } } as any })
                }}
              >
                Sign in to check out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PLATFORM VOUCHER ================= */}
      <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-[var(--dni-cart-border)] text-sm">
        <img src={voucherIcon} alt="Voucher" className="w-5 h-5" />
        <span className="font-medium">Platform Voucher</span>
        <div className="flex-1" />
        <button
          type="button"
          className="text-blue-600 hover:text-emerald-600 whitespace-nowrap"
        >
          Select
        </button>
      </div>

      {/* ================= COINS ================= */}
      <div className="flex items-center px-4 md:px-6 py-3 text-xs md:text-sm text-gray-400 border-b border-dashed border-[var(--dni-cart-border)]">
        <input type="checkbox" disabled className="mr-3 h-4 w-4" />
        <span className="mr-2 text-emerald-400">Ⓢ</span>
        <span className="flex-1">DNI Coins</span>
        <span className="hidden sm:inline">No item selected</span>
        <span className="ml-2 sm:ml-4">-$0.00</span>
      </div>

      {/* ================= CHECKOUT ================= */}
      <footer className="px-4 md:px-6 py-4">
        {/* -------- MOBILE -------- */}
        <div className="md:hidden flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={e => dispatch(toggleAllSelection(e.target.checked))}
                className="h-4 w-4 accent-emerald-600 border-gray-300"
              />
              <span>Select All ({selectedCount})</span>
            </label>

            <span className="text-emerald-700 font-semibold text-lg">
              ${total.toFixed(2)}
            </span>
          </div>

          <button
            type="button"
            disabled={isCheckoutDisabled}
            onClick={onCheckoutClick}
            className={`
              w-full py-3 rounded-sm text-sm font-medium
              ${isCheckoutDisabled
                ? 'bg-emerald-300 text-emerald-500 cursor-not-allowed'
                : 'bg-[var(--dni-primary)] text-white hover:opacity-90 cursor-pointer'}
              `}
          >
            {isCheckoutDisabled ? 'Select item(s)' : 'Check Out'}
          </button>
        </div>

        {/* -------- DESKTOP -------- */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={e => dispatch(toggleAllSelection(e.target.checked))}
              className="h-4 w-4 accent-emerald-600 border-gray-300"
            />
            <button className="hover:text-emerald-600">Select All ({selectedCount})</button>
            <button
              disabled={selectedCount === 0}
              onClick={() => dispatch(removeSelectedItems())}
              className={`
                hover:text-emerald-600
                ${selectedCount === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >Delete</button>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Total ({selectedCount} {itemLabel}):
              </span>
              <span className="text-2xl text-emerald-700 font-semibold leading-none">
                ${total.toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              disabled={isCheckoutDisabled}
              onClick={onCheckoutClick}
              className={`
                px-10 py-3 rounded-sm text-sm font-medium
                ${isCheckoutDisabled
                  ? 'bg-emerald-300 text-emerald-500 cursor-not-allowed'
                  : 'bg-[var(--dni-primary)] text-white hover:opacity-90 cursor-pointer'}
              `}
            >
              {isCheckoutDisabled ? 'Select item(s)' : 'Check Out'}
            </button>
          </div>
        </div>
      </footer>
    </section>
  )
}

export default CartSummary