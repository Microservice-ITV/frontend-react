import { useState } from 'react'

type OrderTab = 'all' | 'to-pay' | 'to-ship' | 'to-receive' | 'completed' | 'cancelled' | 'return-refund'

const TABS: { id: OrderTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'to-pay', label: 'To Pay' },
  { id: 'to-ship', label: 'To Ship' },
  { id: 'to-receive', label: 'To Receive' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'return-refund', label: 'Return Refund' },
]

const OrdersPage = () => {
  const [activeTab, setActiveTab] = useState<OrderTab>('all')

  // TODO: Replace static orders below by mapping over real order data.

  return (
    <div className="p-0 md:p-6">
      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white px-4 md:px-6 pt-4">
        <div className="flex flex-wrap gap-4 text-sm">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative pb-2 cursor-pointer
                  ${isActive ? 'text-orange-500 font-medium' : 'text-gray-700 hover:text-orange-500'}
                `}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-orange-500 rounded-full" />
                )}
              </button>
            )
          })}
        </div>

        {/* Search bar */}
        <div className="mt-4 mb-3">
          <input
            type="text"
            placeholder="You can search by Seller Name, Order ID or Product Name"
            className="w-full px-3 py-2 text-xs md:text-sm border border-gray-200 rounded-sm focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Orders list */}
      <div className="px-4 md:px-6 pb-6 space-y-4 mt-2">
        {/* Order card 1 */}
        <div className="bg-white border border-gray-200 rounded-sm">
          {/* Shop header */}
          <div className="px-4 py-3 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-[2px] text-[10px] font-medium text-white bg-[#ee4d2d] rounded-sm uppercase">
                Preferred
              </span>
              <span className="font-medium text-gray-800">wzhome.sg</span>
              <button
                type="button"
                className="ml-2 px-2 py-[2px] border border-orange-500 text-orange-500 rounded-sm text-[10px] cursor-pointer"
              >
                Chat
              </button>
              <button
                type="button"
                className="px-2 py-[2px] border border-gray-300 text-gray-700 rounded-sm text-[10px] cursor-pointer"
              >
                View Shop
              </button>
            </div>
          </div>

          {/* Shipping status + Completed */}
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between text-xs md:text-sm">
            <div className="flex items-center gap-2 text-blue-500">
              <span className="text-base" aria-hidden>
                🚚
              </span>
              <span>Parcel has been returned to seller</span>
            </div>
            <span className="text-red-500 font-medium uppercase">COMPLETED</span>
          </div>

          {/* Item row */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-sm" />
                <div className="space-y-1 text-xs md:text-sm">
                  <p className="text-gray-800">
                    (SG Stock) Upgrade Water-resistant Sofa Cover Elastic 1/2/3/4 Seater L-shaped
                    Corner Slipcover
                  </p>
                  <div className="flex flex-col gap-0.5">
                    <span className="uppercase text-[11px] text-red-500 font-medium">
                      RETURN/REFUND
                    </span>
                    <span className="text-xs text-gray-500">
                      Variation: A1, 1-Seater Size(1*PC)
                    </span>
                    <span className="text-xs text-gray-500">x1</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end text-xs md:text-sm">
                <span className="text-[11px] text-gray-500 line-through">$21.20</span>
                <span className="text-sm text-orange-500 font-semibold">$10.60</span>
              </div>
            </div>
          </div>

          {/* Order total */}
          <div className="px-4 py-2 border-b border-gray-100 flex justify-end">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Order Total:</span>
              <span className="text-orange-500 font-semibold">$11.33</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-4 py-3 flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-1.5 text-xs md:text-sm border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50 cursor-pointer"
            >
              Contact Seller
            </button>
            <button
              type="button"
              className="px-4 py-1.5 text-xs md:text-sm bg-orange-500 text-white rounded-sm hover:bg-orange-600 cursor-pointer"
            >
              Buy Again
            </button>
          </div>
        </div>

        {/* Order card 2 */}
        <div className="bg-white border border-gray-200 rounded-sm">
          {/* Shop header */}
          <div className="px-4 py-3 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800">Zero seven.sg</span>
              <button
                type="button"
                className="ml-2 px-2 py-[2px] border border-orange-500 text-orange-500 rounded-sm text-[10px] cursor-pointer"
              >
                Chat
              </button>
              <button
                type="button"
                className="px-2 py-[2px] border border-gray-300 text-gray-700 rounded-sm text-[10px] cursor-pointer"
              >
                View Shop
              </button>
            </div>
          </div>

          {/* Shipping status + Completed */}
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between text-xs md:text-sm">
            <div className="flex items-center gap-2 text-blue-500">
              <span className="text-base" aria-hidden>
                🚚
              </span>
              <span>Your parcel has been delivered</span>
            </div>
            <span className="text-red-500 font-medium uppercase">COMPLETED</span>
          </div>

          {/* Item row */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-sm" />
                <div className="space-y-1 text-xs md:text-sm">
                  <p className="text-gray-800">
                    Hot selling women&apos;s ice silk seamless plus size thong underwear lace mid
                    waist comfortable breathable triangle underwear
                  </p>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-gray-500">
                      Variation: green, M
                    </span>
                    <span className="text-xs text-gray-500">x1</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end text-xs md:text-sm">
                <span className="text-[11px] text-gray-500 line-through">$6.89</span>
                <span className="text-sm text-orange-500 font-semibold">$2.94</span>
              </div>
            </div>
          </div>

          {/* Order total */}
          <div className="px-4 py-2 border-b border-gray-100 flex justify-end">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Order Total:</span>
              <span className="text-orange-500 font-semibold">$2.94</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-4 py-3 flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-1.5 text-xs md:text-sm border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50 cursor-pointer"
            >
              Contact Seller
            </button>
            <button
              type="button"
              className="px-4 py-1.5 text-xs md:text-sm bg-orange-500 text-white rounded-sm hover:bg-orange-600 cursor-pointer"
            >
              Buy Again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrdersPage

