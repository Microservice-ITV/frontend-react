export const DASHBOARD_MENU_BADGE_EVENT = 'dni:dashboard-menu-badges'

export const notifyDashboardMenuBadgesChanged = () => {
  window.dispatchEvent(new Event(DASHBOARD_MENU_BADGE_EVENT))
}
