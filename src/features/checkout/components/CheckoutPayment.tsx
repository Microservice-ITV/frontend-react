import { visaIcon } from '@/assets/icons'
import { CardElement } from '@stripe/react-stripe-js'

const CheckoutPayment = () => {
  return (
    <div className="bg-white mt-4 border border-black/5">
      {/* ROW 1 — Payment Method */}
      <div className="flex flex-col md:grid md:grid-cols-[220px_1fr] gap-3 px-4 md:px-6 py-5 border-b border-black/5">
        {/* LEFT */}
        <div className="text-gray-900 text-base font-medium md:flex md:items-center">Payment Method</div>

        {/* RIGHT */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Stripe Payment', selected: true },
            { label: 'Cash on Delivery', disabled: true },
          ].map(({ label, disabled, selected }) => (
            <button
              key={label}
              disabled={disabled}
              className={`
                relative px-4 py-2 border rounded text-sm whitespace-nowrap cursor-pointer
                ${disabled && 'text-gray-400 bg-gray-50 cursor-not-allowed'}
                ${selected && 'border-emerald-600 text-emerald-600'}
                ${!disabled && !selected && 'hover:border-emerald-600'}
              `}
            >
              {label}

              {/* tick */}
              {selected && (
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-600 flex items-center justify-center">
                  <svg viewBox="0 0 12 12" className="w-3 h-3 fill-white">
                    <path d="M5.2 10.9L.3 7c-.4-.4-.5-1-.1-1.4s1-.5 1.4-.1l3.4 3 5.1-7c.3-.4 1-.5 1.4-.2s.5 1 .2 1.4l-5.7 7.9z" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ROW 2 — Voucher */}
      <div className="flex flex-col md:grid md:grid-cols-[220px_1fr] px-4 md:px-6 py-5 gap-2">
        {/* LEFT */}
        <div className="text-gray-900 text-base font-medium">
          Credit/Debit Card Voucher
        </div>

        {/* RIGHT */}
        <div>
          <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 text-sm px-3 py-1 rounded">
            Shipping Discount
          </span>
        </div>
      </div>

      {/* ROW 3 — Select payment account */}
      <div className="flex flex-col md:grid md:grid-cols-[220px_1fr] px-4 md:px-6 py-5 gap-2">
        {/* LEFT */}
        <div className="text-gray-900 text-base font-medium">
          Select payment account
        </div>

        {/* RIGHT */}
        <div>
          {/* Card row */}
          <div className="flex items-center gap-4 mb-4 cursor-pointer">
            {/* Radio */}
            <div className="w-4 h-4 rounded-full border-2 border-emerald-600 flex items-center justify-center">
              <div className="w-2 h-2 bg-emerald-600 rounded-full" />
            </div>

            {/* Card */}
            <div className="flex items-center gap-3">
              <img
                src={visaIcon}
                className="w-12 h-8 object-contain"
              />
              <span className="text-sm text-gray-900">DBS</span>
              <span className="text-sm text-gray-900">**** 5850</span>
            </div>
          </div>

          {/* Add new card */}
          <button className="w-full md:w-auto inline-flex justify-center items-center gap-2 px-4 py-3 border rounded text-sm text-gray-700 hover:border-emerald-600 cursor-pointer">
            <span className="text-lg leading-none">+</span>
            Pay With New Card
          </button>

          {/* Stripe secure card input (keeps existing layout, adds real payment field) */}
          <div className="mt-4 border rounded px-4 py-3">
            <CardElement
              options={{
                hidePostalCode: true,
                style: {
                  base: {
                    fontSize: '14px',
                    color: '#111827',
                    '::placeholder': {
                      color: '#9ca3af',
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPayment