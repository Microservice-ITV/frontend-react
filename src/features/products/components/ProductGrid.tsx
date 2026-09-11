import { Product } from '../types/productTypes'
import ProductCard from './ProductCard'

interface Props {
    products: Product[]
    showFindSimilar?: boolean
}

const ProductGrid = ({ products, showFindSimilar = true }: Props) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-2.5 gap-y-1">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} showFindSimilar={showFindSimilar} />
            ))}
        </div>
    )
}

export default ProductGrid