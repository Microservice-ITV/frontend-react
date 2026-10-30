import { useEffect, useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import { loadAllCities } from '@/features/admin/api/locationOptions'
import type { CheckoutDeliveryCompany } from '@/features/shipping/hooks/useCheckoutDeliveryCompany'
import type { ShopCalculatedShipping } from '@/features/shipping/types/shippingTypes'
import { formatKsPrice } from '@/features/products/utils/formatProductPrice'
import { formatDisabledTaxAmount, taxChargeForAmount } from '../api/checkoutApi'
import {
  DELIVERY_FOLLOW_UP_MESSAGE,
  deliveryUnavailableMessage,
  NO_DELIVERY_SERVICE_MESSAGE,
  payDeliveryFeeNowLockMessage,
  shopHasNoDeliveryRoute,
  shopPayDeliveryLockReason,
  type PayDeliveryLockReason,
} from '../utils/deliveryReadiness'
import { voucherIcon } from '@/assets/icons'
import { CheckoutTotals } from '../utils/checkoutCalculator'
import placeholderImage from '@/public/placeholder.svg'
import { Truck } from 'lucide-react'
import CheckoutDeliveryCompanySelect from './CheckoutDeliveryCompanySelect'

export type CheckoutDeliveryCompanySelection = {
  companiesByShopId: Record<string, CheckoutDeliveryCompany[]>
  selectedByShopId: Record<string, string>
  unavailableCompanyIdsByShop: Record<string, string[]>
  loading: boolean
  error: string
  onSelect: (shopId: string, companyId: string) => void
}

interface CheckoutItemsProps {
  checkout: CheckoutTotals
  /** When false, this order does not charge a delivery fee. The rider is paid on arrival. */
  payDeliveryFeeNow?: boolean
  onPayDeliveryFeeNowChange?: (payNow: boolean) => void
  /** No company / no route / staff cash: switch stays off and cannot be turned on. */
  payDeliveryFeeNowLockedOff?: boolean
  /** Why the switch is locked off (e.g. staff cash). */
  payDeliveryFeeNowLockReason?: PayDeliveryLockReason | null
  /** Super-admin switch. Off hides delivery company and pay-delivery-fee controls. */
  showDeliveryCheckoutOptions?: boolean
  deliveryCompany: CheckoutDeliveryCompanySelection
}

function formatKm(value: number): string {
  return `${value.toFixed(1)} km`
}

function formatKg(value: number): string {
  return `${value.toFixed(2)} kg`
}

function formatIncludedKg(value: number): string {
  const rounded = Math.round(value * 100) / 100
  return Number.isInteger(rounded) ? `${rounded} kg` : `${rounded.toFixed(2)} kg`
}

function hasFee(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value) && value > 0
}

type ShippingNoticeKind = 'service' | 'route' | 'company'

const SHIPPING_NOTICE: Record<ShippingNoticeKind, string> = {
  service: 'Delivery is under maintenance and is not available right now.',
  route: DELIVERY_FOLLOW_UP_MESSAGE,
  company: NO_DELIVERY_SERVICE_MESSAGE,
}

const ShippingUnavailableNotice = ({ kind }: { kind: ShippingNoticeKind }) => (
  <div className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-3 text-[13px] leading-5 text-gray-700">
    <div className="flex items-start justify-between gap-3 text-sm font-semibold text-gray-900">
      <span>Standard shipping</span>
      {kind !== 'route' && <span>Not available</span>}
    </div>
    <p className="mt-2 text-xs text-amber-800">{SHIPPING_NOTICE[kind]}</p>
  </div>
)

/** Matches the calculated shipping card so the column does not jump on toggle. */
const SHIPPING_OPTION_SHELL =
  'flex min-h-[6.75rem] w-full flex-col rounded-md border p-3 text-left'

const PayOnArrivalCard = () => (
  <div className={`${SHIPPING_OPTION_SHELL} border-gray-200 bg-white text-[13px] leading-5 text-gray-700`}>
    <p className="text-sm font-semibold text-gray-900">Delivery Fee Paid on Arrival</p>
    <p className="mt-2 text-xs leading-5 text-gray-600">
      The delivery fee is not included in your order total. Please pay the delivery fee separately when your order arrives.
    </p>
  </div>
)

