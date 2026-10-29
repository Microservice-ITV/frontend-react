import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  ShoppingCart,
  Package,
  FileText,
  Building2,
  UserCog,
  Network,
  Server,
  Shield,
  Bell,
  Settings,
  HelpCircle,
  Clock3,
  Boxes,
  Mail,
  MessageCircle,
  FolderOpen,
  Tags,
  Percent,
  Home,
  Image,
  RectangleHorizontal,
  Megaphone,
  LayoutList,
  Stamp,
  Palette,
  Ruler,
  CreditCard,
  Calculator,
  DollarSign,
  Receipt,
  Truck,
  Scale,
  MapPin,
  Warehouse,
  ArrowLeftRight,
  History,
  ClipboardList,
  PackageCheck,
  XCircle,
  AlertTriangle,
  Award,
  Briefcase,
  CalendarClock,
  CalendarDays,
  CalendarCheck,
  ScrollText,
  UserCircle,
  Users,
  Wallet,
  Target,
  ClipboardCheck,
  Gift,
} from "lucide-react";
import { CAPABILITIES } from "@/app/rbac/capabilities";
import type { Capability } from "@/app/rbac/types";
import type {
  DashboardArea,
  DashboardMenuSection,
} from "../types/dashboardTypes";
import { getSearchConfig } from "./searchConfigs";

const withSearch = (item: DashboardMenuSection["items"][0]) => {
  const search = getSearchConfig(item.key);
  return search ? { ...item, search: { enabled: true, ...search } } : item;
};

/** Seller menu omits these. Admin menu omits purchasing; the warehouse manager keeps it. */
const ADMIN_ONLY_WAREHOUSE_KEYS = new Set(["warehouse-suppliers"]);
const ADMIN_HIDDEN_WAREHOUSE_KEYS = new Set([
  "warehouse-purchase-orders",
  "warehouse-receipts",
  "warehouse-returns",
  "warehouse-transfer",
]);

const warehouseSection = (
  base: "/seller" | "/super-admin" | "/warehouse-manager" | "/delivery-agent",
  area: DashboardArea,
  capability: Capability,
): DashboardMenuSection => {
  const items: Array<{
    key: string;
    label: string;
    path: string;
    icon: typeof Warehouse;
  }> = [
    {
      key: "warehouse-overview",
      label: "Overview",
      path: "/warehouse",
      icon: LayoutDashboard,
    },
    {
      key: "warehouse-warehouses",
      label: "Warehouses",
      path: "/warehouse/warehouses",
      icon: Warehouse,
    },
    {
      key: "warehouse-inventory",
      label: "Inventory Data",
      path: "/warehouse/inventory",
      icon: Boxes,
    },
    {
      key: "warehouse-transfer",
      label: "Transfer",
      path: "/warehouse/transfer",
      icon: ArrowLeftRight,
    },
    {
      key: "warehouse-movements",
      label: "Inventory Movements",
      path: "/warehouse/movements",
      icon: History,
    },
    {
      key: "warehouse-purchase-orders",
      label: "Purchase Orders",
      path: "/warehouse/purchase-orders",
      icon: ClipboardList,
    },
    {
      key: "warehouse-seller-requests",
      label: "Request from seller",
      path: "/warehouse/seller-requests",
      icon: ShoppingCart,
    },
    {
      key: "warehouse-purchase-tracking",
      label: "Purchase Order Tracking",
      path: "/warehouse/purchase-order-tracking",
      icon: Package,
    },
    {
      key: "warehouse-from-warehouse",
      label: "Orders from warehouse",
      path: "/warehouse/from-warehouse",
      icon: ShoppingCart,
    },
    {
      key: "warehouse-supplier-receive",
      label: "Receive from Supplier",
      path: "/warehouse/supplier-receipts",
      icon: Package,
    },
    {
      key: "warehouse-receipts",
      label: "Goods Receipts",
      path: "/warehouse/receipts",
      icon: PackageCheck,
    },
    {
      key: "warehouse-returns",
      label: "Purchase Returns",
      path: "/warehouse/returns",
      icon: XCircle,
    },
    {
      key: "warehouse-suppliers",
      label: "Suppliers",
      path: "/warehouse/suppliers",
      icon: Building2,
    },
  ]

  const visibleItems = items.filter((entry) => {
    // Sellers track warehouse stock requests (create via New request on that page).
    if (entry.key === "warehouse-from-warehouse") return area === "seller"
    // WM-only inbox for seller warehouse stock requests.
    if (entry.key === "warehouse-seller-requests") return area === "warehouse_manager"
    if (entry.key === "warehouse-supplier-receive") return false
    if (entry.key === "warehouse-suppliers" && area === "warehouse_manager") return false
    // Warehouse manager posts GRNs after delivery agent drop-off; sellers track only.
    if (entry.key === "warehouse-receipts" && area === "seller") return false
    if (entry.key === "warehouse-purchase-tracking" && area !== "seller") return false
    if (area === "seller") return !ADMIN_ONLY_WAREHOUSE_KEYS.has(entry.key)
    if (area === "super_admin") return !ADMIN_HIDDEN_WAREHOUSE_KEYS.has(entry.key)
    return true
  })

  return {
    title: "WAREHOUSE",
    items: visibleItems.map((entry) => ({
      key: `${area}-${entry.key}`,
      label: entry.label,
      to: `${base}${entry.path}`,
      area,
      requiredCapabilities: [capability],
      icon: entry.icon,
    })),
  }
}

