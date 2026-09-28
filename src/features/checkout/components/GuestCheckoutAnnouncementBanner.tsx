import { Info } from 'lucide-react'

type GuestCheckoutAnnouncementBannerProps = {
  message?: string
}

const DEFAULT_MESSAGE =
  'No registration required. Guest checkout orders don’t receive member discounts or member-only benefits.'

const GuestCheckoutAnnouncementBanner = ({ message = DEFAULT_MESSAGE }: GuestCheckoutAnnouncementBannerProps) => {
  return (
    <div className="overflow-hidden rounded-sm border border-amber-200 bg-amber-50 px-3 py-3 sm:px-4">
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <div className="text-sm text-amber-900">{message}</div>
      </div>
    </div>
  )
}

export default GuestCheckoutAnnouncementBanner

