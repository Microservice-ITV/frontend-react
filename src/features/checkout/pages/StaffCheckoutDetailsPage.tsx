import { useAppSelector } from '@/app/hooks'
import type { UserAddress } from '@/features/account/types/addressTypes'
import { selectAuthUser } from '@/features/auth/store/authSelectors'
import { selectSelectedItems } from '@/features/cart/store/cartSelectors'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { loadAllCities, type CityOptionWithState } from '@/features/admin/api/locationOptions'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { UserRound } from 'lucide-react'
import {
  isShopStaffUser,
  writeStaffCheckoutAddress,
} from '../utils/staffCheckoutCustomer'

const fieldLabelClass = 'mb-1 block text-sm font-semibold text-gray-900'
const fieldClass =
  'w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600'

const StaffCheckoutDetailsPage = () => {
  const navigate = useNavigate()
  const authUser = useAppSelector(selectAuthUser)
  const items = useAppSelector(selectSelectedItems)
  const staffCheckout = isShopStaffUser(authUser)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [address, setAddress] = useState('')
  const [cities, setCities] = useState<CityOptionWithState[]>([])
  const [selectedCityId, setSelectedCityId] = useState('')

  useEffect(() => {
    let cancelled = false
    void loadAllCities()
      .then((list) => {
        if (!cancelled) setCities(list)
      })
      .catch(() => {
        if (!cancelled) setCities([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const selectedCity = useMemo(
    () => cities.find((city) => city.id === selectedCityId) ?? null,
    [cities, selectedCityId],
  )

  const phoneE164 = useMemo(() => {
    const digits = String(phone ?? '').replace(/\D/g, '')
    if (digits.length === 11 && digits.startsWith('0')) return `+95${digits.slice(1)}`
    if (digits.length === 10 && digits.startsWith('9')) return `+95${digits}`
    return ''
  }, [phone])

  const phoneError =
    phoneTouched && phone.length > 0 && !phoneE164
      ? 'Enter a valid Myanmar phone number (9xxxxxxxxx or 09xxxxxxxxx).'
      : null

  const deliveryAddress: UserAddress | null = useMemo(() => {
    if (!fullName.trim() || !phoneE164 || !selectedCity || !address.trim()) return null
    return {
      address_id: `staff-customer-${authUser?.id ?? 'checkout'}`,
      country_code: 'MM',
      country: 'Myanmar',
      state_id: selectedCity.stateId,
      city_id: Number(selectedCity.id),
      district_id: null,
      ward_id: null,
      state: selectedCity.stateName,
      city: selectedCity.name,
      district: null,
      ward: null,
      address_line_1: address.trim(),
      address_line_2: null,
      postal_code: null,
      latitude: null,
      longitude: null,
      type: null,
      label: 'Customer',
      full_name: fullName.trim(),
      phone_no: phoneE164,
      email: null,
      delivery_note: null,
      is_default: false,
      is_shipping: true,
      is_billing: false,
    }
  }, [address, authUser?.id, fullName, phoneE164, selectedCity])

  if (!staffCheckout) {
    return <Navigate to="/checkout" replace />
  }

  if (items.length === 0) {
    return <Navigate to="/cart" replace />
  }

  const continueToCheckout = () => {
    if (!deliveryAddress) return
    writeStaffCheckoutAddress(deliveryAddress)
    navigate('/checkout')
  }

  return (
    <div className="bg-gray-50 px-4 pt-8 pb-12">
      <div className="mx-auto w-full max-w-3xl">
        <Card className="p-6">
          <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <UserRound className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            Customer details
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter the customer’s name, phone, city, and address. These details are used when you place the order.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="staff-customer-name" className={fieldLabelClass}>
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="staff-customer-name"
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="staff-customer-phone" className={fieldLabelClass}>
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="flex w-full">
                <div className="flex items-center rounded-l-sm border border-gray-300 bg-gray-50 px-3 text-sm text-gray-700">
                  +95
                </div>
                <input
                  id="staff-customer-phone"
                  type="text"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="9xxxxxxxxx"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value.replace(/\D/g, '').slice(0, 11))
                  }}
                  onBlur={() => setPhoneTouched(true)}
                  maxLength={11}
                  aria-invalid={!!phoneError}
                  aria-describedby={phoneError ? 'staff-customer-phone-error' : undefined}
                  className={`w-full rounded-r-sm border border-l-0 px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                    phoneError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-emerald-600'
                  }`}
                />
              </div>
              {phoneError && (
                <p id="staff-customer-phone-error" role="alert" className="mt-1 text-xs text-red-600">
                  {phoneError}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label htmlFor="staff-customer-city" className={fieldLabelClass}>
                City <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                id="staff-customer-city"
                placeholder="Search city..."
                emptyLabel="Select City"
                options={cities.map((city) => ({ value: city.id, label: city.name }))}
                value={selectedCityId}
                onChange={setSelectedCityId}
                disabled={cities.length === 0}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="staff-customer-address" className={fieldLabelClass}>
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="staff-customer-address"
                rows={3}
                placeholder="Street Name, Building, House No..."
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className={`${fieldClass} resize-y leading-5`}
              />
            </div>
          </div>

          <div className="mt-4">
            <Button type="button" disabled={!deliveryAddress} onClick={continueToCheckout}>
              Continue to checkout
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default StaffCheckoutDetailsPage
