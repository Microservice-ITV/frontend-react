import ProductActions from './ProductActions'
import { deliveryIcon, guaranteeIcon } from '@/assets/icons'
import type { ProductDetail } from '@/features/products/types/productTypes'

interface Props {
  product: ProductDetail
}

const ProductInfo = ({ product }: Props) => {
  return (
    <section className="flex-1 space-y-4 sm:space-y-5">
      {/* TITLE */}
      <h1 className="text-lg sm:text-xl font-medium text-gray-900">
        {product.name}
      </h1>

      {/* RATING */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <span className="text-[var(--dni-primary)] font-medium">
            4.9
          </span>
          <span className="text-[var(--dni-primary)]">★★★★★</span>
        </div>

        <div>
          <span className="font-medium text-gray-900">11.8k</span>{' '}
          ratings
        </div>

        <div>
          <span className="font-medium text-gray-900">30k+</span>{' '}
          Sold
        </div>
      </div>

      {/* FLASH DEALS */}
      <div className="border border-[#f5f5f5]">
        {/* TOP BAR */}
        <div
          className="flex items-center justify-between px-3 sm:px-4 py-2 text-white"
          style={{
            background: 'linear-gradient(to right, var(--dni-primary), var(--dni-primary-500))',
          }}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 font-semibold text-xs sm:text-sm">
            <span className="text-base sm:text-lg">⚡</span>
            <span>FLASH DEALS</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <span className="opacity-90 hidden sm:inline">ENDS IN</span>
            <div className="flex gap-0.5 sm:gap-1">
              {['00', '00', '00'].map((t, i) => (
                <span
                  key={i}
                  className="bg-black px-1 sm:px-1.5 py-0.5 rounded text-xs font-bold"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* PRICE AREA */}
        <div
          className="px-3 sm:px-4 py-3 sm:py-4"
          style={{
            background: 'linear-gradient(to left, #fff5f5, #ffffff)',
          }}
        >
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-emerald-700">
              ${product.price.toFixed(2)}
            </span>

            <span className="text-base sm:text-lg text-gray-400 line-through">
              $29.52
            </span>

            <span className="text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              -22%
            </span>
          </div>
        </div>
      </div>

      {/* SHIPPING */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm">
        <span className="w-20 sm:w-28 text-gray-500 flex-shrink-0">Shipping</span>

        <div className="flex-1">
          <div className="flex items-start gap-2">
            <img
              src={deliveryIcon}
              alt="Delivery"
              className="w-4 h-4 mt-0.5 flex-shrink-0"
            />

            <div className="space-y-1">
              <p className="text-gray-900">
                Guaranteed to get by <strong>27 Jan</strong>, with shipping
                fee <strong>$0.00</strong>
              </p>

              <p className="text-gray-500">
                Get a $2.00 voucher if your order arrives late.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SHOPPING GUARANTEE */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm">
        <span className="w-20 sm:w-28 text-gray-500 flex-shrink-0">
          Shopping Guarantee
        </span>

        <div className="flex items-start gap-2 text-gray-900">
          <img
            src={guaranteeIcon}
            alt="Guarantee"
            className="w-4 h-4 mt-0.5 flex-shrink-0"
          />
          <span>
            100% Authentic · Fulfilled by DNI · 15-Day Free Returns
          </span>
        </div>
      </div>

      {/* ACTIONS */}
      <ProductActions product={product} />
    </section>
  )
}

export default ProductInfo