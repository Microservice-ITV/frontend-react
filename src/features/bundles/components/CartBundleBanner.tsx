import { useEffect, useState } from 'react'
import { useAppDispatch } from '@/app/hooks'
import type { CartItem } from '@/features/cart/types/cartTypes'
import { bundleApi } from '../api/bundleApi'
import { addBundleProducts } from '../lib/addBundleProducts'
import type { BundleMatchResult, BundleOffer } from '../types/bundleTypes'
import BundlePromoBanner, { type BundlePromoModel } from './BundlePromoBanner'

interface CartBundleBannerProps {
  items: CartItem[]
  onMatch?: (match: BundleMatchResult | null) => void
  allowAdd?: boolean
}

const toModel = (offer: BundleOffer): BundlePromoModel => ({
  id: offer.bundle_id,
  title: offer.title,
  description: offer.description,
  bundlePrice: offer.bundle_price ?? 0,
  individualTotal: offer.individual_total,
  savings: offer.savings,
  complete: offer.complete,
  items: offer.items.map((item) => ({
    productId: item.product_id,
    name: item.name,
    image: item.image,
    price: item.price,
    inCart: item.in_cart,
  })),
})

const CartBundleBanner = ({ items, onMatch, allowAdd = true }: CartBundleBannerProps) => {
  const dispatch = useAppDispatch()
  const [offers, setOffers] = useState<BundleOffer[]>([])
  const [addingId, setAddingId] = useState('')
  const [readyIds, setReadyIds] = useState<string[]>([])
  const signature = items.map((item) => `${item.productId}:${item.shopId}:${item.price}:${item.quantity}:${item.selected}`).join('|')

  useEffect(() => {
    if (!signature) {
      setOffers([])
      onMatch?.(null)
      return
    }
    let cancelled = false
    void bundleApi.match(items.map((item) => ({
      product_id: item.productId,
      shop_id: item.shopId,
      unit_price: item.price,
      quantity: item.quantity,
      selected: item.selected,
    }))).then((result) => {
      const nextOffers = (result.offers ?? []).map((offer) => {
        const covered = offer.items.length > 0 && offer.items.every((item) => item.in_cart)
        const savings = Math.max(0, offer.savings ?? 0)
        const complete = offer.complete || (covered && savings > 0)
        return {
          ...offer,
          savings,
          amount: complete ? savings : 0,
          complete,
          sets: 1,
        }
      })
      if (cancelled) return
      setOffers(nextOffers)
      const discounts = nextOffers
        .filter((offer) => offer.complete && offer.savings > 0)
        .map((offer) => ({
          bundle_id: offer.bundle_id,
          title: offer.title,
          kind: 'FIXED' as const,
          shop_id: offer.shop_id,
          amount: offer.savings,
          sets: 1,
        }))
      onMatch?.({
        ...result,
        offers: nextOffers,
        discounts,
        discount_total: discounts.reduce((sum, row) => sum + row.amount, 0),
      })
    }).catch(() => {
      if (!cancelled) {
        setOffers([])
        onMatch?.(null)
      }
    })
    return () => {
      cancelled = true
    }
  }, [signature])

  const applied = offers
    .map((offer) => {
      const model = toModel(offer)
      if (!model.complete && readyIds.includes(model.id)) return { ...model, complete: true }
      return model
    })
    .filter((bundle) => bundle.complete)

  return (
    <BundlePromoBanner
      bundles={applied}
      addingId={addingId}
      onAdd={allowAdd ? (bundle, productIds) => {
        const missing = bundle.items.filter((item) => !item.inCart)
        const rows = missing
          .filter((item) => productIds.includes(item.productId))
          .map((item) => ({ productId: item.productId, quantity: 1 }))
        if (rows.length === 0) return
        const addsTheRest = missing.every((item) => productIds.includes(item.productId))
        if (addsTheRest) setReadyIds((current) => current.includes(bundle.id) ? current : [...current, bundle.id])
        setAddingId(bundle.id)
        void addBundleProducts(dispatch, rows).finally(() => setAddingId(''))
      } : undefined}
    />
  )
}

export default CartBundleBanner
