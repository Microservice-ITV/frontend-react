import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation } from "react-router-dom";
import {
  X,
  Zap,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useDashboardMenu } from "../../hooks/useDashboardMenu";
import type { DashboardArea } from "../../types/dashboardTypes";

type DashboardSidebarProps = {
  area: DashboardArea;
  isOpen: boolean;
  onClose: () => void;
};

type TooltipState = {
  label: string;
  badge?: string | number | null;
  top: number;
};

const DashboardSidebar = ({ area, isOpen, onClose }: DashboardSidebarProps) => {
  const sections = useDashboardMenu(area);
  const location = useLocation();
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({});
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isSidebarCollapsed ? "76px" : "256px",
    );
  }, [isSidebarCollapsed]);

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const showTooltip = (
    e: React.MouseEvent<HTMLElement>,
    label: string,
    badge?: string | number | null,
  ) => {
    if (!isSidebarCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ label, badge, top: rect.top + rect.height / 2 });
  };

  const hideTooltip = () => setTooltip(null);

  const renderItems = (
    items: (typeof sections)[number]["items"],
    nested = false,
  ) => (
    <div className="mt-1 space-y-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const hasChildren = item.children && item.children.length > 0;
        const isParentActive = item.children?.some((child) =>
          location.pathname.startsWith(child.to),
        );
        const isItemCollapsed = collapsedSections[item.key] ?? false;
        const isItemExpanded = collapsedSections[item.key] ?? Boolean(isParentActive);
        return (
          <div key={item.key}>
            <div className="flex items-center">
              {hasChildren && !isSidebarCollapsed ? (
                <button
                  type="button"
                  onClick={() => toggleSection(item.key)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-slate-400 transition-colors hover:bg-slate-900 hover:text-slate-300"
                  aria-label={`${isItemExpanded ? "Collapse" : "Expand"} ${item.label}`}
                  aria-expanded={isItemExpanded}
                >
                  <span>{item.label}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ease-out ${
                      isItemExpanded ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </button>
              ) : (
                <NavLink
                  to={item.to}
                  onClick={onClose}
                  onMouseEnter={(e) => showTooltip(e, item.label, item.badge)}
                  onMouseLeave={hideTooltip}
                  className={({ isActive }) =>
                    `group relative flex min-w-0 flex-1 items-center rounded-md py-2 text-xs transition-colors ${
                      isSidebarCollapsed
                        ? "justify-center px-2"
                        : nested
                          ? "gap-3 pl-9 pr-3"
                          : "gap-3 px-3"
                    } ${
                      isActive || isParentActive
                        ? "bg-emerald-600 text-white"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    }`
                  }
                >
                  {Icon && <Icon size={18} className="shrink-0" />}

                  {!isSidebarCollapsed && (
                    <>
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                      {item.badge != null && (
                        <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-medium text-white">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              )}
            </div>
            {!isSidebarCollapsed && hasChildren && (
              <div
                className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                  isItemExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden space-y-0.5">
                  {renderItems(item.children!, true)}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const navContent = (
    <>
      <div
        className={`flex shrink-0 items-center border-b border-slate-800 px-4 py-4 lg:px-3 lg:py-5 ${
          isSidebarCollapsed ? "lg:flex-col lg:gap-3" : "justify-between"
        }`}
      >
        <div
          className={`flex items-center gap-2 ${isSidebarCollapsed ? "lg:justify-center" : ""}`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500">
            <Zap size={18} className="text-white" />
          </div>
          {!isSidebarCollapsed && (
            <div>
              <p className="text-xs font-semibold text-white">
                Daily Need Items
              </p>
              <p className="text-[9px] uppercase tracking-wider text-slate-400">
                Dashboard
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((prev) => !prev)}
          className="hidden rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:block"
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
          onClick={onClose}
          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav
        className={`flex-1 overflow-y-auto py-3 ${isSidebarCollapsed ? "px-2" : "px-3"}`}
      >
        {sections.map((section) => {
          const isSectionCollapsed = collapsedSections[section.title] ?? false;
          const isExpanded = !isSectionCollapsed;

          return (
            <div key={section.title} className="mb-4">
              {section.hideTitle ? (
                renderItems(section.items)
              ) : isSidebarCollapsed ? (
                <>
                  <div className="mx-1 mb-2 border-t border-slate-800" />
                  {renderItems(section.items)}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400 transition-colors hover:text-slate-300"
                    aria-expanded={isExpanded}
                  >
                    {section.title}
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ease-out ${
                        isExpanded ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                      isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      {renderItems(section.items)}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
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
        className={`
          fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 flex-col transform border-r border-slate-200 bg-slate-950 text-slate-200
          transition-all duration-200 ease-out
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isSidebarCollapsed ? "w-[76px]" : "w-64"}
        `}
      >
        {navContent}
      </aside>

      {isSidebarCollapsed &&
        tooltip &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[60] flex items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-medium text-white shadow-lg"
            style={{
              left: 84,
              top: tooltip.top,
              transform: "translateY(-50%)",
            }}
          >
            {tooltip.label}
            {tooltip.badge != null && (
              <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px]">
                {tooltip.badge}
              </span>
            )}
          </div>,
          document.body,
        )}
    </>
  );
};

export default DashboardSidebar;
