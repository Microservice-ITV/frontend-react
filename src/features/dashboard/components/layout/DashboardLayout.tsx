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
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopbar from "./DashboardTopbar";
import type { DashboardArea } from "../../types/dashboardTypes";

type DashboardLayoutProps = {
  area: DashboardArea;
};

const DashboardLayout = ({ area }: DashboardLayoutProps) => {
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
      <DashboardSidebar
        area={area}
        isOpen={sidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={closeSidebar}
      />

      <div
        className={`flex min-h-screen min-w-0 flex-col lg:ml-[var(--sidebar-width,16rem)] ${
          showContentLoading ? "" : "transition-[margin] duration-200 ease-out"
        }`}
      >
        <DashboardTopbar
          area={area}
          onMenuClick={openSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebarCollapse}
        />
        <main className="flex flex-1 flex-col">
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

export default DashboardLayout;
