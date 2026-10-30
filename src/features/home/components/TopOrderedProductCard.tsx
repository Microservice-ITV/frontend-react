import { Link } from 'react-router-dom'
import ResponsiveAssetImage from '@/components/media/ResponsiveAssetImage'
import type { TopOrderedProduct } from '../types/topOrderedProductTypes'

interface Props {
    product: TopOrderedProduct
}

const formatSalesCount = (totalOrdered: number) => {
    if (totalOrdered >= 1000) return `${Math.floor(totalOrdered / 1000)}k+`
    return `${totalOrdered}+`
}

const TopOrderedProductCard = ({ product }: Props) => {
    return (
        <Link
            to={`/products/${product.id}`}
            className="group relative flex w-[200px] snap-start flex-col overflow-hidden border border-gray-100 bg-white transition-all duration-200 hover:-translate-y-px hover:border-(--dni-primary) hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--dni-primary) focus-visible:ring-offset-2 ms-2 first:ms-0 last:me-2 px-3"
        >
            {/* Image area */}
            <div className="relative aspect-square overflow-hidden bg-white">
                {/* TOP ribbon badge */}
                <div className="absolute left-2 top-0 z-10 flex flex-col items-center">
                    <span
                        className="flex h-7 w-9 items-center justify-center bg-(--dni-primary) text-[10px] font-bold uppercase tracking-wide text-white"
                        style={{
                            clipPath:
                                'polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%)',
                        }}
                    >
                        Top
                    </span>
                </div>

                <ResponsiveAssetImage
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                    variant="card"
                    sizes="200px"
                    loading="lazy"
                />

                {/* Monthly sales bar overlapping bottom of image */}
                <div className="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-1.5 text-center text-xs font-medium text-white">
                    Monthly Sales {formatSalesCount(product.totalOrdered)}
                </div>
            </div>

            {/* Product info */}
            <div className="flex min-h-16 flex-1 flex-col p-3">
                <h3 className="line-clamp-2 text-base leading-5 text-gray-800">
                    {product.name}
                </h3>
                
            </div>
        </Link>
    )
}

export default TopOrderedProductCard