import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { createPortal } from "react-dom";
// brand logo served from public directory
import { X, CalendarDays, ChevronDown } from "lucide-react";
import { useAppSelector } from "@/app/hooks";
import { selectAuthUser } from "@/features/auth/store/authSelectors";

type EmployeeSelfServiceSidebarProps = {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
};

const EmployeeSelfServiceSidebar = ({
  isOpen,
  isCollapsed,
  onClose,
}: EmployeeSelfServiceSidebarProps) => {
  const location = useLocation();
  const authUser = useAppSelector(selectAuthUser);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [tooltip, setTooltip] = useState<{ label: string; top: number } | null>(null);

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const showTooltip = (e: React.MouseEvent<HTMLElement>, label: string) => {
    if (!isCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ label, top: rect.top + rect.height / 2 });
  };

  const hideTooltip = () => setTooltip(null);

  const userInitial = authUser?.name
    ? authUser.name.charAt(0).toUpperCase()
    : "U";

  const renderMyLeaveItem = () => {
    const isActive = location.pathname === "/employee/my-leave";
    return (
      <NavLink
        to="/employee/my-leave"
        onClick={onClose}
        onMouseEnter={(e) => showTooltip(e, "My Leave")}
        onMouseLeave={hideTooltip}
        className={({ isActive: navActive }) =>
          `group relative flex min-w-0 flex-1 items-center rounded-md py-1.5 text-xs transition-colors ${
            isCollapsed
              ? "justify-center px-2"
              : "gap-3 px-3"
          } ${
            navActive || isActive
              ? "bg-emerald-50 font-medium text-black"
              : "text-black hover:bg-slate-100"
          }`
        }
      >
        <span className="relative shrink-0">
          <CalendarDays size={18} />
        </span>
        {!isCollapsed && (
          <span className="min-w-0 flex-1 truncate">My Leave</span>
        )}
      </NavLink>
    );
  };

  const navContent = (
    <>
      <div
        className={`flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2 lg:px-3 lg:py-[9.4px] ${
          isCollapsed ? "lg:justify-center" : ""
        }`}
      >
        <NavLink
          to="/employee/my-leave"
          onClick={onClose}
          className={`flex items-center gap-2 group ${isCollapsed ? "lg:justify-center" : ""}`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden">
            <img
              src="/brand-logo.svg"
              alt="Brand Logo"
              className="w-8 h-8 rounded-sm object-contain"
            />
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-xs font-semibold text-emerald-600 transition-colors group-hover:text-emerald-700">
                Daily Need Items
              </p>
              <p className="text-[9px] uppercase tracking-wider text-slate-500">
                Employee Portal
              </p>
            </div>
          )}
        </NavLink>

        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-black lg:hidden"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav
        className={`flex-1 overflow-y-auto py-3 ${isCollapsed ? "px-2" : "px-3"}`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="mb-2.5">
          {!isCollapsed && (
            <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-emerald-600">
              My Account
            </div>
          )}
          {renderMyLeaveItem()}
        </div>

        {!isCollapsed && (
          <div className="mt-4 border-t border-slate-200 px-3 pt-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-medium text-sm shrink-0">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {authUser?.name ?? "Employee"}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {authUser?.email ?? ""}
                </p>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );

  return (
    <>
      <div
        role="presentation"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 flex-col transform border-r border-slate-200 bg-white text-black transition-all duration-200 ease-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "w-[76px]" : "w-64"}`}
      >
        {navContent}
      </aside>

      {isCollapsed &&
        tooltip &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[60] flex items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-black shadow-lg"
            style={{
              left: 84,
              top: tooltip.top,
              transform: "translateY(-50%)",
            }}
          >
            {tooltip.label}
          </div>,
          document.body,
        )}
    </>
  );
};

export default EmployeeSelfServiceSidebar;