const sellerWarehouseSection = (): DashboardMenuSection => {
  const section = warehouseSection("/seller", "seller", CAPABILITIES.SELLER_DASHBOARD_VIEW)
  return {
    ...section,
    items: [
      ...section.items,
      {
        key: "seller-damage-reports",
        label: "Damage Reports",
        to: "/seller/warehouse/damage-reports",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: AlertTriangle,
      },
    ],
  }
}

export const DASHBOARD_MENU_SELLER: DashboardMenuSection[] = [
  {
    title: "OVERVIEW",
    items: [
      {
        key: "seller-overview",
        label: "Dashboard",
        to: "/seller/overview",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: LayoutDashboard,
      },
      {
        key: "seller-analytics",
        label: "Analytics",
        to: "/seller/analytics",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: BarChart3,
      },
    ],
  },
  sellerWarehouseSection(),
  {
    title: "CATALOG",
    items: [
      withSearch({
        key: "seller-categories",
        label: "Categories",
        to: "/seller/categories",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.CATEGORIES_VIEW],
        icon: Tags,
      }),
      withSearch({
        key: "seller-products",
        label: "Products",
        to: "/seller/products",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: Package,
      }),
      withSearch({
        key: "seller-brands",
        label: "Brands",
        to: "/seller/brands",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: Stamp,
      }),
      withSearch({
        key: "seller-colors",
        label: "Colors",
        to: "/seller/colors",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: Palette,
      }),
      withSearch({
        key: "seller-sizes",
        label: "Sizes",
        to: "/seller/sizes",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: Ruler,
      }),
    ],
  },
  {
    title: "PROMOTIONS",
    items: [
      withSearch({
        key: "seller-promotions",
        label: "Promotions",
        to: "/seller/promotions",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.PROMOTIONS_VIEW],
        icon: Percent,
      }),
      withSearch({
        key: "seller-flash-deals",
        label: "Flash Deals",
        to: "/seller/promotion-engine/flash-deals",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.FLASH_DEALS_MANAGE],
        icon: Clock3,
      }),
      withSearch({
        key: "seller-bundles",
        label: "Bundles Offer",
        to: "/seller/promotion-engine/bundles",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.FLASH_DEALS_MANAGE],
        icon: Boxes,
      }),
    ],
  },
  {
    title: "SALES",
    items: [
      withSearch({
        key: "seller-orders",
        label: "Orders",
        to: "/seller/orders",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: ShoppingCart,
      }),
      withSearch({
        key: "seller-payments",
        label: "Payments",
        to: "/seller/payments",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: CreditCard,
      }),
      withSearch({
        key: "seller-invoices",
        label: "Invoices",
        to: "/seller/invoices",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: FileText,
      }),
    ],
  },
  // {
  //   title: "FINANCE",
  //   items: [
  //     {
  //       key: "seller-finance-overview",
  //       label: "Finance Overview",
  //       to: "/seller/finance",
  //       area: "seller",
  //       requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
  //       icon: DollarSign,
  //     },
  //     {
  //       key: "seller-finance-transactions",
  //       label: "Transactions",
  //       to: "/seller/finance/transactions",
  //       area: "seller",
  //       requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
  //       icon: Receipt,
  //     },
  //   ],
  // },
  {
    title: "ACCOUNTING",
    items: [
      {
        key: "seller-accounting-overview",
        label: "Accounting Overview",
        to: "/seller/accounting/overview",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: Calculator,
      },
      {
        key: "seller-finance-transactions",
        label: "Transactions",
        to: "/seller/finance/transactions",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: Receipt,
      },
      {
        key: "seller-accounting-profit-loss",
        label: "Profit & Loss",
        to: "/seller/accounting/profit-loss",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: Scale,
      },
      {
        key: "seller-accounting-income",
        label: "Income",
        to: "/seller/accounting/income",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: DollarSign,
      },
      {
        key: "seller-accounting-expenses",
        label: "Expenses",
        to: "/seller/accounting/expenses",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: Receipt,
      },
      {
        key: "seller-accounting-delivery-company-fees",
        label: "Delivery Expense Fees",
        to: "/seller/accounting/delivery-company-fees",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: Truck,
      },
      {
        key: "seller-accounting-pending-approvals",
        label: "Pending Approvals",
        to: "/seller/accounting/pending-approvals",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: Clock3,
      },
      {
        key: "seller-accounting-approval-policies",
        label: "Approval Policies",
        to: "/seller/accounting/approval-policies",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: Settings,
      },
      {
        key: "seller-accounting-journal-entries",
        label: "Journal Entries",
        to: "/seller/accounting/journal-entries",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: BookOpen,
      },
      {
        key: "seller-accounting-chart-of-accounts",
        label: "Chart of Accounts",
        to: "/seller/accounting/chart-of-accounts",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: Calculator,
      },
    ],
  },
  {
    title: "APPS",
    items: [
      {
        key: "seller-mail",
        label: "Mail",
        to: "/seller/mail",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: Mail,
      },
      {
        key: "seller-chat",
        label: "Chat",
        to: "/seller/chat",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: MessageCircle,
      },
      {
        key: "seller-files",
        label: "Files",
        to: "/seller/files",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: FolderOpen,
      },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      {
        key: "seller-notifications",
        label: "Notifications",
        to: "/seller/notifications",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: Bell,
      },
      {
        key: "seller-delivery-companies",
        label: "Delivery Companies",
        to: "/seller/delivery-companies",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: Truck,
      },
      {
        key: "seller-settings",
        label: "Settings",
        to: "/seller/settings",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: Settings,
      },
      {
        key: "seller-users",
        label: "Users",
        to: "/seller/users",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: UserCog,
      },
      {
        key: "seller-help-support",
        label: "Help & Support",
        to: "/seller/help-support",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: HelpCircle,
      },
    ],
  },
];

