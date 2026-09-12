import { Link } from 'react-router-dom'

/** Cart + plus mark, styled like the app add-to-cart icon. */
function BrandMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={`shrink-0 ${className}`}
      aria-hidden
      fill="none"
    >
      <rect width="40" height="40" fill="var(--dni-primary)" />
      {/* Cart body */}
      <path
        d="M9 12h4.2l3.2 13.2h11.8l3.4-10.8H14.2"
        stroke="#fff"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Wheels */}
      <circle cx="19" cy="29.5" r="1.7" fill="#fff" />
      <circle cx="28.2" cy="29.5" r="1.7" fill="#fff" />
      {/* Plus (add to cart) */}
      <path
        d="M22.5 16.2h5.2M25.1 13.6v5.2"
        stroke="#fff"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  )
}

type BrandLogoProps = {
  /** Compact mark + short name for tight layouts */
  compactOnMobile?: boolean
}

const BrandLogo = ({ compactOnMobile = true }: BrandLogoProps) => {
  return (
    <Link
      to="/"
      className="flex min-w-0 shrink-0 items-center gap-2.5 text-[var(--dni-primary)] no-underline"
      aria-label="Daily Need Items — Quality Products for everyday needs"
    >
      <BrandMark className="h-9 w-9 sm:h-10 sm:w-10" />

      {compactOnMobile ? (
        <>
          <span className="block text-xl font-bold tracking-wide md:hidden">DNI</span>
          <span className="hidden min-w-0 md:flex md:flex-col md:leading-tight">
            <span className="text-xl font-bold sm:text-2xl">Daily Need Items</span>
            <span className="text-[11px] font-medium normal-case text-slate-500 sm:text-xs">
              Quality Products for everyday needs
            </span>
          </span>
        </>
      ) : (
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-xl font-bold sm:text-2xl">Daily Need Items</span>
          <span className="text-[11px] font-medium normal-case text-slate-500 sm:text-xs">
            Quality Products for everyday needs
          </span>
        </span>
      )}
    </Link>
  )
}

export default BrandLogo
