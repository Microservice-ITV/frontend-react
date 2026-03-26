import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectIsAllSelected } from '../store/cartSelectors'
import { toggleAllSelection } from '../store/cartSlice'

const CartHeader = () => {
    const dispatch = useAppDispatch()
    const isAllSelected = useAppSelector(selectIsAllSelected)
    return (
        <div
            className="
                hidden md:grid grid-cols-[48px_1fr_120px_120px_120px_80px]
                gap-3 bg-white px-4 py-3 text-sm text-gray-500
                border-b border-[var(--dni-cart-border)] rounded-sm
            "
        >
            {/* CHECKBOX */}
            <div className="flex justify-center items-center">
                <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={e =>
                        dispatch(toggleAllSelection(e.target.checked))
                    }
                    className="h-4 w-4 accent-emerald-600 border-gray-300"
                />
            </div>

            <div className="text-gray-900">Product</div>
            <div className="text-center">Unit Price</div>
            <div className="text-center">Quantity</div>
            <div className="text-center">Total Price</div>
            <div className="text-center">Actions</div>
        </div>
    )
}

export default CartHeader