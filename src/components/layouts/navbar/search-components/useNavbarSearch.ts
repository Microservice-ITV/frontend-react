import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { searchProducts } from "@/features/products/store/productThunks";
import { fetchCategories } from "@/features/categories/store/categoryThunks";
import {
  selectCategories,
  selectCategoriesStatus,
} from "@/features/categories/store/categorySelectors";

export const DEBOUNCE_MS = 400;
export const MIN_QUERY_LENGTH = 2;
export const ALL_CATEGORIES = "";

export function useNavbarSearch() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const searchResults = useAppSelector((s) => s.products.searchResults || []);
  const searchStatus = useAppSelector((s) => s.products.searchStatus || "idle");
  const rawCategories = useAppSelector(selectCategories);
  const categories = rawCategories.filter((c) => (c._count?.products ?? 0) > 0);
  const categoriesStatus = useAppSelector(selectCategoriesStatus);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(ALL_CATEGORIES);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const queryRef = useRef(searchQuery);
  const categoryRef = useRef(selectedCategoryId);
  queryRef.current = searchQuery;
  categoryRef.current = selectedCategoryId;

  useEffect(() => {
    if (categoriesStatus === "idle") {
      dispatch(fetchCategories());
    }
  }, [categoriesStatus, dispatch]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const onSearchPage = location.pathname.startsWith("/search");
    const nextQuery = onSearchPage ? (params.get("q") ?? "") : "";
    const categorySlug = onSearchPage ? params.get("category") : null;

    setSearchQuery(nextQuery);

    if (categorySlug && categories.length > 0) {
      const match = categories.find((c) => c.slug === categorySlug);
      setSelectedCategoryId(match?.id ?? ALL_CATEGORIES);
    } else if (!categorySlug) {
      setSelectedCategoryId(ALL_CATEGORIES);
    }

    if (timerRef.current) clearTimeout(timerRef.current);
  }, [location.pathname, location.search, categories]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(event.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isMobileSearchOpen && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const doSearch = useCallback(
    (q?: string) => {
      const query = (q ?? queryRef.current).trim();
      if (query.length > 0) {
        setIsDropdownOpen(false);
        setIsMobileSearchOpen(false);
        const params = new URLSearchParams({ q: query });
        const cat = categories.find((c) => c.id === categoryRef.current);
        if (cat) params.set("category", cat.slug);
        navigate(`/search?${params.toString()}`);
      }
    },
    [navigate, categories],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);

      if (timerRef.current) clearTimeout(timerRef.current);

      const trimmed = value.trim();
      if (trimmed.length >= MIN_QUERY_LENGTH) {
        setIsDropdownOpen(true);
        timerRef.current = setTimeout(() => {
          dispatch(
            searchProducts({
              query: trimmed,
              categoryId: categoryRef.current || undefined,
            }),
          );
        }, DEBOUNCE_MS);
      } else {
        setIsDropdownOpen(false);
      }
    },
    [dispatch],
  );

  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      setSelectedCategoryId(categoryId);
      const trimmed = queryRef.current.trim();
      if (trimmed.length >= MIN_QUERY_LENGTH) {
        if (timerRef.current) clearTimeout(timerRef.current);
        dispatch(
          searchProducts({
            query: trimmed,
            categoryId: categoryId || undefined,
          }),
        );
      }
    },
    [dispatch],
  );

  const handleFocus = useCallback(() => {
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
        if (timerRef.current) clearTimeout(timerRef.current);
        doSearch();
      }
    },
    [doSearch],
  );

  const clearDesktopSearch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSearchQuery("");
    setIsDropdownOpen(false);
    navigate("/");
  }, [navigate]);

  const clearMobileSearch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSearchQuery("");
  }, []);

  return {
    searchQuery,
    selectedCategoryId,
    selectedCategory,
    isDropdownOpen,
    isCategoryOpen,
    isMobileSearchOpen,
    categories,
    searchResults,
    searchStatus,
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
  };
}
