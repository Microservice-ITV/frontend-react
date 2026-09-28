import { MapPin } from 'lucide-react'
import type { UserAddress } from '@/features/account/types/addressTypes'

type CheckoutAddressProps = {
  address: UserAddress | null
  loading: boolean
  onChangeAddress: () => void
}

const CheckoutAddress = ({ address, loading, onChangeAddress }: CheckoutAddressProps) => {
  const locationText = [address?.state, address?.city, address?.district, address?.ward]
    .filter(Boolean)
    .join(', ')

  const contactText = `${address?.full_name ?? ''} ${address?.phone_no ?? ''}`.trim()
  const fullAddress = [locationText, address?.address_line_1, address?.address_line_2, address?.postal_code]
    .filter(Boolean)
    .join(', ')

  return (
    <section className="overflow-hidden rounded-sm border border-[var(--dni-cart-border)] bg-white">
      <div className="h-[3px] bg-[repeating-linear-gradient(150deg,_#f18d9b_0_22px,_transparent_22px_36px,_#6fa6d6_36px_58px,_transparent_58px_72px)]" />

      <div className="px-3 py-3 sm:px-4 sm:py-3.5">
        <div className="mb-2 flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-600 sm:text-[15px]">Delivery Address</span>
        </div>

        {!loading && !address && (
          <p className="text-sm text-gray-600">No saved address yet. Please add one from My Addresses.</p>
        )}

        {(loading || address) && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-gray-900 sm:text-[15px]">
                  {loading ? 'Loading...' : contactText}
                </p>
                {address?.is_default && (
                  <span className="border border-emerald-600 px-1.5 py-px text-[11px] text-emerald-600">
                    Default
                  </span>
                )}
              </div>
              <p className="mt-1 break-words text-sm leading-5 text-gray-700">
                {loading ? 'Loading delivery address...' : fullAddress}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 self-start text-sm font-medium text-[#0055aa] hover:underline"
              onClick={onChangeAddress}
            >
              Change
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default CheckoutAddress
