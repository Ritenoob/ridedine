---
name: coinbase-cdp-integration
description: |
  Integrate Coinbase crypto payments into payment systems. Use when: (1) adding crypto payment support,
  (2) building onchain features, (3) implementing wallet functionality. Covers Coinbase Commerce
  (payment processor) vs CDP (developer platform), Server Wallets, Embedded Wallets, and multi-network support.
author: Claude Code
version: 1.0.0
---

# Coinbase CDP Integration

## Problem

Integrating cryptocurrency payments requires choosing between Coinbase's two products: **Coinbase Commerce** (simple payment processor) vs **CDP** (comprehensive developer platform), understanding their differences, and implementing the right solution.

## Context / Trigger Conditions

Use this skill when:
- Adding crypto payment acceptance to a marketplace/app
- Building wallet features or onchain functionality
- Choosing between Coinbase Commerce and CDP
- Implementing multi-chain support (Ethereum, Solana, Base, etc.)
- Needing embedded wallets or payment infrastructure

## Coinbase Products Overview

### Coinbase Commerce (Payment Processor)
**Purpose:** Accept crypto payments from customers (like Stripe for crypto)

**Features:**
- Hosted checkout pages
- Support for BTC, ETH, USDC, USDT, DAI
- Webhook notifications for payment events
- Automatic fiat conversion
- Simple merchant-focused API

**Use when:**
- Building e-commerce/marketplace payment flow
- Need simple "pay with crypto" button
- Want Coinbase to handle custody and conversion
- Don't need blockchain interactions

**API:** `https://commerce.coinbase.com/`
**Docs:** `https://docs.cloud.coinbase.com/commerce/docs`

### CDP (Coinbase Developer Platform)
**Purpose:** Build onchain applications with wallets, transactions, and blockchain APIs

**Features:**
- **Server Wallets v2:** Backend wallet management, 250 TPS throughput, sub-200ms latency
- **Embedded Wallets:** User wallets without seed phrases, built-in onramps/trading
- **Policy Engine:** Transaction limits, approve/deny lists, multi-rule governance
- **Smart Accounts:** EVM smart contract wallets (Base, Ethereum, Arbitrum, Optimism, etc.)
- **Solana Support:** Send transactions, sign & broadcast in one call
- **Onramp/Offramp API:** Fiat ↔ crypto conversion with Apple Pay support
- **AgentKit:** AI agents interacting with blockchain
- **OnchainKit:** React/TypeScript SDK for building onchain UIs

**Networks supported:**
- EVM: Ethereum, Base, Arbitrum, Optimism, Polygon, Zora, BNB, Avalanche
- Solana

**Use when:**
- Building DeFi features (lending, staking, trading)
- Need programmatic wallet creation
- Implementing blockchain interactions in your app
- Building onchain games or NFT platforms
- Automating mass payouts or treasury operations

**API:** `https://docs.cdp.coinbase.com/api-reference/v2/introduction`
**Portal:** `https://portal.cdp.coinbase.com/`

## Implementation Patterns

### Pattern 1: Simple Crypto Checkout (Commerce)

**Stack:** Coinbase Commerce + Webhooks

```typescript
// 1. Create charge (server-side)
const charge = await coinbaseCommerce.charges.create({
  name: "Order #123",
  description: "Customer order",
  pricing_type: "fixed_price",
  local_price: {
    amount: "100.00",
    currency: "USD"
  },
  metadata: {
    order_id: "order-123"
  }
});

// 2. Redirect user to charge.hosted_url
window.location.href = charge.hosted_url;

// 3. Handle webhook for payment confirmation
// POST /webhooks/coinbase
// Verify signature, update order status
```

### Pattern 2: Embedded Wallets (CDP)

**Stack:** CDP Embedded Wallets + Onramp

