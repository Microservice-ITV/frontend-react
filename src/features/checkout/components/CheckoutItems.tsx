import { chatIcon, fastDeliveryIcon } from '@/assets/icons'

const CheckoutItems = () => {
  return (
    <div className="mt-3 bg-white rounded-sm">
      {/* Header */}
      <div className="grid grid-cols-[1fr_140px_100px_160px] px-6 py-5 text-sm text-gray-500 hidden md:grid">
        <div className="font-medium text-gray-900">Products Ordered</div>
        <div className="text-right">Unit Price</div>
        <div className="text-center">Amount</div>
        <div className="text-right">Item Subtotal</div>
      </div>

      {/* Shop row */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="bg-[#ee4d2d] text-white text-xs px-2 py-[1px] rounded">Shop</span>
          <span className="font-medium text-gray-900">Apple Flagship Store</span>
          <button className="flex items-center gap-1 text-sm text-[#26aa99] cursor-pointer">
            <img src={chatIcon} className="w-4 h-4" />
            chat now
          </button>
        </div>
      </div>

      {/* Product row */}
      <div className="grid md:grid-cols-[1fr_140px_100px_160px] gap-3 px-4 md:px-6 py-5 items-start">
        <div className="flex gap-3">
          <img
            src="https://down-sg.img.susercontent.com/file/sg-11134207-7rbn5-llxasyev7m17af"
            className="w-10 h-10"
          />
          <div>
            <div className="text-sm text-gray-900">Apple USB-C Power Adapter (20W)</div>
            <div className="text-xs text-gray-500 mt-1">Variation: 20w</div>
          </div>
        </div>

        <div className="text-right">
          <div className="md:text-right text-sm">$19.00</div>
          <div className="text-xs line-through text-gray-400">$29.52</div>
        </div>

        <div className="md:text-center text-sm">200</div>

        <div className="md:text-right text-sm font-medium">$3,800.00</div>
      </div>

      {/* ================= VOUCHER ================= */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-dashed border-black/10">
        <div className="flex items-center gap-2 text-sm">🎟️ Shop Voucher</div>
        <button className="text-sm text-[#0055aa] cursor-pointer">Select Voucher</button>
      </div>

      {/* ================= MESSAGE + SHIPPING ================= */}
      <div className="grid grid-cols-1 md:grid-cols-[40%_60%] bg-[#fafdff] border-b border-dashed border-black/10">

        {/* LEFT COLUMN — Message */}
        <div className="px-6 py-5 md:py-6 md:border-r border-dashed border-black/10">
          <div className="flex flex-col gap-2">
            {/* Shopee-style row label */}
            <span className="text-sm font-medium text-gray-900">
              Message for Seller
            </span>

            <input
              className="w-full border px-3 py-2 text-sm text-gray-700 rounded border-[var(--dni-cart-border)] outline-none"
              placeholder="Please leave a message"
            />
          </div>
        </div>

        {/* RIGHT COLUMN — Shipping */}
        <div className="px-6 py-5 border-t md:border-t-0 border-dashed border-black/10">

          {/* Header row: title + View All */}
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-900">
              Shipping Option
            </div>

            <button
              className="text-sm text-[#0055aa] flex items-center gap-1 cursor-pointer"
            >
              View All <span>›</span>
            </button>
          </div>

          {/* Clickable shipping card */}
          <button
            className="w-full text-left bg-[#f0faf7] border border-[#b7e3d5] rounded-md p-3 hover:border-[#26aa99] transition focus:outline-none cursor-pointer"
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 cursor-pointer">
              <div className="text-sm font-medium text-gray-900">
                Next Day Doorstep Delivery
              </div>

              <span className="text-sm font-medium whitespace-nowrap">
                $1.99
              </span>
            </div>

            {/* DETAILS */}
            <div className="mt-2 flex items-center gap-1 text-sm text-[#26aa99]">
              <img src={fastDeliveryIcon} className="w-4 h-4" />
              Guaranteed to get by <span className="font-medium">7 Feb</span>
            </div>

            <div className="mt-1 text-sm text-gray-600">
              Get a $2.00 voucher if no delivery was attempted by 7 Feb 2026.
            </div>

            <div className="mt-1 text-sm text-gray-600">
              Orders paid after 2pm will be delivered the day after tomorrow, excl. Sun & PH
            </div>
          </button>
        </div>

        {/* ROW 2 — Collection points */}
        <div className="px-6 py-4 border-t border-dashed border-black/10 text-sm">
          <span className="text-gray-900 font-medium">
            Guaranteed to get by 9 Feb
          </span>
          <span className="text-gray-500 ml-1">
            with Collection Points
          </span>
          <span className="ml-1 text-gray-400">›</span>
        </div>

        {/* ROW 3 — Leave at doorstep */}
        <div className="px-6 py-4 border-t border-dashed border-black/10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              Allow to leave at doorstep
            </span>
            <span className="text-xs bg-[#ee4d2d] text-white px-2 py-[1px] rounded">
              New
            </span>
          </div>

          {/* Toggle */}
          <div className="w-10 h-5 bg-green-500 rounded-full relative cursor-pointer">
            <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
          </div>
        </div>
      </div>

      {/* ================= ORDER TOTAL ================= */}
      <div className="flex justify-end items-center px-6 py-5 bg-[#fafdff]">
        <span className="text-sm text-gray-600 mr-3">Order Total (200 Items):</span>
        <span className="text-2xl font-semibold text-[#ee4d2d]">$3,801.99</span>
      </div>
    </div>
  )
}

export default CheckoutItems