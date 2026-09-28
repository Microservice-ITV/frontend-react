import { useCallback, useState } from "react";
import { CardElement } from "@stripe/react-stripe-js";
import { useDispatch, useSelector } from "react-redux";
import {
  setPaymentMethod,
  selectPaymentMethod,
  type PaymentMethod,
} from "../store/checkoutSlice";
import { visaIcon } from "@/assets/icons";
import { formatKsPrice } from "@/features/products/utils/formatProductPrice";
import { Banknote, CreditCard } from "lucide-react";

type CheckoutPaymentProps = {
  totalAmount?: number;
};

const CheckoutPayment = ({ totalAmount }: CheckoutPaymentProps) => {
  const dispatch = useDispatch();
  const selectedPaymentMethod = useSelector(selectPaymentMethod);

  const handlePaymentMethodChange = useCallback(
    (method: PaymentMethod) => {
      dispatch(setPaymentMethod(method));
    },
    [dispatch],
  );

  const isPrepaid = selectedPaymentMethod === "prepaid";
  const [selectedProvider, setSelectedProvider] = useState("card");

  const paymentProviders = [
    {
      id: "card",
      label: "Card",
      logo: visaIcon,
      logoClassName: "h-8",
    },
    {
      id: "kpay",
      label: "KBZ Pay",
      logo: "/payment-kpay.svg",
      logoClassName: "h-8 w-[88px]",
    },
    {
      id: "wavepay",
      label: "Wave Pay",
      logo: "/payment-wavepay.svg",
      logoClassName: "h-8 w-[88px]",
    },
    {
      id: "ayapay",
      label: "AYA Pay",
      logo: "/payment-ayapay.svg",
      logoClassName: "h-8 w-[88px]",
    },
    {
      id: "cbpay",
      label: "CB pay",
      logo: "/payment-cbpay.svg",
      logoClassName: "h-8 w-[88px]",
    },
  ];

  const selectedProviderInfo =
    paymentProviders.find((provider) => provider.id === selectedProvider) ??
    paymentProviders[0];

  return (
    <div className="rounded-sm border border-[var(--dni-cart-border)] bg-white">
      <div className="border-b border-gray-100 px-3 py-3 sm:px-4">
        <div className="mb-2 text-sm font-medium text-gray-900">Payment Method</div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Prepaid", value: "prepaid" as PaymentMethod, Icon: CreditCard },
            { label: "Cash on Delivery", value: "cod" as PaymentMethod, Icon: Banknote },
          ].map(({ label, value, Icon }) => {
            const selected = value === selectedPaymentMethod;
            return (
              <button
                key={value}
                type="button"
                onClick={() => handlePaymentMethodChange(value)}
                className={`
                  relative flex min-w-0 items-center justify-center gap-1.5 rounded border px-1.5 py-2 text-[13px] transition-colors cursor-pointer sm:px-2 sm:text-sm
                  ${selected ? "border-[#5f8f80] bg-[#f0f8f5] text-[#477b6b]" : "border-gray-300 text-gray-700 hover:border-[#5f8f80]"}
                `}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="min-w-0 truncate">{label}</span>

                {selected && (
                  <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5 items-center justify-center bg-[#3d8c73]">
                    <svg viewBox="0 0 12 12" className="w-3 h-3 fill-white">
                      <path d="M5.2 10.9L.3 7c-.4-.4-.5-1-.1-1.4s1-.5 1.4-.1l3.4 3 5.1-7c.3-.4 1-.5 1.4-.2s.5 1 .2 1.4l-5.7 7.9z" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {isPrepaid && (
        <>
          <div className="border-b border-gray-100 px-3 py-3 sm:px-4">
            <h2 className="text-sm font-semibold text-gray-900 sm:text-base">
              Prepaid (Card, Wallet)
            </h2>
            <div className="mt-3 flex items-center gap-1">
              {paymentProviders.map((provider) => {
                const selected = selectedProvider === provider.id;
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setSelectedProvider(provider.id)}
                    aria-label={provider.label}
                    className={`group relative flex h-11 min-w-0 flex-1 items-center justify-center px-0.5 transition-colors cursor-pointer ${selected ? "bg-[#f0f8f5]" : "bg-transparent hover:bg-gray-50"}`}
                  >
                    <img
                      src={provider.logo}
                      alt=""
                      className="h-7 w-auto max-w-full object-contain"
                    />
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-sm transition-opacity after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-gray-900 group-hover:opacity-100 group-focus-visible:opacity-100">
                      {provider.label}
                    </span>
                    {selected && (
                      <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5 items-center justify-center bg-[#3d8c73]">
                        <svg
                          viewBox="0 0 12 12"
                          className="h-2.5 w-2.5 fill-white"
                        >
                          <path d="M5.2 10.9L.3 7c-.4-.4-.5-1-.1-1.4s1-.5 1.4-.1l3.4 3 5.1-7c.3-.4 1-.5 1.4-.2s.5 1 .2 1.4l-5.7 7.9z" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedProvider === "card" && (
          <div className="flex flex-col gap-3 px-3 pb-4 sm:px-4">
            <div>
              <div className="mt-1 max-w-full rounded-sm border border-[var(--dni-cart-border)] p-3 sm:p-4">
                <div className="mb-4 flex items-center gap-3 text-sm font-medium text-gray-900">
                  <img
                    src={selectedProviderInfo.logo}
                    alt={selectedProviderInfo.label}
                    className={`object-contain ${selectedProviderInfo.logoClassName}`}
                  />
                  Pay with {selectedProviderInfo.label}
                </div>
                <label className="mb-1 block text-xs text-gray-500">
                  Card information
                </label>
                <div className="rounded-lg border border-gray-300 bg-white px-3 py-3">
                  <CardElement
                    options={{
                      hidePostalCode: true,
                      style: {
                        base: {
                          fontSize: "14px",
                          color: "#111827",
                          "::placeholder": { color: "#9ca3af" },
                        },
                      },
                    }}
                  />
                </div>
                <label className="mb-1 mt-4 block text-xs text-gray-500">
                  Cardholder name
                </label>
                <input
                  type="text"
                  placeholder="Full name on card"
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#5f8f80]"
                />
                <label className="mb-1 mt-4 block text-xs text-gray-500">
                  Country or region
                </label>
                <select
                  defaultValue="Myanmar (Burma)"
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#5f8f80]"
                >
                  <option>Myanmar (Burma)</option>
                  <option>Thailand</option>
                  <option>Singapore</option>
                </select>
              </div>
            </div>
          </div>
        )}
        </>
      )}

      {!isPrepaid && (
        <div className="px-3 py-3 sm:px-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 sm:text-base">
            Cash on Delivery (COD)
          </h2>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => handlePaymentMethodChange("cod")}
              className="w-full rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 cursor-pointer"
            >
              Cash on Delivery
            </button>
            <p className="rounded bg-[#f0eff5] px-4 py-2 text-xs text-gray-700 sm:flex-1">
              Pay{" "}
              <span className="font-semibold">
                {formatKsPrice(totalAmount ?? 0)}
              </span>{" "}
              to the delivery person upon arrival.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPayment;
