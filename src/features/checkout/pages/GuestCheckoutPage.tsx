import { useAppDispatch, useAppSelector } from '@/app/hooks'
import type { UserAddress } from '@/features/account/types/addressTypes'
import { selectSelectedItems } from '@/features/cart/store/cartSelectors'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { guestCheckoutCart } from '../store/checkoutThunks'
import { clearCheckout, setCheckoutError } from '../store/checkoutSlice'
import { loadAllDistricts, type DistrictOptionWithCity } from '@/features/admin/api/locationOptions'
import {
  formatDisabledTaxAmount,
  isTaxChargeEnabled,
  resolveCartTax,
} from '../api/checkoutApi'
import { formatKsPrice } from '@/features/products/utils/formatProductPrice'
import { AlertCircle, Lightbulb, UserRound } from 'lucide-react'
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

const fieldLabelClass = 'mb-1 block text-sm font-semibold text-gray-900'
const fieldClass =
  'w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600'
const exampleBadgeClass =
  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-semibold text-white'
const exampleBoxClass = 'mt-2 rounded-sm border border-gray-300 bg-white text-sm text-gray-800'
const exampleTextClass = `${exampleBoxClass} px-2.5 py-1.5`

const FILL_IN_TOUR_DISMISS_KEY = 'dni.guest_checkout.fill_in_tour_dismissed'

function dismissedFillInTourVisit() {
  try {
    return sessionStorage.getItem(FILL_IN_TOUR_DISMISS_KEY)
  } catch {
    return null
  }
}

function rememberDismissedFillInTour(visitKey: string) {
  try {
    sessionStorage.setItem(FILL_IN_TOUR_DISMISS_KEY, visitKey)
  } catch {
    // Ignore storage failures. The tour can show again after a refresh.
  }
}

function ExampleStep({
  step,
  label,
  hint,
  children,
}: {
  step: string
  label: string
  hint: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className={exampleBadgeClass}>{step}</span>
        <span className="text-sm font-semibold text-gray-900">{label}</span>
      </div>
      {children}
      <p className="mt-1.5 text-[11px] leading-4 text-gray-500">{hint}</p>
    </div>
  )
}

const GuestCheckoutPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()

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
  const fillInGuideRef = useRef<HTMLDivElement>(null)
  const checkoutFormRef = useRef<HTMLDivElement>(null)
  const [fillInTourOpen, setFillInTourOpen] = useState(false)
  const [fillInTourRect, setFillInTourRect] = useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(null)

  const pageReady = entryOk && items.length > 0

  const dismissFillInTour = () => {
    rememberDismissedFillInTour(location.key)
    setFillInTourOpen(false)
  }

  const finishFillInTour = () => {
    dismissFillInTour()
    checkoutFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    if (!pageReady || dismissedFillInTourVisit() === location.key) return

    const timer = window.setTimeout(() => {
      fillInGuideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setFillInTourOpen(true)
    }, 150)

    return () => window.clearTimeout(timer)
  }, [pageReady, location.key])

  useEffect(() => {
    if (!fillInTourOpen) return

    const measure = () => {
      const box = fillInGuideRef.current?.getBoundingClientRect()
      if (!box) return
      setFillInTourRect({ top: box.top, left: box.left, width: box.width, height: box.height })
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      rememberDismissedFillInTour(location.key)
      setFillInTourOpen(false)
    }

    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [fillInTourOpen, location.key])

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
        <div ref={checkoutFormRef} className="scroll-mt-28">
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

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label htmlFor="guest-city" className={fieldLabelClass}>
                City <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                id="guest-city"
                placeholder="Search city..."
                emptyLabel="Select City"
                options={districts.map((d) => ({ value: d.id, label: d.name }))}
                value={selectedDistrictId}
                onChange={setSelectedDistrictId}
                disabled={districts.length === 0}
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
            >
              Continue to payment
            </Button>
          </div>
        </Card>
        </div>

        <div
          ref={fillInGuideRef}
          className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-4"
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <Lightbulb className="h-4 w-4" aria-hidden="true" />
            How to fill in (example)
          </p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ExampleStep step="1" label="Full Name" hint="Enter your real name.">
              <div className={exampleTextClass}>Mg Kaung Pyae</div>
            </ExampleStep>
            <ExampleStep step="2" label="Phone Number" hint="Enter your mobile number (e.g. 912345678).">
              <div className={`${exampleBoxClass} flex overflow-hidden`}>
                <span className="border-r border-gray-300 bg-gray-50 px-2 py-1.5 text-gray-600">+95</span>
                <span className="px-2 py-1.5">912345678</span>
              </div>
            </ExampleStep>
            <ExampleStep step="3" label="City" hint="Select your city from the list.">
              <div className={exampleTextClass}>Yangon</div>
            </ExampleStep>
            <ExampleStep
              step="4"
              label="Address"
              hint="Enter your complete address (street name, building, house number, etc.)."
            >
              <div className={`${exampleTextClass} min-h-14 leading-5`}>No. 123, Baho Road, Bahan Township</div>
            </ExampleStep>
          </div>
        </div>
      </div>

      {fillInTourOpen && fillInTourRect && (
        <div className="fixed inset-0 z-[80]" role="presentation">
          <button
            type="button"
            aria-label="Dismiss fill-in guide"
            className="absolute inset-0 cursor-default"
            onClick={dismissFillInTour}
          />
          <div
            className="pointer-events-none absolute rounded-md ring-2 ring-emerald-400"
            style={{
              top: fillInTourRect.top - 6,
              left: fillInTourRect.left - 6,
              width: fillInTourRect.width + 12,
              height: fillInTourRect.height + 12,
              boxShadow: '0 0 0 9999px rgba(17, 24, 39, 0.55)',
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="fill-in-tour-title"
            className="absolute w-[min(20rem,calc(100vw-2rem))] rounded-md bg-white p-4 shadow-lg"
            style={{
              left: Math.max(16, Math.min(fillInTourRect.left, window.innerWidth - 336)),
              top: Math.max(16, fillInTourRect.top - 148),
            }}
          >
            <p id="fill-in-tour-title" className="text-sm font-semibold text-gray-900">
              How to fill in
            </p>
            <p className="mt-1 text-sm leading-5 text-gray-600">
              Use these examples for your name, phone number, city, and address.
            </p>
            <button
              type="button"
              onClick={finishFillInTour}
              className="mt-3 h-9 rounded-sm bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default GuestCheckoutPage

