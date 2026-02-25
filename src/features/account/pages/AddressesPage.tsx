const AddressesPage = () => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
        <h1 className="text-lg font-medium text-gray-900">My Addresses</h1>
        <button
          type="button"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-sm hover:bg-orange-600 transition-colors cursor-pointer"
        >
          + Add New Address
        </button>
      </div>

      <div className="space-y-4">
        {/* Address list */}
        <section className="border border-gray-200 rounded-sm">
          <div className="px-5 py-3 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-900">Address</h2>
          </div>

          <div className="divide-y divide-gray-200 text-sm">
            {/* TODO: Replace static address items below by mapping over real user address data. */}
            {/* Address 1 (default) */}
            <div className="px-5 py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 uppercase">AUNG</span>
                  <span className="text-gray-600">(+84) 385 591 842</span>
                </div>
                <p className="text-gray-700">
                  57/11 Le Huu Trac, Phường An Hải Đông, Quận Sơn Trà, Đà Nẵng, #103
                </p>
                <p className="text-gray-700">SG 550000</p>
                <span className="inline-flex items-center px-2 py-[2px] text-[10px] font-medium text-orange-600 border border-orange-500 rounded-sm">
                  Default
                </span>
              </div>

              <div className="flex flex-col items-end gap-2 text-xs sm:text-sm">
                <button
                  type="button"
                  className="text-blue-500 hover:underline cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="px-3 py-1 border border-gray-300 rounded-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Set as default
                </button>
              </div>
            </div>

            {/* Address 2 */}
            <div className="px-5 py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">Aung Zin Latt</span>
                  <span className="text-gray-600">(+65) 989 26222</span>
                </div>
                <p className="text-gray-700">130 BISHAN STREET 12, #02-243</p>
                <p className="text-gray-700">SG 570130</p>
              </div>

              <div className="flex flex-col items-end gap-2 text-xs sm:text-sm">
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="text-blue-500 hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-blue-500 hover:underline cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
                <button
                  type="button"
                  className="px-3 py-1 border border-gray-300 rounded-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Set as default
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Used collection points */}
        <section className="border border-gray-200 rounded-sm">
          <div className="px-5 py-3 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-900">Used Collection Points</h2>
          </div>

          <div className="px-5 py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 text-sm">
            {/* TODO: Replace static collection point items below by mapping over real collection point data. */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">Aung Zin Latt</span>
                <span className="text-gray-600">(+65) 989 26222</span>
              </div>
              <p className="text-gray-700">
                Residential Point @ 109 Bishan St 12, #06-178, S570109 (lift landing)
              </p>
              <p className="text-gray-700">
                109 Bishan St 12, #06-178, Singapore, 570109
              </p>
              <span className="inline-flex items-center px-2 py-[2px] text-[10px] font-medium text-gray-700 border border-gray-300 rounded-sm">
                SPX Collection Point
              </span>
            </div>

            <div className="flex flex-col items-end gap-2 text-xs sm:text-sm">
              <div className="flex gap-3">
                <button
                  type="button"
                  className="text-blue-500 hover:underline cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-blue-500 hover:underline cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AddressesPage

