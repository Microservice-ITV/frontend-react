import { useMemo, useState, useRef, useEffect } from 'react'
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bell,
  Settings,
  LogOut,
  ShoppingCart,
  CreditCard,
  UserPlus,
  Check,
  X,
  ArrowRight,
  Layers,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { logout } from '@/features/auth/store/authThunks'
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
} from '@/features/notifications/store/notificationSlice'
import { useDashboardMenu } from '../../hooks/useDashboardMenu'
import {
  searchGlobalData,
  type GlobalSearchSection,
} from '../../api/globalSearchApi'
import type { DashboardArea } from '../../types/dashboardTypes'
import { getTopbarRouteConfig } from '../../config/topbarRouteConfig'

type DashboardTopbarProps = {
  area: DashboardArea;
  onMenuClick: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};
type SearchResult = {
  key: string;
  label: string;
  to: string;
  section: string;
};

// How long the modal's open/close CSS transition takes. Keep this in sync
// with the `duration-*` class used on the backdrop/panel below.
const MODAL_TRANSITION_MS = 200;

const DashboardTopbar = ({
  area,
  onMenuClick,
  isSidebarCollapsed,
  onToggleSidebar,
}: DashboardTopbarProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authUser = useAppSelector((state) => state.auth.user);
  const menuSections = useDashboardMenu(area);

  const notifications = useAppSelector(
    (state) => state.notifications.items.slice(0, 5),
  );
  const unreadCount = useAppSelector(
    (state) => state.notifications.unreadCount,
  );

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // Whether the modal is in the DOM at all. Stays true a little longer than
  // `searchOpen` so the closing transition has time to play before unmount.
  const [modalMounted, setModalMounted] = useState(false);
  // Whether the modal should be showing its "visible" (entered) styles.
  // Flipped on one tick after mount so the transition has a from-state.
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [dataGroups, setDataGroups] = useState<GlobalSearchSection[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchResults = useMemo<SearchResult[]>(
    () =>
      menuSections.flatMap((section) => {
        const items = section.items.flatMap((item) =>
          item.children && item.children.length > 0
            ? item.children.map((child) => ({
              key: child.key,
              label: child.label,
              to: child.to,
              section: section.title,
            }))
            : [
              {
                key: item.key,
                label: item.label,
                to: item.to,
                section: section.title,
              },
            ],
        );
        return items;
      }),
    [menuSections],
  );

  const filteredResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return query
      ? searchResults.filter((result) =>
        result.label.toLowerCase().includes(query),
      )
      : searchResults;
  }, [searchResults, searchQuery]);

  useEffect(() => {
    abortRef.current?.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const query = searchQuery.trim();
    if (!searchOpen || query.length < 2) {
      setDataGroups([]);
      setDataLoading(false);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    debounceRef.current = setTimeout(async () => {
      setDataLoading(true);
      const sections = await searchGlobalData(
        query,
        menuSections,
        {},
        controller.signal,
      );
      if (!controller.signal.aborted) {
        setDataGroups(sections);
        setDataLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      controller.abort();
    };
  }, [searchQuery, searchOpen, menuSections]);

  const dataItems = useMemo(
    () => dataGroups.flatMap((section) => section.items),
    [dataGroups],
  );

  const combinedRows = useMemo(
    () => [...filteredResults, ...dataItems],
    [filteredResults, dataItems],
  );

  const globalIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    let idx = 0;
    filteredResults.forEach((r) => {
      map.set(r.key, idx++);
    });
    dataGroups.forEach((group) =>
      group.items.forEach((item) => {
        map.set(item.key, idx++);
      }),
    );
    return map;
  }, [filteredResults, dataGroups]);

  const initials =
    authUser?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "U";

  const displayName = authUser?.name ?? "User";
  const displayEmail = authUser?.email ?? "";
  const topbarRoutes = getTopbarRouteConfig(area);

  // Mount/unmount + enter/exit animation state machine for the search modal.
  // Opening: mount immediately, then flip to the "visible" styles one frame
  // later so the browser has a from-state to transition from.
  // Closing: flip back to the "hidden" styles immediately, then wait for the
  // CSS transition to finish before actually removing the modal from the DOM.
  useEffect(() => {
    if (searchOpen) {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setModalMounted(true);
      const raf = requestAnimationFrame(() => setModalVisible(true));
      return () => cancelAnimationFrame(raf);
    }

    setModalVisible(false);
    closeTimeoutRef.current = setTimeout(() => {
      setModalMounted(false);
    }, MODAL_TRANSITION_MS);

    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setNotificationOpen(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    if (profileOpen || notificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen, notificationOpen]);

  // Open and close command shortcut support (⌘K or Ctrl+K to toggle)
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  const goToSearchResult = (to: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    navigate(to);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setSearchOpen(false);
      setSearchQuery("");
      return;
    }
    if (combinedRows.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % combinedRows.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(
        (i) => (i - 1 + combinedRows.length) % combinedRows.length,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (combinedRows[activeIndex]) {
        goToSearchResult(combinedRows[activeIndex].to);
      }
    }
  };

  const handleLogout = () => {
    setProfileOpen(false);
    dispatch(logout());
  };

  const formatTimeAgo = (value: string): string => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Recently'
    const diffMinutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000))
    if (diffMinutes < 60) return `${diffMinutes} min ago`
    const diffHours = Math.round(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    const diffDays = Math.round(diffHours / 24)
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  }

  const markNotificationAsRead = (notification: { id: string; status: 'UNREAD' | 'READ' }) => {
    if (notification.status !== 'UNREAD') return
    void dispatch(markNotificationRead(notification.id))
  }

  const markAllRead = () => {
    notifications.forEach((notification) => {
      if (notification.status === 'UNREAD') {
        void dispatch(markNotificationRead(notification.id))
      }
    })
  }

  const getNotificationIcon = (type: string) => {
    if (type === 'PAYMENT') return CreditCard
    if (type === 'ACCOUNT' || type === 'MARKETING') return UserPlus
    return ShoppingCart
  }

  const renderSearchRow = (
    key: string,
    label: string,
    to: string,
    rightText?: string,
    subtitle?: string,
  ) => {
    const index = globalIndexMap.get(key);
    const isActive = index === activeIndex;

    return (
      <button
        key={key}
        type="button"
        onMouseEnter={() => {
          if (index != null) setActiveIndex(index);
        }}
        onClick={() => goToSearchResult(to)}
        className={`group flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition-all rounded-xl ${isActive
            ? "bg-emerald-50 text-emerald-900 font-medium"
            : "hover:bg-slate-50 text-slate-700"
          }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`p-2 rounded-lg shrink-0 transition-colors ${isActive ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}
          >
            <Layers size={16} />
          </div>
          <div className="min-w-0">
            <span className="block truncate text-sm">{label}</span>
            {subtitle && (
              <span className="block truncate text-xs text-slate-400">
                {subtitle}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {rightText && (
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${isActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
                }`}
            >
              {rightText}
            </span>
          )}
          <ArrowRight
            size={14}
            className={`transition-opacity ${isActive ? "opacity-100 text-emerald-600" : "opacity-0 group-hover:opacity-100 text-slate-400"}`}
          />
        </div>
      </button>
    );
  };

  const renderSectionHeading = (label: string) => (
    <div className="px-4 pb-2 pt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
      <span>{label}</span>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
        {/* Left: menu + search trigger button */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden shrink-0 rounded-md p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-black lg:block"
            aria-label={
              isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>

          <button
            type="button"
            onClick={onMenuClick}
            className="shrink-0 rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          {/* Mobile: icon-only search trigger */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex sm:hidden shrink-0 items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 cursor-pointer"
            aria-label="Open search"
          >
            <Search size={20} />
          </button>

          {/* Desktop/tablet: full search trigger bar that opens the modal */}
          <div className="hidden sm:block w-full max-w-lg">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-between w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-left text-sm text-slate-400 hover:border-slate-300 hover:bg-white transition-all shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Search size={18} className="text-slate-400 shrink-0" />
                <span className="truncate">
                  Web apps, screens, flows, or keywords...
                </span>
              </div>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                ⌘K
              </kbd>
            </button>
          </div>
        </div>

        {/* Right: notification + profile */}
        <div className="flex shrink-0 items-center gap-2">
          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={() => setNotificationOpen((o) => !o)}
              className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              aria-label="Notifications"
              aria-expanded={notificationOpen}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-[360px] max-w-[90vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={markAllRead}
                    className="flex cursor-pointer items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    <Check size={14} />
                    Mark all read
                  </button>
                </div>

                <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
                  {notifications.map((item) => {
                    const Icon = getNotificationIcon(item.type);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          markNotificationRead(item.id);
                          navigate(topbarRoutes.notificationsPath);
                          setNotificationOpen(false);
                        }}
                        className={`flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors ${item.read
                            ? "bg-white hover:bg-slate-50"
                            : "bg-emerald-50/30 hover:bg-emerald-50/60"
                          }`}
                      >
                        <div className="rounded-full bg-emerald-100 p-2 text-emerald-600 shrink-0">
                          <Icon size={16} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold leading-tight text-slate-900">
                            {item.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-600">
                            {item.message}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {item.timeAgo}
                          </p>
                        </div>

                        {!item.read && (
                          <span className="mt-2 h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-center">
                  <Link
                    to={topbarRoutes.notificationsPath}
                    onClick={() => setNotificationOpen(false)}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-medium text-white hover:bg-emerald-700 cursor-pointer shadow-sm transition-transform active:scale-95"
              aria-label="Profile"
              aria-expanded={profileOpen}
            >
              {initials}
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                <div className="border-b border-slate-100 px-4 py-3 bg-slate-50/50">
                  <p className="text-sm font-semibold text-slate-900">
                    {displayName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {displayEmail}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    to={topbarRoutes.settingsPath}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Settings size={16} className="text-slate-400" />
                    Settings
                  </Link>

                  <Link
                    to={topbarRoutes.notificationsPath}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Bell size={16} className="text-slate-400" />
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-auto rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-medium text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Link>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <LogOut size={16} className="text-red-500" />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Full-screen Search Modal Overlay with Smooth Open/Close Transition */}
      {modalMounted && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
          {/* Backdrop fades in/out */}
          <div
            className={`fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] transition-opacity duration-200 ease-out ${modalVisible ? "opacity-100" : "opacity-0"
              }`}
            onClick={() => {
              setSearchOpen(false);
              setSearchQuery("");
            }}
          />

          {/* Centered Search Box: fades + scales + slides in/out */}
          <div
            ref={modalRef}
            className={`relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-900/5 z-10 flex flex-col max-h-[80vh] transition-all duration-200 ease-out ${modalVisible
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 -translate-y-2"
              }`}
          >
            {/* Input Header Area */}
            <div className="relative flex items-center px-4 py-3.5 border-b border-slate-100 bg-white">
              <Search
                size={20}
                className="text-emerald-600 shrink-0 mr-3 pointer-events-none"
              />

              <input
                ref={searchInputRef}
                type="text"
                placeholder="Web Apps, Screens, UI Elements, Flows or Keywords..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                className="w-full bg-transparent text-sm sm:text-base outline-none placeholder:text-slate-400 text-slate-800 font-medium"
              />

              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Results Area (Only shown when a query is typed) */}
            {searchQuery.trim().length > 0 && (
              <div className="overflow-y-auto p-2 space-y-1 flex-1 bg-white">
                {filteredResults.length > 0 && (
                  <div>
                    {renderSectionHeading("Platform Pages")}

                    <div className="space-y-0.5">
                      {filteredResults.map((result) =>
                        renderSearchRow(
                          result.key,
                          result.label,
                          result.to,
                          result.section,
                        ),
                      )}
                    </div>
                  </div>
                )}

                {dataGroups.map((section) => (
                  <div key={section.id} className="pt-2">
                    {renderSectionHeading(section.label)}

                    <div className="space-y-0.5">
                      {section.items.map((item) =>
                        renderSearchRow(
                          item.key,
                          item.label,
                          item.to,
                          undefined,
                          item.subtitle,
                        ),
                      )}
                    </div>
                  </div>
                ))}

                {dataLoading && combinedRows.length === 0 && (
                  <div className="flex items-center justify-center py-12 text-xs text-slate-400 gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
                    Searching across databases...
                  </div>
                )}

                {!dataLoading &&
                  searchQuery.trim() &&
                  combinedRows.length === 0 && (
                    <div className="px-6 py-14 text-center">
                      <p className="text-sm font-semibold text-slate-800">
                        No results found
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        We couldn&apos;t find anything matching &quot;
                        {searchQuery}&quot;. Try a different keyword.
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
export default DashboardTopbar;