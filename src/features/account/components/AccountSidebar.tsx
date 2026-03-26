import { NavLink } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { myAccountIcon, myPurchaseIcon, notificationsIcon, myVouchersIcon, myDniCoinsIcon } from '@/assets/icons'

interface AccountSidebarProps {
  onNavigate?: () => void
}

const AccountSidebar = ({ onNavigate }: AccountSidebarProps) => {
  const { user } = useAppSelector((s) => s.auth)

  const accountLinkBase = 'block px-10 py-1 text-sm'
  const accountLinkActive = 'text-emerald-700'
  const accountLinkInactive = 'text-gray-700 hover:text-emerald-700'

  const bottomLinkBase = 'flex items-center gap-2 px-5 py-1.5 text-sm'
  const bottomLinkActive = 'text-emerald-700'
  const bottomLinkInactive = 'text-gray-700 hover:text-emerald-700'

  return (
    <aside className="w-full md:w-64">
      {/* Profile summary */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
          {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900 truncate max-w-[140px]">
            {user?.name ?? 'User'}
          </span>
          <NavLink
            to="/account/profile"
            className="mt-0.5 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-700 transition-colors"
            onClick={() => onNavigate?.()}
          >
            <span className="inline-block w-3 h-3 rounded-full border border-gray-400 flex items-center justify-center text-[9px]">
              ✎
            </span>
            <span>Edit Profile</span>
          </NavLink>
        </div>
      </div>

      {/* My Account section */}
      <div className="pt-4 pb-3">
        <div className="flex items-center gap-2 px-5 text-sm font-medium text-gray-900">
          <img src={myAccountIcon} alt="" className="w-5 h-5 shrink-0" aria-hidden />
          <span>My Account</span>
        </div>

        <nav className="mt-2 space-y-1">
          <NavLink
            to="/account/profile"
            className={({ isActive }) =>
              `${accountLinkBase} ${isActive ? accountLinkActive : accountLinkInactive}`
            }
            onClick={() => onNavigate?.()}
          >
            Profile
          </NavLink>

          <NavLink
            to="/account/addresses"
            className={({ isActive }) =>
              `${accountLinkBase} ${isActive ? accountLinkActive : accountLinkInactive}`
            }
            onClick={() => onNavigate?.()}
          >
            Addresses
          </NavLink>

          <NavLink
            to="/account/banks-cards"
            className={({ isActive }) =>
              `${accountLinkBase} ${isActive ? accountLinkActive : accountLinkInactive}`
            }
            onClick={() => onNavigate?.()}
          >
            Banks &amp; Cards
          </NavLink>

          <NavLink
            to="/account/change-password"
            className={({ isActive }) =>
              `${accountLinkBase} ${isActive ? accountLinkActive : accountLinkInactive}`
            }
            onClick={() => onNavigate?.()}
          >
            Change Password
          </NavLink>

          <NavLink
            to="/account/notifications"
            className={({ isActive }) =>
              `${accountLinkBase} ${isActive ? accountLinkActive : accountLinkInactive}`
            }
            onClick={() => onNavigate?.()}
          >
            Notification Settings
          </NavLink>

          <button
            type="button"
            className={`${accountLinkBase} text-gray-700 w-full text-left`}
            onClick={() => onNavigate?.()}
          >
            Privacy Settings
          </button>
        </nav>
      </div>

      {/* My Purchase / Notifications / Vouchers / Coins */}
      <div className="pt-2 space-y-1">
        <NavLink
          to="/account/orders"
          className={({ isActive }) =>
            `${bottomLinkBase} ${isActive ? bottomLinkActive : bottomLinkInactive}`
          }
          onClick={() => onNavigate?.()}
        >
          <img src={myPurchaseIcon} alt="" className="w-4 h-4 shrink-0" aria-hidden />
          <span>My Purchase</span>
        </NavLink>

        <NavLink
          to="/account/notifications-center"
          className={({ isActive }) =>
            `${bottomLinkBase} ${isActive ? bottomLinkActive : bottomLinkInactive}`
          }
          onClick={() => onNavigate?.()}
        >
          <img src={notificationsIcon} alt="" className="w-4 h-4 shrink-0" aria-hidden />
          <span>Notifications</span>
        </NavLink>

        <NavLink
          to="/account/my-vouchers"
          className={({ isActive }) =>
            `${bottomLinkBase} ${isActive ? bottomLinkActive : bottomLinkInactive}`
          }
          onClick={() => onNavigate?.()}
        >
          <img src={myVouchersIcon} alt="" className="w-4 h-4 shrink-0" aria-hidden />
          <span>My Vouchers</span>
        </NavLink>

        <NavLink
          to="/account/my-coins"
          className={({ isActive }) =>
            `${bottomLinkBase} ${isActive ? bottomLinkActive : bottomLinkInactive}`
          }
          onClick={() => onNavigate?.()}
        >
          <img src={myDniCoinsIcon} alt="" className="w-4 h-4 shrink-0" aria-hidden />
          <span>My DNI Coins</span>
        </NavLink>
      </div>
    </aside>
  )
}

export default AccountSidebar

