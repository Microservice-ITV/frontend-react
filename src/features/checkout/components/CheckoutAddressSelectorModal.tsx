import type { UserAddress } from '@/features/account/types/addressTypes'

type CheckoutAddressSelectorModalProps = {
  addresses: UserAddress[]
  selectedAddressId: string | null
  onSelectAddress: (addressId: string) => void
  onEditAddress: (address: UserAddress) => void
  onAddNewAddress: () => void
}

export const CheckoutAddressSelectorModal = ({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onEditAddress,
  onAddNewAddress,
}: CheckoutAddressSelectorModalProps) => {
  return (
    <div className="-mx-2 -my-1">
      <div className="max-h-[360px] overflow-y-auto px-2 pb-3">
        {addresses.map((address) => {
          const isSelected = selectedAddressId === address.address_id
          const locationText = [address.state, address.city, address.district, address.ward]
            .filter(Boolean)
            .join(', ')

          return (
            <button
              key={address.address_id}
              type="button"
              onClick={() => onSelectAddress(address.address_id)}
              className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                isSelected ? 'bg-orange-50/40' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                    isSelected ? 'border-orange-500' : 'border-gray-300'
                  }`}>
                    {isSelected && <span className="h-2 w-2 rounded-full bg-orange-500" />}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{address.full_name}</span>
                      <span className="text-gray-600">{address.phone_no}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">
                      {[locationText, address.address_line_1, address.address_line_2, address.postal_code]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {address.is_default && (
                      <span className="mt-2 inline-flex items-center px-2 py-[2px] text-[10px] font-medium text-orange-600 border border-orange-500 rounded-sm">
                        Default
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="text-sm text-[#0055aa] hover:underline cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditAddress(address)
                  }}
                >
                  Edit
                </button>
              </div>
            </button>
          )
        })}
      </div>

      <div className="border-t border-gray-200 pt-3 px-2 flex justify-end">
        <button
          type="button"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-sm hover:bg-orange-600 cursor-pointer"
          onClick={onAddNewAddress}
        >
          + Add New Address
        </button>
      </div>
    </div>
  )
}
