import { useEffect } from 'react'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectAuthUser } from '@/features/auth/store/authSelectors'
import { NewAddressModal } from '../components/NewAddressModal'
import {
  selectAccountAddresses,
  selectAccountAddressesLoading,
  selectAccountAddressesMutating,
  selectAccountAddressesError,
} from '../store/accountSelectors'
import { fetchUserAddresses, deleteUserAddress, setDefaultUserAddress } from '../store/accountThunks'
import type { UserAddress } from '../types/addressTypes'

const AddressesPage = () => {
  const dispatch = useAppDispatch()
  const { openModal } = useGlobalModal()
  const authUser = useAppSelector(selectAuthUser)
  const addresses = useAppSelector(selectAccountAddresses)
  const loading = useAppSelector(selectAccountAddressesLoading)
  const mutating = useAppSelector(selectAccountAddressesMutating)
  const accountError = useAppSelector(selectAccountAddressesError)

  useEffect(() => {
    if (!authUser?.id) return
    void dispatch(fetchUserAddresses(authUser.id))
  }, [authUser?.id, dispatch])

  const refreshAddresses = async () => {
    if (!authUser?.id) return
    await dispatch(fetchUserAddresses(authUser.id)).unwrap()
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!authUser?.id) return

    const target = addresses.find((addr) => addr.address_id === addressId)
    if (!target) return

    const hasOtherAddresses = addresses.length > 1
    const deletingDefaultAddress = target.is_default

    openModal({
      title: 'Delete Address',
      primaryLabel: 'Delete',
      secondaryLabel: 'Cancel',
      content: (
        <div className="space-y-2 text-sm text-gray-700">
          <p>Are you sure you want to delete this address?</p>
          {deletingDefaultAddress && hasOtherAddresses && (
            <p className="text-emerald-700">
              This is your default address. After deletion, we will set another saved address as default.
            </p>
          )}
          {deletingDefaultAddress && !hasOtherAddresses && (
            <p className="text-emerald-700">
              This is your only default address. After deletion, you will have no default address.
            </p>
          )}
        </div>
      ),
      onPrimary: async () => {
        const deleteAction = await dispatch(deleteUserAddress({ userId: authUser.id, addressId }))
        if (deleteUserAddress.rejected.match(deleteAction)) {
          throw new Error((deleteAction.payload as string) ?? 'Failed to delete address.')
        }

        const refreshAction = await dispatch(fetchUserAddresses(authUser.id))
        if (fetchUserAddresses.rejected.match(refreshAction)) {
          throw new Error((refreshAction.payload as string) ?? 'Failed to refresh addresses.')
        }

        const refreshed = refreshAction.payload
        const hasDefault = refreshed.some((addr) => addr.is_default)

        if (deletingDefaultAddress && refreshed.length > 0 && !hasDefault) {
          const setDefaultAction = await dispatch(
            setDefaultUserAddress({
              userId: authUser.id,
              addressId: refreshed[0].address_id,
            }),
          )
          if (setDefaultUserAddress.rejected.match(setDefaultAction)) {
            throw new Error((setDefaultAction.payload as string) ?? 'Failed to set fallback default address.')
          }

          await dispatch(fetchUserAddresses(authUser.id))
        }
      },
    })
  }

  const handleSetDefaultAddress = async (addressId: string) => {
    if (!authUser?.id) return
    await dispatch(setDefaultUserAddress({ userId: authUser.id, addressId }))
  }

  const openNewAddressModal = () => {
    openModal({
      title: 'New Address',
      content: <NewAddressModal mode="create" onSaved={refreshAddresses} />,
      hidePrimary: true,
      hideSecondary: true,
    })
  }

  const openEditAddressModal = (address: UserAddress) => {
    openModal({
      title: 'Edit Address',
      content: <NewAddressModal mode="edit" initialAddress={address} onSaved={refreshAddresses} />,
      hidePrimary: true,
      hideSecondary: true,
    })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
        <h1 className="text-lg font-medium text-gray-900">My Addresses</h1>
        <button
          type="button"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-sm hover:bg-emerald-700 transition-colors cursor-pointer"
          onClick={openNewAddressModal}
        >
          + Add New Address
        </button>
      </div>

      <div className="space-y-4">
        {accountError && (
          <div className="px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-sm">
            {accountError}
          </div>
        )}

        {/* Address list */}
        <section className="border border-gray-200 rounded-sm">
          <div className="px-5 py-3 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-900">Address</h2>
          </div>

          <div className="divide-y divide-gray-200 text-sm">
            {loading && (
              <div className="px-5 py-3 text-gray-500 text-sm">Loading addresses...</div>
            )}
            {!loading && addresses.length === 0 && (
              <div className="px-5 py-3 text-gray-500 text-sm">
                You have not added any addresses yet.
              </div>
            )}
            {!loading &&
              addresses.map((addr) => (
                <div
                  key={addr.address_id}
                  className="px-5 py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{addr.full_name}</span>
                      <span className="text-gray-600">{addr.phone_no}</span>
                    </div>
                    <p className="text-gray-700">
                      {[addr.state, addr.city, addr.district, addr.ward]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    <p className="text-gray-700">{addr.address_line_1}</p>
                    {addr.address_line_2 && <p className="text-gray-700">{addr.address_line_2}</p>}
                    {addr.postal_code && <p className="text-gray-700">{addr.postal_code}</p>}
                    {addr.is_default && (
                      <span className="inline-flex items-center px-2 py-[2px] text-[10px] font-medium text-emerald-700 border border-emerald-600 rounded-sm">
                        Default
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 text-xs sm:text-sm">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        className="text-blue-500 hover:underline cursor-pointer"
                        onClick={() => openEditAddressModal(addr)}
                        disabled={mutating}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-blue-500 hover:underline cursor-pointer"
                        onClick={() => void handleDeleteAddress(addr.address_id)}
                        disabled={mutating}
                      >
                        Delete
                      </button>
                    </div>
                    {!addr.is_default && (
                      <button
                        type="button"
                        className="px-3 py-1 border border-gray-300 rounded-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                        onClick={() => void handleSetDefaultAddress(addr.address_id)}
                        disabled={mutating}
                      >
                        Set as default
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* Used collection points */}
        <section className="border border-gray-200 rounded-sm">
          <div className="px-5 py-3 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-900">Used Collection Points</h2>
          </div>

          <div className="px-5 py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 text-sm">
            {/* TODO: Replace static collection point items below by mapping over real collection point data. */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">Aung Zin Latt</span>
                <span className="text-gray-600">(+65) 989 26222</span>
              </div>
              <p className="text-gray-700">
                Residential Point @ 109 Bishan St 12, #06-178, S570109 (lift landing)
              </p>
              <p className="text-gray-700">
                109 Bishan St 12, #06-178, Singapore, 570109
              </p>
              <span className="inline-flex items-center px-2 py-[2px] text-[10px] font-medium text-gray-700 border border-gray-300 rounded-sm">
                SPX Collection Point
              </span>
            </div>

            <div className="flex flex-col items-end gap-2 text-xs sm:text-sm">
              <div className="flex gap-3">
                <button
                  type="button"
                  className="text-blue-500 hover:underline cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-blue-500 hover:underline cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AddressesPage

