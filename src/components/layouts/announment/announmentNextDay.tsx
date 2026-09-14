import { useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

export type AnnouncementNextDayProps = {
  ctaLabel?: string;
  ctaTo?: string;
};

export const NEXT_DAY_ANNOUNCEMENT_DISMISS_EVENT =
  "dni:announcement-next-day-dismissed";
export const NEXT_DAY_ANNOUNCEMENT_HEIGHT = 44;

const FONT_STACK =
  "'Poppins', 'Nunito Sans', Nunito, Inter, 'Segoe UI', sans-serif";

const TruckWithMotion = () => (
  <svg
    viewBox="0 0 52 28"
    className="h-6 w-[52px] shrink-0"
    aria-hidden
    fill="none"
  >
    <path d="M2 9h6" stroke="#86D4A4" strokeWidth="1.6" strokeLinecap="round" />
    <path
      d="M1 14h8"
      stroke="#86D4A4"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M3 19h5"
      stroke="#86D4A4"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <rect x="12" y="6" width="18" height="13" rx="1.6" fill="#F59E0B" />
    <rect x="13.2" y="7.2" width="15.6" height="6.2" rx="0.8" fill="#FDE68A" />
    <path
      d="M30 11h8.2c.5 0 1 .26 1.25.7l3.1 5.3c.16.28.25.6.25.93V19H30V11Z"
      fill="#0B5D3B"
    />
    <rect x="30" y="6" width="7.5" height="5.2" rx="1" fill="#047857" />
    <circle cx="18.5" cy="21.5" r="3.1" fill="#1F2937" />
    <circle cx="18.5" cy="21.5" r="1.35" fill="#E5E7EB" />
    <circle cx="37.2" cy="21.5" r="3.1" fill="#1F2937" />
    <circle cx="37.2" cy="21.5" r="1.35" fill="#E5E7EB" />
  </svg>
);

const GiftAccent = () => (
  <svg
    viewBox="0 0 36 24"
    className="ml-1 hidden h-6 w-9 shrink-0 sm:block"
    aria-hidden
  >
    <path
      d="M1 11h6"
      stroke="#5EEAD4"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M2 15.5h5"
      stroke="#5EEAD4"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M28.5 3.5l.9 1.8 1.9.4-1.5 1.2.4 1.9-1.7-1-1.7 1 .4-1.9-1.5-1.2 1.9-.4Z"
      fill="#FBBF24"
    />
    <path
      d="M32.2 11.2l.7 1.3 1.4.3-1.1.9.3 1.4-1.3-.8-1.3.8.3-1.4-1.1-.9 1.4-.3Z"
      fill="#34D399"
    />
    <rect x="12" y="8" width="14" height="12.5" rx="1.5" fill="#F59E0B" />
    <rect x="12" y="8" width="14" height="3.6" fill="#EA580C" />
    <rect x="17.6" y="8" width="2.8" height="12.5" fill="#14B8A6" />
    <rect x="12" y="12.8" width="14" height="2.3" fill="#14B8A6" />
    <path
      d="M17.4 8C16 5.2 13.4 4.6 12.4 6.2c1.7 0 3.1 1.4 5 3.2Z"
      fill="#0F766E"
    />
    <path d="M20.6 8c1.4-2.8 4-3.4 5-1.8-1.7 0-3.1 1.4-5 3.2Z" fill="#0F766E" />
  </svg>
);

const AnnouncementNextDay = ({
  ctaLabel = "Shop Now",
  ctaTo = "/",
}: AnnouncementNextDayProps = {}) => {
  const [visible, setVisible] = useState(true);

  const handleDismiss = () => {
    setVisible(false);
    window.dispatchEvent(new Event(NEXT_DAY_ANNOUNCEMENT_DISMISS_EVENT));
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Next-day delivery announcement"
      className="relative isolate h-11 w-full overflow-hidden text-[14px] leading-none"
      style={{
        fontFamily: FONT_STACK,
        background:
          "linear-gradient(90deg, #CFF6DC 0%, #E9FBE9 32%, #FFF9E8 72%, #FFF4D6 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-8 h-24 w-40 rounded-full bg-[#B8F0C9]/70 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -bottom-10 h-24 w-48 rounded-full bg-[#FFE9A8]/60 blur-2xl"
      />

      <div className="relative mx-auto flex h-full max-w-7xl items-center justify-center gap-2.5 px-10 pr-12 sm:gap-3 sm:px-14 sm:pr-16">
        <TruckWithMotion />

        <span className="inline-flex h-[22px] items-center rounded-full bg-[#16A34A] px-2.5 text-[12px] font-bold tracking-wide text-white">
          Free
        </span>

        <p className="flex min-w-0 items-center gap-2 truncate sm:gap-3">
          <span className="font-bold text-[#0B5D3B]">
            Next-Day Delivery{" "}
            <span
              className="inline-block text-[13px] text-[#F5C518]"
              aria-hidden
            >
              ⚡
            </span>
          </span>
          <span
            className="hidden h-4 w-px bg-[#9CA3AF]/70 sm:inline-block"
            aria-hidden
          />
          <span className="hidden font-semibold text-[#6B7280] sm:inline">
            Order today, get it tomorrow!
          </span>
        </p>

        <Link
          to={ctaTo}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-[#0B5D3B] px-3.5 text-[13px] font-bold text-white transition-colors hover:bg-[#094e32]"
        >
          {ctaLabel}
          <span aria-hidden>→</span>
        </Link>

        <GiftAccent />
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss next-day delivery announcement"
        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#0B5D3B]/70 transition-colors hover:bg-[#0B5D3B]/10 hover:text-[#0B5D3B] sm:right-3"
      >
        <X className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </div>
  );
};

export default AnnouncementNextDay;
