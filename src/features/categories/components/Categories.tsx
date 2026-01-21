import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchCategories } from '@/features/categories/store/categoryThunks'

const Categories = () => {
  const dispatch = useAppDispatch()
  const { items, status } = useAppSelector((s) => s.categories)

  useEffect(() => {
    if (status === 'idle') {
      void dispatch(fetchCategories())
    }
  }, [dispatch, status])

  return (
    <section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
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

        {status === 'succeeded' && (
          <div className="overflow-x-auto md:overflow-visible">
            <ul
              className="
            flex md:grid
            gap-0
            snap-x snap-mandatory
            md:snap-none
            md:grid-cols-10 md:grid-rows-2
          "
            >
              {items.slice(0, 20).map((cat) => (
                <li
                  key={cat.id}
                  className="
                snap-start
                shrink-0 md:shrink
                w-[120px] md:w-auto
              "
                >
                  <Link
                    to={`/categories/${cat.id}`}
                    className="
                  group
                  flex flex-col items-center
                  px-4 py-5
                  h-full
                  rounded-sm
                  bg-gray-50
                  border border-gray-200
                  transition-all duration-200
                  hover:bg-white
                  hover:border-gray-200
                  hover:shadow-lg
                "
                  >
                    <div className="w-14 h-14 flex items-center justify-center">
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">No Image</span>
                      )}
                    </div>

                    <span className="mt-3 text-xs text-gray-800 text-center line-clamp-2">
                      {cat.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>

  )
}

export default Categories