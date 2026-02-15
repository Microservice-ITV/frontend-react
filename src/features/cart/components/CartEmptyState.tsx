import { emptyCartIcon } from '@/assets/icons'
import { Link } from 'react-router-dom'

const CartEmptyState = () => {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        {/* ICON */}
        <img
          src={emptyCartIcon}
          alt="Empty cart"
          className="mb-6 h-32 w-32 object-contain"
        />

        {/* TITLE */}
        <p className="mb-6 text-base font-medium text-gray-700">
          Your shopping cart is empty
        </p>

        {/* CTA */}
        <Link to="/">
          <button className="rounded-sm bg-[var(--dni-primary)] px-8 py-3 text-sm font-medium text-white hover:opacity-90 cursor-pointer">
            Go shopping now
          </button>
        </Link>
      </div>
    </section>
  )
}

export default CartEmptyState
