import { MapPin } from 'lucide-react'

const CheckoutAddress = () => {
  return (
    <div className="bg-white">
      {/* DNI dashed top border */}
      <div className="h-[4px] bg-[repeating-linear-gradient(150deg,_#f18d9b_0_22px,_transparent_22px_36px,_#6fa6d6_36px_58px,_transparent_58px_72px)]" />

      <div className="px-6 py-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-[#ee4d2d]" />
          <span className="text-[#ee4d2d] text-base font-medium">Delivery Address</span>
        </div>

        <div className="flex items-center text-sm text-gray-900">
          <span className="font-semibold mr-6 whitespace-nowrap">
            AUNG (+84) 385 591 842
          </span>

          <span className="truncate max-w-[620px] mr-4">
            57/11 Lê Hữu Trác, Phường An Hải Đông, Quận Sơn Trà, Đà Nẵng, #103, SG 550000
          </span>

          <span className="mr-6 text-xs text-[#ee4d2d] border border-[#ee4d2d] px-2 py-[1px]">
            Default
          </span>

          <button className="text-sm text-[#0055aa] cursor-pointer">
            Change
          </button>
        </div>
      </div>
    </div>
  )
}

export default CheckoutAddress