```typescript
// 1. Initialize CDP SDK
import { Coinbase } from "@coinbase/coinbase-sdk";

const coinbase = new Coinbase({
  apiKeyName: process.env.CDP_API_KEY_NAME,
  privateKey: process.env.CDP_PRIVATE_KEY
});

// 2. Create user wallet
const wallet = await coinbase.createWallet({
  networkId: "base-mainnet"
});

// 3. Fund with onramp (Apple Pay)
const onrampSession = await coinbase.createOnrampSession({
  walletAddress: wallet.address,
  amount: "50.00",
  currency: "USD",
  paymentMethod: "apple_pay"
});

// 4. Send transaction
const transaction = await wallet.sendTransaction({
  to: recipientAddress,
  amount: "10.0",
  asset: "USDC"
});
```

### Pattern 3: Server Wallets for Mass Payouts (CDP)

**Stack:** CDP Server Wallets v2 + Policy Engine

```typescript
// 1. Create server wallet with policies
const wallet = await coinbase.createServerWallet({
  networkId: "base-mainnet",
  policies: [
    {
      type: "transfer_limit",
      asset: "USDC",
      maxAmount: "1000.00",
      timeWindow: "24h"
    },
    {
      type: "allowlist",
      addresses: [recipient1, recipient2, recipient3]
    }
  ]
});

// 2. Batch payouts (250 TPS)
const payouts = await wallet.batchTransfer([
  { to: employee1, amount: "500", asset: "USDC" },
  { to: employee2, amount: "750", asset: "USDC" },
  { to: employee3, amount: "600", asset: "USDC" }
]);
```

## Architecture Decision Tree

```
Need crypto payments?
├─ Just accept payments → Coinbase Commerce
│  └─ Simple checkout, webhooks, fiat conversion
│
└─ Build onchain features → CDP
   ├─ User wallets needed?
   │  ├─ Yes, users manage → Embedded Wallets
   │  └─ No, backend managed → Server Wallets v2
   │
   ├─ Need fiat onramp?
   │  └─ Yes → Onramp API (Apple Pay, card)
   │
   ├─ Transaction governance?
   │  └─ Yes → Policy Engine (limits, allowlists)
   │
   └─ Multi-chain support?
      └─ Yes → Smart Accounts (EVM) or Solana APIs
```

## Key Differences: Commerce vs CDP

| Feature | Coinbase Commerce | CDP |
|---------|------------------|-----|
| **Purpose** | Accept payments | Build onchain apps |
| **Custody** | Coinbase holds funds | You control wallets |
| **Networks** | Bitcoin, Ethereum, others | EVM + Solana (programmable) |
| **Complexity** | Simple (like Stripe) | Advanced (blockchain APIs) |
| **Use case** | E-commerce checkout | DeFi, NFTs, onchain logic |
| **Pricing** | 1% transaction fee | API usage-based |
| **Wallet creation** | No | Yes (embedded or server) |
| **Fiat conversion** | Automatic | Via Onramp API |

## RidenDine Implementation Status

**Current:** Coinbase Commerce for crypto checkout
- Edge Function: `create_crypto_payment` (creates Commerce charge)
- Webhook: `webhook_coinbase` (handles payment events)
- Database: `crypto_payments` table tracks blockchain confirmations

**Potential CDP Upgrades:**
1. **Embedded Wallets** - Give customers crypto wallets for loyalty/rewards
2. **Server Wallets v2** - Automate chef/driver payouts in USDC (faster, cheaper than bank transfers)
3. **Onramp API** - Apple Pay → crypto onboarding (25% conversion increase per Moonshot case study)
4. **Policy Engine** - Governance for treasury operations (spending limits, multi-sig)

## References

- **CDP Docs:** https://docs.cdp.coinbase.com/
- **API Reference:** https://docs.cdp.coinbase.com/api-reference/v2/introduction
- **SDKs:** https://docs.cdp.coinbase.com/sdks
- **Demo Apps:** https://docs.cdp.coinbase.com/get-started/demo-apps/explore
- **Changelog:** https://docs.cdp.coinbase.com/get-started/changelog
- **Dev Portal:** https://portal.cdp.coinbase.com/
- **Commerce Docs:** https://docs.cloud.coinbase.com/commerce/docs
