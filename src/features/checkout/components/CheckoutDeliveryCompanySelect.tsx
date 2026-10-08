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

  const imageOnly = companies.length > 4

  return (
    <div className={`flex flex-nowrap items-center ${imageOnly ? 'w-full justify-between' : 'gap-2'}`}>
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
            aria-label={company.name}
            title={disabled ? `${company.name}: no district route for this company` : company.name}
            className={`relative flex items-center overflow-hidden rounded-sm border text-left transition ${
              imageOnly ? 'w-fit shrink-0 gap-2 p-1.5' : 'min-w-0 flex-1 gap-3 px-3 py-2.5'
            } ${
              disabled
                ? 'cursor-not-allowed border-amber-300 bg-amber-50'
                : selected
                  ? 'cursor-pointer border-emerald-600 bg-[#f0faf7]'
                  : 'cursor-pointer border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            {disabled && (
              <span className="absolute inset-0 z-10 flex items-center justify-center bg-amber-50/90 px-1 text-center text-[11px] font-medium leading-tight text-amber-800">
                Not available
              </span>
            )}
            {selected && !disabled && (
              <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5 items-center justify-center bg-[#3d8c73]">
                <svg viewBox="0 0 12 12" className="h-3 w-3 fill-white" aria-hidden="true">
                  <path d="M5.2 10.9L.3 7c-.4-.4-.5-1-.1-1.4s1-.5 1.4-.1l3.4 3 5.1-7c.3-.4 1-.5 1.4-.2s.5 1 .2 1.4l-5.7 7.9z" />
                </svg>
              </span>
            )}
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-sm border border-gray-200 bg-white object-contain md:h-14 md:w-14"
              />
            ) : null}
            {imageOnly ? (
              <span className="block max-w-16 truncate text-xs text-gray-900">{company.name}</span>
            ) : (
              <span className="min-w-0">
                <span className="block truncate text-sm text-gray-900 sm:text-[15px]">{company.name}</span>
                {company.description && (
                  <span className="mt-0.5 block truncate text-xs text-gray-500">{company.description}</span>
                )}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default CheckoutDeliveryCompanySelect
