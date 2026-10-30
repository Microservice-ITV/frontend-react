/**
 * Looping packing animation: items drop into a shopping bag, then the bag lifts.
 */
const CheckoutPreparingAnimation = () => {
  return (
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
}

export default CheckoutPreparingAnimation
