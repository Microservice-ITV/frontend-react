import { matchPath } from 'react-router-dom'

export const SITE_NAME = 'Daily Need Items'

type PageTitleRule = {
  path: string
  title: string
}

/**
 * Most specific matching rule wins, so `/products/new` beats `/products/:id`.
 * Keep static paths and their `:param` siblings both listed.
 */
const PAGE_TITLE_RULES: PageTitleRule[] = [
  { path: '/', title: SITE_NAME },
  { path: '/ai-assistant', title: SITE_NAME },

  { path: '/login', title: 'Login' },
  { path: '/register', title: 'Register' },
  { path: '/verify-email', title: 'Verify Email' },
  { path: '/forgot-password', title: 'Forgot Password' },
  { path: '/reset-password', title: 'Reset Password' },
  { path: '/phone-auth', title: 'Phone Login' },
  { path: '/phone-verify', title: 'Verify Phone' },
  { path: '/oauth-success', title: 'Sign In' },
  { path: '/oauth-error', title: 'Sign In' },
  { path: '/forbidden', title: 'Access Denied' },

  { path: '/search', title: 'Search' },
  { path: '/all_categories', title: 'Categories' },
  { path: '/categories/:id', title: 'Category' },
  { path: '/products/:id', title: 'Product' },
  { path: '/shops/:shopId', title: 'Shop' },
  { path: '/cart', title: 'Cart' },
  { path: '/cart/see-more', title: 'Recommendations' },
  { path: '/wishlist', title: 'Wishlist' },
  { path: '/recently-added', title: 'Recently Added' },
  { path: '/flash-deals', title: 'Flash Deals' },
  { path: '/mall', title: 'Mall' },
  { path: '/blog', title: 'Blog' },
  { path: '/about', title: 'About Us' },
  { path: '/careers', title: 'Careers' },
  { path: '/policies', title: 'Policies' },
  { path: '/privacy', title: 'Privacy Policy' },
  { path: '/seller-centre', title: 'Seller Centre' },
  { path: '/seller-mentors', title: 'Seller Mentors' },
  { path: '/media', title: 'Media Contact' },
  { path: '/ambassador', title: 'Ambassador Programme' },
  { path: '/become-a-seller', title: 'Become a Seller' },

  { path: '/checkout', title: 'Checkout' },
  { path: '/checkout/guest', title: 'Checkout' },
  { path: '/checkout/guest/checkout', title: 'Checkout' },
  { path: '/checkout/success', title: 'Order Confirmed' },
  { path: '/checkout/guest/success', title: 'Order Confirmed' },

  { path: '/help-centre', title: 'Help Centre' },
  { path: '/help-centre/how-to-buy', title: 'How to Buy' },
  { path: '/help-centre/how-to-sell', title: 'How to Sell' },
  { path: '/help-centre/payment-methods', title: 'Payment Methods' },
  { path: '/help-centre/ecommerce-coins', title: 'Coins' },
  { path: '/help-centre/ecommerce-guarantee', title: 'Guarantee' },
  { path: '/help-centre/return-refund', title: 'Return & Refund' },
  { path: '/help-centre/mall-return-refund', title: 'Mall Return & Refund' },
  { path: '/help-centre/contact-us', title: 'Contact Us' },
  { path: '/help-centre/article/:categoryId/:itemIndex', title: 'Help' },
  { path: '/announcements/:announcementId', title: 'Announcement' },

  { path: '/account', title: 'Profile' },
  { path: '/account/profile', title: 'Profile' },
  { path: '/account/banks-cards', title: 'Banks & Cards' },
  { path: '/account/addresses', title: 'Addresses' },
  { path: '/account/change-password', title: 'Change Password' },
  { path: '/account/notifications', title: 'Notifications' },
  { path: '/account/notifications-center', title: 'Notifications' },
  { path: '/account/orders', title: 'Orders' },
  { path: '/account/orders/:orderId', title: 'Order Details' },
  { path: '/account/invoices', title: 'Invoices' },
  { path: '/account/invoices/:invoiceNumber', title: 'Invoice' },
  { path: '/account/invoices/:invoiceNumber/print', title: 'Print invoice' },
  { path: '/account/my-vouchers', title: 'My Vouchers' },
  { path: '/account/my-coins', title: 'My Coins' },

  { path: '/seller', title: 'Dashboard' },
  { path: '/seller/overview', title: 'Dashboard' },
  { path: '/seller/analytics', title: 'Analytics' },
  { path: '/seller/orders', title: 'Orders' },
  { path: '/seller/orders/:id', title: 'Order Details' },
  { path: '/seller/payments', title: 'Payments' },
  { path: '/seller/payments/:paymentId', title: 'Payment Details' },
  { path: '/seller/categories', title: 'Categories' },
  { path: '/seller/categories/new', title: 'Categories' },
  { path: '/seller/categories/:id', title: 'Category' },
  { path: '/seller/categories/:id/edit', title: 'Categories' },
  { path: '/seller/brands', title: 'Brands' },
  { path: '/seller/brands/new', title: 'New Brand' },
  { path: '/seller/brands/:id/edit', title: 'Edit Brand' },
  { path: '/seller/colors', title: 'Colors' },
  { path: '/seller/colors/new', title: 'New Color' },
  { path: '/seller/colors/:id/edit', title: 'Edit Color' },
  { path: '/seller/sizes', title: 'Sizes' },
  { path: '/seller/sizes/new', title: 'New Size' },
  { path: '/seller/sizes/:id/edit', title: 'Edit Size' },
  { path: '/seller/products', title: 'Products' },
  { path: '/seller/products/new', title: 'New Product' },
  { path: '/seller/products/:id', title: 'Product' },
  { path: '/seller/products/:id/edit', title: 'Edit Product' },
  { path: '/seller/promotions', title: 'Promotions' },
  { path: '/seller/invoices', title: 'Invoices' },
  { path: '/seller/finance', title: 'Finance Overview' },
  { path: '/seller/finance/transactions', title: 'Transactions' },
  { path: '/seller/accounting', title: 'Accounting Overview' },
  { path: '/seller/accounting/overview', title: 'Accounting Overview' },
  { path: '/seller/accounting/income', title: 'Income' },
  { path: '/seller/accounting/expenses', title: 'Expenses' },
  { path: '/seller/accounting/expenses/new', title: 'New Expense' },
  { path: '/seller/accounting/expenses/:expenseId', title: 'Expense' },
  { path: '/seller/accounting/pending-approvals', title: 'Pending Approvals' },
  { path: '/seller/accounting/journal-entries', title: 'Journal Entries' },
  { path: '/seller/accounting/chart-of-accounts', title: 'Chart of Accounts' },
  { path: '/seller/accounting/approval-policies', title: 'Approval Policies' },
  { path: '/seller/accounting/approval-policies/new', title: 'New Approval Policy' },
  { path: '/seller/accounting/approval-policies/:policyId', title: 'Approval Policy' },
  { path: '/seller/accounting/approval-policies/:policyId/edit', title: 'Edit Approval Policy' },
  { path: '/seller/mail', title: 'Mail' },
  { path: '/seller/chat', title: 'Chat' },
  { path: '/seller/files', title: 'Files' },
  { path: '/seller/notifications', title: 'Notifications' },
  { path: '/seller/settings', title: 'Settings' },
  { path: '/seller/help-support', title: 'Help & Support' },

  { path: '/super-admin', title: 'Dashboard' },
  { path: '/super-admin/overview', title: 'Dashboard' },
  { path: '/super-admin/analytics', title: 'Analytics' },
  { path: '/super-admin/shops', title: 'Shops' },
  { path: '/super-admin/shops/:shopId', title: 'Shop' },
  { path: '/super-admin/shops/:shopId/edit', title: 'Edit Shop' },
  { path: '/super-admin/sellers', title: 'Shops' },
  { path: '/super-admin/payments', title: 'Payments' },
  { path: '/super-admin/payments/:paymentId', title: 'Payment Details' },
  { path: '/super-admin/users', title: 'Users' },
  { path: '/super-admin/invoices', title: 'Invoices' },
  { path: '/super-admin/categories', title: 'Categories' },
  { path: '/super-admin/categories/new', title: 'New Category' },
  { path: '/super-admin/categories/:id', title: 'Category' },
  { path: '/super-admin/categories/:id/edit', title: 'Edit Category' },
  { path: '/super-admin/home-features', title: 'Home Features' },
  { path: '/super-admin/home-features/new', title: 'New Home Feature' },
  { path: '/super-admin/home-features/:id/edit', title: 'Edit Home Feature' },
  { path: '/super-admin/hero-banners', title: 'Hero Banners' },
  { path: '/super-admin/hero-banners/new', title: 'New Hero Banner' },
  { path: '/super-admin/hero-banners/:id/edit', title: 'Edit Hero Banner' },
  { path: '/super-admin/promo-banners', title: 'Promo Banners' },
  { path: '/super-admin/promo-banners/new', title: 'New Promo Banner' },
  { path: '/super-admin/promo-banners/:id/edit', title: 'Edit Promo Banner' },
  { path: '/super-admin/announcements', title: 'Announcements' },
  { path: '/super-admin/announcements/new', title: 'New Announcement' },
  { path: '/super-admin/announcements/:id/edit', title: 'Edit Announcement' },
  { path: '/super-admin/announcement-types', title: 'Announcement Types' },
  { path: '/super-admin/announcement-types/new', title: 'New Announcement Type' },
  { path: '/super-admin/announcement-types/:id/edit', title: 'Edit Announcement Type' },
  { path: '/super-admin/shipping/pricing-rules', title: 'Delivery Pricing' },
  { path: '/super-admin/shipping/pricing-rules/new', title: 'New Pricing Rule' },
  { path: '/super-admin/shipping/pricing-rules/:id', title: 'Pricing Rule' },
  { path: '/super-admin/shipping/pricing-rules/:id/edit', title: 'Edit Pricing Rule' },
  { path: '/super-admin/shipping/weight-rates', title: 'Weight Rates' },
  { path: '/super-admin/shipping/weight-rates/new', title: 'New Weight Rate' },
  { path: '/super-admin/shipping/weight-rates/:id', title: 'Weight Rate' },
  { path: '/super-admin/shipping/weight-rates/:id/edit', title: 'Edit Weight Rate' },
  { path: '/super-admin/shipping/distance-ranges', title: 'Distance Ranges' },
  { path: '/super-admin/shipping/distance-ranges/new', title: 'New Distance Range' },
  { path: '/super-admin/shipping/distance-ranges/:id', title: 'Distance Range' },
  { path: '/super-admin/shipping/distance-ranges/:id/edit', title: 'Edit Distance Range' },
  { path: '/super-admin/shipping/quotes', title: 'Delivery Quotes' },
  { path: '/super-admin/shipping/quotes/:id', title: 'Delivery Quote' },
  { path: '/super-admin/promotion-engine', title: 'Promotions' },
  { path: '/super-admin/promotion-engine/flash-deals', title: 'Flash Deals' },
  { path: '/super-admin/promotion-engine/flash-deals/new', title: 'New Flash Deal' },
  { path: '/super-admin/promotion-engine/flash-deals/:id/edit', title: 'Edit Flash Deal' },
  { path: '/super-admin/rbac', title: 'RBAC' },
  { path: '/super-admin/system', title: 'System' },
  { path: '/super-admin/finance', title: 'Finance Overview' },
  { path: '/super-admin/finance/transactions', title: 'Transactions' },
  { path: '/super-admin/accounting', title: 'Accounting Overview' },
  { path: '/super-admin/accounting/overview', title: 'Accounting Overview' },
  { path: '/super-admin/accounting/income', title: 'Income' },
  { path: '/super-admin/accounting/expenses', title: 'Expenses' },
  { path: '/super-admin/accounting/expense-categories', title: 'Expense Categories' },
  { path: '/super-admin/accounting/chart-of-accounts', title: 'Chart of Accounts' },
  { path: '/super-admin/accounting/journal-entries', title: 'Journal Entries' },
  { path: '/super-admin/accounting/:section', title: 'Accounting' },
  { path: '/super-admin/notifications', title: 'Notifications' },
  { path: '/super-admin/mail', title: 'Mail' },
  { path: '/super-admin/chat', title: 'Chat' },
  { path: '/super-admin/files', title: 'Files' },
  { path: '/super-admin/settings', title: 'Settings' },
  { path: '/super-admin/help-support', title: 'Help & Support' },
]

function ruleScore(path: string): number {
  const segments = path.split('/').filter(Boolean)
  const staticSegments = segments.filter((segment) => !segment.startsWith(':')).length
  return staticSegments * 10 + segments.length
}

export function formatDocumentTitle(pageTitle?: string | null): string {
  const page = pageTitle?.trim()
  if (!page || page === SITE_NAME) return SITE_NAME
  return `${page} - ${SITE_NAME}`
}

export function resolvePageTitle(pathname: string, search = ''): string {
  if (pathname === '/search') {
    const query = new URLSearchParams(search).get('q')?.trim()
    if (query) return `Search: ${query}`
    return 'Search'
  }

  let best: { title: string; score: number } | null = null

  for (const rule of PAGE_TITLE_RULES) {
    if (!matchPath({ path: rule.path, end: true }, pathname)) continue

    const score = ruleScore(rule.path)
    if (!best || score > best.score) {
      best = { title: rule.title, score }
    }
  }

  return best?.title ?? 'Page Not Found'
}
