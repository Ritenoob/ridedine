"use client";

import { useState } from "react";

interface CryptoPaymentProps {
  orderId: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  onError: (error: string) => void;
}

export function CryptoPayment({
  orderId,
  amount,
  currency,
  customerName,
  customerEmail,
  onError,
}: CryptoPaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCryptoPayment = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create_crypto_payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            order_id: orderId,
            amount_cents: amount,
            currency: currency,
            customer_name: customerName,
            customer_email: customerEmail,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create crypto payment");
      }

      const data = await response.json();

      if (data.success && data.hosted_url) {
        window.location.href = data.hosted_url;
      } else {
        throw new Error("Invalid response from payment service");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMessage(message);
      onError(message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="h-8 w-8 text-gray-700"
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
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Pay with Cryptocurrency
              </h3>
              <p className="text-sm text-gray-500">
                Powered by Coinbase Commerce
              </p>
            </div>
          </div>

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
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">
                  How it works
                </h4>
                <div className="mt-2 text-sm text-blue-700">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Click &quot;Pay with Crypto&quot; below</li>
                    <li>Choose your cryptocurrency (BTC, ETH, USDC, USDT)</li>
                    <li>Send payment from your wallet</li>
                    <li>
                      Your order will be confirmed once payment is received
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-md bg-gray-50 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Order Total:</span>
              <span className="font-medium text-gray-900">
                {currency} ${(amount / 100).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-500">
            <p>✓ Secure blockchain payment</p>
            <p>✓ No personal information required</p>
            <p>✓ Typically confirms in 10-15 minutes</p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleCryptoPayment}
        disabled={isProcessing}
        className={`
          w-full rounded-md px-4 py-3 text-base font-medium text-white shadow-sm
          ${
            isProcessing
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          }
        `}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Redirecting to Coinbase...
          </span>
        ) : (
          "Pay with Crypto"
        )}
      </button>

      <p className="text-center text-sm text-gray-500">
        You&apos;ll be redirected to{" "}
        <span className="font-medium text-gray-900">Coinbase Commerce</span> to
        complete payment
      </p>
    </div>
  );
}
