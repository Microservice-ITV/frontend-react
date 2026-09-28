import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopbar from "./DashboardTopbar";
import type { DashboardArea } from "../../types/dashboardTypes";

type DashboardLayoutProps = {
  area: DashboardArea;
};

const DashboardLayout = ({ area }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isSidebarCollapsed ? "76px" : "256px",
    );
  }, [isSidebarCollapsed]);

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
      className="dni-dashboard min-h-screen overflow-x-hidden bg-slate-50 text-slate-900"
    >
      <DashboardSidebar
        area={area}
        isOpen={sidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={closeSidebar}
      />

      <div className="min-w-0 transition-[margin] duration-200 ease-out lg:ml-[var(--sidebar-width,16rem)]">
        <DashboardTopbar
          area={area}
          onMenuClick={openSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebarCollapse}
        />
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