const PayDeliveryFeeNowSwitch = ({
  shopId,
  payNow,
  onChange,
  lockedOff = false,
  lockReason = null,
}: {
  shopId: string
  payNow: boolean
  onChange?: (payNow: boolean) => void
  lockedOff?: boolean
  lockReason?: PayDeliveryLockReason | null
}) => {
  const labelId = `pay-delivery-now-${shopId}`
  const tipId = `${labelId}-tip`
  const canToggle = Boolean(onChange) && !lockedOff
  const shownOn = !lockedOff && payNow
  const lockMessage = lockedOff
    ? payDeliveryFeeNowLockMessage(lockReason ?? 'company')
    : null
  const serviceUnavailable = lockedOff && lockReason !== 'cash' && lockReason !== 'staff'
  const hint =
    lockMessage ??
    (shownOn
      ? 'A delivery fee will be included in your order total.'
      : 'Pay the delivery fee when your order arrives.')

  const switchControl = (
    <button
      type="button"
      role="switch"
      aria-checked={shownOn}
      aria-labelledby={labelId}
      aria-describedby={lockMessage ? tipId : undefined}
      disabled={!canToggle}
      onClick={() => canToggle && onChange?.(!payNow)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ease-out ${
        shownOn ? 'bg-emerald-600' : 'bg-gray-300'
      } ${canToggle ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] ${
          shownOn ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )

  return (
    <div
      className={`mb-3 rounded-sm border border-gray-200 bg-white px-3 py-2.5 ${
        lockedOff ? 'relative z-30' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span id={labelId} className="text-sm font-medium text-gray-900">
          Pay delivery fee now
        </span>
        {lockMessage ? (
          <span className="group/tip relative z-40 inline-flex shrink-0">
            {/* Disabled buttons do not receive hover; wrap so the tooltip still opens. */}
            <span className="inline-flex">{switchControl}</span>
            <span
              id={tipId}
              role="tooltip"
              className="pointer-events-none absolute bottom-full right-0 z-50 mb-2 w-52 rounded-md bg-gray-900 px-2.5 py-2 text-left text-xs font-medium leading-4 text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
            >
              {lockMessage}
              <span
                className="absolute right-3 top-full border-x-4 border-t-4 border-x-transparent border-t-gray-900"
                aria-hidden
              />
            </span>
          </span>
        ) : (
          switchControl
        )}
      </div>
      <p className={`mt-1.5 text-xs leading-5 ${serviceUnavailable ? 'text-amber-800' : 'text-gray-600'}`}>
        {hint}
      </p>
    </div>
  )
}

const ShippingOptionCard = ({
  fee,
  calculateStatus,
  cityNames,
}: {
  fee?: ShopCalculatedShipping
  calculateStatus: string
  cityNames: Record<string, string>
}) => {
  if (calculateStatus === 'loading' || calculateStatus === 'idle') {
    return (
      <div className="text-sm text-gray-500">
        {calculateStatus === 'loading' ? 'Calculating delivery price…' : 'Delivery price will appear after your address is confirmed.'}
      </div>
    )
  }

  if (calculateStatus === 'failed') {
    return <ShippingUnavailableNotice kind="service" />
  }

  if (!fee || fee.amount == null) {
    const routeMissing =
      fee?.deliveryStatus === 'NOT_DELIVERABLE' || fee?.unavailableReason === 'ROUTE_NOT_AVAILABLE'
    return <ShippingUnavailableNotice kind={routeMissing ? 'route' : 'service'} />
  }

  const currency = fee.currency
  const isCityRoute = fee.calculationMethod === 'CITY_ROUTE'
  const baseWeightFee =
    (hasFee(fee.baseFee) ? fee.baseFee : 0) + (hasFee(fee.distanceFee) ? fee.distanceFee : 0)
  const fromDistrict = fee.fromDistrictId ? cityNames[fee.fromDistrictId] : undefined
  const toDistrict = fee.toDistrictId ? cityNames[fee.toDistrictId] : undefined
  const routeLabel = [fromDistrict, toDistrict].filter(Boolean).join(' → ')

  return (
    <div className="text-[13px] leading-5 text-gray-700">
      <div className="flex items-start justify-between gap-3 text-sm font-semibold text-gray-900">
        <span>{fee.methodLabel?.trim() || 'Standard shipping'}</span>
        <span>
          {fee.deliveryStatus === 'NOT_DELIVERABLE'
            ? fee.unavailableReason === 'ROUTE_NOT_AVAILABLE'
              ? null
              : 'Not available'
            : formatKsPrice(fee.amount, currency)}
        </span>
      </div>

      <div className="mt-2 space-y-0.5 text-xs text-gray-600">
        {fee.deliveryStatus === 'NOT_DELIVERABLE' ? (
          <p className="text-amber-800">
            {fee.unavailableReason === 'ROUTE_NOT_AVAILABLE'
              ? SHIPPING_NOTICE.route
              : deliveryUnavailableMessage(fee.unavailableReason)}
          </p>
        ) : (
          <>
            {isCityRoute ? (
              <p>Route: {routeLabel || 'City route'}</p>
            ) : (
              fee.distanceKm != null && fee.distanceKm > 0 && <p>Distance: {formatKm(fee.distanceKm)}</p>
            )}
            {fee.chargeableWeightKg != null && (
              <p>Chargeable weight: {formatKg(fee.chargeableWeightKg)}</p>
            )}
            {baseWeightFee > 0 && (
              <p>
                Base weight fee
                {fee.baseWeightKg != null && fee.baseWeightKg > 0
                  ? ` (${formatIncludedKg(fee.baseWeightKg)})`
                  : ''}
                : {formatKsPrice(baseWeightFee, currency)}
              </p>
            )}
            {hasFee(fee.weightFee) && (
              <p>Additional weight fee: {formatKsPrice(fee.weightFee, currency)}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function formatLineTaxRate(rate: number | null | undefined): string {
  if (rate == null || !Number.isFinite(rate)) return '—'
  const rounded = Math.round(rate * 100) / 100
  return `${Number.isInteger(rounded) ? rounded : rounded}%`
}

const CheckoutItems = ({
  checkout,
  payDeliveryFeeNow = true,
  onPayDeliveryFeeNowChange,
  payDeliveryFeeNowLockedOff = false,
  payDeliveryFeeNowLockReason = null,
  showDeliveryCheckoutOptions = true,
  deliveryCompany,
}: CheckoutItemsProps) => {
  const { groupedByShop } = checkout
  const feesByShopId = useAppSelector(state => state.shipping.feesByShopId)
  const calculateStatus = useAppSelector(state => state.shipping.calculateStatus)
  const [cityNames, setCityNames] = useState<Record<string, string>>({})
  const itemTaxes = useAppSelector((state) => state.checkout.itemTaxes)
  const taxQuoting = useAppSelector((state) => state.checkout.taxQuoting)
  const needsCityNames = Object.values(feesByShopId).some(
    (fee) => fee.calculationMethod === 'CITY_ROUTE' && (fee.fromDistrictId || fee.toDistrictId),
  )

  useEffect(() => {
    if (!needsCityNames) return
    let cancelled = false
    void loadAllCities()
      .then((cities) => {
        if (cancelled) return
        const next: Record<string, string> = {}
        for (const city of cities) {
          next[city.id] = city.name
        }
        setCityNames(next)
      })
      .catch(() => {
        if (!cancelled) setCityNames({})
      })
    return () => {
      cancelled = true
    }
  }, [needsCityNames])

  return (
    <div className="space-y-3">
      <div className="hidden items-center gap-3.5 rounded-sm border border-[var(--dni-cart-border)] bg-white px-3 py-2.5 text-sm text-gray-500 sm:px-4 md:grid md:grid-cols-[minmax(0,1fr)_7.5rem_9rem_8.5rem_auto]">
        <span className="text-gray-900">Products Ordered</span>
        <span className="whitespace-nowrap text-right">Unit Price</span>
        <span className="text-center">Quantity</span>
        <span className="whitespace-nowrap text-right">Item Subtotal</span>
        <div className="grid w-[13.875rem] grid-cols-[5.5rem_7.5rem] gap-3.5">
          <span className="whitespace-nowrap text-right">Tax Rate</span>
          <span className="whitespace-nowrap text-right">Tax</span>
        </div>
      </div>

      {Object.entries(groupedByShop).map(([shopId, shopItems]) => {
        const shopSubtotal = shopItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        )
        const shopQuantity = shopItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        )
        const feeRow = feesByShopId[shopId]
        const shopCompanies = deliveryCompany.companiesByShopId[shopId] ?? []
        const unavailableIds = deliveryCompany.unavailableCompanyIdsByShop[shopId] ?? []
        const companyLoadFailed = !deliveryCompany.loading && Boolean(deliveryCompany.error)
        const noDeliveryCompany =
          !deliveryCompany.loading && !companyLoadFailed && shopCompanies.length === 0
        const noDeliveryRoute = shopHasNoDeliveryRoute(
          shopCompanies.length,
          unavailableIds,
        )
        const serviceUnavailable = companyLoadFailed || calculateStatus === 'failed'
        const shippingNoticeKind: ShippingNoticeKind | null = noDeliveryRoute
          ? 'route'
          : noDeliveryCompany
            ? 'company'
            : serviceUnavailable
              ? 'service'
              : null
        const lockReason = shopPayDeliveryLockReason({
          noDeliveryCompany,
          noDeliveryRoute,
          checkoutLockedOff: payDeliveryFeeNowLockedOff,
          checkoutLockReason: payDeliveryFeeNowLockReason,
        })
        const shopLocksPayNow = lockReason != null
        const chargeDeliveryNow = payDeliveryFeeNow && !shopLocksPayNow
        const isNotDeliverable = feeRow?.deliveryStatus === 'NOT_DELIVERABLE'
        const hasFee =
          chargeDeliveryNow &&
          calculateStatus === 'succeeded' &&
          !isNotDeliverable &&
          feeRow?.amount != null &&
          feeRow.amount >= 0
        const shopTotal = shopSubtotal + (hasFee ? (feeRow.amount as number) : 0)

        return (
          <section
            key={shopId}
            className="overflow-hidden rounded-sm border border-[var(--dni-cart-border)] bg-white"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--dni-cart-border)] px-3 py-2.5 sm:px-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="shrink-0 rounded bg-emerald-600 px-2 py-px text-xs text-white">Shop</span>
                <span className="min-w-0 truncate text-sm font-medium text-gray-900 sm:text-[15px]">
                  {shopItems[0].shopName}
                </span>
              </div>
            </div>

            <ul>
              {shopItems.map(item => {
                const subtotal = item.price * item.quantity
                const variation = item.variantLabel?.trim() || 'Standard'
                const variantId = item.variantId ?? ''
                // No quote yet and none running → tax is off or 0%: show 0% right away.
                const lineTax = itemTaxes.find(
                  (tax) => tax.productId === item.productId && tax.variantId === variantId,
                ) ?? (taxQuoting ? undefined : { productId: item.productId, variantId, taxRate: 0, taxAmount: 0 })
                const noCategoryTax = Boolean(lineTax?.noCategoryTax)
                const liveTaxAmount = lineTax && !noCategoryTax
                  ? taxChargeForAmount(subtotal, lineTax.taxRate)
                  : null
                const taxRateLabel = !lineTax
                  ? 'Calculating…'
                  : noCategoryTax || lineTax.taxRate == null
                    ? '0%'
                    : formatLineTaxRate(lineTax.taxRate)
                const resolvedTaxAmount = !lineTax
                  ? null
                  : noCategoryTax
                    ? 0
                    : liveTaxAmount != null
                      ? liveTaxAmount
                      : lineTax.taxAmount
                const taxAmountLabel = resolvedTaxAmount == null
                  ? 'Calculating…'
                  : resolvedTaxAmount === 0
                    ? formatDisabledTaxAmount(0)
                    : formatKsPrice(resolvedTaxAmount)

                return (
                  <li
                    key={`${item.productId}-${item.variantId ?? ''}-${item.shopId}`}
                    className="flex flex-col gap-2 border-b border-[var(--dni-cart-border)] px-3 py-3 last:border-b-0 sm:px-4 md:grid md:grid-cols-[minmax(0,1fr)_7.5rem_9rem_8.5rem_auto] md:items-center md:gap-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={item.image || placeholderImage}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        onError={e => {
                          const img = e.currentTarget
                          img.onerror = null
                          img.src = placeholderImage
                        }}
                        className="h-16 w-16 shrink-0 object-cover md:h-14 md:w-14"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-gray-900 sm:text-[15px]">{item.name}</p>
                        <p className="mt-0.5 truncate text-xs text-gray-500">Variation : {variation}</p>
                        <p className="mt-1 whitespace-nowrap text-sm font-medium text-emerald-700 md:hidden">
                          {formatKsPrice(item.price)}
                        </p>
                        <p className={`mt-0.5 md:hidden ${lineTax ? 'text-xs text-gray-500' : 'text-[11px] text-gray-400'}`}>
                          {lineTax ? `Tax ${taxRateLabel} · ${taxAmountLabel}` : 'Calculating…'}
                        </p>
                      </div>
                    </div>

                    <p className="hidden whitespace-nowrap text-right text-[15px] tabular-nums text-gray-700 md:block">
                      {formatKsPrice(item.price)}
                    </p>
                    <div className="flex items-center justify-between pl-[4.5rem] md:contents">
                      <p className="text-center text-sm tabular-nums text-gray-700">
                        {item.quantity}
                      </p>
                      <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-emerald-700 md:text-right md:text-[15px]">
                        {formatKsPrice(subtotal)}
                      </p>
                      <div className="hidden w-[13.875rem] md:block">
                        <div className="grid grid-cols-[5.5rem_7.5rem] gap-3.5">
                          <p className={`whitespace-nowrap text-right ${lineTax ? 'text-sm tabular-nums text-gray-700' : 'text-xs text-gray-400'}`}>
                            {taxRateLabel}
                          </p>
                          <p className={`whitespace-nowrap text-right ${lineTax ? 'text-sm font-medium tabular-nums text-gray-900' : 'text-xs text-gray-400'}`}>
                            {taxAmountLabel}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="flex items-center justify-between gap-3 border-t border-[var(--dni-cart-border)] px-3 py-2.5 text-sm sm:px-4">
              <div className="flex min-w-0 items-center gap-2">
                <img src={voucherIcon} alt="" className="h-5 w-5" />
                <span className="text-gray-700">Shop Voucher</span>
              </div>
              <button type="button" className="shrink-0 text-[#0055aa] hover:underline">
                Select Voucher
              </button>
            </div>

            {showDeliveryCheckoutOptions && (
            <div className="border-t border-dashed border-black/10 bg-[#fafdff] px-3 py-3 sm:px-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-900">
                <Truck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                <span>Delivery Method</span>
              </div>
              <CheckoutDeliveryCompanySelect
                companies={shopCompanies}
                selectedId={deliveryCompany.selectedByShopId[shopId] ?? ''}
                disabledCompanyIds={unavailableIds}
                loading={deliveryCompany.loading}
                error={deliveryCompany.error}
                onSelect={(companyId) => deliveryCompany.onSelect(shopId, companyId)}
              />
            </div>
            )}

            <div className="border-t border-dashed border-black/10 grid grid-cols-1 bg-[#fafdff] lg:grid-cols-2 lg:items-stretch">
              <div className="px-3 py-3 sm:px-4 sm:py-4 lg:flex lg:border-r lg:border-dashed lg:border-black/10">
                <div className="flex min-h-28 w-full flex-col gap-2 lg:h-full lg:min-h-0">
                  <span className="text-sm font-medium text-gray-900">Message for Seller</span>
                  <textarea
                    rows={4}
                    className="min-h-24 w-full flex-1 resize-none overflow-y-auto rounded-sm border border-[var(--dni-cart-border)] bg-white px-3 py-2 text-sm leading-5 text-gray-700 outline-none focus:border-emerald-500 lg:min-h-0"
                    placeholder="Please leave a message"
                  />
                </div>
              </div>

              <div className="border-t border-dashed border-black/10 px-3 py-3 sm:px-4 sm:py-4 lg:border-t-0">
                {showDeliveryCheckoutOptions && (
                <PayDeliveryFeeNowSwitch
                  shopId={shopId}
                  payNow={chargeDeliveryNow}
                  onChange={onPayDeliveryFeeNowChange}
                  lockedOff={shopLocksPayNow}
                  lockReason={lockReason}
                />
                )}
                <div className="mb-2 text-sm font-medium text-gray-900">Shipping Option</div>

                {!chargeDeliveryNow ? (
                  <PayOnArrivalCard />
                ) : shippingNoticeKind ? (
                  <ShippingUnavailableNotice kind={shippingNoticeKind} />
                ) : (
                  <button
                    type="button"
                    className={`${SHIPPING_OPTION_SHELL} cursor-pointer border-[#b7e3d5] bg-[#f0faf7] transition hover:border-emerald-600 focus:outline-none`}
                  >
                    <ShippingOptionCard
                      fee={feesByShopId[shopId]}
                      calculateStatus={calculateStatus}
                      cityNames={cityNames}
                    />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 bg-[#fafdff] px-3 py-2.5 sm:px-4">
              <span className="text-sm text-gray-600">
                Order Total ({shopQuantity} {shopQuantity === 1 ? 'Item' : 'Items'}):
              </span>
              <span className="whitespace-nowrap text-lg font-semibold tabular-nums text-emerald-600 sm:text-xl">
                {formatKsPrice(shopTotal)}
              </span>
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default CheckoutItems
