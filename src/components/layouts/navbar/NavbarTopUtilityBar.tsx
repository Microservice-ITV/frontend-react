import { Link } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { logout } from '@/features/auth/store/authThunks'
import { extractRoleFromUser } from '@/app/rbac/normalizers'
import { Sparkles, Tag, User } from 'lucide-react'
import { openAiAssistant } from '@/features/ai/store/aiAssistantSlice'

/** Logged-in buyers: apply to sell. Shop roles: dashboard entry. */
export const START_SELLING_PATH = '/become-a-seller'
export const SELLER_DASHBOARD_OVERVIEW_PATH = '/seller/overview'

/**
 * Top gray strip: Start Selling, Help, Notifications + auth (Login/Register or user menu).
 */
const NavbarTopUtilityBar = () => {
    const dispatch = useAppDispatch()
    const { isAuthenticated, user } = useAppSelector((s) => s.auth)
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!menuOpen) return
        const handlePointerDown = (e: PointerEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false)
            }
        }
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMenuOpen(false)
        }
        document.addEventListener('pointerdown', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [menuOpen])

    const startSellingTo = useMemo(() => {
        if (!user) return START_SELLING_PATH
        const role = extractRoleFromUser(user)
        if (role === 'WAREHOUSE_MANAGER') return '/warehouse-manager/warehouse'
        if (role === 'DELIVERY_AGENT') return '/delivery-agent/overview'
        if (role === 'SHOP_OWNER' || role === 'SHOP_ADMIN') return SELLER_DASHBOARD_OVERVIEW_PATH
        return START_SELLING_PATH
    }, [user])

    return (
        <div className="bg-gray-50 text-xs text-gray-600 overflow-visible">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between h-8 items-center gap-2">
                <div className="flex space-x-4 items-center">
                    <Link to={startSellingTo} className="hover:text-black">
                        Start Selling
                    </Link>
                    {/* <Link to={startSellingTo} className="hover:text-black">
                        Start Selling
                    </Link>
                    {/* 
                    <Link to="/help-centre" className="hover:text-black">
                        Help
                    </Link>
                    <Link to="#" className="hover:text-black">
                        Notifications
                    </Link>
                    */}
                </div>

                {/* Desktop Announcement Badge */}
                <Link
                    to="/all_categories"
                    className="hidden md:inline-flex relative overflow-hidden items-center gap-2 px-4 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-amber-950 border border-yellow-200 shadow-[0_2px_10px_rgba(245,158,11,0.35)] hover:shadow-[0_4px_14px_rgba(245,158,11,0.5)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group cursor-pointer"
                >
                    {/* Shimmer sweep effect */}
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

                    {/* Left Sparkles Icon */}
                    <Sparkles className="w-4 h-4 text-amber-800 animate-pulse shrink-0" />

                    <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-600 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-700"></span>
                    </span>

                    <Tag className="w-4 h-4 text-amber-900 group-hover:rotate-12 transition-transform duration-200 shrink-0" />

                    <span className="tracking-wide text-amber-950 font-bold whitespace-nowrap">
                        New user, get all items 10% discount
                    </span>

                    {/* Right Sparkles Icon */}
                    <Sparkles className="w-4 h-4 text-amber-800 animate-bounce shrink-0" />
                </Link>

                <div className="flex space-x-4 items-center">
                    {isAuthenticated && user ? (
                        <div ref={menuRef} className="relative z-[100] group">
                            <button
                                type="button"
                                onClick={() => setMenuOpen((o) => !o)}
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                                className="flex items-center gap-2 py-1 text-gray-800 hover:text-black cursor-pointer touch-manipulation"
                            >
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                    {user.profile_image ? (
                                        <img
                                            src={user.profile_image}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <svg viewBox="0 0 15 15" className="w-4 h-4 text-gray-600">
                                            <circle cx="7.5" cy="4.5" r="3.8" fill="none" stroke="currentColor" />
                                            <path
                                                d="M1.5 14.2c0-3.3 2.7-6 6-6s6 2.7 6 6"
                                                fill="none"
                                                stroke="currentColor"
                                            />
                                        </svg>
                                    )}
                                </div>

                                <span className="max-w-[120px] truncate text-sm">{user.name}</span>
                            </button>

                            <div
                                role="menu"
                                className={`
                                        absolute right-0 top-full mt-2 z-[200] w-48 bg-white rounded-sm
                                        shadow-[0_2px_8px_rgba(0,0,0,0.15)]
                                        md:group-hover:opacity-100 md:group-hover:visible md:group-hover:translate-y-0
                                        transition-all duration-150 ease-out
                                        ${menuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-[-4px]'}
                                    `}
                            >
                                <div className="absolute -top-2 right-6 w-4 h-4 bg-white rotate-45" />

                                <Link
                                    to="/account/profile"
                                    onClick={() => setMenuOpen(false)}
                                    className="block px-4 py-3 text-sm hover:bg-gray-100"
                                >
                                    My Account
                                </Link>

                                <Link
                                    to="/account/orders"
                                    onClick={() => setMenuOpen(false)}
                                    className="block px-4 py-3 text-sm hover:bg-gray-100"
                                >
                                    My Purchase
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false)
                                        dispatch(logout())
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 cursor-pointer"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden />
                            <span>
                                <Link to="/login" className="hover:text-black">
                                    Login
                                </Link>
                                <span className="mx-1" aria-hidden>
                                    /
                                </span>
                                <Link to="/register" className="hover:text-black">
                                    Register
                                </Link>
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Responsive Gold Banner (Under Navbar Utility Strip) */}
            <div className="block md:hidden bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-amber-950 py-1.5 px-3 border-t border-b border-yellow-300/60 shadow-xs">
                <Link
                    to="/all_categories"
                    className="flex items-center justify-between gap-2 max-w-7xl mx-auto text-xs font-bold"
                >
                    <div className="flex items-center gap-1.5 min-w-0">
                        <Sparkles className="w-3.5 h-3.5 text-amber-900 animate-pulse shrink-0" />
                        <Tag className="w-3.5 h-3.5 text-amber-900 shrink-0" />
                        <span className="truncate text-amber-950 font-bold">New user, get all 10% discount</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 bg-amber-950 text-yellow-300 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-2xs">
                        <span>Get 10% OFF</span>
                        <Sparkles className="w-3 h-3 text-yellow-300 animate-bounce" />
                    </div>
                </Link>
            </div>
        </div>
    )
}

export default NavbarTopUtilityBar
