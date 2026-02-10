# RideNDine Integrations Guide

## Overview

RideNDine integrates with multiple external services to provide a complete food delivery platform. This guide covers all integrations and how to configure them.

## Integrations

### 1. Cooco Meal Plan

**Purpose:** Import menu items and meal plans from Cooco app

**Website:** https://cooco.app/mealplan

**Integration Type:** Manual import (API coming soon)

#### Configuration

Access the integrations page at `/admin/integrations` and configure:

1. **Store/Account Name** - Your Cooco store identifier
2. **Import Mode** - Currently "Manual Paste" (API mode planned)

#### Menu Import Process

1. Open Cooco in new tab using "Open Cooco" button
2. Copy your menu items from Cooco
3. Click "Import Menu" button
4. Paste menu items in CSV format:
   ```
   name,price,category
   Pho Bo,12.99,Soup
   Spring Rolls,6.99,Appetizer
   Bun Cha,13.99,Main
   ```
5. Click "Import Items"
6. Items are saved to your store

#### API Endpoints

**Save Cooco Configuration:**
```bash
POST /api/integrations/cooco-config
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "storeName": "My Kitchen",
  "importMode": "manual"
}
```

**Import Menu:**
```bash
POST /api/integrations/import-menu
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "integrationType": "cooco",
  "storeId": "cooco_store",
  "items": [
    {"name": "Pho Bo", "price": 12.99, "category": "Soup"},
    {"name": "Spring Rolls", "price": 6.99, "category": "Appetizer"}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Imported 2 menu items for cooco_store"
}
```

### 2. Hoang Gia Pho (Chef Site)

**Purpose:** Featured Vietnamese restaurant integration

**Website:** https://hoang-gia-pho-site-of8l.vercel.app/hoang-gia-pho-delivery.html

**Store ID:** `store_hoang_gia_pho`

**Integration Type:** Manual menu sync (auto-scraping planned)

#### Configuration

Hoang Gia Pho is pre-configured in the system as one of the simulator stores. The integration page allows:

1. Opening the storefront in a new tab
2. Manually syncing menu items
3. Viewing integration status

#### Menu Sync Process

1. Click "Open Storefront" to view the chef's website
2. Click "Sync Menu" button
3. Paste menu items from the website in CSV format
4. Items are imported to `store_hoang_gia_pho`

#### Integration with Simulator

Hoang Gia Pho is included in the simulator with:
- Pre-loaded menu items (Pho Bo, Pho Ga, Bun Cha, Spring Rolls)
- Geographic location in Hamilton, ON
- Average prep time of 15 minutes
- Orders automatically routed through the store

### 3. Stripe Payments

**Purpose:** Payment processing for customer orders

**Website:** https://stripe.com

**Integration Type:** API integration with auto-detection

#### Configuration

Set environment variables:
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Auto-Detection

The system automatically detects Stripe mode:
- **Demo Mode** - No Stripe keys OR `DEMO_MODE=true`
- **Live Mode** - Stripe keys present AND `DEMO_MODE=false`

#### Status Display

The integrations page shows current Stripe status:
- **Demo Mode** (Yellow) - Mock payments, no charges
- **Connected** (Green) - Real Stripe integration active
- **Not Configured** (Red) - Missing Stripe keys

#### Testing

Click "Test Payment" to verify:
- Demo mode returns instant success
- Live mode creates real payment intent

See `PAYMENT_DEMO_GUIDE.md` for detailed payment integration.

### 4. Mealbridge Dispatch

**Purpose:** Order routing and driver dispatch system

**Integration Type:** Internal simulator integration

**Status:** Active (via simulator)

#### Features

- Automatic driver assignment to orders
- Route optimization
- Real-time driver tracking
- Batch order handling
- ETA calculations

#### Integration Points

The simulator serves as the Mealbridge integration:
- Orders are automatically dispatched when ready
- Drivers are assigned based on proximity
- Routes are calculated using Haversine distance
- Progress is tracked in real-time

#### API Access

Access dispatch data through simulator endpoints:
```bash
GET /api/simulator/drivers
GET /api/simulator/orders?status=en_route
GET /api/simulator/state
```

## Integration Logs

All integration events are logged and viewable at `/admin/integrations`.

### Log Structure
```json
{
  "id": 1,
  "source": "cooco",
  "event": "menu_imported",
  "data": {
    "storeId": "cooco_store",
    "itemCount": 5
  },
  "timestamp": "2026-02-10T22:00:00.000Z"
}
```

### Event Types

**Cooco:**
- `order_received` - Incoming order from Cooco
- `order_rejected` - Order rejected (signature verification)
- `webhook_error` - Webhook processing error
- `menu_imported` - Menu items imported
- `config_updated` - Configuration changed

**Chef/Hoang Gia Pho:**
- `menu_imported` - Menu items synced

