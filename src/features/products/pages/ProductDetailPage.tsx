import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchProductDetail } from '@/features/products/store/productThunks'
import { clearSelectedProduct } from '@/features/products/store/productSlice'

import ProductBreadcrumb from '../components/ProductBreadcrumb'
import ProductGallery from '../components/ProductGallery'
import ProductInfo from '../components/ProductInfo'

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()

  const { selectedProduct, status } = useAppSelector(
    (state) => state.products
  )

  useEffect(() => {
    if (id) dispatch(fetchProductDetail(id))

    return () => {
      dispatch(clearSelectedProduct())
    }
  }, [id, dispatch])

  if (status === 'loading' || !selectedProduct) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="bg-[#f5f5f5] min-h-screen">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
        <ProductBreadcrumb product={selectedProduct} />

        <section className="bg-white rounded-sm p-3 sm:p-4 flex flex-col lg:flex-row gap-4 lg:gap-6">
          <ProductGallery images={selectedProduct.images} />
          <ProductInfo product={selectedProduct} />
        </section>
      </div>
    </div>
  )
}

export default ProductDetailPage