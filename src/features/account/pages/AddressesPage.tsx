import { FormEvent, useEffect, useState } from 'react'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { useAppSelector } from '@/app/hooks'
import { selectAuthUser } from '@/features/auth/store/authSelectors'
import { addressApi } from '../api/addressApi'
import type { UpsertAddressPayload, UserAddressDto } from '../types/addressTypes'

const AddressesPage = () => {
  const { openModal } = useGlobalModal()
  const authUser = useAppSelector(selectAuthUser)

  const [addresses, setAddresses] = useState<UserAddressDto[]>([])
  const [loading, setLoading] = useState(false)

  const [formValues, setFormValues] = useState({
    fullName: '',
    phoneNumber: '',
    postalCode: '',
    unitNo: '',
    addressLine: '',
    labelAs: 'HOME' as 'HOME' | 'OFFICE',
    isDefault: false,
  })

  const fetchAddresses = async () => {
    if (!authUser?.id) return
    setLoading(true)
    try {
      const res = await addressApi.list(authUser.id)
      setAddresses(res.data.data.addresses)
    } catch {
      // swallow for now; you can add toast here
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAddresses()
  }, [authUser?.id])

  const openNewAddressModal = () => {
    setFormValues({
      fullName: '',
      phoneNumber: '',
      postalCode: '',
      unitNo: '',
      addressLine: '',
      labelAs: 'HOME',
      isDefault: false,
    })

    const handleSubmit = async (e?: FormEvent) => {
      if (e) e.preventDefault()
      if (!authUser?.id) return

      const payload: UpsertAddressPayload = {
        type: formValues.labelAs,
        label: formValues.labelAs === 'HOME' ? 'Home' : 'Work',
        full_name: formValues.fullName,
        phone_number: formValues.phoneNumber,
        line1: formValues.addressLine,
        line2: formValues.unitNo || null,
        line3: null,
        postal_code: formValues.postalCode || null,
        is_default: formValues.isDefault,
        is_shipping: true,
        is_billing: false,
      }

      await addressApi.create(authUser.id, payload)
      await fetchAddresses()
    }

    openModal({
      title: 'New Address',
      content: (
        <form
          className="space-y-4"
          onSubmit={handleSubmit}
        >
          {/* Row 1: Full name / Phone number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={formValues.fullName}
              onChange={(e) => setFormValues((v) => ({ ...v, fullName: e.target.value }))}
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <input
              type="text"
              placeholder="Phone Number"
              value={formValues.phoneNumber}
              onChange={(e) => setFormValues((v) => ({ ...v, phoneNumber: e.target.value }))}
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Row 2: Postal code / Unit no (2 columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Postal Code"
              value={formValues.postalCode}
              onChange={(e) => setFormValues((v) => ({ ...v, postalCode: e.target.value }))}
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <input
              type="text"
              placeholder="Unit No (Optional)"
              value={formValues.unitNo}
              onChange={(e) => setFormValues((v) => ({ ...v, unitNo: e.target.value }))}
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Row 3: Long address field spanning both columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Building, Street, and etc."
              value={formValues.addressLine}
              onChange={(e) => setFormValues((v) => ({ ...v, addressLine: e.target.value }))}
              className="md:col-span-2 w-full border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-gray-700">Label As:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormValues((v) => ({ ...v, labelAs: 'HOME' }))}
                className={`px-4 py-1 text-xs font-medium rounded-sm cursor-pointer border ${
                  formValues.labelAs === 'HOME'
                    ? 'bg-gray-50 border-gray-400 text-gray-900'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => setFormValues((v) => ({ ...v, labelAs: 'OFFICE' }))}
                className={`px-4 py-1 text-xs font-medium rounded-sm cursor-pointer border ${
                  formValues.labelAs === 'OFFICE'
                    ? 'bg-gray-50 border-gray-400 text-gray-900'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                Work
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={formValues.isDefault}
              onChange={(e) => setFormValues((v) => ({ ...v, isDefault: e.target.checked }))}
              className="h-4 w-4 border-gray-300 rounded-sm text-orange-500 focus:ring-orange-500"
            />
            <span>Set as Default Address</span>
          </label>
        </form>
      ),
      primaryLabel: 'Submit',
      secondaryLabel: 'Cancel',
      onPrimary: handleSubmit,
    })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
        <h1 className="text-lg font-medium text-gray-900">My Addresses</h1>
        <button
          type="button"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-sm hover:bg-orange-600 transition-colors cursor-pointer"
          onClick={openNewAddressModal}
        >
          + Add New Address
        </button>
      </div>

      <div className="space-y-4">
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
                      <span className="text-gray-600">{addr.phone_number}</span>
                    </div>
                    <p className="text-gray-700">{addr.line1}</p>
                    {addr.line2 && <p className="text-gray-700">{addr.line2}</p>}
                    {addr.postal_code && <p className="text-gray-700">{addr.postal_code}</p>}
                    {addr.is_default && (
                      <span className="inline-flex items-center px-2 py-[2px] text-[10px] font-medium text-orange-600 border border-orange-500 rounded-sm">
                        Default
                      </span>
                    )}
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
                    {!addr.is_default && (
                      <button
                        type="button"
                        className="px-3 py-1 border border-gray-300 rounded-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
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

