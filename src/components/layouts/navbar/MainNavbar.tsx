import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Heart, X, ArrowLeft } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { selectIsAuthenticated } from "@/features/auth/store/authSelectors";
import { selectCartCount } from "@/features/cart/store/cartSelectors";
import { selectWishlistCount } from "@/features/wishlist/store/wishlistSelectors";
import { searchProducts } from "@/features/products/store/productThunks";
import NavbarTopUtilityBar from "./NavbarTopUtilityBar";
import { Announcements } from "@/components/layouts/announment";
import BrandLogo from "./BrandLogo";

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;

const MainNavbar = () => {
  const dispatch = useAppDispatch();
  const cartCount = useAppSelector(selectCartCount);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const wishlistCount = useAppSelector(selectWishlistCount);

  const searchResults = useAppSelector((s) => s.products.searchResults || []);
  const searchStatus = useAppSelector((s) => s.products.searchStatus || "idle");

  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const queryRef = useRef(searchQuery);
  queryRef.current = searchQuery;

  // Sync search input with URL if on search page
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

  // Close desktop dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus mobile input when full-screen view opens
  useEffect(() => {
    if (isMobileSearchOpen && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  const doSearch = useCallback(
    (q?: string) => {
      const query = (q ?? queryRef.current).trim();
      if (query.length > 0) {
        setIsDropdownOpen(false);
        setIsMobileSearchOpen(false);
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
        setIsDropdownOpen(true);
        timerRef.current = setTimeout(() => {
          dispatch(searchProducts({ query: trimmed }));
        }, DEBOUNCE_MS);
      } else {
        setIsDropdownOpen(false);
      }
    },
    [dispatch],
  );

  const handleFocus = useCallback(() => {
    // If mobile view, open the full-screen mobile search page experience
    if (window.innerWidth < 768) {
      setIsMobileSearchOpen(true);
    } else if (searchQuery.trim().length >= MIN_QUERY_LENGTH) {
      setIsDropdownOpen(true);
    }
  }, [searchQuery]);

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
    <header className="sticky top-0 z-50 bg-emerald-50">
      <Announcements />
      <NavbarTopUtilityBar />

      {/* ===== Main Navbar (with search bar) ===== */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex h-20 items-center gap-4 sm:gap-6">
            <BrandLogo />

            {/* Search Bar Container (Desktop) */}
            <div
              className="flex-1 min-w-0 relative hidden md:block"
              ref={searchContainerRef}
            >
              <div className="flex items-center border border-gray-300 rounded-sm overflow-hidden focus-within:border-emerald-500 bg-white">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onKeyDown={handleKeyDown}
                  placeholder="Search products, brands and more"
                  className="flex-1 min-w-0 px-4 py-2 text-sm outline-none bg-transparent"
                />
                {searchQuery.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (timerRef.current) clearTimeout(timerRef.current);
                      setSearchQuery("");
                      setIsDropdownOpen(false);
                      navigate("/");
                    }}
                    className="px-2 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X size={18} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (timerRef.current) clearTimeout(timerRef.current);
                    doSearch();
                  }}
                  className="bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center cursor-pointer"
                  aria-label="Submit Search"
                >
                  <Search size={18} />
                </button>
              </div>

              {/* Desktop Instant Search Dropdown */}
              {isDropdownOpen &&
                searchQuery.trim().length >= MIN_QUERY_LENGTH && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 flex flex-col max-h-96">
                    {/* Sticky Header Fixed at Top of Results */}
                    <div className="flex-shrink-0 bg-white z-10 px-4 pt-3 pb-2 border-b border-gray-100">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Products ({searchResults.length})
                      </h3>
                    </div>

                    {/* Internal Scrollable Products Container */}
                    <div className="flex-1 overflow-y-auto px-4 divide-y divide-gray-50">
                      {searchStatus === "loading" &&
                        searchResults.length === 0 && (
                          <div className="py-6 text-center text-xs text-gray-500">
                            Searching products...
                          </div>
                        )}

                      {searchStatus === "succeeded" &&
                        searchResults.length === 0 && (
                          <div className="py-6 text-center text-xs text-gray-500">
                            No products found
                          </div>
                        )}

                      {searchResults.map((product: any) => (
                        <div
                          key={product.id || product._id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setIsDropdownOpen(false);
                            navigate(`/products/${product.id || product._id}`);
                          }}
                          className="flex items-center justify-between py-2.5 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden flex items-center justify-center border border-gray-200">
                              {product.image || product.thumbnail ? (
                                <img
                                  src={product.image || product.thumbnail}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Search size={16} className="text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {product.name}
                              </h4>
                              <p className="text-xs text-gray-500 truncate">
                                {product.subtitle ||
                                  product.category ||
                                  "Wireless Earphones"}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-emerald-600 pl-3 flex-shrink-0">
                            ${product.price}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Categories Footer Section */}
                    <div className="flex-shrink-0 border-t border-gray-100 p-3 bg-gray-50/50">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                        Categories
                      </h3>
                      <div
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => doSearch(searchQuery)}
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 cursor-pointer py-1"
                      >
                        Search for &apos;{searchQuery}&apos; in{" "}
                        <span className="underline">Smartphones</span>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Mobile Search Trigger Bar (Triggers full screen view on click) */}
            <div className="flex-1 min-w-0 md:hidden">
              <div
                onClick={() => setIsMobileSearchOpen(true)}
                className="flex items-center border border-gray-300 rounded-sm bg-white px-3 py-2 cursor-pointer"
              >
                <Search
                  size={16}
                  className="text-gray-400 mr-2 flex-shrink-0"
                />
                <span className="text-sm text-gray-400 truncate">
                  Search products, brands and more
                </span>
              </div>
            </div>

            {/* Wishlist & Cart Links */}
            {isAuthenticated && (
              <Link
                to="/wishlist"
                className="relative flex items-center flex-shrink-0"
                aria-label="Wishlist"
              >
                <Heart size={22} className="md:size-[26px]" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] leading-none px-[3px]">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Link>
            )}

            <Link
              to="/cart"
              className="relative flex items-center flex-shrink-0"
              aria-label="Cart"
            >
              <ShoppingCart size={22} className="md:size-[26px]" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] leading-none px-[3px]">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* ===== Full-Screen Mobile Search Overlay Page ===== */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col md:hidden">
          {/* Top Search Header */}
          <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-1.5 text-gray-600 hover:text-gray-900 cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft size={22} />
            </button>
            <div className="flex items-center flex-1 border border-gray-300 rounded-sm overflow-hidden focus-within:border-emerald-500 bg-white px-3 py-1.5">
              <input
                ref={mobileInputRef}
                type="text"
                value={searchQuery}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Search products, brands and more"
                className="w-full text-sm outline-none bg-transparent"
              />
              {searchQuery.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (timerRef.current) clearTimeout(timerRef.current);
                    setSearchQuery("");
                  }}
                  className="px-1 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                if (timerRef.current) clearTimeout(timerRef.current);
                doSearch();
              }}
              className="bg-emerald-600 px-3 py-2 text-white rounded-sm text-sm font-medium"
            >
              Search
            </button>
          </div>

          {/* Full Screen Scrollable Content */}
          {/* Full Screen Scrollable Content */}
          <div className="flex-1 flex flex-col min-h-0 bg-[#f5f5f5]">
            {searchQuery.trim().length >= MIN_QUERY_LENGTH ? (
              <div className="flex-1 flex flex-col bg-white shadow-sm min-h-0">
                {/* Sticky Header Fixed at Top of Results */}
                <div className="flex-shrink-0 bg-white z-10 px-4 pt-3 pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Products ({searchResults.length})
                  </h3>
                </div>

                {/* Internal Scrollable Products Container */}
                <div className="flex-1 overflow-y-auto px-4 divide-y divide-gray-100">
                  {searchStatus === "loading" && searchResults.length === 0 && (
                    <div className="py-12 text-center text-sm text-gray-500">
                      Searching products...
                    </div>
                  )}

                  {searchStatus === "succeeded" &&
                    searchResults.length === 0 && (
                      <div className="py-12 text-center text-sm text-gray-500">
                        No products found matching &ldquo;{searchQuery}&rdquo;
                      </div>
                    )}

                  {searchResults.map((product: any) => (
                    <div
                      key={product.id || product._id}
                      onClick={() => {
                        setIsMobileSearchOpen(false);
                        navigate(`/products/${product.id || product._id}`);
                      }}
                      className="flex items-center justify-between py-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden flex items-center justify-center border border-gray-200">
                          {product.image || product.thumbnail ? (
                            <img
                              src={product.image || product.thumbnail}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Search size={16} className="text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {product.name}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">
                            {product.subtitle ||
                              product.category ||
                              "Wireless Earphones"}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-emerald-600 pl-3 flex-shrink-0">
                        ${product.price}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Categories Footer Section */}
                {searchQuery.trim().length > 0 && (
                  <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-gray-50/50">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                      Categories
                    </h3>
                    <div
                      onClick={() => doSearch(searchQuery)}
                      className="text-sm font-medium text-emerald-600 cursor-pointer py-1"
                    >
                      Search for &apos;{searchQuery}&apos; in{" "}
                      <span className="underline">Smartphones</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-gray-400">
                Type at least {MIN_QUERY_LENGTH} characters to search products
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default MainNavbar;
