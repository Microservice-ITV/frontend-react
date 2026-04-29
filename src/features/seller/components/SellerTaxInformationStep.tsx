import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { SellerTaxDraft } from '../types/sellerRegistrationTypes'

export type SellerTaxErrors = Partial<Record<keyof SellerTaxDraft, string>>

const FieldRow = ({
    label,
    required,
    labelAlignTop,
    children,
    error,
}: {
    label: string
    required?: boolean
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

type Props = {
    value: SellerTaxDraft
    onChange: Dispatch<SetStateAction<SellerTaxDraft>>
    errors: SellerTaxErrors
}

const SellerTaxInformationStep = ({ value, onChange, errors }: Props) => {
    const setField = <K extends keyof SellerTaxDraft>(key: K, v: SellerTaxDraft[K]) => {
        onChange((prev) => ({ ...prev, [key]: v }))
    }

    return (
        <div className="space-y-6 sm:space-y-7">
            <div className="rounded-sm border border-sky-200/90 bg-sky-50/90 px-4 py-3 text-sm text-sky-950">
                Myanmar does not use the same VAT/GST-style seller tax profile as some other marketplaces. For now we
                only need a short confirmation. If regulations or your payout partner require tax or registration details
                later, we will add fields here.
            </div>

            <FieldRow label="Notes" labelAlignTop>
                <textarea
                    value={value.notes}
                    onChange={(e) => setField('notes', e.target.value)}
                    rows={3}
                    className="w-full rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[var(--dni-primary)] focus:ring-1 focus:ring-[var(--dni-primary)]"
                    placeholder="Optional — e.g. company registration reference"
                />
            </FieldRow>

            <FieldRow label="Confirmation" required error={errors.infoConfirmed} labelAlignTop>
                <label className="flex cursor-pointer items-start gap-2.5 text-sm text-gray-900">
                    <input
                        type="checkbox"
                        checked={value.infoConfirmed}
                        onChange={(e) => setField('infoConfirmed', e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--dni-primary)] focus:ring-[var(--dni-primary)]"
                    />
                    <span>
                        I confirm that the shop and identification information I provided is accurate. I understand
                        additional business or tax details may be requested later if required.
                    </span>
                </label>
            </FieldRow>
        </div>
    )
}

export default SellerTaxInformationStep
