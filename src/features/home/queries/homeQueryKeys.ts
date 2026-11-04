export const homeQueryKeys = {
  all: ['storefront', 'home'] as const,
  banner: () => [...homeQueryKeys.all, 'banner'] as const,
  quickActions: () => [...homeQueryKeys.all, 'quick-actions'] as const,
  categories: () => ['storefront', 'categories', 'list'] as const,
  flashDeals: () =>
    [...homeQueryKeys.all, 'flash-deals', { limit: 12, status: 'all' }] as const,
  topOrdered: (limit = 10) =>
    [...homeQueryKeys.all, 'top-ordered', { limit }] as const,
  recentProducts: (limit = 10) =>
    ['storefront', 'products', 'recent', { limit }] as const,
  announcements: () => ['storefront', 'announcements', 'active'] as const,
}