**Mealbridge:**
- `dispatch_requested` - Order dispatch initiated
- `dispatch_success` - Driver assigned
- `dispatch_error` - Dispatch failed

### Viewing Logs

**Get all logs:**
```bash
GET /api/integrations/logs
Authorization: Bearer <admin_token>
```

**Filter by source:**
```bash
GET /api/integrations/logs?source=cooco&limit=10
```

**Response:**
```json
{
  "logs": [...],
  "total": 25
}
```

## Security

### Webhook Signatures

For production Cooco integration:
1. Configure `COOCO_WEBHOOK_SECRET` in environment
2. Webhooks without valid signature are rejected
3. Signature verification prevents unauthorized orders

### API Authentication

All integration management endpoints require:
- Valid authentication session
- Admin role
- CORS headers for cross-origin requests

### CORS Configuration

Backend allows:
- `https://seancfafinlay.github.io` (GitHub Pages)
- `localhost` (development)

Update in `server/index.js` for additional origins.

## External Service Integration

### Future Integrations

Planned integrations include:

1. **Cooco API** - Direct API connection (webhook → API polling)
2. **Menu Scraping** - Auto-extract menus from chef websites
3. **SMS Notifications** - Twilio for order updates
4. **Email** - SendGrid for receipts and notifications
5. **Analytics** - Google Analytics for tracking
6. **Maps** - Google Maps API for better routing

### Adding New Integrations

To add a new integration:

1. **Create configuration section** in `/docs/pages/admin/integrations.html`
2. **Add integration card** with icon, description, status
3. **Implement backend routes** in `/server/routes/integrations.js`
4. **Add log events** using `logIntegration(source, event, data)`
5. **Update integration settings** storage
6. **Document** in this guide

Example integration card:
```html
<div class="integration-card">
  <div class="integration-icon">📧</div>
  <h3>SendGrid Email</h3>
  <p class="integration-description">
    Send order confirmations and receipts via email.
  </p>
  <div class="integration-status">
    <span class="status-badge status-success">Active</span>
  </div>
  <div class="integration-actions">
    <button class="button button--primary" onclick="configureSendGrid()">
      Configure
    </button>
  </div>
</div>
```

## Troubleshooting

### Cooco Menu Import Fails

**Symptoms:** Import shows error or no items saved

**Solutions:**
1. Check CSV format (name,price,category)
2. Ensure prices are valid numbers
3. Verify admin authentication
4. Check browser console for errors
5. Verify backend `/api/integrations/import-menu` is accessible

### Stripe Not Detected

**Symptoms:** Shows "Not Configured" status

**Solutions:**
1. Check environment variables are set
2. Restart server after adding keys
3. Verify keys are valid (starts with sk_test_ or sk_live_)
4. Check `/api/config` endpoint returns publishable key

### Integration Logs Not Showing

**Symptoms:** Empty logs table

**Solutions:**
1. Trigger integration events (import menu, test payment)
2. Check admin role is assigned
3. Verify `/api/integrations/logs` endpoint
4. Check browser console for API errors

### Hoang Gia Pho Orders Not Appearing

**Symptoms:** No orders from the chef store

**Solutions:**
1. Initialize simulator: `POST /api/simulator/initialize`
2. Generate orders: `POST /api/simulator/generate-orders`
3. Check store exists: `GET /api/simulator/stores`
4. Verify store ID is `store_hoang_gia_pho`

## Best Practices

1. **Test in demo mode first** - Verify integration before going live
2. **Monitor logs regularly** - Check for errors and anomalies
3. **Keep credentials secure** - Never commit secrets to git
4. **Use environment variables** - For all API keys and secrets
5. **Validate input** - Always validate imported menu data
6. **Handle errors gracefully** - Show user-friendly messages
7. **Document custom integrations** - Update this guide

## Integration Checklist

### Cooco
- [x] Integration card created
- [x] Manual menu import UI
- [x] Store configuration
- [x] Backend routes
- [ ] Webhook signature verification
- [ ] API-based import (future)

### Hoang Gia Pho
- [x] Pre-configured store in simulator
- [x] Integration card
- [x] Menu sync UI
- [x] Storefront link
- [ ] Auto-scraping (future)

### Stripe
- [x] Auto-detection of mode
- [x] Demo mode support
- [x] Payment intent creation
- [x] Test payment button
- [ ] Webhook verification in production

### Mealbridge
- [x] Simulator integration
- [x] Driver assignment
- [x] Route calculation
- [x] Real-time tracking
- [x] Status display

## Support

For integration issues:
1. Check this guide first
2. Review integration logs at `/admin/integrations`
3. Check server logs for backend errors
4. Verify environment configuration
5. Test endpoints directly with curl/Postman

## Related Documentation

- `SIMULATOR_GUIDE.md` - Simulator and dispatch system
- `PAYMENT_DEMO_GUIDE.md` - Payment processing details
- `README.md` - General setup and deployment