export const DASHBOARD_MENU_ADMIN: DashboardMenuSection[] = [
  {
    title: "OVERVIEW",
    items: [
      {
        key: "admin-overview",
        label: "Dashboard",
        to: "/super-admin/overview",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: LayoutDashboard,
      },
      {
        key: "admin-analytics",
        label: "Analytics",
        to: "/super-admin/analytics",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: BarChart3,
      },
      {
        key: "admin-orders",
        label: "Order Approvals",
        to: "/super-admin/orders",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: ShoppingCart,
      },
    ],
  },
  (() => {
    const warehouse = warehouseSection(
      "/super-admin",
      "super_admin",
      CAPABILITIES.PLATFORM_ADMIN_VIEW,
    )
    return {
      ...warehouse,
      items: [
        ...warehouse.items,
        {
          key: "admin-assign-warehouse-manager",
          label: "Assign Warehouse Manager",
          to: "/super-admin/warehouse/assign-manager",
          area: "super_admin" as const,
          requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
          icon: Shield,
        },
        {
          key: "admin-assign-delivery-agent",
          label: "Assign Delivery Agent",
          to: "/super-admin/warehouse/assign-delivery-agent",
          area: "super_admin" as const,
          requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
          icon: Truck,
        },
      ],
    }
  })(),
  {
    title: "PLATFORM",
    items: [
      withSearch({
        key: "admin-shops",
        label: "Shops",
        to: "/super-admin/shops",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: Building2,
      }),
      withSearch({
        key: 'admin-invoices',
        label: 'Invoices',
        to: '/super-admin/invoices',
        area: 'super_admin',
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: FileText,
      }),
      withSearch({
        key: 'admin-payments',
        label: 'Payments',
        to: '/super-admin/payments',
        area: 'super_admin',
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: CreditCard,
      }),
      withSearch({
        key: 'admin-categories',
        label: 'Categories',
        to: '/super-admin/categories',
        area: 'super_admin',
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: Tags,
      }),
      withSearch({
        key: 'admin-users',
        label: 'Users',
        to: '/super-admin/users',
        area: 'super_admin',
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: UserCog,
      }),
      withSearch({
        key: 'admin-platform-users',
        label: 'Platform Users',
        to: '/super-admin/platform-users',
        area: 'super_admin',
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: Network,
      }),
    ],
  },
  {
    title: 'TAX',
    items: [
      {
        key: 'admin-tax',
        label: 'Tax',
        to: '/super-admin/tax',
        area: 'super_admin',
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: Receipt,
      },
    ],
  },
  {
    title: 'SHIPPING',
    items: [
      {
        key: 'admin-delivery-companies',
        label: 'Delivery Companies',
        to: '/super-admin/shipping/delivery-companies',
        area: 'super_admin',
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: Building2,
      },
      {
        key: 'admin-delivery-pricing',
        label: 'Delivery Pricing',
        to: '/super-admin/shipping/pricing-rules',
        area: 'super_admin',
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: Truck,
      },
      {
        key: 'admin-weight-rates',
        label: 'Weight Rates',
        to: '/super-admin/shipping/weight-rates',
        area: 'super_admin',
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: Scale,
      },
      {
        key: 'admin-route-rates',
        label: 'Cities Rates',
        to: '/super-admin/shipping/city-rates',
        area: 'super_admin',
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: MapPin,
      },
      {
        key: 'admin-delivery-quotes',
        label: 'Delivery Quotes',
        to: '/super-admin/shipping/quotes',
        area: 'super_admin',
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: FileText,
      },
    ],
  },
  {
    title: 'STOREFRONT',
    items: [
      {
        key: "admin-home-features",
        label: "Home Features",
        to: "/super-admin/home-features",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: Home,
      },
      withSearch({
        key: "admin-promotions",
        label: "Promotions",
        to: "/super-admin/promotion-engine",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PROMOTIONS_VIEW],
        icon: Percent,
      }),
      {
        key: "admin-hero-banners",
        label: "Hero Banners",
        to: "/super-admin/hero-banners",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: Image,
      },
      {
        key: "admin-promo-banners",
        label: "Promo Banners",
        to: "/super-admin/promo-banners",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: RectangleHorizontal,
      },
      withSearch({
        key: "admin-announcements",
        label: "Announcements",
        to: "/super-admin/announcements",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: Megaphone,
      }),
      withSearch({
        key: 'admin-announcement-types',
        label: 'Announcement Types',
        to: '/super-admin/announcement-types',
        area: 'super_admin',
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: LayoutList,
        }),
      //   withSearch({
      //   key: "admin-users",
      //   label: "Users",
      //   to: "/super-admin/users",
      //   area: "super_admin",
      //   requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
      //   icon: UserCog,
      // }),
      {
        key: "admin-system",
        label: "System",
        to: "/super-admin/system",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: LayoutList,
      },
    ],
  },
  {
    title: 'SECURITY',
    items: [
      {
        key: "admin-rbac",
        label: "RBAC",
        to: "/super-admin/rbac",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: Shield,
      },
      {
        key: 'admin-system',
        label: 'System',
        to: '/super-admin/system',
        area: 'super_admin',
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: Server,
      },
    ],
  },
  {
    title: "ACCOUNTING",
    hideTitle: true,
    items: [
      {
        key: "admin-accounting",
        label: "Accounting",
        to: "/super-admin/accounting/overview",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: Calculator,
        children: [
          {
            key: "admin-accounting-overview",
            label: "Overview",
            to: "/super-admin/accounting/overview",
            area: "super_admin",
            requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
          },
          {
            key: "admin-accounting-income",
            label: "Income",
            to: "/super-admin/accounting/income",
            area: "super_admin",
            requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
          },
          {
            key: "admin-accounting-expenses",
            label: "Expenses",
            to: "/super-admin/accounting/expenses",
            area: "super_admin",
            requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
          },
          {
            key: "admin-accounting-platform-expenses",
            label: "Platform Expenses",
            to: "/super-admin/accounting/platform-expenses",
            area: "super_admin",
            requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
          },
          {
            key: "admin-accounting-platform-pending-approvals",
            label: "Pending Approvals",
            to: "/super-admin/accounting/platform-pending-approvals",
            area: "super_admin",
            requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
          },
          {
            key: "admin-accounting-platform-approval-policies",
            label: "Approval Policies",
            to: "/super-admin/accounting/platform-approval-policies",
            area: "super_admin",
            requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
          },
          {
            key: "admin-accounting-expense-categories",
            label: "Expense Categories",
            to: "/super-admin/accounting/expense-categories",
            area: "super_admin",
            requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
          },
          {
            key: "admin-accounting-journal-entries",
            label: "Journal Entries",
            to: "/super-admin/accounting/journal-entries",
            area: "super_admin",
            requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
          },
          {
            key: "admin-accounting-chart-of-accounts",
            label: "Chart of Accounts",
            to: "/super-admin/accounting/chart-of-accounts",
            area: "super_admin",
            requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
          },
        ],
      },
    ],
  },
  // {
  //   title: 'FINANCE',
  //   items: [
  //     {
  //       key: "admin-finance-overview",
  //       label: "Finance Overview",
  //       to: "/super-admin/finance",
  //       area: "super_admin",
  //       requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  //       icon: DollarSign,
  //     },
  //     {
  //       key: "admin-finance-transactions",
  //       label: "Transactions",
  //       to: "/super-admin/finance/transactions",
  //       area: "super_admin",
  //       requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
  //       icon: Receipt,
  //     },
  //   ],
  // },
  {
    title: "APPS",
    items: [
      {
        key: "admin-mail",
        label: "Mail",
        to: "/super-admin/mail",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: Mail,
      },
      {
        key: "admin-chat",
        label: "Chat",
        to: "/super-admin/chat",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: MessageCircle,
      },
      {
        key: "admin-files",
        label: "Files",
        to: "/super-admin/files",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: FolderOpen,
      },
    ],
  },
  {
    title: "HR MANAGEMENT",
    items: [
      {
        key: "admin-hr-employees",
        label: "Employees",
        to: "/super-admin/employees",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: Users,
      },
      {
        key: "admin-hr-departments",
        label: "Departments",
        to: "/super-admin/employees/departments",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: Building2,
      },
      {
        key: "admin-hr-positions",
        label: "Positions",
        to: "/super-admin/employees/positions",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: Briefcase,
      },
      {
        key: "admin-hr-designations",
        label: "Designations",
        to: "/super-admin/employees/designations",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: Award,
      },
      {
        key: "admin-hr-my-profile",
        label: "My Profile",
        to: "/super-admin/employees/me",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: UserCircle,
      },
    ],
  },
  {
    title: "TIME & ATTENDANCE",
    items: [
      {
        key: "admin-hr-attendance",
        label: "Attendance",
        to: "/super-admin/attendance",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.ATTENDANCE_REVIEW],
        icon: CalendarCheck,
      },
      {
        key: "admin-hr-shifts",
        label: "Shifts",
        to: "/super-admin/shifts",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.ATTENDANCE_MANAGE],
        icon: Clock3,
      },
      {
        key: "admin-hr-shift-schedules",
        label: "Shift Schedules",
        to: "/super-admin/shift-schedules",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.ATTENDANCE_MANAGE],
        icon: CalendarDays,
      },
      {
        key: "admin-hr-overtime-requests",
        label: "Overtime Requests",
        to: "/super-admin/overtime-requests",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.ATTENDANCE_REVIEW],
        icon: CalendarClock,
      },
      {
        key: "admin-hr-my-attendance",
        label: "My Attendance",
        to: "/super-admin/attendance/me",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.ATTENDANCE_VIEW],
        icon: ClipboardCheck,
      },
    ],
  },
  {
    title: "LEAVE MANAGEMENT",
    items: [
      {
        key: "admin-hr-leave-types",
        label: "Leave Types",
        to: "/super-admin/leave-types",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.LEAVE_MANAGE],
        icon: Tags,
      },
      {
        key: "admin-hr-leave-policies",
        label: "Leave Policies",
        to: "/super-admin/leave-policies",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.LEAVE_MANAGE],
        icon: ScrollText,
      },
      {
        key: "admin-hr-leave-balances",
        label: "Leave Balances",
        to: "/super-admin/leave-balances",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.LEAVE_MANAGE],
        icon: Wallet,
      },
      {
        key: "admin-hr-leave-requests",
        label: "Leave Requests",
        to: "/super-admin/leave-requests",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.LEAVE_MANAGE],
        icon: ClipboardList,
      },
      {
        key: "admin-hr-leave-approvals",
        label: "Leave Approvals",
        to: "/super-admin/leave-approvals",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.LEAVE_REVIEW],
        icon: ClipboardCheck,
      },
      {
        key: "admin-hr-leave-settings",
        label: "Leave Settings",
        to: "/super-admin/leave-settings",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.LEAVE_MANAGE],
        icon: Settings,
      },
      {
        key: "admin-hr-my-leave",
        label: "My Leave",
        to: "/super-admin/leave/me",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.LEAVE_VIEW],
        icon: CalendarDays,
      },
    ],
  },
  {
    title: "PAYROLL & COMPENSATION",
    items: [
      {
        key: "admin-hr-payroll-policies",
        label: "Payroll Policies",
        to: "/super-admin/payroll/policies",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PAYROLL_POLICIES_MANAGE],
        icon: ScrollText,
      },
      {
        key: "admin-hr-payroll-runs",
        label: "Payroll Runs",
        to: "/super-admin/payroll/runs",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PAYROLL_VIEW],
        icon: Calculator,
      },
      {
        key: "admin-hr-payslips",
        label: "Payslips",
        to: "/super-admin/payroll/payslips",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PAYSLIP_VIEW],
        icon: FileText,
      },
      {
        key: "admin-hr-payment-records",
        label: "Payment Records",
        to: "/super-admin/payroll/payments",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PAYROLL_VIEW],
        icon: CreditCard,
      },
      {
        key: "admin-hr-my-payslips",
        label: "My Payslips",
        to: "/super-admin/payroll/payslips/me",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PAYSLIP_VIEW_OWN],
        icon: Wallet,
      },
    ],
  },
  {
    title: "PERFORMANCE & BONUSES",
    items: [
      {
        key: "admin-hr-perf-cycles",
        label: "Performance Cycles",
        to: "/super-admin/performance/cycles",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PERFORMANCE_READ],
        icon: CalendarCheck,
      },
      {
        key: "admin-hr-kpis",
        label: "KPIs",
        to: "/super-admin/performance/kpis",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PERFORMANCE_READ],
        icon: Target,
      },
      {
        key: "admin-hr-reviews",
        label: "Performance Reviews",
        to: "/super-admin/performance/reviews",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PERFORMANCE_READ],
        icon: ClipboardCheck,
      },
      {
        key: "admin-hr-bonus-policies",
        label: "Bonus Policies",
        to: "/super-admin/performance/bonus-policies",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.BONUS_POLICIES_MANAGE],
        icon: ScrollText,
      },
      {
        key: "admin-hr-bonus-awards",
        label: "Bonus Awards",
        to: "/super-admin/performance/bonus-awards",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.BONUS_READ],
        icon: Gift,
      },
      {
        key: "admin-hr-my-perf",
        label: "My Performance",
        to: "/super-admin/performance/me",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PERFORMANCE_READ_OWN],
        icon: Award,
      },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      {
        key: "admin-notifications",
        label: "Notifications",
        to: "/super-admin/notifications",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: Bell,
      },
      {
        key: "admin-settings",
        label: "Settings",
        to: "/super-admin/settings",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: Settings,
      },
      {
        key: "admin-help-support",
        label: "Help & Support",
        to: "/super-admin/help-support",
        area: "super_admin",
        requiredCapabilities: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
        icon: HelpCircle,
      },
    ],
  },
];

