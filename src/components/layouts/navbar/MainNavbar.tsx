import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Heart, X } from "lucide-react";
import { useAppSelector } from "@/app/hooks";
import { selectIsAuthenticated } from "@/features/auth/store/authSelectors";
import { selectCartCount } from "@/features/cart/store/cartSelectors";
import { selectWishlistCount } from "@/features/wishlist/store/wishlistSelectors";
import NavbarTopUtilityBar from "./NavbarTopUtilityBar";
import { Announcements } from "@/components/layouts/announment";
import BrandLogo from "./BrandLogo";
import CategoryDropdown from "./search-components/CategoryDropdown";
import SearchResultsPanel from "./search-components/SearchResultsPanel";
import MobileSearchOverlay from "./search-components/MobileSearchOverlay";
import {
  useNavbarSearch,
  MIN_QUERY_LENGTH,
} from "./search-components/useNavbarSearch";

const MainNavbar = () => {
  const navigate = useNavigate();
  const cartCount = useAppSelector(selectCartCount);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const wishlistCount = useAppSelector(selectWishlistCount);

  const {
    searchQuery,
    selectedCategoryId,
    selectedCategory,
    isDropdownOpen,
    isCategoryOpen,
    isMobileSearchOpen,
    categories,
    searchResults,
    searchStatus,
    shopResults,
    shopStatus,
    searchContainerRef,
    categoryMenuRef,
    mobileInputRef,
    setIsCategoryOpen,
    setIsMobileSearchOpen,
    doSearch,
    handleChange,
    handleCategoryChange,
    handleFocus,
    handleKeyDown,
    clearDesktopSearch,
    clearMobileSearch,
  } = useNavbarSearch();

  const goToProduct = (productId: string) => navigate(`/products/${productId}`);
  const goToShop = (shopId: string) => navigate(`/shops/${shopId}`);

  return (
    <header className="sticky top-0 z-50 bg-emerald-50">
      <Announcements />
      <NavbarTopUtilityBar />

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex h-20 items-center gap-4 sm:gap-6">
            <BrandLogo />

            <div
              className="flex-1 min-w-0 relative hidden md:block"
              ref={searchContainerRef}
            >
              <div className="flex items-center border border-gray-300 rounded-sm focus-within:border-emerald-500 bg-white">
                <CategoryDropdown
                  categories={categories}
                  selectedCategoryId={selectedCategoryId}
                  selectedCategory={selectedCategory}
                  isOpen={isCategoryOpen}
                  onToggle={() => setIsCategoryOpen((open) => !open)}
                  onSelect={(id) => {
                    handleCategoryChange(id);
                    setIsCategoryOpen(false);
                  }}
                  menuRef={categoryMenuRef}
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    selectedCategory
                      ? `Search in ${selectedCategory.name}`
                      : "Search products, shops and more"
                  }
                  className="flex-1 min-w-0 px-4 py-2 text-sm outline-none bg-transparent"
                />
                {searchQuery.length > 0 && (
                  <button
                    type="button"
                    onClick={clearDesktopSearch}
                    className="px-2 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X size={18} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => doSearch()}
                  className="bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center cursor-pointer"
                  aria-label="Submit Search"
                >
                  <Search size={18} />
                </button>
              </div>

              {isDropdownOpen &&
                searchQuery.trim().length >= MIN_QUERY_LENGTH && (
                  <SearchResultsPanel
                    searchQuery={searchQuery}
                    searchResults={searchResults}
                    searchStatus={searchStatus}
                    shopResults={shopResults}
                    shopStatus={shopStatus}
                    selectedCategory={selectedCategory}
                    onSelectProduct={goToProduct}
                    onSelectShop={goToShop}
                    onSeeAll={doSearch}
                  />
                )}
            </div>

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
                  {selectedCategory
                    ? `Search in ${selectedCategory.name}`
                    : "Search products, shops and more"}
                </span>
              </div>
            </div>

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

      {isMobileSearchOpen && (
        <MobileSearchOverlay
          searchQuery={searchQuery}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          searchResults={searchResults}
          searchStatus={searchStatus}
          shopResults={shopResults}
          shopStatus={shopStatus}
          inputRef={mobileInputRef}
          onClose={() => setIsMobileSearchOpen(false)}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onClear={clearMobileSearch}
          onSearch={() => doSearch()}
          onCategorySelect={handleCategoryChange}
          onSelectProduct={goToProduct}
          onSelectShop={goToShop}
        />
      )}
    </header>
  );
};

export default MainNavbar;
