"use client";

type PaymentMethod = "stripe" | "crypto";

interface PaymentMethodSelectorProps {
  onSelect: (method: PaymentMethod) => void;
  selected: PaymentMethod;
}

export function PaymentMethodSelector({
  onSelect,
  selected,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Credit Card (Stripe) */}
        <button
          type="button"
          onClick={() => onSelect("stripe")}
          className={`
            relative rounded-lg border-2 p-4 text-left transition-all
            ${
              selected === "stripe"
                ? "border-green-600 bg-green-50"
                : "border-gray-300 hover:border-gray-400"
            }
          `}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-base font-medium text-gray-900">
                Credit/Debit Card
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Pay instantly with Visa, Mastercard, or Amex
              </p>
              {selected === "stripe" && (
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    ✓ Selected
                  </span>
                </div>
              )}
            </div>
          </div>
        </button>

        {/* Cryptocurrency */}
        <button
          type="button"
          onClick={() => onSelect("crypto")}
          className={`
            relative rounded-lg border-2 p-4 text-left transition-all
            ${
              selected === "crypto"
                ? "border-green-600 bg-green-50"
                : "border-gray-300 hover:border-gray-400"
            }
          `}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-base font-medium text-gray-900">
                Cryptocurrency
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Pay with BTC, ETH, USDC, or USDT
              </p>
              {selected === "crypto" && (
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    ✓ Selected
                  </span>
                </div>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Payment method info */}
      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-blue-700">
              {selected === "stripe" ? (
                <>
                  Your payment is processed securely by Stripe. Your card
                  details are never stored on our servers.
                </>
              ) : (
                <>
                  You&apos;ll be redirected to Coinbase Commerce to complete
                  your payment. The transaction typically confirms within 10-15
                  minutes.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
