import { Link, useLocation, matchPath } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { logout } from '@/features/auth/store/authThunks'

const getPageName = (pathname: string): string | null => {
    if (matchPath({ path: '/cart', end: true }, pathname)) return 'Shopping Cart'
    if (matchPath({ path: '/checkout', end: true }, pathname)) return 'Checkout'
    return null
}

const NavbarNoSearch = () => {
    const dispatch = useAppDispatch()
    const { pathname } = useLocation()
    const { isAuthenticated, user } = useAppSelector((s) => s.auth)
    const pageName = getPageName(pathname)

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-emerald-50">
            <div className="bg-gray-50 text-xs text-gray-600 overflow-visible">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between h-8 items-center">
                    <div className="flex space-x-4">
                        <Link to="#" className="hover:text-black">Help</Link>
                        <Link to="#" className="hover:text-black">Notifications</Link>
                    </div>

                    <div className="flex space-x-4">
                        {isAuthenticated && user ? (
                            <div className="relative z-[100] group">
                                <button className="flex items-center gap-2 text-gray-800 hover:text-black cursor-pointer">
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                        <svg viewBox="0 0 15 15" className="w-4 h-4 text-gray-600">
                                            <circle cx="7.5" cy="4.5" r="3.8" fill="none" stroke="currentColor" />
                                            <path
                                                d="M1.5 14.2c0-3.3 2.7-6 6-6s6 2.7 6 6"
                                                fill="none"
                                                stroke="currentColor"
                                            />
                                        </svg>
                                    </div>

                                    <span className="max-w-[120px] truncate text-sm">
                                        {user.name}
                                    </span>
                                </button>

                                <div
                                    className="
                                        absolute right-0 top-full mt-2 z-[200] w-48 bg-white rounded-sm
                                        shadow-[0_2px_8px_rgba(0,0,0,0.15)] opacity-0 invisible translate-y-[-4px]
                                        group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
                                        transition-all duration-150 ease-out
                                    "
                                >
                                    <div className="absolute -top-2 right-6 w-4 h-4 bg-white rotate-45" />

                                    <Link to="/account/profile" className="block px-4 py-3 text-sm hover:bg-gray-100">
                                        My Account
                                    </Link>

                                    <Link to="/account/orders" className="block px-4 py-3 text-sm hover:bg-gray-100">
                                        My Purchase
                                    </Link>

                                    <button
                                        onClick={() => {
                                            dispatch({ type: 'auth/forceLogout' })
                                            dispatch(logout())
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 cursor-pointer"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="hover:text-black">Login</Link>
                                <Link to="/register" className="hover:text-black">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Main row — logo + page name (no search bar) */}
            <div className="bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex h-20 items-center gap-4">

                        <Link to="/" className="text-2xl font-bold text-emerald-600 flex items-center shrink-0">
                            <span className="block md:hidden tracking-wide">DNI</span>
                            <span className="hidden md:block">Daily Need Items</span>
                        </Link>

                        {pageName && (
                            <>
                                <span className="h-6 w-px bg-emerald-600" aria-hidden />
                                <span className="text-xl text-base font-medium font-bold text-emerald-600">{pageName}</span>
                            </>
                        )}

                    </div>
                </div>
            </div>
        </header>
    )
}

export default NavbarNoSearch
