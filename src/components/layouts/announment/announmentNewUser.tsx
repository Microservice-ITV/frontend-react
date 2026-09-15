import { useState } from "react";
import { Link } from "react-router-dom";
import { Megaphone, X } from "lucide-react";

export type AnnouncementNewUserProps = {
  ctaLabel?: string;
  ctaTo?: string;
  headline?: string;
  supportingText?: string;
  onDismiss?: () => void;
};

export const NEW_USER_ANNOUNCEMENT_DISMISS_EVENT =
  "dni:announcement-new-user-dismissed";
export const NEW_USER_ANNOUNCEMENT_HEIGHT = 44;

const FONT_STACK =
  "'Poppins', 'Nunito Sans', Nunito, Inter, 'Segoe UI', sans-serif";

const GiftIllustration = () => (
  <svg viewBox="0 0 40 32" className="h-8 w-10 shrink-0" aria-hidden>
    <path
      d="M2 6l1.5 3 3 .4-2.3 2 .6 3-2.8-1.7L2 16l-.8-3.3-2.8 1.7.6-3L-3.3 9.4l3-.4L2 6Z"
      fill="#FFD54A"
    />
    <path
      d="M34 4l1.2 2.4 2.6.5-2 1.6.5 2.5-2.3-1.4-2.3 1.4.5-2.5-2-1.6 2.6-.5Z"
      fill="#86EFAC"
    />
    <path
      d="M36 14l.8 1.6 1.7.3-1.3 1 .3 1.7-1.5-.9-1.5.9.3-1.7-1.3-1 1.7-.3Z"
      fill="#FDE047"
    />
    <rect x="10" y="14" width="18" height="15" rx="1.6" fill="#22C55E" />
    <rect x="10" y="14" width="18" height="4.2" fill="#16A34A" />
    <rect x="17.6" y="14" width="3" height="15" fill="#FBBF24" />
    <rect x="10" y="19.6" width="18" height="2.6" fill="#FBBF24" />
    <path
      d="M17.2 14c-2-3.6-5.4-4.4-6.8-2.2 2.2.2 4.2 1.8 6.8 4.2Z"
      fill="#F59E0B"
    />
    <path
      d="M20.8 14c2-3.6 5.4-4.4 6.8-2.2-2.2.2-4.2 1.8-6.8 4.2Z"
      fill="#F59E0B"
    />
    <ellipse cx="19" cy="12.2" rx="2.1" ry="1.4" fill="#FBBF24" />
  </svg>
);

const AnnouncementNewUser = ({
  ctaLabel = "Shop Now",
  ctaTo = "/",
  headline,
  supportingText,
  onDismiss,
}: AnnouncementNewUserProps = {}) => {
  const [visible, setVisible] = useState(true);

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
    window.dispatchEvent(new Event(NEW_USER_ANNOUNCEMENT_DISMISS_EVENT));
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="New user voucher announcement"
      className="relative isolate h-11 w-full overflow-hidden text-[14px] leading-none"
      style={{
        fontFamily: FONT_STACK,
        background:
          "linear-gradient(90deg, #0B5D3B 0%, #14914F 52%, #22A85A 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, transparent 0 40px, rgba(255,255,255,0.08) 40px 42px, transparent 42px 80px)",
        }}
      />

      <div className="relative mx-auto flex h-full max-w-7xl items-center justify-center gap-2 px-10 pr-12 sm:gap-3 sm:px-14 sm:pr-16">
        <GiftIllustration />

        <Megaphone
          className="hidden h-4 w-4 shrink-0 text-white sm:block"
          strokeWidth={2.25}
          aria-hidden
        />

        <p className="flex min-w-0 items-center gap-2 truncate sm:gap-3">
          <span className="font-bold text-[#FFD54A]">
            {headline ? "$12" : "$12"}
          </span>
          <span className="font-bold text-white">
            {headline ?? "New User Voucher"}
          </span>
          <span
            className="hidden h-4 w-px bg-white/50 sm:inline-block"
            aria-hidden
          />
        </p>

        <span className="hidden h-[30px] shrink-0 flex-col items-center justify-center rounded-md bg-[#FFC93C] px-3 leading-tight sm:inline-flex">
          <span className="text-[11px] font-bold text-[#0B5D3B]">
            {supportingText ?? (
              <>
                Welcome to our store! Get{" "}
                <span className="font-bold text-[13px]">$12</span> off your
                first order
              </>
            )}
          </span>
        </span>

        <Link
          to={ctaTo}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-[#064E3B] px-3.5 text-[13px] font-bold text-white transition-colors hover:bg-[#053828]"
        >
          {ctaLabel}
          <span aria-hidden>→</span>
        </Link>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss new user voucher announcement"
        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/15 hover:text-white sm:right-3"
      >
        <X className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </div>
  );
};

export default AnnouncementNewUser;
