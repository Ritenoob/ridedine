"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../../lib/supabaseClient";

export default function PaymentPendingClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [cryptoPayment, setCryptoPayment] = useState<{
    status: string;
    cryptocurrency?: string;
    confirmations?: number;
    hosted_url?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchPaymentStatus = async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("crypto_payments")
        .select("*")
        .eq("order_id", orderId)
        .single();

      if (!error && data) {
        setCryptoPayment(data);
      }
      setLoading(false);
    };

    fetchPaymentStatus();

    const interval = setInterval(fetchPaymentStatus, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <div
        className="page"
        style={{ maxWidth: 600, textAlign: "center", paddingTop: 80 }}
      >
        <div>Loading payment status...</div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 600, paddingTop: 40 }}>
      <div className="card card-body" style={{ textAlign: "center" }}>
        {/* Pending Icon */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: "#f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
            }}
          >
            <svg
              style={{ width: 48, height: 48, color: "white" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          Payment Processing
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: 16,
            marginBottom: 32,
          }}
        >
          Your cryptocurrency payment is being confirmed on the blockchain
        </p>

        {/* Status Details */}
        {cryptoPayment && (
          <div
            style={{
              backgroundColor: "var(--background-secondary)",
              borderRadius: 8,
              padding: 20,
              marginBottom: 24,
              textAlign: "left",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <span style={{ color: "var(--text-secondary)" }}>Status</span>
              <span style={{ fontWeight: 600, textTransform: "capitalize" }}>
                {cryptoPayment.status}
              </span>
            </div>
            {cryptoPayment.cryptocurrency && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>
                  Cryptocurrency
                </span>
                <span style={{ fontWeight: 600 }}>
                  {cryptoPayment.cryptocurrency.toUpperCase()}
                </span>
              </div>
            )}
            {cryptoPayment.confirmations !== undefined && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>
                  Confirmations
                </span>
                <span style={{ fontWeight: 600 }}>
                  {cryptoPayment.confirmations} / 1
                </span>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div
          style={{
            backgroundColor: "#fef3c7",
            border: "1px solid #fbbf24",
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "start" }}>
            <svg
              style={{
                width: 20,
                height: 20,
                color: "#d97706",
                marginRight: 12,
                flexShrink: 0,
              }}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p style={{ fontWeight: 600, color: "#92400e", marginBottom: 4 }}>
                What&apos;s Happening?
              </p>
              <p style={{ fontSize: 14, color: "#92400e", lineHeight: 1.5 }}>
                Your transaction is being confirmed on the blockchain. This
                typically takes 10-15 minutes. You&apos;ll receive an email once
                your payment is confirmed and your order begins preparation.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {cryptoPayment?.hosted_url && (
            <a
              href={cryptoPayment.hosted_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              View Payment Details
            </a>
          )}
          <Link href="/" className="btn btn-primary">
            Return Home
          </Link>
        </div>

        <p
          style={{
            marginTop: 20,
            fontSize: 14,
            color: "var(--text-secondary)",
          }}
        >
          This page will automatically update when your payment is confirmed
        </p>
      </div>
    </div>
  );
}
