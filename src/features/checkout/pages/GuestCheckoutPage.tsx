import { useAppDispatch, useAppSelector } from '@/app/hooks'
import type { UserAddress } from '@/features/account/types/addressTypes'
import { selectSelectedItems } from '@/features/cart/store/cartSelectors'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { guestCheckoutCart } from '../store/checkoutThunks'
import { clearCheckout, setCheckoutError } from '../store/checkoutSlice'
import { locationApi, type CityOption } from '@/features/account/api/locationApi'

function getOrCreateGuestId(): string {
  try {
    const key = 'dni.guest_id'
    const existing = sessionStorage.getItem(key)
    if (existing) return existing
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`
    sessionStorage.setItem(key, id)
    return id
  } catch {
    return `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
}

const GuestCheckoutPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const items = useAppSelector(selectSelectedItems)
  const { loading } = useAppSelector((state) => state.checkout)

  const entryOk = useMemo(() => {
    try {
      return sessionStorage.getItem('dni.guest_checkout.entry_ok') === '1'
    } catch {
      return false
    }
  }, [])

  // Protect manual URL access: guest form can only be reached via cart modal flow.
  if (!entryOk || items.length === 0) {
    return <Navigate to="/cart" replace />
  }

  const [guestId] = useState<string>(() => getOrCreateGuestId())
  const [fullName, setFullName] = useState('')
  // Store digits only (no +95 prefix)
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [cities, setCities] = useState<CityOption[]>([])
  const [selectedCityId, setSelectedCityId] = useState<string>('')
  const selectedCity = useMemo(
    () => cities.find((c) => String(c.id) === selectedCityId) ?? null,
    [cities, selectedCityId],
  )

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const announcement = 'Guest checkout is available without registration, but discounts and member-only benefits won’t apply.'

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await locationApi.getAllCities()
        const list =
          (res as any)?.data?.data?.cities ??
          (res as any)?.data?.cities ??
          []
        if (cancelled) return
        setCities(Array.isArray(list) ? list : [])
      } catch {
        if (!cancelled) setCities([])
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const phoneE164 = useMemo(() => {
    const digits = String(phone ?? '').replace(/\D/g, '')
    // Accept Myanmar local formats:
    // - 09xxxxxxxxx (11 digits, starts with 0)
    // - 9xxxxxxxxx  (10 digits, starts with 9) because +95 prefix is shown in UI
    if (digits.length === 11 && digits.startsWith('0')) {
      return `+95${digits.slice(1)}`
    }
    if (digits.length === 10 && digits.startsWith('9')) {
      return `+95${digits}`
    }
    return ''
  }, [phone])

  const deliveryAddress: UserAddress | null = useMemo(() => {
    if (!fullName.trim() || !phoneE164 || !selectedCity || !address.trim()) return null

    return {
      address_id: `guest-${guestId}`,
      country_code: 'MM',
      country: 'Myanmar',
      state_id: null,
      city_id: selectedCity.id,
      district_id: null,
      ward_id: null,
      state: null,
      city: selectedCity.name,
      district: null,
      ward: null,
      address_line_1: address.trim(),
      address_line_2: null,
      postal_code: null,
      latitude: null,
      longitude: null,
      type: null,
      label: 'Guest Address',
      full_name: fullName.trim(),
      phone_no: phoneE164,
      email: null,
      delivery_note: null,
      is_default: false,
      is_shipping: true,
      is_billing: false,
    }
  }, [fullName, phoneE164, selectedCity, address, guestId])

  const missingRequired = useMemo(() => {
    const missing: string[] = []
    if (!fullName.trim()) missing.push('Full name')
    if (!phoneE164) missing.push('Phone number')
    if (!selectedCity) missing.push('City')
    if (!address.trim()) missing.push('Address')
    if (items.length === 0) missing.push('Selected item(s)')
    return missing
  }, [fullName, phoneE164, selectedCity, address, items.length])

  const canContinue =
    !!deliveryAddress &&
    items.length > 0 &&
    !loading &&
    !submitting

  const continueToPayment = async () => {
    if (!deliveryAddress) return

    const cartKey = items
      .map((item) => `${item.productId}:${item.variantId ?? ''}:${item.quantity}`)
      .sort()
      .join('|')

    dispatch(setCheckoutError(null))
    dispatch(clearCheckout())
    setSubmitting(true)
    setSubmitError(null)

    try {
      const result = await dispatch(
        guestCheckoutCart({
          guest_id: guestId,
          delivery_address: {
            full_name: deliveryAddress.full_name,
            phone_no: deliveryAddress.phone_no,
            email: deliveryAddress.email ?? null,
            country_code: deliveryAddress.country_code || 'MM',
            country: deliveryAddress.country ?? '',
            state: deliveryAddress.state ?? '',
            city: deliveryAddress.city ?? '',
            district: deliveryAddress.district ?? '',
            ward: deliveryAddress.ward ?? '',
            address_line_1: deliveryAddress.address_line_1,
            address_line_2: deliveryAddress.address_line_2 ?? null,
            postal_code: deliveryAddress.postal_code ?? null,
            latitude: deliveryAddress.latitude ?? null,
            longitude: deliveryAddress.longitude ?? null,
            delivery_note: deliveryAddress.delivery_note ?? null,
          },
        }),
      ).unwrap()

      try {
        sessionStorage.setItem('dni.guest_checkout.delivery_address', JSON.stringify(deliveryAddress))
        sessionStorage.setItem('dni.guest_checkout.cart_key', cartKey)
        const checkoutId =
          (result as any)?.checkout_id ??
          (result as any)?.checkout?.checkout_id ??
          (result as any)?.checkout?.id ??
          null
        if (checkoutId) {
          sessionStorage.setItem('dni.guest_checkout.checkout_id', String(checkoutId))
        }
      } catch {
        // ignore
      }

      navigate('/checkout', { replace: true })
    } catch (e: any) {
      const message =
        typeof e === 'string'
          ? e
          : e?.message ??
            e?.response?.data?.message ??
            e?.response?.data?.error ??
            'Unable to start checkout. Please try again.'
      setSubmitError(String(message))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-50 px-4 pt-8 pb-12">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <Card className="p-6">
          <h1 className="text-lg font-semibold text-gray-900">Guest checkout</h1>
          <p className="mt-2 text-sm text-gray-600">{announcement}</p>

          {items.length === 0 && (
            <div className="mt-4 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              No items selected. Go back to cart and select item(s) to checkout.
            </div>
          )}

          {submitError && (
            <div className="mt-4 rounded-sm border border-red-200 bg-[#fff6f6] px-3 py-2 text-xs text-red-700" role="alert">
              {submitError}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 border-gray-300 focus:ring-emerald-600"
              />
            </div>
            <div>
              <div className="flex w-full">
                <div className="flex items-center rounded-l-sm border border-gray-300 bg-gray-50 px-3 text-sm text-gray-700">
                  +95
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="9xxxxxxxxx"
                  value={phone}
                  onChange={(e) => {
                    const next = e.target.value.replace(/\D/g, '').slice(0, 11)
                    setPhone(next)
                  }}
                  maxLength={11}
                  className="w-full border border-l-0 rounded-r-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 border-gray-300 focus:ring-emerald-600"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <SearchableSelect
                placeholder="Search city..."
                emptyLabel="Select City"
                options={cities.map((c) => ({ value: String(c.id), label: c.name }))}
                value={selectedCityId}
                onChange={setSelectedCityId}
                disabled={cities.length === 0}
              />
            </div>
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Street Name, Building, House No..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 border-gray-300 focus:ring-emerald-600"
              />
            </div>
          </div>

          {!canContinue && missingRequired.length > 0 && (
            <div className="mt-3 text-xs text-gray-500">
              Required: {missingRequired.join(', ')}
            </div>
          )}

          <div className="mt-4">
            <Button
              type="button"
              loading={submitting}
              disabled={!canContinue}
              onClick={() => void continueToPayment()}
              className="md:max-w-sm"
            >
              Continue to payment
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default GuestCheckoutPage

