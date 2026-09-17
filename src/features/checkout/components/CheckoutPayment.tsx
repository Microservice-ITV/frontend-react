import { useCallback, useState } from "react";
import { CardElement } from "@stripe/react-stripe-js";
import { useDispatch, useSelector } from "react-redux";
import {
  setPaymentMethod,
  selectPaymentMethod,
  type PaymentMethod,
} from "../store/checkoutSlice";
import { visaIcon } from "@/assets/icons";

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

  const isPrepaid = selectedPaymentMethod === "card";
  const [selectedProvider, setSelectedProvider] = useState("card");

  const paymentProviders = [
    {
      id: "card",
      label: "Card",
      logo: visaIcon,
      logoClassName: "h-8 w-[92px]",
    },
    {
      id: "kpay",
      label: "Kpay",
      logo: "/payment-kpay.svg",
      logoClassName: "h-8 w-[88px]",
    },
    {
      id: "wavepay",
      label: "Wpay",
      logo: "/payment-wavepay.svg",
      logoClassName: "h-8 w-[88px]",
    },
    {
      id: "ayapay",
      label: "AYA pay",
      logo: "/payment-ayapay.svg",
      logoClassName: "h-8 w-[88px]",
    },
  ];

  return (
    <div className="mt-4 overflow-hidden border border-gray-100 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-4 border-b border-gray-100 px-4 py-4 sm:px-6 md:grid md:grid-cols-[145px_1fr] md:items-center">
        <div className="text-sm font-medium text-gray-900">Payment Method</div>

        <div className="flex flex-wrap gap-2">
          {[
            { label: "Prepaid", value: "card" as PaymentMethod },
            { label: "Cash on Delivery", value: "cod" as PaymentMethod },
          ].map(({ label, value }) => {
            const selected = value === selectedPaymentMethod;
            return (
              <button
                key={value}
                type="button"
                onClick={() => handlePaymentMethodChange(value)}
                className={`
                  relative min-w-26 rounded border px-4 py-2 text-sm whitespace-nowrap transition-colors cursor-pointer
                  ${selected ? "border-[#5f8f80] bg-[#f0f8f5] text-[#477b6b]" : "border-gray-300 text-gray-700 hover:border-[#5f8f80]"}
                `}
              >
                {label}

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
          <div className="border-b border-gray-100 px-4 py-4 sm:px-6 md:px-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Method 1: Prepaid (Card, Wallet, etc.)
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {paymentProviders.map((provider) => {
                const selected = selectedProvider === provider.id;
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setSelectedProvider(provider.id)}
                    className={`relative flex h-13.5 flex-col items-center justify-center rounded border px-2 transition-colors cursor-pointer ${selected ? "border-[#5f8f80] bg-[#f0f8f5]" : "border-gray-300 bg-white hover:border-[#5f8f80]"}`}
                  >
                    <img
                      src={provider.logo}
                      alt={provider.label}
                      className={`object-contain ${provider.logoClassName}`}
                    />
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

          <div className="flex flex-col gap-3 px-4 pb-5 sm:px-6 md:grid">
            <div>
              {selectedProvider === "card" && (
                <div className="mt-4 max-w-full rounded-lg border border-gray-200 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                  <div className="mb-4 flex items-center gap-3 text-sm font-medium text-gray-900">
                    <span className="flex h-5 w-6 items-center justify-center rounded-sm bg-black text-white">
                      <svg
                        viewBox="0 0 24 18"
                        className="h-3.5 w-4 fill-current"
                      >
                        <rect x="2" y="4" width="20" height="12" rx="1" />
                        <rect x="2" y="7" width="20" height="2" fill="white" />
                        <rect x="5" y="12" width="4" height="1" fill="white" />
                      </svg>
                    </span>
                    Card
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
              )}
            </div>
          </div>
        </>
      )}

      {!isPrepaid && (
        <div className="px-4 py-4 sm:px-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Method 2: Cash on Delivery (COD)
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => handlePaymentMethodChange("cod")}
              className="rounded border border-gray-300 px-8 py-2 text-sm text-gray-700 sm:min-w-[150px] cursor-pointer"
            >
              Cash on Delivery
            </button>
            <p className="rounded bg-[#f0eff5] px-4 py-2 text-xs text-gray-700 sm:flex-1">
              Pay{" "}
              <span className="font-semibold">
                ${(totalAmount ?? 0).toFixed(2)}
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
