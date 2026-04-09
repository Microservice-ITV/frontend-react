import { Link } from 'react-router-dom'
import { ProductDetail } from '@/features/products/types/productTypes'

interface Props {
    product: ProductDetail
}

const ProductBreadcrumb = ({ product }: Props) => {
    return (
        <nav className="flex items-center text-sm text-gray-500">
            <Link to="/" className="hover:text-blue-600">
                Home
            </Link>

            {product.category && (
                <>
                    <span className="mx-2">{'>'}</span>
                    <Link
                        to={`/categories/${product.category.id}`}
                        className="hover:text-blue-600"
                    >
                        {product.category.name}
                    </Link>
                </>
            )}

            <span className="mx-2">{'>'}</span>

            <span className="text-gray-700 font-medium truncate max-w-[300px]">
                {product.name}
            </span>
        </nav>
    )
}

export default ProductBreadcrumb