export const DASHBOARD_MENU_PAYROLL: DashboardMenuSection[] = [
  {
    title: "PAYROLL",
    items: [
      {
        key: "payroll-policies",
        label: "Payroll Policies",
        to: "/payroll/policies",
        area: "payroll",
        requiredCapabilities: [CAPABILITIES.PAYROLL_POLICIES_MANAGE],
        icon: ScrollText,
      },
      {
        key: "payroll-runs",
        label: "Payroll Runs",
        to: "/payroll/runs",
        area: "payroll",
        requiredCapabilities: [CAPABILITIES.PAYROLL_VIEW],
        icon: Calculator,
      },
      {
        key: "payroll-payslips",
        label: "Payslips",
        to: "/payroll/payslips",
        area: "payroll",
        requiredCapabilities: [CAPABILITIES.PAYSLIP_VIEW],
        icon: FileText,
      },
      {
        key: "payroll-payment-records",
        label: "Payment Records",
        to: "/payroll/payments",
        area: "payroll",
        requiredCapabilities: [CAPABILITIES.PAYROLL_VIEW],
        icon: CreditCard,
      },
    ],
  },
  {
    title: "PERFORMANCE",
    items: [
      {
        key: "payroll-perf-cycles",
        label: "Performance Cycles",
        to: "/payroll/performance/cycles",
        area: "payroll",
        requiredCapabilities: [CAPABILITIES.PERFORMANCE_READ],
        icon: CalendarCheck,
      },
      {
        key: "payroll-kpis",
        label: "KPIs",
        to: "/payroll/performance/kpis",
        area: "payroll",
        requiredCapabilities: [CAPABILITIES.PERFORMANCE_READ],
        icon: Target,
      },
      {
        key: "payroll-reviews",
        label: "Performance Reviews",
        to: "/payroll/performance/reviews",
        area: "payroll",
        requiredCapabilities: [CAPABILITIES.PERFORMANCE_READ],
        icon: ClipboardCheck,
      },
      {
        key: "payroll-bonus-policies",
        label: "Bonus Policies",
        to: "/payroll/performance/bonus-policies",
        area: "payroll",
        requiredCapabilities: [CAPABILITIES.BONUS_POLICIES_MANAGE],
        icon: ScrollText,
      },
      {
        key: "payroll-bonus-awards",
        label: "Bonus Awards",
        to: "/payroll/performance/bonus-awards",
        area: "payroll",
        requiredCapabilities: [CAPABILITIES.BONUS_READ],
        icon: Gift,
      },
    ],
  },
  {
    title: "ME",
    items: [
      {
        key: "payroll-my-payslips",
        label: "My Payslips",
        to: "/payroll/payslips/me",
        area: "payroll",
        requiredCapabilities: [CAPABILITIES.PAYSLIP_VIEW_OWN],
        icon: Wallet,
      },
    ],
  },
];

