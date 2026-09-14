import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { logout } from '@/features/auth/store/authThunks'
import { extractRoleFromUser } from '@/app/rbac/normalizers'

/** Logged-in buyers: apply to sell. Shop roles: dashboard entry. */
export const START_SELLING_PATH = '/become-a-seller'
export const SELLER_DASHBOARD_OVERVIEW_PATH = '/seller/overview'

/**
 * Top gray strip: Start Selling, Help, Notifications + auth (Login/Register or user menu).
 */
const NavbarTopUtilityBar = () => {
    const dispatch = useAppDispatch()
    const { isAuthenticated, user } = useAppSelector((s) => s.auth)

    const startSellingTo = useMemo(() => {
        if (!user) return START_SELLING_PATH
        const role = extractRoleFromUser(user)
        if (role === 'SHOP_OWNER' || role === 'SHOP_ADMIN') return SELLER_DASHBOARD_OVERVIEW_PATH
        return START_SELLING_PATH
    }, [user])

    return (
        <div className="bg-gray-50 text-xs text-gray-600 overflow-visible">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between h-8 items-center">
                <div className="flex space-x-4">
                    {/* <Link to={startSellingTo} className="hover:text-black">
                        Start Selling
                    </Link> */}
                    <Link to="/help-centre" className="hover:text-black">
                        Help
                    </Link>
                    <Link to="#" className="hover:text-black">
                        Notifications
                    </Link>
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

                                <span className="max-w-[120px] truncate text-sm">{user.name}</span>
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
                            <Link to="/login" className="hover:text-black">
                                Login
                            </Link>
                            <Link to="/register" className="hover:text-black">
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default NavbarTopUtilityBar