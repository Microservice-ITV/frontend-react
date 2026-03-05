import { MapPin } from 'lucide-react'
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectAuthUser } from '@/features/auth/store/authSelectors'
import { fetchUserAddresses } from '@/features/account/store/accountThunks'
import { selectDefaultAddress, selectAccountAddressesLoading } from '@/features/account/store/accountSelectors'

const CheckoutAddress = () => {
  const dispatch = useAppDispatch()
  const authUser = useAppSelector(selectAuthUser)
  const defaultAddress = useAppSelector(selectDefaultAddress)
  const loading = useAppSelector(selectAccountAddressesLoading)

  useEffect(() => {
    if (!authUser?.id) return
    void dispatch(fetchUserAddresses(authUser.id))
  }, [authUser?.id, dispatch])

  const locationText = [defaultAddress?.state, defaultAddress?.city, defaultAddress?.district, defaultAddress?.ward]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="bg-white">
      {/* DNI dashed top border */}
      <div className="h-[4px] bg-[repeating-linear-gradient(150deg,_#f18d9b_0_22px,_transparent_22px_36px,_#6fa6d6_36px_58px,_transparent_58px_72px)]" />

      <div className="px-6 py-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-[#ee4d2d]" />
          <span className="text-[#ee4d2d] text-base font-medium">Delivery Address</span>
        </div>

        {!loading && !defaultAddress && (
          <div className="text-sm text-gray-600">No saved address yet. Please add one from My Addresses.</div>
        )}

        {(loading || defaultAddress) && (
          <div className="flex items-center text-sm text-gray-900">
            <span className="font-semibold mr-6 whitespace-nowrap">
              {loading
                ? 'Loading...'
                : `${defaultAddress?.full_name ?? ''} ${defaultAddress?.phone_no ?? ''}`.trim()}
            </span>

            <span className="truncate max-w-[620px] mr-4">
              {loading
                ? 'Loading delivery address...'
                : [locationText, defaultAddress?.address_line_1, defaultAddress?.address_line_2, defaultAddress?.postal_code]
                    .filter(Boolean)
                    .join(', ')}
            </span>

            {defaultAddress?.is_default && (
              <span className="mr-6 text-xs text-[#ee4d2d] border border-[#ee4d2d] px-2 py-[1px]">
                Default
              </span>
            )}

            <button className="text-sm text-[#0055aa] cursor-pointer">
              Change
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CheckoutAddress