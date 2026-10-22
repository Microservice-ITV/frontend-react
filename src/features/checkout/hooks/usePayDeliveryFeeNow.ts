import { useEffect, useState } from 'react'
import {
  canPayDeliveryFeeNow,
  checkoutHasNoDeliveryRoute,
  mustWaiveDeliveryFeeNow,
  type DeliveryAvailabilityParams,
  type PayDeliveryLockReason,
} from '../utils/deliveryReadiness'

type Options = DeliveryAvailabilityParams & {
  /**
   * Force the switch OFF (e.g. staff prepaid cash).
   * Stays locked until cleared so availability sync cannot turn it back on.
   */
  forceOff?: boolean
  forceOffReason?: PayDeliveryLockReason
}

/**
 * Owns the "Pay delivery fee now" switch.
 * - AUTO ON when delivery companies exist and at least one route is available
 * - AUTO OFF when companies/routes are missing, or when forceOff is set (staff cash)
 */
export function usePayDeliveryFeeNow({
  forceOff = false,
  forceOffReason = 'cash',
  ...availability
}: Options) {
  const [payDeliveryFeeNow, setPayDeliveryFeeNow] = useState(true)
  const deliveryQuotePendingConfirmation = checkoutHasNoDeliveryRoute(availability)
  const availabilityLockedOff = mustWaiveDeliveryFeeNow(availability)
  const payDeliveryFeeNowLockedOff = forceOff || availabilityLockedOff
  const canPayNow = canPayDeliveryFeeNow(availability)
  const payDeliveryFeeNowLockReason: PayDeliveryLockReason | null = forceOff
    ? forceOffReason
    : availabilityLockedOff
      ? (checkoutHasNoDeliveryRoute(availability) ? 'route' : 'company')
      : null

  useEffect(() => {
    if (forceOff) {
      setPayDeliveryFeeNow(false)
      return
    }

    if (availability.loading || !availability.routesReady) return

    setPayDeliveryFeeNow(canPayNow)
  }, [
    forceOff,
    availability.loading,
    availability.routesReady,
    availability.companiesCountByShop,
    availability.shopIds,
    availability.unavailableCompanyIdsByShop,
    canPayNow,
  ])

  return {
    payDeliveryFeeNow,
    setPayDeliveryFeeNow,
    payDeliveryFeeNowLockedOff,
    payDeliveryFeeNowLockReason,
    deliveryQuotePendingConfirmation,
  }
}
