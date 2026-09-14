import { useState } from "react";
import { Megaphone, X } from "lucide-react";
import { Link } from "react-router-dom";

export const ANNOUNCEMENT_DISMISS_EVENT = "dni:announcement-dismissed";
export const ANNOUNCEMENT_BANNER_HEIGHT = 44;

const FONT_STACK =
  "'Poppins', 'Nunito Sans', Nunito, Inter, 'Segoe UI', sans-serif";

export type AnnouncementBannerProps = {
  ctaLabel?: string;
  ctaTo?: string;
};

const Sparkle = ({
  className,
  size = 12,
}: {
  className?: string;
  size?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 0l2.2 9.8L24 12l-9.8 2.2L12 24l-2.2-9.8L0 12l9.8-2.2z" />
  </svg>
);

const AnnouncementBanner = ({
  ctaLabel = "Shop Now",
  ctaTo = "/",
}: AnnouncementBannerProps = {}) => {
  const [visible, setVisible] = useState(true);

  const handleDismiss = () => {
    setVisible(false);
    window.dispatchEvent(new Event(ANNOUNCEMENT_DISMISS_EVENT));
  };

  if (!visible) return null;

  return (
    <div
      className="relative flex h-[44px] w-full items-center justify-center overflow-visible"
      style={{
        backgroundImage: "linear-gradient(90deg, #0B5D3B 0%, #1A9C5B 100%)",
        fontFamily: FONT_STACK,
      }}
    >
      {/* subtle diagonal light-streak texture overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, rgba(255,255,255,0.07) 0 26px, rgba(255,255,255,0) 26px 52px)",
        }}
      />

      {/* small yellow sparkle accents near the right edge */}
      <Sparkle
        size={12}
        className="pointer-events-none absolute right-[132px] top-[6px] text-yellow-300/70"
      />
      <Sparkle
        size={9}
        className="pointer-events-none absolute right-[104px] bottom-[6px] text-yellow-300/80"
      />
      <Sparkle
        size={14}
        className="pointer-events-none absolute right-[76px] top-[11px] text-yellow-300/60"
      />

      {/* message + CTA */}
      <div className="relative z-10 flex max-w-full items-center gap-x-2 whitespace-nowrap px-3 pr-8 text-[11px] sm:text-[14px] md:text-[15px]">
        <Megaphone
          size={20}
          className="shrink-0 text-white"
          aria-hidden="true"
        />

        <p className="min-w-0 text-white">
          <span className="font-bold text-[#FFD54A]">Free Shipping</span>
          <span className="font-bold"> on orders over $50!</span>
        </p>

        <span className="hidden items-center gap-x-3 text-white md:inline-flex">
          <span className="font-semibold text-white/80" aria-hidden="true">
            •
          </span>
          <span className="font-semibold">Shop more, save more!</span>
          <span className="text-base" aria-hidden="true">
            🎁
          </span>
        </span>

        <Link
          to={ctaTo}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-[#FFC93C] px-3.5 text-[13px] font-bold text-[#0B5D3B] transition-colors hover:bg-[#FFD54A]"
        >
          {ctaLabel}
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* dismiss */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/15 hover:text-white sm:right-3"
      >
        <X size={16} strokeWidth={2.5} aria-hidden="true" />
      </button>
    </div>
  );
};

export default AnnouncementBanner;
