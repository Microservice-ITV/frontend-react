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
import { loadAllDistricts, type DistrictOptionWithCity } from '@/features/admin/api/locationOptions'
import {
  formatDisabledTaxAmount,
  isTaxChargeEnabled,
  resolveCartTax,
} from '../api/checkoutApi'
import { formatKsPrice } from '@/features/products/utils/formatProductPrice'

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

  const [guestId] = useState<string>(() => getOrCreateGuestId())
  const [fullName, setFullName] = useState('')
  // Store digits only (no +95 prefix)
  const [phone, setPhone] = useState('')
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [address, setAddress] = useState('')
  const [districts, setDistricts] = useState<DistrictOptionWithCity[]>([])
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('')
  const selectedDistrict = useMemo(
    () => districts.find((d) => d.id === selectedDistrictId) ?? null,
    [districts, selectedDistrictId],
  )

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [taxAmount, setTaxAmount] = useState(0)
  const [taxEnabled, setTaxEnabled] = useState(true)
  const [taxLoading, setTaxLoading] = useState(false)

  const merchandiseSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const taxLinesKey = items
    .map((item) => `${item.productId}:${item.quantity}:${item.price}:${item.categoryId ?? ''}`)
    .join('|')

  useEffect(() => {
    if (items.length === 0) return
    let cancelled = false
    setTaxLoading(true)
    void resolveCartTax(
      items.map((item) => ({
        productId: item.productId,
        categoryId: item.categoryId,
        price: item.price,
        quantity: item.quantity,
      })),
    )
      .then((resolved) => {
        if (cancelled) return
        setTaxAmount(resolved.taxAmount)
        setTaxEnabled(isTaxChargeEnabled(resolved.quote))
      })
      .catch(() => {
        if (!cancelled) {
          setTaxAmount(0)
          setTaxEnabled(true)
        }
      })
      .finally(() => {
        if (!cancelled) setTaxLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [taxLinesKey])

  const announcement = 'Guest checkout is available without registration, but discounts and member-only benefits won’t apply.'

  useEffect(() => {
    let cancelled = false
    void loadAllDistricts()
      .then((list) => {
        if (!cancelled) setDistricts(list)
      })
      .catch(() => {
        if (!cancelled) setDistricts([])
      })
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
  const phoneError =
    phoneTouched && phone.length > 0 && !phoneE164
      ? 'Enter a valid Myanmar phone number (9xxxxxxxxx or 09xxxxxxxxx).'
      : null

  const deliveryAddress: UserAddress | null = useMemo(() => {
    if (!fullName.trim() || !phoneE164 || !selectedDistrict || !address.trim()) return null

    return {
      address_id: `guest-${guestId}`,
      country_code: 'MM',
      country: 'Myanmar',
      state_id: null,
      city_id: Number(selectedDistrict.cityId),
      district_id: Number(selectedDistrict.id),
      ward_id: null,
      state: null,
      city: selectedDistrict.cityName,
      district: selectedDistrict.name,
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
  }, [fullName, phoneE164, selectedDistrict, address, guestId])

  const missingRequired = useMemo(() => {
    const missing: string[] = []
    if (!fullName.trim()) missing.push('Full name')
    if (!phoneE164) missing.push('Phone number')
    if (!selectedDistrict) missing.push('District')
    if (!address.trim()) missing.push('Address')
    if (items.length === 0) missing.push('Selected item(s)')
    return missing
  }, [fullName, phoneE164, selectedDistrict, address, items.length])

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

  if (!entryOk || items.length === 0) {
    return <Navigate to="/cart" replace />
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
                  id="guest-phone"
                  type="text"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="9xxxxxxxxx"
                  value={phone}
                  onChange={(e) => {
                    const next = e.target.value.replace(/\D/g, '').slice(0, 11)
                    setPhone(next)
                  }}
                  onBlur={() => setPhoneTouched(true)}
                  maxLength={11}
                  aria-invalid={!!phoneError}
                  aria-describedby={phoneError ? 'guest-phone-error' : undefined}
                  className={`w-full border border-l-0 rounded-r-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                    phoneError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-emerald-600'
                  }`}
                />
              </div>
              {phoneError && (
                <p id="guest-phone-error" role="alert" className="mt-1 text-xs text-red-600">
                  {phoneError}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <SearchableSelect
                placeholder="Search district..."
                emptyLabel="Select District"
                options={districts.map((d) => ({ value: d.id, label: d.name }))}
                value={selectedDistrictId}
                onChange={setSelectedDistrictId}
                disabled={districts.length === 0}
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

          <div className="mt-4 rounded-sm border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-700">
            <div className="flex justify-between gap-3">
              <span>Merchandise Subtotal</span>
              <span className="tabular-nums text-gray-900">{formatKsPrice(merchandiseSubtotal)}</span>
            </div>
            <div className="mt-2 flex justify-between gap-3">
              <span>
                Tax
              </span>
              <span className={taxLoading ? 'text-xs text-gray-400' : 'tabular-nums font-medium text-gray-900'}>
                {taxLoading
                  ? 'Calculating…'
                  : taxEnabled
                    ? formatKsPrice(taxAmount)
                    : formatDisabledTaxAmount(taxAmount)}
              </span>
            </div>
            <div className="mt-2 flex justify-between gap-3 border-t border-gray-200 pt-2 font-medium text-gray-900">
              <span>Total</span>
              <span className="tabular-nums text-emerald-600">
                {formatKsPrice(merchandiseSubtotal + taxAmount)}
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">Delivery is added on the payment step.</p>
          </div>

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

