import { useEffect, useState } from 'react'
import { shippingApi } from '@/features/shipping/api/shippingApi'

/**
 * Super-admin switch for the checkout delivery-company and pay-now controls.
 * `null` means the setting has not been read yet. Callers must not treat that
 * as enabled, or the delivery-company lookup runs before the server can say no.
 */
export function useCheckoutDeliveryOptions(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null)

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
