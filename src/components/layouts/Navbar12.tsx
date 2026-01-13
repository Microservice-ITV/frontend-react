import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { logout } from '@/features/auth/authThunks'

const Navbar = () => {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)

  return (
    <nav className="
      sticky top-0 z-50
      bg-white/80 backdrop-blur
      border-b shadow-sm
    ">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-gray-900">
            🛒 Ecommerce
          </Link>

          {/* Center Links */}
          <div className="hidden md:flex space-x-6">
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link to="/products" className="text-gray-600 hover:text-gray-900">
              Products
            </Link>
            <Link to="/cart" className="text-gray-600 hover:text-gray-900">
              Cart
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
                >
                  Register
                </Link>
              </>
            ) : (
              <div className="relative group">
                <button className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.name}
                  </span>
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown */}
                <div className="
                  absolute right-0 mt-2 w-40
                  bg-white border rounded-md shadow-lg
                  opacity-0 group-hover:opacity-100
                  pointer-events-none group-hover:pointer-events-auto
                  transition
                ">
                  <Link
                    to="/account"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    My Account
                  </Link>
                  <button
                    onClick={() => dispatch(logout())}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}

export default Navbar