import { useNavbarVariant } from './useNavbarVariant'
import MainNavbar from './MainNavbar'
import NavbarNoSearch from './NavbarNoSearch'

const Navbar = () => {
    const variant = useNavbarVariant()

    if (variant === 'noSearch') return <NavbarNoSearch />
    return <MainNavbar />
}

export default Navbar
