-- Schema Reconciliation Migration
-- Fixes conflicts discovered in audit: dishes vs menu_items, order status standardization, and database constraints

-- =============================================================================
-- 1. DISHES vs MENU_ITEMS CLARIFICATION
-- =============================================================================
-- Both tables exist and serve different purposes:
-- - `dishes`: Chef's catalog (directly attached to chef)
-- - `menu_items`: Items within a specific menu offering (attached to menu)
-- No schema changes needed - both are valid tables.
-- Code uses `dishes` table consistently. Some old references to `menu_items` will be updated to use `dishes` where appropriate.

-- =============================================================================
-- 2. ORDER STATUS STANDARDIZATION
-- =============================================================================
-- Problem: Three different order entry statuses across codebase:
-- - orders-repository.ts: uses DRAFT for new orders
-- - web checkout: uses SUBMITTED
-- - SQL CHECK constraint: expects PLACED as entry point
--
-- Solution: Standardize lifecycle to: DRAFT → PLACED → ACCEPTED → ...
-- - createOrder() uses DRAFT (pending customer confirmation)
-- - submitOrder() transitions DRAFT → PLACED (customer confirms + payment succeeds)
-- - Remove SUBMITTED as an entry status entirely

-- Update CHECK constraint to allow DRAFT as entry point
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('draft', 'placed', 'accepted', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'));

-- Add comment documenting the standardized lifecycle
COMMENT ON COLUMN orders.status IS 'Order lifecycle: draft (cart) → placed (paid) → accepted (chef confirms) → preparing → ready → picked_up → out_for_delivery → delivered. cancelled can occur at any stage.';

-- =============================================================================
-- 3. CUSTOMER_ID NOT NULL CONSTRAINT
-- =============================================================================
-- Problem: orders.customer_id has NOT NULL constraint, but checkout creates guest orders with NULL
-- Solution: Auth gate middleware (Task 9) will require login before checkout
-- For now, document the constraint. Guest checkout attempts will fail until middleware is added.

COMMENT ON COLUMN orders.customer_id IS 'NOT NULL constraint enforced. Auth gate middleware (added in Task 9) requires user login before checkout.';

-- =============================================================================
-- 4. SESSION_ID COLUMN
-- =============================================================================
-- Problem: Code references session_id column that doesn't exist
-- Solution: Column was never created. Code updated to remove session_id references and use order.id for tracking.
-- No migration action needed.

-- =============================================================================
-- 5. MISSING INDEXES FOR PERFORMANCE
-- =============================================================================
-- Add indexes for common query patterns discovered during audit

CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON orders(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_chef_status ON orders(chef_id, status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Run these after migration to verify schema reconciliation:
--
-- 1. Check order status constraint allows DRAFT:
--    INSERT INTO orders (chef_id, customer_id, status, total_cents) VALUES (..., 'draft', ...);
--
-- 2. Verify indexes created:
--    SELECT tablename, indexname FROM pg_indexes WHERE tablename IN ('orders', 'order_items');
--
-- 3. Check table comments:
--    SELECT col_description('orders'::regclass, (SELECT attnum FROM pg_attribute WHERE attrelid = 'orders'::regclass AND attname = 'status'));
