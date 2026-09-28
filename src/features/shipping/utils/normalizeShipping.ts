import type { ShopShippingProfileRow, ShopCalculatedShipping } from '../types/shippingTypes'

function num(v: unknown): number | null {
    if (v === null || v === undefined || v === '') return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
}

function textOrNull(v: unknown): string | null {
    if (typeof v !== 'string') return null
    const trimmed = v.trim()
    return trimmed || null
}

function calculationMethodOf(v: unknown): 'REAL_ROUTE' | 'CITY_ROUTE' | undefined {
    if (v === 'REAL_ROUTE' || v === 'CITY_ROUTE') return v
    return undefined
}

/** Turn batch API JSON into a map by shopId (tolerates several response shapes). */
export function normalizeBatchShopProfiles(data: unknown): Record<string, ShopShippingProfileRow> {
    const out: Record<string, ShopShippingProfileRow> = {}
    if (data === null || data === undefined) return out

    let list: unknown[] = []
    const root = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {}

    if (Array.isArray(data)) {
        list = data
    } else if (Array.isArray(root.shops)) {
        list = root.shops as unknown[]
    } else if (Array.isArray(root.data)) {
        list = root.data as unknown[]
    } else if (root.data && typeof root.data === 'object' && Array.isArray((root.data as Record<string, unknown>).shops)) {
        list = ((root.data as Record<string, unknown>).shops as unknown[]) ?? []
    }

    for (const row of list) {
        if (!row || typeof row !== 'object') continue
        const r = row as Record<string, unknown>
        const shopId = String(r.shopId ?? r.shop_id ?? r.id ?? '').trim()
        if (!shopId) continue

        const defaultFee = num(
            r.estimatedFee ?? r.standardShippingFee ?? r.defaultFee ?? r.shippingFee ?? r.fee,
        )
        const freeShippingMin = num(
            r.freeShippingMinimum ?? r.minOrderForFreeShipping ?? r.freeShippingThreshold ?? r.minSubtotalForFreeShipping,
        )

        const hint =
            typeof r.hint === 'string'
                ? r.hint
                : typeof r.description === 'string'
                  ? r.description
                  : typeof r.message === 'string'
                    ? r.message
                    : undefined

        out[shopId] = {
            shopId,
            hint,
            defaultFee,
            freeShippingMin,
            raw: row,
        }
    }

    return out
}

/** Extract per-shop shipping fee + label from calculate API (best-effort). */
export function normalizeCalculateResponse(data: unknown): {
    byShopId: Record<string, ShopCalculatedShipping>
    totalShippingFee: number | null
    raw: unknown
} {
    const byShopId: Record<string, ShopCalculatedShipping> = {}
    if (data === null || data === undefined)
        return { byShopId, totalShippingFee: null, raw: data }

    const root = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {}
    let list: unknown[] = []
    let totalShippingFee = num(root.totalShippingFee)
    let rootMethod = calculationMethodOf(root.calculationMethod)

    if (Array.isArray(data)) {
        list = data
    } else if (Array.isArray(root.shops)) {
        list = root.shops as unknown[]
    } else if (Array.isArray(root.results)) {
        list = root.results as unknown[]
    } else if (root.data && typeof root.data === 'object') {
        const d = root.data as Record<string, unknown>
        if (totalShippingFee == null) totalShippingFee = num(d.totalShippingFee)
        if (!rootMethod) rootMethod = calculationMethodOf(d.calculationMethod)
        if (Array.isArray(d.shops)) list = d.shops as unknown[]
        else if (Array.isArray(d.results)) list = d.results as unknown[]
    }

    for (const row of list) {
        if (!row || typeof row !== 'object') continue
        const r = row as Record<string, unknown>
        const shopId = String(r.shopId ?? r.shop_id ?? '').trim()
        if (!shopId) continue

        const amount = num(
            r.shippingFee ?? r.fee ?? r.amount ?? r.totalShipping ?? r.calculatedFee ?? r.price,
        )
        const deliveryStatusRaw =
            typeof r.deliveryStatus === 'string' ? r.deliveryStatus.trim().toUpperCase() : ''
        const deliveryStatus =
            deliveryStatusRaw === 'NOT_DELIVERABLE'
                ? ('NOT_DELIVERABLE' as const)
                : deliveryStatusRaw === 'DELIVERABLE'
                  ? ('DELIVERABLE' as const)
                  : amount != null
                    ? ('DELIVERABLE' as const)
                    : undefined
        const currency =
            typeof r.currency === 'string' && r.currency.trim() ? r.currency.trim() : undefined
        const calculationMethod = calculationMethodOf(r.calculationMethod) ?? rootMethod
        const fromCityId = textOrNull(r.fromCityId ?? r.from_city_id)
        const toCityId = textOrNull(r.toCityId ?? r.to_city_id)
        const estimatedDays = num(r.estimatedDays)
        const methodLabel =
            typeof r.method === 'string'
                ? r.method
                : typeof r.methodName === 'string'
                  ? r.methodName
                  : typeof r.optionName === 'string'
                    ? r.optionName
                    : typeof r.label === 'string'
                      ? r.label
                      : undefined
        const etaHint =
            typeof r.estimatedDelivery === 'string'
                ? r.estimatedDelivery
                : typeof r.eta === 'string'
                  ? r.eta
                  : estimatedDays != null && estimatedDays > 0
                    ? `Estimated ${estimatedDays} business day${estimatedDays === 1 ? '' : 's'}`
                    : undefined

        byShopId[shopId] = {
            shopId,
            amount: deliveryStatus === 'NOT_DELIVERABLE' ? 0 : amount,
            deliveryStatus,
            currency,
            calculationMethod,
            fromCityId,
            toCityId,
            methodLabel,
            etaHint,
            estimatedDays,
            distanceKm: num(r.distanceKm),
            actualWeightKg: num(r.actualWeightKg),
            volumetricWeightKg: num(r.volumetricWeightKg),
            chargeableWeightKg: num(r.chargeableWeightKg),
            baseFee: num(r.baseFee),
            distanceFee: num(r.distanceFee),
            weightFee: num(r.weightFee),
            raw: row,
        }
    }

    return { byShopId, totalShippingFee, raw: data }
}

export function formatProfileShippingLine(profile: ShopShippingProfileRow | undefined): string {
    if (!profile) {
        return 'Shipping fees are estimated at checkout.'
    }
    if (profile.hint?.trim()) return profile.hint.trim()

    const parts: string[] = []
    if (profile.defaultFee != null && profile.defaultFee > 0) {
        parts.push(`From $${profile.defaultFee.toFixed(2)}`)
    }
    if (profile.freeShippingMin != null && profile.freeShippingMin > 0) {
        parts.push(`Free shipping on orders from $${profile.freeShippingMin.toFixed(2)}`)
    }
    if (parts.length > 0) return parts.join(' · ')
    return 'Shipping fees are estimated at checkout.'
}