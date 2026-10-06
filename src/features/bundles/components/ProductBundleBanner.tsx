import { useEffect, useState } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { bundleApi } from '../api/bundleApi'
import { addBundleProducts } from '../lib/addBundleProducts'
import BundlePromoBanner, { type BundlePromoModel } from './BundlePromoBanner'

const ProductBundleBanner = ({ productId }: { productId: string }) => {
  const dispatch = useAppDispatch()
  const [bundles, setBundles] = useState<BundlePromoModel[]>([])
  const [addingId, setAddingId] = useState('')

  useEffect(() => {
    let cancelled = false
    void bundleApi.storefront({ productId, kind: 'FIXED', limit: 6 }).then((rows) => {
      if (cancelled) return
      setBundles(rows.filter((row) => row.kind === 'FIXED').map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        bundlePrice: row.bundlePrice ?? 0,
        individualTotal: row.individualTotal ?? 0,
        savings: row.savings ?? 0,
        items: row.items.filter((item) => item.role === 'INCLUDED').map((item) => ({
          productId: item.productId,
          name: item.product?.name || 'Product',
          image: item.product?.image ?? null,
          price: item.product?.price ?? 0,
        })),
      })))
    }).catch(() => {
      if (!cancelled) setBundles([])
    })
    return () => {
      cancelled = true
    }
  }, [productId])

  return (
    <BundlePromoBanner
      bundles={bundles}
      addingId={addingId}
      onAdd={(bundle, productIds) => {
        const rows = bundle.items
          .filter((item) => productIds.includes(item.productId))
          .map((item) => ({ productId: item.productId, quantity: 1 }))
        if (rows.length === 0) return
        setAddingId(bundle.id)
        void addBundleProducts(dispatch, rows).finally(() => setAddingId(''))
      }}
    />
  )
}

export default ProductBundleBanner
