import type { LucideIcon } from 'lucide-react'
import type { Capability } from '@/app/rbac/types'

export type DashboardArea = 'seller' | 'super_admin'

export type DashboardMenuItem = {
  key: string
  label: string
  to: string
  area: DashboardArea
  requiredCapabilities: readonly Capability[]
  icon?: LucideIcon
  badge?: string | number
}

export type DashboardMenuSection = {
  title: string
  items: DashboardMenuItem[]
}