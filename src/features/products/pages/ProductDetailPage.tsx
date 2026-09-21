import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchProductDetail } from '@/features/products/store/productThunks'
import { clearSelectedProduct } from '@/features/products/store/productSlice'
import type { ProductVariant } from '@/features/products/types/productTypes'
import { getGalleryImagesForVariant } from '@/features/products/utils/variantGallery'
import type { FlashDealPromoContext } from '@/features/flash-deals/types/flashDealTypes'
import { getFlashDealsByTimeSlot } from '@/lib/api/flashDealClient'

import ProductBreadcrumb from '../components/ProductBreadcrumb'
import ProductDescriptionSection from '../components/ProductDescriptionSection'
import ProductGallery from '../components/ProductGallery'
import ProductInfo from '../components/ProductInfo'
import { pickDefaultVariant } from '../components/ProductVariantSelector'

const isFlashDealPromo = (value: unknown): value is FlashDealPromoContext =>
  Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as FlashDealPromoContext).flashDealId === 'string' &&
      Number.isFinite(Number((value as FlashDealPromoContext).discount)),
  )

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const location = useLocation()

  const { selectedProduct, status, error } = useAppSelector((state) => state.products)
  const [galleryVariant, setGalleryVariant] = useState<ProductVariant | null>(null)
  const [fallbackPromo, setFallbackPromo] = useState<FlashDealPromoContext>()

  const flashDealPromo = useMemo(() => {
    const state = (location.state ?? null) as Record<string, unknown> | null
    const value = state && typeof state === 'object' ? state.flashDealPromo : null
    return isFlashDealPromo(value) ? value : undefined
  }, [location.state])

  useEffect(() => {
    if (flashDealPromo || !id) return
    let cancelled = false
    const resolveActiveDeal = async () => {
      try {
        const res = await getFlashDealsByTimeSlot({ limit: 100, status: 'all' })
        if (cancelled) return
        const now = Date.now()
        const match = (res.data.items ?? []).find((item) => {
          if (item.productId !== id || item.soldOut) return false
          const start = item.startAt ? new Date(item.startAt).getTime() : Number.NEGATIVE_INFINITY
          const end = item.endAt ? new Date(item.endAt).getTime() : Number.POSITIVE_INFINITY
          if (Number.isNaN(start) || Number.isNaN(end)) return false
          return now >= start && now <= end
        })
        if (!match) return
        setFallbackPromo({
          flashDealId: match.flashDealId,
          flashDealItemId: match.id ?? null,
          originalPrice: Number(match.originalPrice) || 0,
          promoPrice: Number(match.dealPrice) || 0,
          discount: Number(match.discount) || 0,
          startAt: match.startAt ?? null,
          endAt: match.endAt ?? null,
        })
      } catch {
        // promo resolution is best-effort; keep original pricing when it fails
      }
    }
    void resolveActiveDeal()
    return () => {
      cancelled = true
    }
  }, [id, flashDealPromo])

  const appliedPromo = flashDealPromo ?? fallbackPromo

  const onGalleryVariantChange = useCallback((v: ProductVariant | null) => {
    setGalleryVariant(v)
  }, [])

  const galleryImages = useMemo(() => {
    if (!selectedProduct) return []
    const variantForGallery =
      galleryVariant &&
        selectedProduct.variants.some((x) => x.variantId === galleryVariant.variantId)
        ? galleryVariant
        : pickDefaultVariant(selectedProduct.variants)
    return getGalleryImagesForVariant(selectedProduct.images, variantForGallery)
  }, [selectedProduct, galleryVariant])

  useEffect(() => {
    if (id) dispatch(fetchProductDetail(id))

    return () => {
      dispatch(clearSelectedProduct())
    }
  }, [id, dispatch])

  if (!id) {
    return (
      <div className="bg-[#f5f5f5] min-h-screen p-6">
        <p className="text-sm text-red-600">Invalid product link.</p>
        <Link to="/" className="mt-2 inline-block text-sm text-emerald-700 underline">
          Back to home
        </Link>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="bg-[#f5f5f5] min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <p className="text-sm text-red-600">{error ?? 'Failed to load product.'}</p>
          <Link to="/" className="mt-4 inline-block text-sm text-emerald-700 underline">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  const loading = status === 'loading' || !selectedProduct || selectedProduct.id !== id

  if (loading) {
    return (
      <div className="bg-[#f5f5f5] min-h-screen p-6">
        <p className="text-sm text-gray-600">Loading product…</p>
      </div>
    )
  }

  return (
    <div className="bg-[#f5f5f5] min-h-screen">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
        <ProductBreadcrumb product={selectedProduct} />

        <section className="bg-white rounded-sm p-3 sm:p-4 flex flex-col lg:flex-row gap-4 lg:gap-6">
          <ProductGallery images={galleryImages} />
          <ProductInfo
            product={selectedProduct}
            onSelectedVariantChange={onGalleryVariantChange}
            flashDeal={appliedPromo}
          />
        </section>

        <ProductDescriptionSection product={selectedProduct} />
      </div>
    </div>
  )
}

export default ProductDetailPage