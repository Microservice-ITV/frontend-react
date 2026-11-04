import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectSelectedItems } from '@/features/cart/store/cartSelectors'
import { useSyncCartAvailableStock } from '@/features/cart/hooks/useSyncCartAvailableStock'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { guestCheckoutCart } from '../store/checkoutThunks'
import { clearCheckout, setCheckoutError, setCheckoutPreparingUi } from '../store/checkoutSlice'
import { CheckoutPreparingScreen } from '../components/CheckoutPreparingAnimation'
import { loadAllCities, type CityOptionWithState } from '@/features/admin/api/locationOptions'
import {
  formatDisabledTaxAmount,
  isTaxActive,
  isTaxChargeEnabled,
  resolveCartTax,
} from '../api/checkoutApi'
import { formatKsPrice } from '@/features/products/utils/formatProductPrice'
import {
  buildGuestDeliveryAddress,
  getOrCreateGuestId,
  guestPhoneToE164,
  isGuestCheckoutEditingProfile,
  isGuestCheckoutProfileComplete,
  loadGuestCheckoutProfile,
  persistGuestCheckoutSession,
  saveGuestCheckoutProfile,
  setGuestCheckoutEditingProfile,
  toGuestCheckoutApiAddress,
} from '../utils/guestCheckoutProfile'
import { AlertCircle, Lightbulb, UserRound } from 'lucide-react'

const fieldLabelClass = 'mb-1 block text-sm font-semibold text-gray-900'
const fieldClass =
  'w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600'

function ExampleStep({
  step,
  label,
  hint,
  example,
}: {
  step: string
  label: string
  hint: string
  example: string
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-semibold text-white">
          {step}
        </span>
        <span className="text-sm font-semibold text-gray-900">{label}</span>
      </div>
      <p className="mt-2 text-sm font-medium leading-5 text-gray-900">{example}</p>
      <p className="mt-1.5 text-[11px] leading-4 text-gray-500">{hint}</p>
    </div>
  )
}

