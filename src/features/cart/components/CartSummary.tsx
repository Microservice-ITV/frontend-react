import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { voucherIcon } from '@/assets/icons'
import { selectIsAllSelected, selectSelectedItems } from '../store/cartSelectors'
import { removeSelectedItems, toggleAllSelection } from '../store/cartSlice'
import { useNavigate } from 'react-router-dom'

interface CartSummaryProps {
  total: number
  selectedCount?: number
}

const CartSummary = ({ total }: CartSummaryProps) => {
  const dispatch = useAppDispatch()
  const isAllSelected = useAppSelector(selectIsAllSelected)
  const selectedCount = useAppSelector(selectSelectedItems).length
  const itemLabel = selectedCount <= 1 ? 'item' : 'items'

  // Disable "Check Out" button when no items are selected
  const isCheckoutDisabled = selectedCount === 0

  const navigate = useNavigate()

  return (
    <section
      className="
        bg-white border border-[var(--dni-cart-border)] rounded-sm
        sticky bottom-0 z-20" role="contentinfo"
    >
      {/* ================= PLATFORM VOUCHER ================= */}
      <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-[var(--dni-cart-border)] text-sm">
        <img src={voucherIcon} alt="Voucher" className="w-5 h-5" />
        <span className="font-medium">Platform Voucher</span>
        <div className="flex-1" />
        <button
          type="button"
          className="text-blue-600 hover:text-orange-500 whitespace-nowrap"
        >
          Select
        </button>
      </div>

      {/* ================= COINS ================= */}
      <div className="flex items-center px-4 md:px-6 py-3 text-xs md:text-sm text-gray-400 border-b border-dashed border-[var(--dni-cart-border)]">
        <input type="checkbox" disabled className="mr-3 h-4 w-4" />
        <span className="mr-2 text-orange-400">Ⓢ</span>
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
                className="h-4 w-4 accent-orange-500 border-gray-300"
              />
              <span>Select All ({selectedCount})</span>
            </label>

            <span className="text-orange-600 font-semibold text-lg">
              ${total.toFixed(2)}
            </span>
          </div>

          <button
            type="button"
            disabled={isCheckoutDisabled}
            onClick={() => navigate('/checkout')}
            className={`
              w-full py-3 rounded-sm text-sm font-medium
              ${isCheckoutDisabled
                ? 'bg-orange-300 text-orange-400 cursor-not-allowed'
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
              className="h-4 w-4 accent-orange-500 border-gray-300"
            />
            <button className="hover:text-orange-500">Select All ({selectedCount})</button>
            <button
              disabled={selectedCount === 0}
              onClick={() => dispatch(removeSelectedItems())}
              className={`
                hover:text-orange-500
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
              <span className="text-2xl text-orange-600 font-semibold leading-none">
                ${total.toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              disabled={isCheckoutDisabled}
              onClick={() => navigate('/checkout')}
              className={`
                px-10 py-3 rounded-sm text-sm font-medium
                ${isCheckoutDisabled
                  ? 'bg-orange-300 text-orange-400 cursor-not-allowed'
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