import type { ReactNode } from 'react'
import type { SellerShopInfoDraft } from '../types/sellerRegistrationTypes'

const SHOP_NAME_MAX = 30

type Props = {
    value: SellerShopInfoDraft
    onChange: (next: SellerShopInfoDraft) => void
    errors: Partial<Record<keyof SellerShopInfoDraft, string>>
    hasPickupAddress: boolean
    onAddPickup: () => void
    onEditPickup: () => void
}

/** Shopee-style row: label column (right-aligned on sm+) + control column. */
const FieldRow = ({
    label,
    required,
    labelAlignTop,
    children,
    error,
}: {
    label: string
    required?: boolean
    /** Use when control is multi-line (pickup box). */
    labelAlignTop?: boolean
    children: ReactNode
    error?: string
}) => (
    <div
        className={`grid grid-cols-1 gap-x-8 gap-y-1.5 sm:grid-cols-[minmax(140px,200px)_1fr] ${
            labelAlignTop ? 'sm:items-start' : 'sm:items-center'
        }`}
    >
        <div className={`text-sm text-gray-800 sm:text-right ${labelAlignTop ? 'sm:pt-2.5' : ''}`}>
            {required && <span className="text-red-500">*</span>}
            {label}
        </div>
        <div className="min-w-0">
            {children}
            {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        </div>
    </div>
)

const SellerShopInformationStep = ({
    value,
    onChange,
    errors,
    hasPickupAddress,
    onAddPickup,
    onEditPickup,
}: Props) => {
    const setField = <K extends keyof SellerShopInfoDraft>(key: K, v: SellerShopInfoDraft[K]) => {
        onChange({ ...value, [key]: v })
    }

    const phoneDisplay = value.phone.trim() || '—'

    return (
        <div className="space-y-6 sm:space-y-7">
            <FieldRow label="Shop Name" required error={errors.shopName}>
                <div className="relative">
                    <input
                        type="text"
                        maxLength={SHOP_NAME_MAX}
                        value={value.shopName}
                        onChange={(e) => setField('shopName', e.target.value)}
                        className="h-10 w-full rounded-sm border border-gray-300 bg-white px-3 py-2 pr-16 text-sm text-gray-900 outline-none transition-colors focus:border-[var(--dni-primary)] focus:ring-1 focus:ring-[var(--dni-primary)]"
                        placeholder="Your shop name"
                        autoComplete="organization"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-gray-400">
                        {value.shopName.length}/{SHOP_NAME_MAX}
                    </span>
                </div>
            </FieldRow>

            <FieldRow label="Pickup address" required labelAlignTop error={errors.pickupAddress}>
                {!hasPickupAddress ? (
                    <button
                        type="button"
                        onClick={onAddPickup}
                        className="h-10 rounded-sm border border-gray-300 bg-white px-5 text-sm text-gray-800 shadow-sm hover:bg-gray-50 cursor-pointer"
                    >
                        + Add
                    </button>
                ) : (
                    <div className="rounded-sm border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
                        <p className="text-sm leading-relaxed text-gray-900">{value.pickupAddress}</p>
                        <button
                            type="button"
                            onClick={onEditPickup}
                            className="mt-2 text-sm font-normal text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                        >
                            Edit
                        </button>
                    </div>
                )}
            </FieldRow>

            <FieldRow label="Email" required>
                <input
                    type="email"
                    readOnly
                    tabIndex={-1}
                    value={value.email}
                    className="h-10 w-full cursor-not-allowed rounded-sm border border-gray-200 bg-gray-100 px-3 text-sm text-gray-800"
                />
            </FieldRow>

            <FieldRow label="Phone number" required error={errors.phone}>
                <p className="py-2 text-sm leading-normal text-gray-900">{phoneDisplay}</p>
            </FieldRow>
        </div>
    )
}

export default SellerShopInformationStep
