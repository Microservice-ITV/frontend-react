import { Link, useLocation, matchPath } from "react-router-dom";
import NavbarTopUtilityBar from "./NavbarTopUtilityBar";
import BrandLogo from './BrandLogo'
import { Announcements } from "@/components/layouts/announment";

const getPageName = (pathname: string): string | null => {
  if (matchPath({ path: "/cart", end: true }, pathname)) return "Shopping Cart";
  if (matchPath({ path: "/checkout", end: true }, pathname)) return "Checkout";
  if (matchPath({ path: "/become-a-seller", end: true }, pathname))
    return "Become a Seller";
  return null;
};

const NavbarNoSearch = () => {
  const { pathname } = useLocation();
  const pageName = getPageName(pathname);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-emerald-50">
      <Announcements />
      <NavbarTopUtilityBar />

      {/* Main row — logo + page name (no search bar) */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex h-20 items-center gap-4">
            <BrandLogo />


            {pageName && (
              <>
                <span className="h-6 w-px bg-emerald-600" aria-hidden />
                <span className="text-xl text-base font-medium font-bold text-emerald-600">
                  {pageName}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};


export default NavbarNoSearch

