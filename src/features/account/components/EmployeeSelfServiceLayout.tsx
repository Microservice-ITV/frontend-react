import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Outlet } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { Typing } from "@/components/loading-ui/typing";
import {
  selectAuthUser,
  selectIsAuthenticated,
  selectIsAuthBootstrapping,
} from "@/features/auth/store/authSelectors";
import EmployeeSelfServiceSidebar from "./EmployeeSelfServiceSidebar";

const EmployeeSelfServiceLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isAuthBootstrapping = useAppSelector(selectIsAuthBootstrapping);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const authUser = useAppSelector(selectAuthUser);
  const showContentLoading = isAuthBootstrapping || (isAuthenticated && !authUser);
  const rootRef = useRef<HTMLDivElement>(null);
  const sidebarWidth = isSidebarCollapsed ? "76px" : "256px";
  const contentLeft =
    typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
      ? sidebarWidth
      : "0px";

  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", sidebarWidth);
  }, [sidebarWidth]);

  // Mobile: convert dashboard tables into expandable/collapsible row cards
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mobileQuery = window.matchMedia("(max-width: 639px)");

    const handleClick = (e: MouseEvent) => {
      if (!mobileQuery.matches) return;
      const target = e.target as HTMLElement;
      if (
        target.closest("button, a, input, select, textarea, label")
      ) {
        return;
      }
      const row = target.closest("tbody tr");
      if (!row || row.querySelector("td[colspan]")) return;
      const table = row.closest("table");
      if (!table || !root.contains(table)) return;

      const headerCells = Array.from(
        table.querySelectorAll("thead th"),
      ) as HTMLElement[];
      Array.from(row.querySelectorAll("td")).forEach((td, i) => {
        const label = headerCells[i]?.innerText?.trim();
        if (label) td.dataset.label = label;
      });
      row.classList.toggle("is-expanded");
    };

    root.addEventListener("click", handleClick);
    return () => root.removeEventListener("click", handleClick);
  }, []);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebarCollapse = () => setIsSidebarCollapsed((prev) => !prev);

  return (
    <div
      ref={rootRef}
      className="dni-dashboard min-h-screen overflow-x-clip bg-slate-50 text-slate-900"
    >
      <EmployeeSelfServiceSidebar
        isOpen={sidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={closeSidebar}
      />

      <div
        className={`flex min-h-screen min-w-0 flex-col lg:ml-[var(--sidebar-width,16rem)] ${
          showContentLoading ? "" : "transition-[margin] duration-200 ease-out"
        }`}
      >
        <div
          className={`fixed top-0 right-0 left-[var(--sidebar-width,16rem)] z-40 h-14 bg-white border-b border-slate-200 lg:left-[var(--sidebar-width,16rem)] ${
            showContentLoading ? "opacity-50" : ""
          }`}
        >
          <div className="flex h-full items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openSidebar}
                className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
                aria-label="Open menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              <h1 className="text-base font-semibold text-slate-900">My Leave</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSidebarCollapse}
                className="lg:block hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
                aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {isSidebarCollapsed ? (
                    <polyline points="15 18 9 12 15 6" />
                  ) : (
                    <polyline points="9 18 15 12 9 6" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        <main className="flex flex-1 flex-col pt-14">
          <div className={showContentLoading ? "hidden" : "p-4 sm:p-6"}>
            <Outlet />
          </div>
        </main>
        {showContentLoading &&
          createPortal(
            <div
              style={{
                position: "fixed",
                top: "3.5rem",
                right: 0,
                bottom: 0,
                left: contentLeft,
                zIndex: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f8fafc",
              }}
            >
              <Typing className="w-8" />
            </div>,
            document.body,
          )}
      </div>
    </div>
  );
};

export default EmployeeSelfServiceLayout;