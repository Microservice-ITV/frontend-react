import { NavLink } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import {
  User,
  MapPin,
  CreditCard,
  Bell,
  Shield,
  ShoppingBag,
  ClipboardList,
  Ticket,
  Coins,
  Pencil,
} from "lucide-react";

interface AccountSidebarProps {
  onNavigate?: () => void;
}

const AccountSidebar = ({ onNavigate }: AccountSidebarProps) => {
  const { user } = useAppSelector((s) => s.auth);

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-sm transition-all duration-150 ${
      isActive
        ? "bg-[#e8f7f0] text-[#008f51] font-semibold"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-normal"
    }`;

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : "U";

  return (
    <aside className="w-full md:w-64 flex-shrink-0 select-none">
      <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-4 sm:p-5">
        {/* User Profile Header */}
        <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100">
          <div className="w-12 h-12 rounded-full bg-slate-200/90 border border-slate-200 flex items-center justify-center overflow-hidden text-slate-700 font-bold text-base shadow-2xs shrink-0">
            {user?.profile_image ? (
              <img
                src={user.profile_image}
                alt={user?.name ?? "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              userInitial
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-slate-900 truncate">
              {user?.name ?? "User"}
            </span>

            <NavLink
              to="/account/profile"
              className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#008f51] transition-colors"
              onClick={() => onNavigate?.()}
            >
              <Pencil className="w-3 h-3 stroke-[2]" />
              <span>Edit Profile</span>
            </NavLink>
          </div>
        </div>

        {/* Group 1: My Account */}
        <div className="pt-4 pb-2">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 text-sm font-bold text-slate-900">
            <User className="w-4 h-4 text-slate-700 stroke-[2.2]" />
            <span>My Account</span>
          </div>

          <nav className="mt-1 space-y-0.5">
            <NavLink
              to="/account/profile"
              className={navItemClass}
              onClick={() => onNavigate?.()}
            >
              <User className="w-4 h-4 shrink-0 stroke-[2]" />
              <span>Profile</span>
            </NavLink>

            <NavLink
              to="/account/addresses"
              className={navItemClass}
              onClick={() => onNavigate?.()}
            >
              <MapPin className="w-4 h-4 shrink-0 stroke-[2]" />
              <span>Addresses</span>
            </NavLink>

            <NavLink
              to="/account/banks-cards"
              className={navItemClass}
              onClick={() => onNavigate?.()}
            >
              <CreditCard className="w-4 h-4 shrink-0 stroke-[2]" />
              <span>Banks &amp; Cards</span>
            </NavLink>

            <NavLink
              to="/account/notifications"
              className={navItemClass}
              onClick={() => onNavigate?.()}
            >
              <Bell className="w-4 h-4 shrink-0 stroke-[2]" />
              <span>Notification Settings</span>
            </NavLink>

            <NavLink
              to="/account/privacy"
              className={navItemClass}
              onClick={() => onNavigate?.()}
            >
              <Shield className="w-4 h-4 shrink-0 stroke-[2]" />
              <span>Privacy Settings</span>
            </NavLink>
          </nav>
        </div>

        {/* Group 2: Activity Links */}
        <div className="pt-3 border-t border-slate-100 space-y-0.5">
          <NavLink
            to="/account/orders"
            className={navItemClass}
            onClick={() => onNavigate?.()}
          >
            <ShoppingBag className="w-4 h-4 shrink-0 stroke-[2]" />
            <span>My Purchase</span>
          </NavLink>

          <NavLink
            to="/account/quantity-approvals"
            className={navItemClass}
            onClick={() => onNavigate?.()}
          >
            <ClipboardList className="w-4 h-4 shrink-0 stroke-[2]" />
            <span>Quantity Approvals</span>
          </NavLink>

          <NavLink
            to="/account/invoices"
            className={navItemClass}
            onClick={() => onNavigate?.()}
          >
            <ShoppingBag className="w-4 h-4 shrink-0 stroke-[2]" />
            <span>My Invoices</span>
          </NavLink>

          <NavLink
            to="/account/notifications-center"
            className={navItemClass}
            onClick={() => onNavigate?.()}
          >
            <Bell className="w-4 h-4 shrink-0 stroke-[2]" />
            <span>Notifications</span>
          </NavLink>

          <NavLink
            to="/account/my-vouchers"
            className={navItemClass}
            onClick={() => onNavigate?.()}
          >
            <Ticket className="w-4 h-4 shrink-0 stroke-[2]" />
            <span>My Vouchers</span>
          </NavLink>

          <NavLink
            to="/account/my-coins"
            className={navItemClass}
            onClick={() => onNavigate?.()}
          >
            <Coins className="w-4 h-4 shrink-0 stroke-[2]" />
            <span>My DNI Coins</span>
          </NavLink>
        </div>
      </div>
    </aside>
  );
};

export default AccountSidebar;