export const DASHBOARD_MENU_EMPLOYEE: DashboardMenuSection[] = [
  {
    title: "SELF SERVICE",
    items: [
      {
        key: "employee-my-leave",
        label: "My Leave",
        to: "/employee/my-leave",
        area: "employee",
        requiredCapabilities: [CAPABILITIES.LEAVE_VIEW],
        icon: CalendarDays,
      },
    ],
  },
];

export const DASHBOARD_MENU_WAREHOUSE_MANAGER: DashboardMenuSection[] = [
  warehouseSection(
    "/warehouse-manager",
    "warehouse_manager",
    CAPABILITIES.WAREHOUSE_DASHBOARD_VIEW,
  ),
  {
    title: "Leave Management",
    items: [
      {
        key: "wm-leave-requests",
        label: "Leave Requests",
        to: "/warehouse-manager/leave/requests",
        area: "warehouse_manager",
        requiredCapabilities: [CAPABILITIES.LEAVE_VIEW],
        icon: ClipboardList,
      },
      {
        key: "wm-leave-approvals",
        label: "Leave Approvals",
        to: "/warehouse-manager/leave/approvals",
        area: "warehouse_manager",
        requiredCapabilities: [CAPABILITIES.LEAVE_REVIEW],
        icon: CalendarCheck,
      },
      {
        key: "wm-my-leave",
        label: "My Leave",
        to: "/warehouse-manager/leave/me",
        area: "warehouse_manager",
        requiredCapabilities: [CAPABILITIES.LEAVE_VIEW],
        icon: CalendarDays,
      },
    ],
  },
];

