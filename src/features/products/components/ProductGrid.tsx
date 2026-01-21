import { Product } from '../types/productTypes'
import ProductCard from './ProductCard'

interface Props {
    products: Product[]
}

const ProductGrid = ({ products }: Props) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    )
}

export default ProductGrid