const GuestCheckoutPage = () => {
  const dispatch = useAppDispatch()
  useSyncCartAvailableStock()
  const navigate = useNavigate()
  const items = useAppSelector(selectSelectedItems)
  const { loading } = useAppSelector((s) => s.checkout)

  const entryOk = useMemo(() => {
    try {
      return sessionStorage.getItem('dni.guest_checkout.entry_ok') === '1'
    } catch {
      return false
    }
  }, [])

  const [guestId] = useState(getOrCreateGuestId)
  const [savedProfile] = useState(loadGuestCheckoutProfile)
  const [editingProfile] = useState(isGuestCheckoutEditingProfile)
  const [autoSkipBlocked, setAutoSkipBlocked] = useState(false)
  const autoStartedRef = useRef(false)
  const shouldSkipForm =
    !editingProfile && !autoSkipBlocked && isGuestCheckoutProfileComplete(savedProfile)

  const [fullName, setFullName] = useState(savedProfile.fullName)
  const [phone, setPhone] = useState(savedProfile.phone)
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [address, setAddress] = useState(savedProfile.address)
  const [cities, setCities] = useState<CityOptionWithState[]>([])
  const [citiesLoaded, setCitiesLoaded] = useState(false)
  const [selectedCityId, setSelectedCityId] = useState(savedProfile.cityId)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [taxAmount, setTaxAmount] = useState(0)
  const [taxEnabled, setTaxEnabled] = useState(true)
  const [taxLoading, setTaxLoading] = useState(false)

  const selectedCity = useMemo(
    () => cities.find((c) => c.id === selectedCityId) ?? null,
    [cities, selectedCityId],
  )
  const phoneE164 = useMemo(() => guestPhoneToE164(phone), [phone])
  const phoneError =
    phoneTouched && phone.length > 0 && !phoneE164
      ? 'Enter a valid Myanmar phone number (9xxxxxxxxx or 09xxxxxxxxx).'
      : null

  const deliveryAddress = useMemo(() => {
    if (!fullName.trim() || !phoneE164 || !selectedCity || !address.trim()) return null
    return buildGuestDeliveryAddress({
      guestId,
      fullName,
      phone,
      address,
      city: selectedCity,
    })
  }, [fullName, phoneE164, selectedCity, address, guestId, phone])

  const merchandiseSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const taxLinesKey = items
    .map((item) => `${item.productId}:${item.quantity}:${item.price}:${item.categoryId ?? ''}`)
    .join('|')
  const canContinue = !!deliveryAddress && items.length > 0 && !loading && !submitting

  useEffect(() => {
    if (shouldSkipForm) return
    saveGuestCheckoutProfile({ fullName, phone, address, cityId: selectedCityId })
  }, [fullName, phone, address, selectedCityId, shouldSkipForm])

  useEffect(() => {
    if (items.length === 0) return
    let cancelled = false
    void (async () => {
      const active = await isTaxActive()
      if (cancelled) return
      if (!active) {
        setTaxAmount(0)
        setTaxEnabled(false)
        return
      }
      setTaxLoading(true)
      try {
        const resolved = await resolveCartTax(
          items.map((item) => ({
            productId: item.productId,
            categoryId: item.categoryId,
            price: item.price,
            quantity: item.quantity,
          })),
        )
        if (cancelled) return
        setTaxAmount(resolved.taxAmount)
        setTaxEnabled(isTaxChargeEnabled(resolved.quote))
      } catch {
        if (!cancelled) {
          setTaxAmount(0)
          setTaxEnabled(true)
        }
      } finally {
        if (!cancelled) setTaxLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [taxLinesKey])

  useEffect(() => {
    let cancelled = false
    void loadAllCities()
      .then((list) => {
        if (!cancelled) {
          setCities(list)
          setCitiesLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCities([])
          setCitiesLoaded(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    dispatch(setCheckoutPreparingUi(submitting || shouldSkipForm))
    return () => {
      dispatch(setCheckoutPreparingUi(false))
    }
  }, [dispatch, submitting, shouldSkipForm])

  const continueToPayment = useCallback(async () => {
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
          delivery_address: toGuestCheckoutApiAddress(deliveryAddress),
        }),
      ).unwrap()

      const checkoutId =
        (result as { checkout_id?: string; checkout?: { checkout_id?: string; id?: string } })
          ?.checkout_id ??
        (result as { checkout?: { checkout_id?: string; id?: string } })?.checkout?.checkout_id ??
        (result as { checkout?: { id?: string } })?.checkout?.id ??
        null

      persistGuestCheckoutSession({
        address: deliveryAddress,
        cartKey,
        checkoutId,
        profile: {
          fullName: deliveryAddress.full_name,
          phone,
          address: deliveryAddress.address_line_1,
          cityId: selectedCityId,
        },
      })
      navigate('/checkout', { replace: true })
    } catch (e: unknown) {
      const message =
        typeof e === 'string'
          ? e
          : (e as { message?: string })?.message ?? 'Unable to start checkout. Please try again.'
      setSubmitError(String(message))
      setSubmitting(false)
      setAutoSkipBlocked(true)
      setGuestCheckoutEditingProfile(true)
    }
  }, [deliveryAddress, dispatch, guestId, items, navigate, phone, selectedCityId])

  useEffect(() => {
    if (!shouldSkipForm || !entryOk || items.length === 0 || !citiesLoaded) return
    if (!deliveryAddress) {
      setAutoSkipBlocked(true)
      return
    }
    if (loading || submitting || autoStartedRef.current) return
    autoStartedRef.current = true
    void continueToPayment()
  }, [
    shouldSkipForm,
    entryOk,
    items.length,
    citiesLoaded,
    deliveryAddress,
    loading,
    submitting,
    continueToPayment,
  ])

  if (!entryOk || items.length === 0) return <Navigate to="/cart" replace />
  if (submitting || shouldSkipForm) {
    return (
      <div className="min-h-[60vh] bg-[#f5f5f5] py-3 sm:py-4 lg:py-5">
        <CheckoutPreparingScreen />
      </div>
    )
  }

  return (
    <div className="bg-gray-50 px-4 pt-8 pb-12">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <Card className="p-6">
          <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <UserRound className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            Guest checkout
          </h1>
          <div
            className="mt-3 flex items-start gap-2 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900"
            role="status"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
            <div>
              <p>Guest checkout is available without registration.</p>
              <p className="mt-1">You will not receive any promotion offer unless you register an account.</p>
            </div>
          </div>

          {submitError && (
            <div className="mt-4 rounded-sm border border-red-200 bg-[#fff6f6] px-3 py-2 text-xs text-red-700" role="alert">
              {submitError}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="guest-full-name" className={fieldLabelClass}>
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="guest-full-name"
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="guest-phone" className={fieldLabelClass}>
                Phone Number <span className="text-red-500">*</span>
              </label>
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
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  onBlur={() => setPhoneTouched(true)}
                  maxLength={11}
                  aria-invalid={!!phoneError}
                  aria-describedby={phoneError ? 'guest-phone-error' : undefined}
                  className={`w-full rounded-r-sm border border-l-0 px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
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
              <label htmlFor="guest-city" className={fieldLabelClass}>
                City <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                id="guest-city"
                placeholder="Search city..."
                emptyLabel="Select City"
                options={cities.map((city) => ({ value: city.id, label: city.name }))}
                value={selectedCityId}
                onChange={setSelectedCityId}
                disabled={cities.length === 0}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="guest-address" className={fieldLabelClass}>
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="guest-address"
                rows={3}
                placeholder="Street Name, Building, House No..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={`${fieldClass} resize-y leading-5`}
              />
            </div>
          </div>

          <div className="mt-4 rounded-sm border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-700">
            <div className="flex justify-between gap-3">
              <span>Merchandise Subtotal</span>
              <span className="tabular-nums text-gray-900">{formatKsPrice(merchandiseSubtotal)}</span>
            </div>
            <div className="mt-2 flex justify-between gap-3">
              <span>Tax</span>
              <span className={taxLoading ? 'text-xs text-gray-400' : 'tabular-nums font-medium text-gray-900'}>
                {taxLoading
                  ? 'Calculating…'
                  : taxEnabled && taxAmount !== 0
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
            >
              Continue to payment
            </Button>
          </div>
        </Card>

        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <Lightbulb className="h-4 w-4" aria-hidden="true" />
            How to fill in (example)
          </p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ExampleStep step="1" label="Full Name" hint="Enter your real name." example="Mg Kaung Pyae" />
            <ExampleStep
              step="2"
              label="Phone Number"
              hint="Enter your mobile number (e.g. 912345678)."
              example="+95 912345678"
            />
            <ExampleStep step="3" label="City" hint="Select your city from the list." example="Yangon" />
            <ExampleStep
              step="4"
              label="Address"
              hint="Enter your complete address (street name, building, house number, etc.)."
              example="No. 123, Baho Road, Bahan Township"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default GuestCheckoutPage
