import CheckoutAddress from "../components/CheckoutAddress"
import CheckoutItems from "../components/CheckoutItems"
import CheckoutPayment from "../components/CheckoutPayment"
import CheckoutSummary from "../components/CheckoutSummary"

const CheckoutPage = () => {
    return (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-4 py-3 mb-5">
            <CheckoutAddress />
            <CheckoutItems />
            <CheckoutPayment />
            <CheckoutSummary />
        </div>
    )
}

export default CheckoutPage