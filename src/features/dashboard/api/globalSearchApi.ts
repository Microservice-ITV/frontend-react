import type { DashboardArea, DashboardMenuSection } from '../types/dashboardTypes'
import { getSearchConfigsForArea } from '../config/searchConfigs'

export type GlobalSearchDomain =
  | 'product'
  | 'shop'
  | 'user'
  | 'brand'
  | 'color'
  | 'size'
  | 'category'
  | 'payment'
  | 'order'
  | 'announcement-type'
  | 'announcement'
  | 'promotion'
  | 'navigation'

export type GlobalSearchItem = {
  key: string
  label: string
  subtitle?: string
  to: string
  domain: GlobalSearchDomain
}

export type GlobalSearchSection = {
  id: string
  label: string
  items: GlobalSearchItem[]
}

export type GlobalSearchOptions = {
  userId?: string | null
  activeShopId?: string | null
}

export type SearchHit = {
  id: string
  label: string
  subtitle?: string
}

type SearchSectionConfig = {
  domain: GlobalSearchDomain
  label: string
  fetch: (
    query: string,
    opts: GlobalSearchOptions,
    signal?: AbortSignal,
  ) => Promise<SearchHit[]>
  makeTo: (hit: SearchHit) => string
  itemKey?: string
  itemLabel?: string
  itemTo?: string
}

function collectSearchConfigs(menuSections: DashboardMenuSection[]): SearchSectionConfig[] {
  const configs: SearchSectionConfig[] = []
  
  for (const section of menuSections) {
    for (const item of section.items) {
      if (item.search?.enabled) {
        const searchConfig = item.search
        configs.push({
          domain: searchConfig.domain as GlobalSearchDomain,
          label: searchConfig.domain === 'navigation' ? 'Navigation' : searchConfig.domain.charAt(0).toUpperCase() + searchConfig.domain.slice(1).replace('-', ' '),
          fetch: searchConfig.fetch,
          makeTo: searchConfig.makeTo,
          itemKey: item.key,
          itemLabel: item.label,
          itemTo: item.to,
        })
      }
      if (item.children) {
        for (const child of item.children) {
          if (child.search?.enabled) {
            const searchConfig = child.search
            configs.push({
              domain: searchConfig.domain as GlobalSearchDomain,
              label: searchConfig.domain === 'navigation' ? 'Navigation' : searchConfig.domain.charAt(0).toUpperCase() + searchConfig.domain.slice(1).replace('-', ' '),
              fetch: searchConfig.fetch,
              makeTo: searchConfig.makeTo,
              itemKey: child.key,
              itemLabel: child.label,
              itemTo: child.to,
            })
          }
        }
      }
    }
  }
  
  return configs
}

export async function searchGlobalData(
  query: string,
  menuSections: DashboardMenuSection[],
  opts: GlobalSearchOptions = {},
  signal?: AbortSignal,
): Promise<GlobalSearchSection[]> {
  const configs = collectSearchConfigs(menuSections)
  const lowerQuery = query.trim().toLowerCase()
  
  const sections = await Promise.all(
    configs.map(async (config) => {
      let hits: SearchHit[] = []
      
      if (config.domain === 'navigation' && config.itemLabel) {
        // Navigation search: match query against menu item label
        if (config.itemLabel.toLowerCase().includes(lowerQuery)) {
          hits = [{
            id: config.itemKey || 'nav',
            label: config.itemLabel,
            subtitle: config.itemTo,
          }]
        }
      } else {
        // Regular API search
        hits = await config.fetch(query, opts, signal).catch(() => [] as SearchHit[])
      }
      
      return {
        id: config.domain,
        label: config.label,
        items: hits.map((hit) => ({
          key: `${config.domain}-${hit.id}`,
          label: hit.label,
          ...(hit.subtitle ? { subtitle: hit.subtitle } : {}),
          to: config.makeTo(hit),
          domain: config.domain,
        })),
      }
    }),
  )
  return sections.filter((section) => section.items.length > 0)
}