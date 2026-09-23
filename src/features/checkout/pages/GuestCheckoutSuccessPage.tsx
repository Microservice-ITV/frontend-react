import { useLocation, useNavigate } from 'react-router-dom'

const GuestCheckoutSuccessPage = () => {
  const location = useLocation() as { state?: { checkoutId?: string; phone?: string } }
  const navigate = useNavigate()

  const checkoutId = location.state?.checkoutId
  const phone = location.state?.phone

  return (
    <div className="max-w-[700px] mx-auto px-4 py-8 space-y-4">
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <h1 className="text-xl font-semibold text-gray-900">Order Placed</h1>
        <p className="mt-2 text-sm text-gray-600">
          Please save your order number. We’ll send updates to your phone.
        </p>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Order / Checkout ID</span>
            <span className="font-mono text-gray-900">{checkoutId ?? '—'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Phone</span>
            <span className="text-gray-900">{phone ?? '—'}</span>
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
    </div>
  )
}

export default GuestCheckoutSuccessPage

