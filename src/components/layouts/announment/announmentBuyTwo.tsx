import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Tags, X } from 'lucide-react'

export const BUY_TWO_ANNOUNCEMENT_DISMISS_EVENT = 'dni:announcement-buy-two-dismissed'
export const BUY_TWO_ANNOUNCEMENT_HEIGHT = 44

const FONT_STACK = "'Poppins', 'Nunito Sans', Nunito, Inter, 'Segoe UI', sans-serif"

export type AnnouncementBuyTwoProps = {
    buyQty?: number
    percentOff?: number
    headline?: string
    supportingText?: string
    ctaLabel?: string
    ctaTo?: string
}

const TwinBags = ({ qty }: { qty: number }) => (
    <svg viewBox="0 0 36 28" className="h-6 w-9 shrink-0" aria-hidden>
        <rect x="2" y="9" width="16" height="16" rx="2" fill="#FBBF24" />
        <path d="M6 9c0-3 2.2-5.2 5-5.2S16 6 16 9" stroke="#0B5D3B" strokeWidth="1.6" fill="none" />
        <rect x="7" y="9" width="3" height="16" fill="#0B5D3B" opacity="0.2" />
        <rect x="14" y="6" width="18" height="18" rx="2" fill="#16A34A" />
        <path d="M19 6c0-3.2 2.4-5.6 5.5-5.6S30 2.8 30 6" stroke="#FBBF24" strokeWidth="1.6" fill="none" />
        <rect x="21.5" y="6" width="3.2" height="18" fill="#FBBF24" />
        <text x="23" y="18.5" textAnchor="middle" fill="#0B5D3B" fontSize="8" fontWeight="700">
            {qty}
        </text>
    </svg>
)

const AnnouncementBuyTwo = ({
    buyQty = 2,
    percentOff = 10,
    headline,
    supportingText = 'Mix and match. Discount applied at checkout.',
    ctaLabel = 'Shop Now',
    ctaTo = '/',
}: AnnouncementBuyTwoProps) => {
    const [visible, setVisible] = useState(true)
    const title = headline ?? `Buy ${buyQty}, Get ${percentOff}% Off`

    const handleDismiss = () => {
        setVisible(false)
        window.dispatchEvent(new Event(BUY_TWO_ANNOUNCEMENT_DISMISS_EVENT))
    }

    if (!visible) return null

    return (
        <div
            role="region"
            aria-label={title}
            className="relative isolate h-11 w-full overflow-hidden text-[14px] leading-none"
            style={{
                fontFamily: FONT_STACK,
                background: 'linear-gradient(90deg, #064E3B 0%, #0B5D3B 42%, #17824A 100%)',
            }}
        >
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(115deg, transparent 0 36px, rgba(255,213,74,0.12) 36px 38px, transparent 38px 72px)',
                }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 w-1/3"
                style={{
                    background: 'linear-gradient(115deg, transparent 10%, rgba(255,201,60,0.16) 50%, transparent 85%)',
                }}
            />

            <div className="relative mx-auto flex h-full max-w-7xl items-center justify-center gap-2 px-10 pr-12 sm:gap-3 sm:px-14 sm:pr-16">
                <TwinBags qty={buyQty} />
                <Tags className="hidden h-4 w-4 shrink-0 text-[#FFD54A] sm:block" strokeWidth={2.25} aria-hidden />

                <span className="inline-flex h-[22px] shrink-0 items-center rounded-full bg-[#FFC93C] px-2.5 text-[12px] font-bold text-[#0B5D3B]">
                    {percentOff}% OFF
                </span>

                <p className="flex min-w-0 items-center gap-2 truncate sm:gap-3">
                    {headline ? (
                        <span className="font-bold text-white">{headline}</span>
                    ) : (
                        <>
                            <span className="font-bold text-[#FFD54A]">Buy {buyQty}</span>
                            <span className="font-bold text-white">Get {percentOff}% Off</span>
                        </>
                    )}
                    <span className="hidden h-4 w-px bg-white/45 sm:inline-block" aria-hidden />
                    <span className="hidden font-semibold text-white/90 sm:inline">{supportingText}</span>
                </p>

                <Link
                    to={ctaTo}
                    className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-[#FFC93C] px-3.5 text-[13px] font-bold text-[#0B5D3B] transition-colors hover:bg-[#FFD54A]"
                >
                    {ctaLabel}
                    <span aria-hidden>→</span>
                </Link>
            </div>

            <button
                type="button"
                onClick={handleDismiss}
                aria-label={`Dismiss ${title} announcement`}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/15 hover:text-white sm:right-3"
            >
                <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
        </div>
    )
}

export default AnnouncementBuyTwo
