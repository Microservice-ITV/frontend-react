import type { SearchConfig, DashboardArea } from '../types/dashboardTypes'
import type { SearchHit } from '../api/globalSearchApi'
import { productClient } from '@/lib/api/productClient'
import { authClient } from '@/lib/api/authClient'
import { paymentClient } from '@/lib/api/paymentClient'
import { ecommerceReadRestClient } from '@/lib/api/ecommerceReadRestClient'
import { promotionClient } from '@/lib/api/promotionClient'
import type { ProductServiceProductListItem } from '@/features/seller/api/sellerProductApi'
import type { ShopReadItem } from '@/features/admin/api/adminShopApi'
import type { AdminUserDto } from '@/features/admin/api/adminUsersApi'
import type { CatalogItem } from '@/features/seller/types/catalogTypes'
import type { PromotionRecord } from '@/features/promotions/api/promotionApi'
import type { AnnouncementType, AnnouncementSummary } from '@/features/announcements/types/announcementTypes'

const LIMIT = 5

type PaginatedResponse<T> = {
  success?: boolean
  data?: T[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const fetchProducts = async (
  query: string,
  _opts: { userId?: string | null; activeShopId?: string | null },
  signal?: AbortSignal,
): Promise<SearchHit[]> => {
  const response = await productClient.get<PaginatedResponse<ProductServiceProductListItem>>(
    '/products',
    { params: { search: query, page: 1, limit: LIMIT }, signal },
  )
  return (response.data?.data ?? []).map((product) => {
    const categoryName = product.category?.name ?? product.category?.title
    return {
      id: product.id,
      label: product.name ?? 'Untitled product',
      ...(categoryName ? { subtitle: categoryName } : {}),
    }
  })
}

const fetchShops = async (
  query: string,
  _opts: { userId?: string | null; activeShopId?: string | null },
  signal?: AbortSignal,
): Promise<SearchHit[]> => {
  const response = await productClient.get<PaginatedResponse<ShopReadItem>>('/shops', {
    params: { search: query, page: 1, limit: LIMIT },
    signal,
  })
  return (response.data?.data ?? []).map((shop) => ({
    id: shop.id,
    label: shop.name ?? 'Untitled shop',
    ...(shop.slug ? { subtitle: `@${shop.slug}` } : {}),
  }))
}

const fetchUsers = async (
  query: string,
  _opts: { userId?: string | null; activeShopId?: string | null },
  signal?: AbortSignal,
): Promise<SearchHit[]> => {
  const response = await authClient.get<{
    success: boolean
    data: { users: AdminUserDto[] }
  }>('/admin/users', { params: { search: query, per_page: LIMIT }, signal })
  return (response.data?.data?.users ?? []).map((user) => ({
    id: user.id,
    label: user.name ?? 'Unnamed user',
    ...(user.email ? { subtitle: user.email } : {}),
  }))
}

type CategorySearchItem = {
  id: string
  name?: string
  slug?: string
}

const fetchCategories = async (
  query: string,
  _opts: { userId?: string | null; activeShopId?: string | null },
  signal?: AbortSignal,
): Promise<SearchHit[]> => {
  const response = await productClient.get<PaginatedResponse<CategorySearchItem>>('/categories', {
    params: { search: query, page: 1, limit: LIMIT },
    signal,
  })
  return (response.data?.data ?? []).map((category) => ({
    id: category.id,
    label: category.name ?? 'Untitled category',
    ...(category.slug ? { subtitle: category.slug } : {}),
  }))
}

type PaymentSearchItem = {
  id: string
  amount: number | string
  currency?: string
  status?: string
  provider?: string
}

const fetchPayments = async (
  query: string,
  _opts: { userId?: string | null; activeShopId?: string | null },
  signal?: AbortSignal,
): Promise<SearchHit[]> => {
  const response = await paymentClient.get<PaginatedResponse<PaymentSearchItem>>('/payments', {
    params: { search: query, page: 1, limit: LIMIT },
    signal,
  })
  return (response.data?.data ?? []).map((payment) => {
    const amount = Number(payment.amount ?? 0).toLocaleString('en-US', {
      style: 'currency',
      currency: payment.currency || 'USD',
      maximumFractionDigits: 2,
    })
    const detail = [payment.status, payment.provider?.toUpperCase()]
      .filter(Boolean)
      .join(' \u2022 ')
    return {
      id: payment.id,
      label: `Payment ${payment.id.slice(0, 8).toUpperCase()}`,
      subtitle: `${amount}${detail ? ` \u2022 ${detail}` : ''}`,
    }
  })
}

const SHOP_ORDERS_SEARCH_QUERY = `
  query ShopOrdersSearch($shopId: ID!, $search: String) {
    shopOrders(shopId: $shopId, search: $search) {
      orderId
      status
      placedAt
      createdAt
      items {
        name
      }
      deliveryAddress {
        recipientName
      }
    }
  }
`

type SellerOrderSearchItem = {
  orderId: string
  status?: string
  placedAt?: string | null
  createdAt?: string | null
  deliveryAddress?: { recipientName?: string } | null
}

type GraphQLEnvelope<T> = {
  data?: T
  errors?: { message?: string }[]
}

const ownedShopCache = new Map<string, { at: number; promise: Promise<string[]> }>()
const OWNED_SHOPS_CACHE_TTL = 60_000

const resolveSellerShopIds = async (
  opts: { userId?: string | null; activeShopId?: string | null },
): Promise<string[]> => {
  if (opts.userId) {
    const cached = ownedShopCache.get(opts.userId)
    if (cached && Date.now() - cached.at < OWNED_SHOPS_CACHE_TTL) {
      return cached.promise
    }
    const promise = productClient
      .get<{ success?: boolean; data?: Array<{ id?: string; shopId?: string }> }>(
        `/shops/user/${opts.userId}`,
      )
      .then((response) =>
        (response.data?.data ?? [])
          .map((shop) => shop.id ?? shop.shopId ?? '')
          .filter((value): value is string => Boolean(value)),
      )
      .catch(() => [] as string[])
    ownedShopCache.set(opts.userId, { at: Date.now(), promise })
    return promise
  }
  return opts.activeShopId ? [opts.activeShopId] : []
}

const fetchOrders = async (
  query: string,
  opts: { userId?: string | null; activeShopId?: string | null },
  signal?: AbortSignal,
): Promise<SearchHit[]> => {
  const shopIds = await resolveSellerShopIds(opts)
  if (shopIds.length === 0) return []

  const results = await Promise.all(
    shopIds.map((shopId) =>
      ecommerceReadRestClient
        .post<GraphQLEnvelope<{ shopOrders?: SellerOrderSearchItem[] }>>(
          '/graphql',
          {
            query: SHOP_ORDERS_SEARCH_QUERY,
            variables: { shopId, search: query },
          },
          { signal },
        )
        .then((response) => {
          if (response.data?.errors?.length) {
            throw new Error(response.data.errors[0]?.message ?? 'Failed to fetch orders')
          }
          return response.data?.data?.shopOrders ?? []
        })
        .catch(() => [] as SellerOrderSearchItem[]),
    ),
  )

  const merged = new Map<string, SellerOrderSearchItem>()
  for (const orders of results) {
    for (const order of orders) {
      if (!merged.has(order.orderId)) {
        merged.set(order.orderId, order)
      }
    }
  }

  const sorted = [...merged.values()]
    .sort((a, b) => {
      const aTime = new Date(a.placedAt || a.createdAt || 0).getTime()
      const bTime = new Date(b.placedAt || b.createdAt || 0).getTime()
      return bTime - aTime
    })
    .slice(0, LIMIT)

  return sorted.map((order) => ({
    id: order.orderId,
    label: `Order ${order.orderId}`,
    ...(order.deliveryAddress?.recipientName
      ? { subtitle: order.deliveryAddress.recipientName }
      : {}),
  }))
}

const fetchAnnouncementTypes = async (
  query: string,
  _opts: { userId?: string | null; activeShopId?: string | null },
  signal?: AbortSignal,
): Promise<SearchHit[]> => {
  const response = await productClient.get<{ success?: boolean; data?: AnnouncementType[] }>(
    '/announcement-types',
    { params: { search: query, page: 1, limit: LIMIT }, signal },
  )
  return (response.data?.data ?? []).map((type) => ({
    id: type.id,
    label: type.name,
    ...(type.code ? { subtitle: type.code } : {}),
  }))
}

const fetchAnnouncements = async (
  query: string,
  _opts: { userId?: string | null; activeShopId?: string | null },
  signal?: AbortSignal,
): Promise<SearchHit[]> => {
  const response = await productClient.get<{ success?: boolean; data?: AnnouncementSummary[] }>(
    '/announcements',
    { params: { search: query, page: 1, limit: LIMIT }, signal },
  )
  return (response.data?.data ?? []).map((announcement) => ({
    id: announcement.id,
    label: announcement.name,
    ...(announcement.announcementType?.name ? { subtitle: announcement.announcementType.name } : {}),
  }))
}

const fetchPromotions = async (
  query: string,
  _opts: { userId?: string | null; activeShopId?: string | null },
  signal?: AbortSignal,
): Promise<SearchHit[]> => {
  const response = await promotionClient.get<{ success?: boolean; data?: PromotionRecord[] }>(
    '/promotions',
    { params: { search: query, page: 1, limit: LIMIT }, signal },
  )
  return (response.data?.data ?? []).map((promo) => ({
    id: promo.id,
    label: promo.name,
    ...(promo.scope ? { subtitle: promo.scope } : {}),
  }))
}

const makeCatalogFetcher = (basePath: string) => {
  return async (
    query: string,
    _opts: { userId?: string | null; activeShopId?: string | null },
    signal?: AbortSignal,
  ): Promise<SearchHit[]> => {
    const response = await productClient.get<PaginatedResponse<CatalogItem>>(`/${basePath}`, {
      params: { search: query, limit: LIMIT },
      signal,
    })
    return (response.data?.data ?? []).map((item) => ({
      id: item.id,
      label: `${item.name ?? item.code}`,
      ...(item.code && item.name ? { subtitle: item.code } : {}),
    }))
  }
}

const makeStaticSearch = (to: string): SearchConfig => ({
  enabled: true,
  domain: 'navigation',
  fetch: async () => [] as SearchHit[],
  makeTo: () => to,
})

export const searchConfigs: Record<string, SearchConfig> = {
  'seller-products': {
    enabled: true,
    domain: 'product',
    fetch: fetchProducts,
    makeTo: (hit) => `/seller/products/${hit.id}`,
  },
  'seller-orders': {
    enabled: true,
    domain: 'order',
    fetch: fetchOrders,
    makeTo: (hit) => `/seller/orders/${hit.id}`,
  },
  'seller-categories': {
    enabled: true,
    domain: 'category',
    fetch: fetchCategories,
    makeTo: (hit) => `/seller/categories/${hit.id}`,
  },
  'seller-payments': {
    enabled: true,
    domain: 'payment',
    fetch: fetchPayments,
    makeTo: (hit) => `/seller/payments/${hit.id}`,
  },
  'seller-brands': {
    enabled: true,
    domain: 'brand',
    fetch: makeCatalogFetcher('brands'),
    makeTo: (hit) => `/seller/brands/${hit.id}/edit`,
  },
  'seller-colors': {
    enabled: true,
    domain: 'color',
    fetch: makeCatalogFetcher('colors'),
    makeTo: (hit) => `/seller/colors/${hit.id}/edit`,
  },
  'seller-sizes': {
    enabled: true,
    domain: 'size',
    fetch: makeCatalogFetcher('sizes'),
    makeTo: (hit) => `/seller/sizes/${hit.id}/edit`,
  },
  'seller-promotions': {
    enabled: true,
    domain: 'promotion',
    fetch: fetchPromotions,
    makeTo: () => `/seller/promotions`,
  },
  'seller-flash-deals': makeStaticSearch('/seller/promotion-engine/flash-deals'),
  'seller-bundles': makeStaticSearch('/seller/promotion-engine/bundles'),
  'seller-overview': makeStaticSearch('/seller/overview'),
  'seller-analytics': makeStaticSearch('/seller/analytics'),
  'seller-finance-overview': makeStaticSearch('/seller/finance'),
  'seller-finance-transactions': makeStaticSearch('/seller/finance/transactions'),
  'seller-accounting-chart-of-accounts': makeStaticSearch('/seller/accounting/chart-of-accounts'),
  'seller-mail': makeStaticSearch('/seller/mail'),
  'seller-chat': makeStaticSearch('/seller/chat'),
  'seller-files': makeStaticSearch('/seller/files'),
  'seller-notifications': makeStaticSearch('/seller/notifications'),
  'seller-settings': makeStaticSearch('/seller/settings'),
  'seller-help-support': makeStaticSearch('/seller/help-support'),
  'admin-shops': {
    enabled: true,
    domain: 'shop',
    fetch: fetchShops,
    makeTo: (hit) => `/super-admin/shops/${hit.id}`,
  },
  'admin-users': {
    enabled: true,
    domain: 'user',
    fetch: fetchUsers,
    makeTo: () => '/super-admin/users',
  },
  'admin-categories': {
    enabled: true,
    domain: 'category',
    fetch: fetchCategories,
    makeTo: (hit) => `/super-admin/categories/${hit.id}`,
  },
  'admin-payments': {
    enabled: true,
    domain: 'payment',
    fetch: fetchPayments,
    makeTo: (hit) => `/super-admin/payments/${hit.id}`,
  },
  'admin-announcement-types': {
    enabled: true,
    domain: 'announcement-type',
    fetch: fetchAnnouncementTypes,
    makeTo: (hit) => `/super-admin/announcement-types/${hit.id}/edit`,
  },
  'admin-announcements': {
    enabled: true,
    domain: 'announcement',
    fetch: fetchAnnouncements,
    makeTo: (hit) => `/super-admin/announcements/${hit.id}/edit`,
  },
  'admin-promotions': {
    enabled: true,
    domain: 'promotion',
    fetch: fetchPromotions,
    makeTo: () => `/super-admin/promotion-engine`,
  },
  'admin-overview': makeStaticSearch('/super-admin/overview'),
  'admin-analytics': makeStaticSearch('/super-admin/analytics'),
  'admin-home-features': makeStaticSearch('/super-admin/home-features'),
  'admin-hero-banners': makeStaticSearch('/super-admin/hero-banners'),
  'admin-promo-banners': makeStaticSearch('/super-admin/promo-banners'),
  'admin-system': makeStaticSearch('/super-admin/system'),
  'admin-rbac': makeStaticSearch('/super-admin/rbac'),
  'admin-accounting': makeStaticSearch('/super-admin/accounting/overview'),
  'admin-accounting-overview': makeStaticSearch('/super-admin/accounting/overview'),
  'admin-accounting-income': makeStaticSearch('/super-admin/accounting/income'),
  'admin-accounting-expenses': makeStaticSearch('/super-admin/accounting/expenses'),
  'admin-accounting-expense-categories': makeStaticSearch('/super-admin/accounting/expense-categories'),
  'admin-accounting-journal-entries': makeStaticSearch('/super-admin/accounting/journal-entries'),
  'admin-accounting-chart-of-accounts': makeStaticSearch('/super-admin/accounting/chart-of-accounts'),
  'admin-finance-overview': makeStaticSearch('/super-admin/finance'),
  'admin-finance-transactions': makeStaticSearch('/super-admin/finance/transactions'),
  'admin-mail': makeStaticSearch('/super-admin/mail'),
  'admin-chat': makeStaticSearch('/super-admin/chat'),
  'admin-files': makeStaticSearch('/super-admin/files'),
  'admin-notifications': makeStaticSearch('/super-admin/notifications'),
  'admin-settings': makeStaticSearch('/super-admin/settings'),
  'admin-help-support': makeStaticSearch('/super-admin/help-support'),
}

export function getSearchConfig(key: string): SearchConfig | undefined {
  return searchConfigs[key]
}

export function getSearchConfigsForArea(area: DashboardArea): SearchConfig[] {
  if (area === 'warehouse_manager') return []
  return Object.entries(searchConfigs)
    .filter(([key]) => key.startsWith(area === 'seller' ? 'seller-' : 'admin-'))
    .map(([, config]) => config)
}