import { CAPABILITIES } from '@/app/rbac/capabilities'

export const ROUTE_ACCESS = {
  accountRoot: [CAPABILITIES.ACCOUNT_VIEW],
  accountAddresses: [CAPABILITIES.ACCOUNT_ADDRESSES_MANAGE],
  accountOrders: [CAPABILITIES.ACCOUNT_ORDERS_VIEW],
  checkout: [CAPABILITIES.CHECKOUT_VIEW],
  checkoutSuccess: [CAPABILITIES.CHECKOUT_VIEW],
  sellerDashboard: [CAPABILITIES.SELLER_DASHBOARD_VIEW, CAPABILITIES.FINANCE_DASHBOARD_VIEW],
  sellerOverview: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
  /** Warehouse & inventory management — shop owner scope */
  warehouse: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
  /** Purchasing (purchase orders, returns) — shop owner scope. Goods receipts and suppliers are admin only. */
  purchase: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
  sellerAnalytics: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
  sellerOrders: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
  /** Seller dashboard: browse categories only (list + detail) */
  sellerCategoriesView: [CAPABILITIES.CATEGORIES_VIEW],
  /** Super admin: full category CRUD */
  categoriesManage: [CAPABILITIES.CATEGORIES_MANAGE],
  promotionsView: [CAPABILITIES.PROMOTIONS_VIEW],
  /** Flash deal management — super admin and sellers */
  flashDealsView: [CAPABILITIES.FLASH_DEALS_MANAGE],
  sellerFlashDealsView: [CAPABILITIES.FLASH_DEALS_MANAGE],
  sellerFlashDealsNew: [CAPABILITIES.FLASH_DEALS_MANAGE],
  sellerFlashDealsEdit: [CAPABILITIES.FLASH_DEALS_MANAGE],
  bundlesView: [CAPABILITIES.FLASH_DEALS_MANAGE],
  sellerBundlesView: [CAPABILITIES.FLASH_DEALS_MANAGE],
  sellerProducts: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
  /** Seller dashboard: manage brand / color / size reference data */
  sellerCatalogRefs: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
  sellerInvoices: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
  sellerMail: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
  sellerChat: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
  sellerFiles: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
  sellerNotifications: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
  sellerSettings: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
  sellerDeliveryCompanies: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
  sellerHelpSupport: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
  sellerPermissions: [CAPABILITIES.SELLER_PERMISSIONS_VIEW],
  superAdminDashboard: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  superAdminOverview: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  /** Warehouse & inventory management — platform wide scope */
  superAdminWarehouse: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  /** Purchasing — platform wide scope */
  superAdminPurchase: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  warehouseManager: [CAPABILITIES.WAREHOUSE_DASHBOARD_VIEW],
  deliveryAgent: [CAPABILITIES.DELIVERY_DASHBOARD_VIEW],
  deliveryAgentParcels: [CAPABILITIES.DELIVERY_PARCELS_VIEW],
  deliveryAgentDamageReports: [CAPABILITIES.DELIVERY_DAMAGE_REPORTS_VIEW],
  superAdminAnalytics: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  superAdminShops: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  superAdminShipping: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  superAdminTax: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  superAdminUsers: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  superAdminInvoices: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  superAdminSystem: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  superAdminMail: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  superAdminChat: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  superAdminFiles: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  superAdminNotifications: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  superAdminSettings: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  superAdminHelpSupport: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  superAdminRbac: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  superAdminAccounting: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  sellerFinanceOverview: [CAPABILITIES.FINANCE_DASHBOARD_VIEW],
  sellerFinanceTransactions: [CAPABILITIES.FINANCE_ACCOUNTING_VIEW],
  sellerAccounting: [CAPABILITIES.FINANCE_ACCOUNTING_VIEW],
  sellerFinanceManagerReports: [CAPABILITIES.FINANCE_DASHBOARD_VIEW],
  sellerInventoryValuation: [CAPABILITIES.FINANCE_DASHBOARD_VIEW],
  sellerPendingApprovals: [CAPABILITIES.FINANCE_APPROVALS_VIEW],
  sellerSalaryApprovals: [CAPABILITIES.FINANCE_APPROVALS_VIEW],
  superAdminFinanceOverview: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  superAdminFinanceTransactions: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  /** HR — employee management, departments, positions, salary grades */
  superAdminEmployees: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  /** HR — attendance records, adjustments, overtime review */
  attendanceRecords: [CAPABILITIES.ATTENDANCE_REVIEW],
  /** HR — shift definitions */
  attendanceShifts: [CAPABILITIES.ATTENDANCE_MANAGE],
  /** HR — shift schedules and assignments */
  attendanceSchedules: [CAPABILITIES.ATTENDANCE_MANAGE],
  /** HR — overtime request approvals */
  attendanceOvertime: [CAPABILITIES.ATTENDANCE_REVIEW],
  /** Self-service attendance (all roles with attendance visibility) */
  attendanceMy: [CAPABILITIES.ATTENDANCE_VIEW],
  /** HR — leave types and policies configuration */
  leaveConfig: [CAPABILITIES.LEAVE_MANAGE],
  /** HR — leave balances and manual adjustments */
  leaveBalances: [CAPABILITIES.LEAVE_MANAGE],
  /** HR — all leave requests (create on behalf of employees) */
  leaveRequests: [CAPABILITIES.LEAVE_MANAGE],
  /** HR — leave approval queue */
  leaveApprovals: [CAPABILITIES.LEAVE_REVIEW],
  /** Self-service leave (balances, requests, cancel) */
  leaveMy: [CAPABILITIES.LEAVE_VIEW],
  /** Warehouse manager — leave requests from their staff (read-only) */
  warehouseLeaveRequests: [CAPABILITIES.LEAVE_VIEW],
  /** Warehouse manager — approval queue scoped to their own staff */
  warehouseLeaveApprovals: [CAPABILITIES.LEAVE_REVIEW],
  /** HR / payroll — payroll policy configuration */
  payrollPolicies: [CAPABILITIES.PAYROLL_POLICIES_MANAGE],
  /** Payroll runs list & detail */
  payrollRuns: [CAPABILITIES.PAYROLL_VIEW],
  /** Payslip administration */
  payrollPayslips: [CAPABILITIES.PAYSLIP_VIEW],
  /** Salary payment records */
  payrollPayments: [CAPABILITIES.PAYROLL_VIEW],
  /** Payroll dashboard area root (any payroll-capable role) */
  payrollDashboard: [CAPABILITIES.PAYROLL_VIEW, CAPABILITIES.PAYSLIP_VIEW_OWN],
  /** Self-service performance */
  performanceMy: [CAPABILITIES.PERFORMANCE_READ_OWN],
  performanceCycles: [CAPABILITIES.PERFORMANCE_READ],
  performanceKpis: [CAPABILITIES.PERFORMANCE_READ],
  performanceReviews: [CAPABILITIES.PERFORMANCE_READ],
  performanceReviewsManage: [CAPABILITIES.PERFORMANCE_MANAGE],
  performanceReviewsReview: [CAPABILITIES.PERFORMANCE_REVIEW],
  bonusPolicies: [CAPABILITIES.BONUS_POLICIES_MANAGE],
  bonusAwards: [CAPABILITIES.BONUS_READ],
  /** Self-service payslips */
  payrollMyPayslips: [CAPABILITIES.PAYSLIP_VIEW_OWN],
} as const