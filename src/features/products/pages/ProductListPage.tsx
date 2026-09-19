import { useState, useEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchProductsByCategory } from '@/features/products/store/productThunks'
import { fetchCategories } from '@/features/categories/store/categoryThunks'
import ProductSidebar from '../components/ProductSidebar'
import ProductSortBar from '../components/ProductSortBar'
import ProductGrid from '../components/ProductGrid'
import Pagination from '@/components/ui/Pagination'
import { normalizeProductSort, type ProductSortKey } from '../utils/productSort'

const PAGE_SIZE = 12

const ProductListPage = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const { items, status } = useAppSelector((s) => s.products)
  const { items: categories, status: categoriesStatus } = useAppSelector((s) => s.categories)
  const [sort, setSort] = useState<ProductSortKey>(() => normalizeProductSort(searchParams.get('sort')))
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const nextSort = normalizeProductSort(searchParams.get("sort"));
    setSort(nextSort);
  }, [searchParams]);

  useEffect(() => {
    if (categoriesStatus === "idle" || categories.length === 0) {
      void dispatch(fetchCategories());
    }
  }, [categoriesStatus, categories.length, dispatch]);

  useEffect(() => {
    if (id) {
      dispatch(fetchProductsByCategory({ categoryId: id, sort }))
      setCurrentPage(1)
    }
  }, [dispatch, id, sort]);

  const handleSortChange = (nextSort: ProductSortKey) => {
    setSort(nextSort);
    const next = new URLSearchParams(searchParams);
    next.set("sort", nextSort);
    setSearchParams(next, { replace: true });
  };

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pagedProducts = useMemo(
    () => items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [items, safePage],
  )
  const pageStart = items.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const pageEnd = Math.min(safePage * PAGE_SIZE, items.length)

  return (
    <div className="bg-[#f5f5f5] h-[calc(100vh-140px)] overflow-hidden">
      {/* Inline style to hide scrollbars universally across Chrome, Safari, Firefox, and Edge */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 h-full">
        <div className="flex items-start gap-4 h-full">
          {/* Sidebar with scrollbar hidden */}
          <aside className="w-[240px] shrink-0 hidden md:block h-full overflow-y-auto no-scrollbar">
            <ProductSidebar activeCategoryId={id} />
          </aside>

          {/* Main section with scrollbar hidden */}
          <section className="flex-1 min-w-0 h-full overflow-y-auto no-scrollbar pr-1 flex flex-col">
            {/* Sort Bar: Sticky on desktop with a small bottom padding overlay to prevent any visual gap */}
              <ProductSortBar sort={sort} onSortChange={handleSortChange} />

            {status === "loading" && (
              <div className="py-10 text-center text-sm text-gray-500">
                Loading products...
              </div>
            )}

            {status === 'succeeded' && (
              <>
                <ProductGrid products={pagedProducts} />

                {totalPages > 1 && (
                  <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                    <p className="text-xs text-slate-600">
                      Showing {pageStart}-{pageEnd} of {items.length} products
                    </p>
                    <Pagination
                      page={safePage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      className="justify-center sm:justify-end"
                    />
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;
