import type { CheckoutDeliveryCompany } from '@/features/shipping/hooks/useCheckoutDeliveryCompany'

type CheckoutDeliveryCompanySelectProps = {
  companies: CheckoutDeliveryCompany[]
  selectedId: string
  disabledCompanyIds?: string[]
  loading: boolean
  error: string
  onSelect: (id: string) => void
}

const CheckoutDeliveryCompanySelect = ({
  companies,
  selectedId,
  disabledCompanyIds = [],
  loading,
  error,
  onSelect,
}: CheckoutDeliveryCompanySelectProps) => {
  if (loading) {
    return <p className="text-sm text-gray-600">Loading delivery companies...</p>
  }

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>
  }

  if (companies.length === 0) {
    return <p className="text-sm text-gray-600">No delivery company is available right now.</p>
  }

  return (
    <div className="flex flex-nowrap gap-2">
      {companies.map((company) => {
        const selected = company.id === selectedId
        const disabled = disabledCompanyIds.includes(company.id)
        return (
          <button
            key={company.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(company.id)}
            aria-pressed={selected}
            title={disabled ? 'No district route for this company' : undefined}
            className={`relative flex min-w-0 flex-1 items-center gap-3 rounded-md border px-3 py-2.5 pr-8 text-left transition ${
              disabled
                ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-50'
                : selected
                  ? 'cursor-pointer border-emerald-600 bg-[#f0faf7]'
                  : 'cursor-pointer border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <span
              className={`absolute right-2 top-2 inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                selected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300 bg-white'
              }`}
            >
              {selected && (
                <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M3.5 8.5 6.5 11.5 12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-sm border border-gray-200 bg-white object-contain md:h-14 md:w-14"
              />
            ) : null}
            <span className="min-w-0">
              <span className="block truncate text-sm text-gray-900 sm:text-[15px]">{company.name}</span>
              {company.description && (
                <span className="mt-0.5 block truncate text-xs text-gray-500">{company.description}</span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default CheckoutDeliveryCompanySelect