export const DASHBOARD_MENU_DELIVERY_AGENT: DashboardMenuSection[] = [
  {
    title: "DELIVERY",
    items: [
      {
        key: "delivery-overview",
        label: "Overview",
        to: "/delivery-agent/overview",
        area: "delivery_agent",
        requiredCapabilities: [CAPABILITIES.DELIVERY_DASHBOARD_VIEW],
        icon: LayoutDashboard,
      },
      {
        key: "delivery-parcels",
        label: "Parcels",
        to: "/delivery-agent/parcels",
        area: "delivery_agent",
        requiredCapabilities: [CAPABILITIES.DELIVERY_PARCELS_VIEW],
        icon: Package,
      },
      {
        key: "delivery-damage-reports",
        label: "Damage Reports",
        to: "/delivery-agent/damage-reports",
        area: "delivery_agent",
        requiredCapabilities: [CAPABILITIES.DELIVERY_DAMAGE_REPORTS_VIEW],
        icon: AlertTriangle,
      },
    ],
  },
  {
    title: "Leave Management",
    items: [
      {
        key: "da-my-leave",
        label: "My Leave",
        to: "/delivery/my-leave",
        area: "delivery_agent",
        requiredCapabilities: [CAPABILITIES.LEAVE_VIEW],
        icon: CalendarDays,
      },
    ],
  },
];
