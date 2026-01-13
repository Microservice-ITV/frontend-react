import { Link } from "react-router-dom"

const Footer = () => {
    return (
        <footer className="border-t bg-white mt-20">
            <div className="max-w-7xl mx-auto px-6 py-12">

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                    {/* Brand */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">🛒 Ecommerce</h3>
                        <p className="mt-3 text-sm text-gray-600">
                            Modern ecommerce platform built with React & Laravel.
                        </p>
                    </div>

                    {/* Shop */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900">Shop</h4>
                        <ul className="mt-4 space-y-2 text-sm text-gray-600">
                            <li><Link to="/products" className="hover:text-black">All Products</Link></li>
                            <li><Link to="/cart" className="hover:text-black">Cart</Link></li>
                            <li><Link to="/checkout" className="hover:text-black">Checkout</Link></li>
                        </ul>
                    </div>

                    {/* Account */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900">Account</h4>
                        <ul className="mt-4 space-y-2 text-sm text-gray-600">
                            <li><Link to="/login" className="hover:text-black">Login</Link></li>
                            <li><Link to="/register" className="hover:text-black">Register</Link></li>
                            <li><Link to="/account" className="hover:text-black">My Account</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900">Legal</h4>
                        <ul className="mt-4 space-y-2 text-sm text-gray-600">
                            <li><Link to="#" className="hover:text-black">Privacy Policy</Link></li>
                            <li><Link to="#" className="hover:text-black">Terms of Service</Link></li>
                        </ul>
                    </div>

                </div>

                {/* Bottom */}
                <div className="mt-12 border-t pt-6 text-center text-sm text-gray-500">
                    © {new Date().getFullYear()} Ecommerce. All rights reserved.
                </div>

            </div>
        </footer>
    )
}

export default Footer