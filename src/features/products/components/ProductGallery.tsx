import { useState } from 'react'

interface Props {
    images: string[]
}

const ProductGallery = ({ images }: Props) => {
    const safeImages = images.length ? images : ['/placeholder.png']
    const [active, setActive] = useState(safeImages[0])

    return (
        <div className="w-full lg:w-[450px] flex-shrink-0">
            {/* MAIN IMAGE (no border) */}
            <img
                src={active}
                alt="Product"
                className="w-full h-[300px] sm:h-[400px] lg:h-[450px] object-contain"
            />

            {/* THUMBNAILS */}
            <div className="flex gap-2 mt-2 overflow-x-auto pb-2 scrollbar-hide">
                {safeImages.map((img) => (
                    <img
                        key={img}
                        src={img}
                        onClick={() => setActive(img)}
                        className={`
                            w-16 h-16 sm:w-20 sm:h-20 object-contain cursor-pointer border border-transparent transition hover:border-[var(--dni-primary)] flex-shrink-0
                            ${active === img ? 'border-[var(--dni-primary)]' : ''}
                        `}
                    />
                ))}
            </div>
        </div>
    )
}

export default ProductGallery