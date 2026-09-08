import { Link } from 'react-router-dom'
import type { Category } from '../types/categoryTypes'

interface Props {
  items: Category[]
}

const CategoryGrid = ({ items }: Props) => (
  <div className="overflow-x-auto md:overflow-visible">
    <ul className="flex md:grid gap-4 snap-x snap-mandatory md:snap-none md:grid-cols-5 lg:grid-cols-10">
      {items.slice(0, 20).map((cat) => (
        <li key={cat.id} className="snap-start shrink-0 md:shrink w-[110px] md:w-full">
          <Link
            to={`/categories/${cat.id}`}
            className="
              group flex flex-col items-center px-3 py-4 h-full rounded-lg bg-white border 
              border-gray-100 transition-all duration-200 hover:border-emerald-200 hover:shadow-md
              focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <div className="w-20 h-20 flex items-center justify-center mb-2">
              {cat.image ? (
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-400">No Image</span>
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-gray-800 text-center line-clamp-2 leading-tight">
              {cat.name}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  </div>
)

export default CategoryGrid