import { Link } from 'react-router-dom'
import shopIcon from '@/public/shop-icon-square.svg'

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
      <img
        src={shopIcon}
        alt=""
        className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
        width={40}
        height={40}
        decoding="async"
      />

      {compactOnMobile ? (
        <>
          <span className="block whitespace-nowrap text-base font-bold min-[360px]:text-lg md:hidden">Daily Need Items</span>
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
