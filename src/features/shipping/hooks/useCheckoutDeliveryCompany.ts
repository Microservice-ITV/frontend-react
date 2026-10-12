import { useEffect, useMemo, useState } from 'react'
import { shippingApi } from '../api/shippingApi'
import { accountingClient } from '@/lib/api/accountingClient'

export type CheckoutDeliveryCompany = {
  id: string
  code: string
  name: string
  description: string | null
  logoUrl: string | null
  status: 'ACTIVE' | 'INACTIVE'
}

export type ShopDistrictRoute = {
  shopId: string
  fromDistrictId: string
  toDistrictId: string
}

type DistrictRouteAvailability = {
  calculationMethod: 'CITY_ROUTE' | 'REAL_ROUTE' | null
  availableCompanyIds: string[] | null
}
const STORAGE_KEY = 'dni.checkout.deliveryCompanyByShop'
const LEGACY_STORAGE_KEY = 'dni.checkout.deliveryCompanyId'

function readStoredMap(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    const out: Record<string, string> = {}
    for (const [shopId, companyId] of Object.entries(parsed)) {
      if (typeof companyId === 'string' && companyId.trim()) out[shopId] = companyId
    }
    return out
  } catch {
    return {}
  }
}

function readLegacyId(): string {
  try {
    return sessionStorage.getItem(LEGACY_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function writeStoredMap(map: Record<string, string>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

function pairKey(fromDistrictId: string, toDistrictId: string) {
  return `${fromDistrictId}|${toDistrictId}`
}

function readAvailability(data: unknown): DistrictRouteAvailability {
  const root = data && typeof data === 'object' ? (data as { data?: unknown }).data ?? data : null
  const body = root && typeof root === 'object' ? (root as Record<string, unknown>) : {}
  const method = body.calculationMethod === 'CITY_ROUTE' || body.calculationMethod === 'REAL_ROUTE'
    ? body.calculationMethod
    : null
  const availableCompanyIds = Array.isArray(body.availableCompanyIds)
    ? body.availableCompanyIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    : null
  return { calculationMethod: method, availableCompanyIds }
}

export function useCheckoutDeliveryCompany(shopIds: string[], routes: ShopDistrictRoute[]) {
  const [companies, setCompanies] = useState<CheckoutDeliveryCompany[]>([])
  const [selectedByShopId, setSelectedByShopId] = useState(readStoredMap)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [configurationError, setConfigurationError] = useState('')
  const [configuredCompanyIdsByShop, setConfiguredCompanyIdsByShop] = useState<Record<string, string[]>>({})
  const [configurationsReady, setConfigurationsReady] = useState(false)
  const [routesReady, setRoutesReady] = useState(false)
  const [availableByPair, setAvailableByPair] = useState<Record<string, string[] | null>>({})
  const shopKey = useMemo(() => [...shopIds].sort().join('|'), [shopIds])
  const routeKey = useMemo(
    () => routes.map((route) => `${route.shopId}:${route.fromDistrictId}:${route.toDistrictId}`).sort().join('|'),
    [routes],
  )

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await shippingApi.listActiveDeliveryCompanies()
        const body = res.data as { data?: { companies?: CheckoutDeliveryCompany[] } }
        const rows = body.data?.companies ?? []
        if (!cancelled) {
          setCompanies(rows)
        }
      } catch {
        if (!cancelled) setError('Delivery companies could not be loaded.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setConfigurationsReady(false)
    setConfigurationError('')

    if (shopIds.length === 0) {
      setConfiguredCompanyIdsByShop({})
      setConfigurationsReady(true)
      return () => {
        cancelled = true
      }
    }

    const loadConfigurations = async () => {
      try {
        const entries = await Promise.all(
          shopIds.map(async (shopId) => {
            const response = await accountingClient.get<{
              configurations?: Array<{ deliveryCompanyId?: unknown }>
            }>(`/delivery-company-configurations/shops/${encodeURIComponent(shopId)}/checkout`)
            const configurations = response.data.configurations
            if (!Array.isArray(configurations)) {
              throw new Error('Accounting returned an invalid shop Delivery Company configuration response')
            }

            return [
              shopId,
              configurations
                .map((configuration) => configuration.deliveryCompanyId)
                .filter((id): id is string => typeof id === 'string' && id.trim() !== ''),
            ] as const
          }),
        )

        if (cancelled) return
        setConfiguredCompanyIdsByShop(Object.fromEntries(entries))
      } catch {
        if (cancelled) return
        setConfiguredCompanyIdsByShop({})
        setConfigurationError('Delivery companies could not be verified for each shop. Please try again.')
      } finally {
        if (!cancelled) setConfigurationsReady(true)
      }
    }

    void loadConfigurations()
    return () => {
      cancelled = true
    }
  }, [shopKey, shopIds])

  useEffect(() => {
    if (loading) return
    let cancelled = false
    setRoutesReady(false)

    const loadRoutes = async () => {
      const pairs = new Map<string, { fromDistrictId: string; toDistrictId: string }>()
      for (const route of routes) {
        pairs.set(pairKey(route.fromDistrictId, route.toDistrictId), {
          fromDistrictId: route.fromDistrictId,
          toDistrictId: route.toDistrictId,
        })
      }

      if (pairs.size === 0) {
        if (!cancelled) {
          setAvailableByPair({})
          setRoutesReady(true)
        }
        return
      }

      try {
        const entries = await Promise.all(
          [...pairs.entries()].map(async ([key, pair]) => {
            const res = await shippingApi.districtRouteAvailability(pair.fromDistrictId, pair.toDistrictId)
            return [key, readAvailability(res.data)] as const
          }),
        )
        if (cancelled) return

        const next: Record<string, string[] | null> = {}
        for (const [key, availability] of entries) {
          next[key] = availability.availableCompanyIds
        }
        setAvailableByPair(next)
      } catch {
        if (!cancelled) setAvailableByPair({})
      } finally {
        if (!cancelled) setRoutesReady(true)
      }
    }

    void loadRoutes()
    return () => {
      cancelled = true
    }
  }, [loading, routeKey, routes])

  const unavailableCompanyIdsByShop = useMemo(() => {
    const out: Record<string, string[]> = {}
    if (!routesReady || !configurationsReady) return out
    for (const shopId of shopIds) {
      const configuredIds = new Set(configuredCompanyIdsByShop[shopId] ?? [])
      const route = routes.find((candidate) => candidate.shopId === shopId)
      const available = route
        ? availableByPair[pairKey(route.fromDistrictId, route.toDistrictId)]
        : null
      const routeAvailableIds = available == null ? null : new Set(available)
      out[shopId] = companies
        .filter((company) =>
          !configuredIds.has(company.id) ||
          (routeAvailableIds !== null && !routeAvailableIds.has(company.id)),
        )
        .map((company) => company.id)
    }
    return out
  }, [availableByPair, companies, configuredCompanyIdsByShop, configurationsReady, routeKey, routes, routesReady, shopIds])

  useEffect(() => {
    if (loading || !routesReady || !configurationsReady || companies.length === 0 || shopIds.length === 0) return

    setSelectedByShopId((current) => {
      const next = { ...current }
      let changed = false
      for (const shopId of shopIds) {
        const blocked = new Set(unavailableCompanyIdsByShop[shopId] ?? [])
        const availableCompanies = companies.filter((company) => !blocked.has(company.id))
        const preferred =
          availableCompanies.find((company) => company.id === readLegacyId())?.id ??
          availableCompanies[0]?.id ??
          ''
        const currentId = next[shopId]
        const currentIsUsable = Boolean(currentId) && availableCompanies.some((company) => company.id === currentId)
        if (!currentIsUsable && next[shopId] !== preferred) {
          next[shopId] = preferred
          changed = true
        }
      }
      if (!changed) return current
      writeStoredMap(next)
      return next
    })
  }, [companies, configurationsReady, loading, routesReady, shopIds, shopKey, unavailableCompanyIdsByShop])

  const selectCompany = (shopId: string, companyId: string) => {
    if ((unavailableCompanyIdsByShop[shopId] ?? []).includes(companyId)) return
    setSelectedByShopId((current) => {
      if (current[shopId] === companyId) return current
      const next = { ...current, [shopId]: companyId }
      writeStoredMap(next)
      return next
    })
  }

  const selectionSettled = useMemo(() => {
    if (!routesReady || !configurationsReady || loading) return false
    if (shopIds.length === 0) return true
    if (companies.length === 0) return false
    return shopIds.every((shopId) => {
      const blocked = new Set(unavailableCompanyIdsByShop[shopId] ?? [])
      const available = companies.filter((company) => !blocked.has(company.id))
      const selected = selectedByShopId[shopId]
      if (available.length === 0) return !selected
      return Boolean(selected && available.some((company) => company.id === selected))
    })
  }, [companies, configurationsReady, loading, routesReady, selectedByShopId, shopIds, unavailableCompanyIdsByShop])

  const companyByShopId = useMemo(() => {
    const next: Record<string, string> = {}
    if (!configurationsReady || !routesReady) return next

    for (const shopId of shopIds) {
      const companyId = selectedByShopId[shopId]
      if (companyId && !(unavailableCompanyIdsByShop[shopId] ?? []).includes(companyId)) {
        next[shopId] = companyId
      }
    }
    return next
  }, [configurationsReady, routesReady, selectedByShopId, shopIds, unavailableCompanyIdsByShop])

  return {
    companies,
    selectedByShopId,
    companyByShopId,
    unavailableCompanyIdsByShop,
    routesReady: routesReady && configurationsReady && selectionSettled,
    loading,
    error: error || configurationError,
    selectCompany,
  }
}
