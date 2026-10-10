import { useEffect, useState } from 'react'
import {
  checkoutHasNoDeliveryRoute,
  mustWaiveDeliveryFeeNow,
  type DeliveryAvailabilityParams,
} from '../utils/deliveryReadiness'

/**
 * Owns the "Pay delivery fee now" switch. Forces it off when there is no company
 * or no route, and keeps the last shipping quote when the customer turns it off.
 */
export function usePayDeliveryFeeNow(availability: DeliveryAvailabilityParams) {
  const [payDeliveryFeeNow, setPayDeliveryFeeNow] = useState(true)
  const deliveryQuotePendingConfirmation = checkoutHasNoDeliveryRoute(availability)
  const payDeliveryFeeNowLockedOff = mustWaiveDeliveryFeeNow(availability)

  useEffect(() => {
    if (payDeliveryFeeNowLockedOff) setPayDeliveryFeeNow(false)
  }, [payDeliveryFeeNowLockedOff])

  return {
    payDeliveryFeeNow,
    setPayDeliveryFeeNow,
    payDeliveryFeeNowLockedOff,
    deliveryQuotePendingConfirmation,
  }
}
