import { useEffect, useMemo, useState } from 'react'
import { authClient } from '@/lib/api/authClient'

export type ApprovalPolicyShop = {
  shop_id: string
  shop_name: string
}

export type ApprovalPolicyAccessContext = {
  active_shop?: { shop_id?: string | null; shop_name?: string | null } | null
  shops?: Array<{
    shop_id?: string | null
    shop_name?: string | null
    membership_status?: string | null
  }>
}

type AccessContextResponse = {
  data?: {
    access_context?: ApprovalPolicyAccessContext
  }
}

export const getApprovalPolicyShops = (
  context?: ApprovalPolicyAccessContext,
): ApprovalPolicyShop[] => {
  const activeShop = context?.active_shop
  const shops = context?.shops ?? []
  const byId = new Map<string, ApprovalPolicyShop>()

  for (const shop of shops) {
    const shopId = shop.shop_id?.trim()
    if (!shopId || (shop.membership_status && shop.membership_status.toLowerCase() !== 'active')) {
      continue
    }
    byId.set(shopId, {
      shop_id: shopId,
      shop_name: shop.shop_name?.trim() || 'Shop',
    })
  }

  if (shops.length === 0 && activeShop?.shop_id?.trim()) {
    byId.set(activeShop.shop_id.trim(), {
      shop_id: activeShop.shop_id.trim(),
      shop_name: activeShop.shop_name?.trim() || 'Shop',
    })
  }

  return [...byId.values()]
}

export const getInitialApprovalPolicyShopId = (
  context: ApprovalPolicyAccessContext | undefined,
  shops: ApprovalPolicyShop[],
): string => {
  const activeShopId = context?.active_shop?.shop_id?.trim()
  if (activeShopId && shops.some((shop) => shop.shop_id === activeShopId)) {
    return activeShopId
  }
  return shops.length === 1 ? shops[0].shop_id : ''
}

export const useApprovalPolicyShopContext = () => {
  const [shops, setShops] = useState<ApprovalPolicyShop[]>([])
  const [shopId, setShopId] = useState('')
  const [status, setStatus] = useState<'loading' | 'succeeded' | 'failed'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void authClient.get<AccessContextResponse>('/me/access-context').then((response) => {
      if (!active) return
      const context = response.data.data?.access_context
      const availableShops = getApprovalPolicyShops(context)
      setShops(availableShops)
      setShopId(getInitialApprovalPolicyShopId(context, availableShops))
      setStatus('succeeded')
    }).catch((cause: unknown) => {
      if (!active) return
      setError(cause instanceof Error ? cause.message : 'Unable to load your current shop context.')
      setStatus('failed')
    })
    return () => { active = false }
  }, [])

  const selectedShop = useMemo(
    () => shops.find((shop) => shop.shop_id === shopId) ?? null,
    [shopId, shops],
  )

  return { shops, shopId, setShopId, selectedShop, status, error }
}
