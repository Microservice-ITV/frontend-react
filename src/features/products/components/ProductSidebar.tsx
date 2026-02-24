import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { allCategoriesIcon, caretRightIcon, arrowDownIcon } from '@/assets/icons'

const INITIAL_VISIBLE = 5

interface Props {
    activeCategoryId?: string
}

const ProductSidebar = ({ activeCategoryId }: Props) => {
    const categories = useAppSelector((s) => s.categories.items)
    const [expanded, setExpanded] = useState(false)

    const visibleCount = expanded ? categories.length : INITIAL_VISIBLE
    const visibleCategories = categories.slice(0, visibleCount)
    const hasMore = categories.length > INITIAL_VISIBLE

    return (
        <div className="bg-white rounded-sm border border-gray-200">
            <Link
                to="/all_categories"
                className="flex items-center gap-2 px-4 py-3 font-semibold text-sm border-b border-gray-200 hover:text-orange-600 transition-colors"
            >
                <img
                    src={allCategoriesIcon}
                    alt=""
                    className="w-4 h-4 shrink-0"
                    aria-hidden
                />
                All Categories
            </Link>

            <ul className="py-2">
                {visibleCategories.map((cat) => {
                    const isActive = cat.id === activeCategoryId
                    return (
                        <li key={cat.id}>
                            <Link
                                to={`/categories/${cat.id}`}
                                className={`
                                    flex items-center px-4 py-2 text-sm
                                    ${isActive ? 'text-orange-600 font-medium' : 'text-gray-700'}
                                    hover:text-orange-600 transition-colors
                                `}
                            >
                                <img
                                    src={caretRightIcon}
                                    alt=""
                                    className="w-1.5 h-2.5 shrink-0 mr-2"
                                    aria-hidden
                                />
                                {cat.name}
                            </Link>
                        </li>
                    )
                })}
            </ul>

            {hasMore && (
                <div className="border-t border-gray-100 px-4 py-2">
                    <button
                        type="button"
                        onClick={() => setExpanded((e) => !e)}
                        className="flex items-center justify-center w-full py-1.5 text-sm text-gray-600 hover:text-orange-600 transition-colors cursor-pointer"
                    >
                        {expanded ? (
                            <>
                                Less
                                <img
                                    src={arrowDownIcon}
                                    alt=""
                                    className="w-3 h-3 shrink-0 ml-1 rotate-180"
                                    aria-hidden
                                />
                            </>
                        ) : (
                            <>
                                More
                                <img
                                    src={arrowDownIcon}
                                    alt=""
                                    className="w-3 h-3 shrink-0 ml-1"
                                    aria-hidden
                                />
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    )
}

export default ProductSidebar