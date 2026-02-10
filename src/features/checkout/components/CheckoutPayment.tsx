import { visaIcon } from '@/assets/icons'

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
            { label: 'Cash on Delivery' },
            { label: 'Google Pay', disabled: true },
            { label: 'Credit/Debit Card', selected: true },
            { label: 'Credit Card Installment', disabled: true },
            { label: 'Apple Pay', disabled: true },
          ].map(({ label, disabled, selected }) => (
            <button
              key={label}
              disabled={disabled}
              className={`
                relative px-4 py-2 border rounded text-sm whitespace-nowrap cursor-pointer
                ${disabled && 'text-gray-400 bg-gray-50 cursor-not-allowed'}
                ${selected && 'border-[#ee4d2d] text-[#ee4d2d]'}
                ${!disabled && !selected && 'hover:border-[#ee4d2d]'}
              `}
            >
              {label}

              {/* tick */}
              {selected && (
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-[#ee4d2d] flex items-center justify-center">
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
      {/* <div className="grid grid-cols-[220px_1fr] px-6 py-5 border-b border-black/5"> */}
      <div className="flex flex-col md:grid md:grid-cols-[220px_1fr] px-4 md:px-6 py-5 gap-2">
        {/* LEFT */}
        <div className="text-gray-900 text-base font-medium">
          Credit/Debit Card Voucher
        </div>

        {/* RIGHT */}
        <div>
          <span className="inline-flex items-center gap-2 bg-[#fff4f1] text-[#ee4d2d] text-sm px-3 py-1 rounded">
            Shipping Discount
          </span>
        </div>
      </div>

      {/* ROW 3 — Select payment account */}
      {/* <div className="grid grid-cols-[220px_1fr] px-6 py-6"> */}
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
            <div className="w-4 h-4 rounded-full border-2 border-[#ee4d2d] flex items-center justify-center">
              <div className="w-2 h-2 bg-[#ee4d2d] rounded-full" />
            </div>

            {/* Card */}
            <div className="flex items-center gap-3">
              <img
                // src="https://spm.susercontent.com/api/v4/50092786/shopee_logo_bucket/static/images/credit_card_icon_visa@3x.png"
                src={visaIcon}
                className="w-12 h-8 object-contain"
              />
              <span className="text-sm text-gray-900">DBS</span>
              <span className="text-sm text-gray-900">**** 5850</span>
            </div>
          </div>

          {/* Add new card */}
          <button className="w-full md:w-auto inline-flex justify-center items-center gap-2 px-4 py-3 border rounded text-sm text-gray-700 hover:border-[#ee4d2d] cursor-pointer">
            <span className="text-lg leading-none">+</span>
            Pay With New Card
          </button>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPayment