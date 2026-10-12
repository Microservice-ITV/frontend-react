import { useLocation, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { removeSelectedItems } from '@/features/cart/store/cartSlice'
import InvoiceDocumentSheet from '@/features/invoices/components/InvoiceDocumentSheet'
import { clearCheckout } from '../store/checkoutSlice'
import {
  getGuestInvoicesByCheckout,
  getGuestInvoicesByOrder,
  type InvoiceDocument,
} from '@/lib/api/invoiceClient'

type GuestInvoiceLookup = {
  identifier: string
  phone: string
  kind: 'order' | 'checkout'
}

const GuestCheckoutSuccessPage = () => {
  const location = useLocation() as { state?: { checkoutId?: string; phone?: string } }
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const placedCheckoutId = location.state?.checkoutId

  useEffect(() => {
    if (!placedCheckoutId) return
    dispatch(removeSelectedItems())
    dispatch(clearCheckout())
  }, [dispatch, placedCheckoutId])

  const [orderIdInput, setOrderIdInput] = useState(location.state?.checkoutId ?? '')
  const [phoneInput, setPhoneInput] = useState(location.state?.phone ?? '')
  const [lookup, setLookup] = useState<GuestInvoiceLookup | null>(() => {
    const checkoutId = location.state?.checkoutId
    const phone = location.state?.phone
    return checkoutId && phone ? { identifier: checkoutId, phone, kind: 'checkout' } : null
  })
  const [invoices, setInvoices] = useState<InvoiceDocument[]>([])
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)

  const identifier = lookup?.identifier
  const phone = lookup?.phone

  const loadInvoices = useCallback(async () => {
    if (!identifier || !phone) return

    setIsLoadingInvoices(true)
    setInvoiceError(null)
    try {
      setInvoices(await (
        lookup?.kind === 'checkout'
          ? getGuestInvoicesByCheckout(identifier, phone)
          : getGuestInvoicesByOrder(identifier, phone)
      ))
    } catch (error: unknown) {
      setInvoiceError(error instanceof Error ? error.message : 'Unable to load your invoice.')
    } finally {
      setIsLoadingInvoices(false)
    }
  }, [identifier, lookup?.kind, phone])

  useEffect(() => {
    void loadInvoices()
  }, [loadInvoices])

  const handleLookupSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const orderId = orderIdInput.trim()
    const phone = phoneInput.trim()
    if (!orderId || !phone) return

    setInvoices([])
    setInvoiceError(null)
    setLookup({ identifier: orderId, phone, kind: 'order' })
  }

  return (
    <div className="max-w-[700px] mx-auto px-4 py-8 space-y-4">
      {!lookup ? (
        <section className="rounded-sm border border-gray-200 bg-white p-6" aria-labelledby="guest-invoice-lookup-heading">
          <h1 id="guest-invoice-lookup-heading" className="text-xl font-semibold text-gray-900">
            Find a guest invoice
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter the order ID and phone number used for the guest order.
          </p>
          <form onSubmit={handleLookupSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="guest-invoice-order-id" className="block text-sm font-medium text-gray-700">
                Order ID
              </label>
              <input
                id="guest-invoice-order-id"
                name="orderId"
                value={orderIdInput}
                onChange={(event) => setOrderIdInput(event.target.value)}
                required
                className="mt-1 w-full rounded-sm border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="guest-invoice-phone" className="block text-sm font-medium text-gray-700">
                Phone number
              </label>
              <input
                id="guest-invoice-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phoneInput}
                onChange={(event) => setPhoneInput(event.target.value)}
                required
                className="mt-1 w-full rounded-sm border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </div>
            <button
              type="submit"
              className="rounded-sm bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              View invoice
            </button>
          </form>
        </section>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <h1 className="text-xl font-semibold text-gray-900">Order Placed</h1>
            <p className="mt-2 text-sm text-gray-600">
              Please save your order number. We’ll send updates to your phone.
            </p>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Order / Checkout ID</span>
                <span className="font-mono text-gray-900">{identifier}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Phone</span>
                <span className="text-gray-900">{phone}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full sm:w-auto rounded-sm bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Continue Shopping
              </button>
              <button
                type="button"
                onClick={() => navigate('/cart')}
                className="w-full sm:w-auto rounded-sm border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back to Cart
              </button>
            </div>
          </div>

          <section className="space-y-4" aria-labelledby="guest-invoice-heading">
            <div className="rounded-sm border border-gray-200 bg-white p-6">
              <h2 id="guest-invoice-heading" className="text-lg font-semibold text-gray-900">
                Your invoice
              </h2>
              {isLoadingInvoices && (
                <p className="mt-2 text-sm text-gray-600" role="status">Loading your invoice…</p>
              )}
              {!isLoadingInvoices && invoiceError && (
                <p className="mt-2 text-sm text-red-700" role="alert">{invoiceError}</p>
              )}
              {!isLoadingInvoices && !invoiceError && invoices.length === 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  Your invoice is still being prepared. Try again shortly.
                </p>
              )}
              {!isLoadingInvoices && (invoiceError || invoices.length === 0) && (
                <button
                  type="button"
                  onClick={() => void loadInvoices()}
                  className="mt-4 rounded-sm border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  disabled={isLoadingInvoices}
                >
                  Retry
                </button>
              )}
            </div>
            {invoices.map((invoice) => (
              <InvoiceDocumentSheet key={invoice.id} invoice={invoice} />
            ))}
          </section>
        </div>
      )}
    </div>
  )
}

export default GuestCheckoutSuccessPage
