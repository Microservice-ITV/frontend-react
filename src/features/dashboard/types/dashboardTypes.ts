import type { LucideIcon } from 'lucide-react'
import type { Capability } from '@/app/rbac/types'
import type { SearchHit } from '../api/globalSearchApi'

export type DashboardArea = 'seller' | 'super_admin' | 'warehouse_manager' | 'delivery_agent'

export type SearchConfig = {
  enabled: boolean
  domain: string
  fetch: (
    query: string,
    opts: { userId?: string | null; activeShopId?: string | null },
    signal?: AbortSignal,
  ) => Promise<SearchHit[]>
  makeTo: (hit: SearchHit) => string
}

export type DashboardMenuItem = {
  key: string
  label: string
  to: string
  area: DashboardArea
  requiredCapabilities: readonly Capability[]
  icon?: LucideIcon
  badge?: string | number
  children?: DashboardMenuItem[]
  search?: SearchConfig
}

export type DashboardMenuSection = {
  title: string
  items: DashboardMenuItem[]
  hideTitle?: boolean
}