import { useEffect, useState } from 'react'
import { shippingApi } from '@/features/shipping/api/shippingApi'

/** Super-admin switch for the checkout delivery-company and pay-now controls. */
export function useCheckoutDeliveryOptions() {
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    let cancelled = false
    void shippingApi.checkoutDeliveryOptions()
      .then((response) => {
        if (!cancelled) setEnabled(response.data.data.enabled !== false)
      })
      .catch(() => {
        if (!cancelled) setEnabled(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return enabled
}
