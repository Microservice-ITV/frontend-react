import { useParams } from 'react-router-dom'

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">
        Product Detail
      </h1>

      <div className="border border-gray-200 rounded bg-white p-6">
        <p className="text-sm text-gray-500">
          Product ID: <span className="font-medium">{id}</span>
        </p>

        {/* IMAGE */}
        <div className="mt-6 h-[300px] bg-gray-100 flex items-center justify-center">
          Image placeholder
        </div>

        {/* INFO */}
        <div className="mt-6 space-y-3">
          <h2 className="text-lg font-medium">
            Product name here
          </h2>

          <p className="text-xl text-[var(--shopee-primary)] font-semibold">
            $0.00
          </p>

          {/* ACTIONS */}
          <div className="flex gap-3 mt-4">
            <button className="px-6 py-2 border border-[var(--shopee-primary)] text-[var(--shopee-primary)] hover:bg-orange-50">
              Add to Cart
            </button>

            <button className="px-6 py-2 bg-[var(--shopee-primary)] text-white hover:opacity-90">
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailPage