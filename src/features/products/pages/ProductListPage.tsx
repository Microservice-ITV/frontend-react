import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchProductsByCategory } from '@/features/products/store/productThunks'
import ProductSidebar from '../components/ProductSidebar'
import ProductSortBar from '../components/ProductSortBar'
import ProductGrid from '../components/ProductGrid'

const ProductListPage = () => {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const { items, status } = useAppSelector((s) => s.products)
  const categories = useAppSelector((s) => s.categories.items)

  const category = categories.find((c) => c.id === id)

  useEffect(() => {
    if (id) {
      dispatch(fetchProductsByCategory(id))
    }
  }, [dispatch, id])

  return (
    <div className="bg-[#f5f5f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-4">

          {/* LEFT SIDEBAR */}
          <aside className="w-[240px] shrink-0 hidden md:block">
            <ProductSidebar activeCategoryId={id} />
          </aside>

          {/* RIGHT CONTENT */}
          <section className="flex-1">
            <ProductSortBar />

            {status === 'loading' && (
              <div className="py-10 text-center text-sm text-gray-500">
                Loading products...
              </div>
            )}

            {status === 'succeeded' && (
              <ProductGrid products={items} />
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default ProductListPage