import { Link } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'

interface Props {
    activeCategoryId?: string
}

const ProductSidebar = ({ activeCategoryId }: Props) => {
    const categories = useAppSelector((s) => s.categories.items)

    return (
        <div className="bg-white rounded-sm border border-gray-200">
            <div className="px-4 py-3 font-semibold text-sm border-b">
                All Categories
            </div>

            <ul className="py-2">
                {categories.map((cat) => {
                    const isActive = cat.id === activeCategoryId

                    return (
                        <li key={cat.id}>
                            <Link
                                to={`/categories/${cat.id}`}
                                className={`
                                    flex items-center px-4 py-2 text-sm
                                    ${isActive ? 'text-orange-600 font-medium' : 'text-gray-700'}
                                    hover:text-orange-600
                                    `}
                            >
                                <span className="mr-2">▸</span>
                                {cat.name}
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

export default ProductSidebar