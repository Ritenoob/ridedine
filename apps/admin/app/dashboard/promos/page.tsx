"use client";

import { useState } from "react";

export default function PromosPage() {
  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [promos] = useState<any[]>([]);

  const handleCreate = () => {
    alert("Promo code creation will be implemented with database schema updates.");
  };

  return (
    <main style={{ padding: 40, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 32, marginBottom: 10 }}>🎫 Promo Code Management</h1>
        <p style={{ color: "#666" }}>Create and manage promotional codes</p>
      </div>

      {/* Create Promo Section */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: 24,
          borderRadius: 8,
          marginBottom: 30,
        }}
      >
        <h2 style={{ fontSize: 20, marginBottom: 20 }}>Create New Promo Code</h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
              Promo Code
            </label>
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="SAVE20"
              style={{
                width: "100%",
                padding: 12,
                fontSize: 16,
                border: "1px solid #ddd",
                borderRadius: 4,
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
              Discount Percentage
            </label>
            <input
              type="number"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              placeholder="20"
              min="0"
              max="100"
              style={{
                width: "100%",
                padding: 12,
                fontSize: 16,
                border: "1px solid #ddd",
                borderRadius: 4,
              }}
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          style={{
            marginTop: 20,
            padding: "12px 24px",
            backgroundColor: "#FF7A00",
            color: "white",
            border: "none",
            borderRadius: 4,
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Create Promo Code
        </button>
      </div>

      {/* Existing Promos */}
      <div>
        <h2 style={{ fontSize: 20, marginBottom: 20 }}>Active Promo Codes</h2>
        
        {promos.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              backgroundColor: "#f8f9fa",
              borderRadius: 8,
            }}
          >
            <p style={{ fontSize: 18, color: "#666" }}>
              No promo codes created yet
            </p>
            <p style={{ fontSize: 14, color: "#999", marginTop: 8 }}>
              Note: Promo code functionality requires database schema for promo_codes table
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            {promos.map((promo: any) => (
              <div
                key={promo.id}
                style={{
                  backgroundColor: "white",
                  border: "1px solid #e0e0e0",
                  borderRadius: 8,
                  padding: 20,
                }}
              >
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center" 
                }}>
                  <div>
                    <h3 style={{ fontSize: 20, marginBottom: 5 }}>{promo.code}</h3>
                    <p style={{ color: "#666" }}>{promo.discount}% off</p>
                  </div>
                  <button
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#f44336",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Implementation Note */}
      <div
        style={{
          marginTop: 40,
          padding: 20,
          backgroundColor: "#fff3e0",
          borderRadius: 8,
          border: "1px solid #ffb74d",
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          📝 Implementation Note
        </h3>
        <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>
          To fully implement promo codes, you&apos;ll need to:
        </p>
        <ul style={{ fontSize: 14, color: "#666", lineHeight: 1.8, marginLeft: 20 }}>
          <li>Create a <code>promo_codes</code> table in the database</li>
          <li>Add promo code validation in the checkout flow</li>
          <li>Update order calculation to apply discounts</li>
          <li>Track usage count and expiration dates</li>
        </ul>
      </div>
    </main>
  );
}
