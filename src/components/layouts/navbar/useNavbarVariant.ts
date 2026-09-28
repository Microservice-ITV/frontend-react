import { useLocation, matchPath } from 'react-router-dom'
import type { NavbarVariant } from './types'

export const useNavbarVariant = (): NavbarVariant => {
    const { pathname } = useLocation()

    /**
     * No Search Bar — Product details, Cart, Checkout
     * Minimal navbar for conversion-focused pages
     */
    if (
        matchPath({ path: '/checkout', end: true }, pathname) ||
        matchPath({ path: '/checkout/guest', end: true }, pathname) ||
        matchPath({ path: '/cart', end: true }, pathname) ||
        matchPath({ path: '/become-a-seller', end: true }, pathname)
    ) {
        return 'noSearch'
    }

    /**
     * Main Navbar (with search bar) — Homepage, Categories
     */
    if (
        matchPath({ path: '/', end: true }, pathname) ||
        matchPath({ path: '/categories/:id', end: true }, pathname)
    ) {
        return 'main'
    }

    return 'main'
}
