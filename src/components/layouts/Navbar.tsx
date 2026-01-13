import { Link } from 'react-router-dom'
import { ShoppingCart, Search } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { logout } from '@/features/auth/authThunks'

const Navbar = () => {
    const dispatch = useAppDispatch()
    const { isAuthenticated, user } = useAppSelector((s) => s.auth)

    return (
        <header className="sticky top-0 z-50 bg-white shadow-sm">
            {/* ===== Top Utility Bar ===== */}
            <div className="bg-gray-50 text-xs text-gray-600">
                <div className="max-w-7xl mx-auto px-6 flex justify-between h-8 items-center">
                    <div className="flex space-x-4">
                        <Link to="#" className="hover:text-black">Help</Link>
                        <Link to="#" className="hover:text-black">Notifications</Link>
                    </div>

                    <div className="flex space-x-4">
                        {!isAuthenticated ? (
                            <>
                                <Link to="/login" className="hover:text-black">
                                    Login
                                </Link>
                                <Link to="/register" className="hover:text-black">
                                    Register
                                </Link>
                            </>
                        ) : (
                            <>
                                <span className="text-gray-800">
                                    Hi, <strong>{user?.name}</strong>
                                </span>
                                <button
                                    onClick={() => dispatch(logout())}
                                    className="text-red-500 hover:underline"
                                >
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== Main Navbar ===== */}
            <div className="bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex h-20 items-center gap-6">

                        {/* Logo */}
                        <Link to="/" className="text-2xl font-bold text-orange-500">
                            Shopee
                        </Link>

                        {/* Search Bar */}
                        <div className="flex-1">
                            <div className="flex items-center border rounded-sm overflow-hidden">
                                <input
                                    type="text"
                                    placeholder="Search products, brands and more"
                                    className="flex-1 px-4 py-2 text-sm outline-none"
                                />
                                <button className="bg-orange-500 px-4 py-2 text-white cursor-pointer">
                                    <Search size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Cart */}
                        <Link to="/cart" className="relative">
                            <ShoppingCart size={26} />
                            <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full px-1.5">
                                0
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Navbar