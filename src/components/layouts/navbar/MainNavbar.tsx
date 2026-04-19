import { Link } from 'react-router-dom'
import { ShoppingCart, Search } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { selectCartCount } from '@/features/cart/store/cartSelectors'
import NavbarTopUtilityBar from './NavbarTopUtilityBar'

const MainNavbar = () => {
    const cartCount = useAppSelector(selectCartCount)

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-emerald-50">
            <NavbarTopUtilityBar />

            {/* ===== Main Navbar (with search bar) ===== */}
            <div className="bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex h-20 items-center gap-6">

                        <Link to="/" className="text-2xl font-bold text-emerald-600 flex items-center">
                            <span className="block md:hidden tracking-wide">DNI</span>
                            <span className="hidden md:block">Daily Need Items</span>
                        </Link>

                        {/* Search Bar */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center border border-[var(--dni-cart-border)] rounded-sm overflow-hidden">
                                <input
                                    type="text"
                                    placeholder="Search products, brands and more"
                                    className="flex-1 min-w-0 px-4 py-2 text-sm outline-none"
                                />
                                <button className="bg-emerald-600 px-4 py-2 text-white cursor-pointer">
                                    <Search size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Cart */}
                        <Link to="/cart" className="relative flex items-center">
                            <ShoppingCart size={22} className="md:size-[26px]" />

                            {cartCount > 0 && (
                                <span
                                    className="
                                    absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] flex items-center justify-center
                                    rounded-full bg-emerald-600 text-white text-[10px] leading-none px-[3px]"
                                >
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default MainNavbar
