/**
 * Looping packing animation: items drop into a shopping bag, then the bag lifts.
 */
const CheckoutPreparingAnimation = () => (
  <div className="checkout-pack" aria-hidden="true">
    <span className="checkout-pack__item checkout-pack__item--1" />
    <span className="checkout-pack__item checkout-pack__item--2" />
    <span className="checkout-pack__item checkout-pack__item--3" />
    <div className="checkout-pack__bag">
      <div className="checkout-pack__handle checkout-pack__handle--left" />
      <div className="checkout-pack__handle checkout-pack__handle--right" />
      <div className="checkout-pack__bag-body">
        <div className="checkout-pack__logo" />
      </div>
    </div>
    <div className="checkout-pack__shadow" />
  </div>
)

/** Full-page preparing state shared by guest + logged-in checkout. */
export const CheckoutPreparingScreen = () => (
  <div
    role="status"
    aria-live="polite"
    aria-busy="true"
    className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4"
  >
    <CheckoutPreparingAnimation />
    <div className="text-center">
      <p className="text-sm font-medium text-slate-700">Getting Your Order Ready...</p>
      <p className="mt-1 text-xs text-slate-500">We're preparing your order with care.</p>
    </div>
  </div>
)

export default CheckoutPreparingAnimation
