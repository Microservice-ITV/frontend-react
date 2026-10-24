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
} from "lucide-react";
import { CAPABILITIES } from "@/app/rbac/capabilities";
import type { Capability } from "@/app/rbac/types";
import type {
  DashboardArea,
  DashboardMenuSection,
} from "../types/dashboardTypes";
import { getSearchConfig } from "./searchConfigs";

const withSearch = (item: DashboardMenuSection['items'][0]) => {
  const search = getSearchConfig(item.key)
  return search ? { ...item, search: { enabled: true, ...search } } : item
}

/** Seller menu omits these. Admin menu omits purchasing; the warehouse manager keeps it. */
const ADMIN_ONLY_WAREHOUSE_KEYS = new Set(["warehouse-suppliers"])
const ADMIN_HIDDEN_WAREHOUSE_KEYS = new Set([
  "warehouse-purchase-orders",
  "warehouse-receipts",
  "warehouse-returns",
  "warehouse-transfer",
])

const warehouseSection = (
  base: "/seller" | "/super-admin" | "/warehouse-manager" | "/delivery-agent",
  area: DashboardArea,
  capability: Capability,
): DashboardMenuSection => {
  const items: Array<{ key: string; label: string; path: string; icon: typeof Warehouse }> = [
    { key: "warehouse-overview", label: "Overview", path: "/warehouse", icon: LayoutDashboard },
    {
      key: "warehouse-warehouses",
      label: "Warehouses",
      path: "/warehouse/warehouses",
      icon: Warehouse,
    },
    { key: "warehouse-inventory", label: "Inventory Data", path: "/warehouse/inventory", icon: Boxes },
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
  const receiptsIndex = section.items.findIndex((item) =>
    item.key.endsWith("warehouse-receipts"),
  )
  const confirmPickupItem = {
    key: "seller-delivery-parcels",
    label: "Confirm and Pickup",
    to: "/seller/warehouse/parcels",
    area: "seller" as const,
    requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
    icon: Truck,
  }
  const damageReportsItem = {
    key: "seller-damage-reports",
    label: "Damage Reports",
    to: "/seller/warehouse/damage-reports",
    area: "seller" as const,
    requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
    icon: AlertTriangle,
  }
  const items =
    receiptsIndex >= 0
      ? [
          ...section.items.slice(0, receiptsIndex),
          confirmPickupItem,
          ...section.items.slice(receiptsIndex),
          damageReportsItem,
        ]
      : [...section.items, confirmPickupItem, damageReportsItem]
  return {
    ...section,
    items,
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
        key: "seller-cancel-orders",
        label: "Cancel Orders",
        to: "/seller/orders/cancelled",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: XCircle,
      }),
      withSearch({
        key: "seller-return-orders",
        label: "Return Orders",
        to: "/seller/orders/returns",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: PackageCheck,
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
        label: "Revenue",
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
        label: "Delivery Costs",
        to: "/seller/accounting/delivery-company-fees",
        area: "seller",
        requiredCapabilities: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
        icon: Truck,
      },
      {
        key: "seller-accounting-pending-approvals",
        label: "Approvals Queues",
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
]

export const DASHBOARD_MENU_WAREHOUSE_MANAGER: DashboardMenuSection[] = [
  warehouseSection(
    "/warehouse-manager",
    "warehouse_manager",
    CAPABILITIES.WAREHOUSE_DASHBOARD_VIEW,
  ),
]

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
]
