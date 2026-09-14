import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchProductDetail } from '@/features/products/store/productThunks'
import { clearSelectedProduct } from '@/features/products/store/productSlice'
import type { ProductVariant } from '@/features/products/types/productTypes'
import { getGalleryImagesForVariant } from '@/features/products/utils/variantGallery'

import ProductBreadcrumb from '../components/ProductBreadcrumb'
import ProductDescriptionSection from '../components/ProductDescriptionSection'
import ProductGallery from '../components/ProductGallery'
import ProductInfo from '../components/ProductInfo'
import { pickDefaultVariant } from '../components/ProductVariantSelector'

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const flashDealItemId = searchParams.get('flashDealItemId') ?? undefined
  const dispatch = useAppDispatch()

  const { selectedProduct, status, error } = useAppSelector((state) => state.products)
  const [galleryVariant, setGalleryVariant] = useState<ProductVariant | null>(null)

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
            flashDealItemId={flashDealItemId}
          />
        </section>

        <ProductDescriptionSection product={selectedProduct} />
      </div>
    </div>
  )
}

export default ProductDetailPage