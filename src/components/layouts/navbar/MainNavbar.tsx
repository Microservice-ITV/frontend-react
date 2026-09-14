
import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Search } from "lucide-react";
import { useAppSelector } from "@/app/hooks";
import { selectCartCount } from "@/features/cart/store/cartSelectors";
import NavbarTopUtilityBar from "./NavbarTopUtilityBar";
import { Announcements } from "@/components/layouts/announment";
import BrandLogo from './BrandLogo'


const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;

const MainNavbar = () => {
  const cartCount = useAppSelector(selectCartCount);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const queryRef = useRef(searchQuery);
  queryRef.current = searchQuery;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const nextQuery = location.pathname.startsWith("/search")
      ? (params.get("q") ?? "")
      : "";

    setSearchQuery(nextQuery);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, [location.pathname, location.search]);

  const doSearch = useCallback(
    (q?: string) => {
      const query = (q ?? queryRef.current).trim();
      if (query.length > 0) {
        navigate(`/search?q=${encodeURIComponent(query)}`);
      }
    },
    [navigate],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      const trimmed = value.trim();
      if (trimmed.length >= MIN_QUERY_LENGTH) {
        timerRef.current = setTimeout(() => {
          doSearch(trimmed);
        }, DEBOUNCE_MS);
      }
    },
    [doSearch],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        doSearch();
      }
    },
    [doSearch],
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-emerald-50">
      <Announcements />
      <NavbarTopUtilityBar />

      {/* ===== Main Navbar (with search bar) ===== */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex h-20 items-center gap-6">
            <BrandLogo />
            <Link
              to="/"
              className="text-2xl font-bold text-emerald-600 flex items-center"
            >
              <span className="block md:hidden tracking-wide">DNI</span>
              <span className="hidden md:block">Daily Need Items</span>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center border border-gray-300 rounded-sm overflow-hidden focus-within:border-emerald-500">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Search products, brands and more"
                  className="flex-1 min-w-0 px-4 py-2 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (timerRef.current) {
                      clearTimeout(timerRef.current);
                    }
                    doSearch();
                  }}
                  className="bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center cursor-pointer"
                  aria-label="Submit Search"
                >
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
  );
};

export default MainNavbar;
