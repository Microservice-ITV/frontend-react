import React from 'react'

const CheckoutSummary = () => {
  return (
    <div className="bg-[#fffefb] border-t border-dashed border-black/10 px-6 py-6">
      {/* Summary rows */}
      <div className="flex justify-center md:justify-end">
        <div className="w-full md:w-[360px] text-sm text-gray-700">

          {/* Merchandise */}
          <div className="flex justify-between mb-3">
            <span className="text-gray-600">Merchandise Subtotal</span>
            <span className="text-gray-900">$3,803.90</span>
          </div>

          {/* Shipping */}
          <div className="flex justify-between mb-3">
            <span className="text-gray-600">Shipping Subtotal</span>
            <span className="text-gray-900">$3.98</span>
          </div>

          {/* Discount */}
          <div className="flex justify-between mb-4">
            <span className="text-gray-600">Shipping Discount Subtotal</span>
            <span className="text-[#ee4d2d]">-$1.99</span>
          </div>

          {/* Total */}
          <div className="flex justify-between items-end">
            <span className="text-gray-900 font-medium">
              Total Payment:
            </span>
            <span className="text-3xl font-semibold text-[#ee4d2d] text-center md:text-right">
              $3,805.89
            </span>
          </div>

          {/* GST note */}
          <div className="mt-2 flex items-center justify-end gap-1 text-xs text-gray-500">
            <span>GST included, where applicable.</span>
            <svg viewBox="0 0 15 15" className="w-4 h-4 text-gray-400">
              <circle cx="7.5" cy="7.5" r="6.5" fill="none" stroke="currentColor" />
              <path
                d="M7.5 11.2v-1.2M5.7 5.6a1.9 1.9 0 013.6.7c0 1.2-1.2 1.5-1.4 2.3"
                stroke="currentColor"
                fill="none"
              />
            </svg>
          </div>

        </div>
      </div>

      {/* Place order */}
      <div className="mt-6 flex justify-end">
        <button className="w-full md:w-auto px-12 py-3 bg-[#ee4d2d] text-white text-base font-medium rounded hover:bg-[#d73211] cursor-pointer">
          Place Order
        </button>
      </div>
    </div>
  )
}

export default CheckoutSummary