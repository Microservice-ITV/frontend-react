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

  return (
    <div className="bg-white">
      {/* DNI dashed top border */}
      <div className="h-[4px] bg-[repeating-linear-gradient(150deg,_#f18d9b_0_22px,_transparent_22px_36px,_#6fa6d6_36px_58px,_transparent_58px_72px)]" />

      <div className="px-6 py-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span className="text-emerald-600 text-base font-medium">Delivery Address</span>
        </div>

        {!loading && !address && (
          <div className="text-sm text-gray-600">No saved address yet. Please add one from My Addresses.</div>
        )}

        {(loading || address) && (
          <div className="flex items-center text-sm text-gray-900">
            <span className="font-semibold mr-6 whitespace-nowrap">
              {loading
                ? 'Loading...'
                : `${address?.full_name ?? ''} ${address?.phone_no ?? ''}`.trim()}
            </span>

            <span className="truncate max-w-[620px] mr-4">
              {loading
                ? 'Loading delivery address...'
                : [locationText, address?.address_line_1, address?.address_line_2, address?.postal_code]
                    .filter(Boolean)
                    .join(', ')}
            </span>

            {address?.is_default && (
              <span className="mr-6 text-xs text-emerald-600 border border-emerald-600 px-2 py-[1px]">
                Default
              </span>
            )}

            <button
              type="button"
              className="text-sm text-[#0055aa] cursor-pointer"
              onClick={onChangeAddress}
            >
              Change
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CheckoutAddress