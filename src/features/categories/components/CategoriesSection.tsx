import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchCategories } from '@/features/categories/store/categoryThunks'
import CategoryGrid from './CategoryGrid'

const CategoriesSection = () => {
  const dispatch = useAppDispatch()
  const { items, status } = useAppSelector((s) => s.categories)

  useEffect(() => {
    if (status === 'idle') {
      void dispatch(fetchCategories())
    }
  }, [dispatch, status])

  return (
    <section>
      <h2 className="mb-4 text-base uppercase font-semibold text-gray-500">
        Categories
      </h2>

      {status === 'loading' && (
        <div className="text-sm text-gray-500">Loading categories...</div>
      )}

      {status === 'failed' && (
        <div className="text-sm text-red-500">
          Failed to load categories. Please try again later.
        </div>
      )}

      {status === 'succeeded' && <CategoryGrid items={items} />}
    </section>
  )
}

export default CategoriesSection
