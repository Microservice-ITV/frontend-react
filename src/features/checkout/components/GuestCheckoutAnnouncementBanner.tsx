import { Info } from 'lucide-react'

type GuestCheckoutAnnouncementBannerProps = {
  message?: string
}

const DEFAULT_MESSAGE =
  'No registration required. Guest checkout orders don’t receive member discounts or member-only benefits.'

const GuestCheckoutAnnouncementBanner = ({ message = DEFAULT_MESSAGE }: GuestCheckoutAnnouncementBannerProps) => {
  return (
    <div className="bg-white rounded-sm overflow-hidden">
      {/* DNI dashed top border (match CheckoutAddress) */}

      <div className="px-6 py-4 bg-amber-50 border-x border border-amber-200">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 text-amber-700" />
          <div className="text-sm text-amber-900">{message}</div>
        </div>
      </div>
    </div>
  )
}

export default GuestCheckoutAnnouncementBanner

