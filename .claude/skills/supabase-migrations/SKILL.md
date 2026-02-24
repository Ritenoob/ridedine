---
name: supabase-migrations
description: |
  Master Supabase database migrations for RidenDine. Use when: (1) creating new migrations,
  (2) modifying schema, (3) adding RLS policies, (4) rolling back changes, (5) deploying to
  production. Key insight: Migrations are SQL files in backend/supabase/migrations/ executed
  in lexicographical order. Use supabase CLI to generate timestamps and apply migrations.
author: Claude Code
version: 1.0.0
---

# Supabase Migrations

## Problem

RidenDine uses Supabase (PostgreSQL) for its database. Schema changes, RLS policies, and indexes must be tracked in version-controlled migration files. Supabase CLI manages migration creation, local application, and production deployment.

## Context / Trigger Conditions

Use this skill when:
- Adding new tables or columns
- Modifying existing schema
- Creating or updating RLS policies
- Adding indexes for performance
- Seeding initial data
- Rolling back database changes
- Deploying schema to production

## Migration Location

**Directory:** `backend/supabase/migrations/`

**Naming Convention:**
```
YYYYMMDDHHMMSS_description.sql
```

**Example:**
```
20240101000000_init.sql
20240107000000_schema_reconciliation.sql
20240115120000_add_reviews_table.sql
```

## Pattern 1: Creating a Migration

**Using Supabase CLI:**

```bash
# Generate new migration file with timestamp
cd backend/supabase
supabase migration new add_reviews_table

# This creates:
# migrations/20240115120000_add_reviews_table.sql
```

**Manual Creation:**

```bash
# Generate timestamp
date -u +"%Y%m%d%H%M%S"  # Example output: 20240115120000

# Create file
touch backend/supabase/migrations/20240115120000_add_reviews_table.sql
```

## Pattern 2: Migration File Structure

**Template:**

```sql
-- Description: Brief explanation of what this migration does
-- Author: Your Name
-- Date: YYYY-MM-DD

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chef_id UUID NOT NULL REFERENCES chefs(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Customers can view own reviews" ON reviews
  FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create reviews for own orders" ON reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = customer_id AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = reviews.order_id
        AND orders.customer_id = auth.uid()
        AND orders.status = 'delivered'
    )
  );

CREATE POLICY "Customers can update own reviews" ON reviews
  FOR UPDATE
  USING (auth.uid() = customer_id);

CREATE POLICY "Chefs can view reviews for own dishes" ON reviews
  FOR SELECT
  USING (auth.uid() IN (
    SELECT profile_id FROM chefs WHERE id = reviews.chef_id
  ));

-- Indexes for performance
CREATE INDEX idx_reviews_order_id ON reviews(order_id);
CREATE INDEX idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX idx_reviews_chef_id ON reviews(chef_id);

-- Comments for documentation
COMMENT ON TABLE reviews IS 'Customer reviews for completed orders';
COMMENT ON COLUMN reviews.rating IS 'Rating from 1 to 5 stars';
```

## Pattern 3: Applying Migrations Locally

**Using Supabase CLI:**

```bash
cd backend/supabase

# Start local Supabase (includes PostgreSQL)
supabase start

# Apply all pending migrations
supabase db push

# Verify migrations applied
supabase db diff --schema public
```

**Manual Application (via psql):**

```bash
# Get connection string from Supabase dashboard
psql "postgresql://postgres:password@db.projectid.supabase.co:5432/postgres"

# Run migration manually
\i backend/supabase/migrations/20240115120000_add_reviews_table.sql
```

## Pattern 4: Zero-Downtime Migrations

**Problem:** Adding NOT NULL column to existing table with data causes downtime.

**Solution:** Multi-step migration.

**Step 1:** Add column as nullable

```sql
-- Migration: 20240120100000_add_delivery_notes_step1.sql
ALTER TABLE orders ADD COLUMN delivery_notes TEXT;
```

**Step 2:** Backfill existing rows

```sql
-- Migration: 20240120110000_add_delivery_notes_step2.sql
UPDATE orders SET delivery_notes = '' WHERE delivery_notes IS NULL;
```

**Step 3:** Add NOT NULL constraint

```sql
-- Migration: 20240120120000_add_delivery_notes_step3.sql
ALTER TABLE orders ALTER COLUMN delivery_notes SET NOT NULL;
```

**Alternative:** Use default value

```sql
ALTER TABLE orders ADD COLUMN delivery_notes TEXT NOT NULL DEFAULT '';
```

## Pattern 5: Modifying Existing Columns

**Renaming Column:**

```sql
-- Migration: 20240121000000_rename_price_to_price_cents.sql
ALTER TABLE dishes RENAME COLUMN price TO price_cents;

-- Update comments
COMMENT ON COLUMN dishes.price_cents IS 'Price in cents (e.g., 1599 = $15.99)';
```

**Changing Column Type:**

```sql
-- Migration: 20240122000000_change_phone_to_text.sql
ALTER TABLE profiles ALTER COLUMN phone TYPE TEXT USING phone::TEXT;
```

**Adding Constraint:**

```sql
-- Migration: 20240123000000_add_email_validation.sql
ALTER TABLE profiles ADD CONSTRAINT profiles_email_format_check
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
```

## Pattern 6: RLS Policy Updates

**Replacing Existing Policy:**

```sql
-- Migration: 20240125000000_update_orders_rls_policy.sql

-- Drop old policy
DROP POLICY IF EXISTS "Customers can view own orders" ON orders;

-- Create new policy with updated logic
CREATE POLICY "Customers can view own orders" ON orders
  FOR SELECT
  USING (
    auth.uid() = customer_id OR
    auth.uid() IN (
      SELECT profile_id FROM profiles WHERE role = 'admin'
    )
  );
```

**Adding Policy for New Role:**

```sql
-- Migration: 20240126000000_add_admin_orders_policy.sql
CREATE POLICY "Admins can manage all orders" ON orders
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );
```

## Pattern 7: Creating Indexes

**Single-Column Index:**

```sql
-- Migration: 20240127000000_add_orders_created_at_index.sql
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

**Composite Index:**

```sql
-- Migration: 20240128000000_add_orders_customer_status_index.sql
CREATE INDEX idx_orders_customer_status ON orders(customer_id, status);
```

**Partial Index (for specific queries):**

```sql
-- Migration: 20240129000000_add_active_orders_index.sql
CREATE INDEX idx_active_orders ON orders(chef_id, status)
  WHERE status IN ('placed', 'accepted', 'preparing', 'ready');
```

## Pattern 8: Seeding Data

**Development Seed Data:**

```sql
-- Migration: 20240130000000_seed_test_data.sql
-- Only run in development/staging

DO $$
BEGIN
  IF current_database() = 'postgres_dev' THEN
    -- Insert test users
    INSERT INTO profiles (id, email, name, role) VALUES
      ('user-customer-1', 'customer@test.com', 'Test Customer', 'customer'),
      ('user-chef-1', 'chef@test.com', 'Test Chef', 'chef'),
      ('user-driver-1', 'driver@test.com', 'Test Driver', 'driver'),
      ('user-admin-1', 'admin@test.com', 'Test Admin', 'admin')
    ON CONFLICT (id) DO NOTHING;

    -- Insert test chef
    INSERT INTO chefs (id, profile_id, bio, status) VALUES
      ('chef-1', 'user-chef-1', 'Professional chef with 10 years experience', 'approved')
    ON CONFLICT (id) DO NOTHING;

    -- Insert test dishes
    INSERT INTO dishes (id, chef_id, name, description, price_cents, available) VALUES
      ('dish-1', 'chef-1', 'Pasta Carbonara', 'Classic Italian pasta', 1599, true),
      ('dish-2', 'chef-1', 'Margherita Pizza', 'Fresh mozzarella and basil', 1299, true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
```

**Production Seed Data (Reference Data):**

```sql
-- Migration: 20240131000000_seed_cuisine_types.sql
CREATE TABLE IF NOT EXISTS cuisine_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

INSERT INTO cuisine_types (id, name, description) VALUES
  ('italian', 'Italian', 'Italian cuisine'),
  ('mexican', 'Mexican', 'Mexican cuisine'),
  ('chinese', 'Chinese', 'Chinese cuisine'),
  ('indian', 'Indian', 'Indian cuisine'),
  ('japanese', 'Japanese', 'Japanese cuisine')
ON CONFLICT (id) DO NOTHING;
```

## Pattern 9: Rolling Back Migrations

**Create Rollback Migration:**

```sql
-- Migration: 20240132000000_rollback_add_reviews_table.sql
-- Reverses 20240115120000_add_reviews_table.sql

DROP TABLE IF EXISTS reviews CASCADE;
```

**Using Supabase CLI:**

```bash
# View migration history
supabase migration list

# Create rollback by reversing specific migration
supabase migration repair --status reverted 20240115120000
```

**Manual Rollback (via psql):**

```bash
# Connect to database
psql "postgresql://..."

# Run rollback SQL manually
DROP TABLE reviews CASCADE;
```

## Pattern 10: Deploying to Production

**Using Supabase CLI:**

```bash
# Link to production project
supabase link --project-ref <project-id>

# Push migrations to production
supabase db push

# Verify migrations applied
supabase db remote commit
```

**Manual Deployment (Supabase Dashboard):**

1. Navigate to Supabase Dashboard → SQL Editor
2. Copy migration SQL
3. Run in SQL Editor
4. Verify in Database → Tables

**Best Practices:**
- Test migrations on staging first
- Create database backup before production deploy
- Run migrations during low-traffic periods
- Monitor logs after deployment

## Debugging Common Issues

### Issue: Migration fails with "relation already exists"

**Symptom:** `ERROR: relation "reviews" already exists`

**Cause:** Migration already applied or table created manually

**Fix:**
1. Add `IF NOT EXISTS` to CREATE statements:
   ```sql
   CREATE TABLE IF NOT EXISTS reviews (...);
   ```

2. Or check if table exists first:
   ```sql
   DO $$
   BEGIN
     IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'reviews') THEN
       CREATE TABLE reviews (...);
     END IF;
   END $$;
   ```

### Issue: RLS policy conflicts

**Symptom:** `ERROR: policy "name" for table "reviews" already exists`

**Cause:** Policy already exists from previous migration

**Fix:**
1. Drop policy first:
   ```sql
   DROP POLICY IF EXISTS "policy_name" ON table_name;
   CREATE POLICY "policy_name" ON table_name ...;
   ```

2. Or use `CREATE OR REPLACE` (PostgreSQL 15+):
   ```sql
   CREATE OR REPLACE POLICY "policy_name" ON table_name ...;
   ```

### Issue: Migration order incorrect

**Symptom:** Migration fails because dependent table doesn't exist

**Cause:** Migrations executed out of order

**Fix:**
1. Check migration timestamps (must be chronological)
2. Rename migration file to have correct timestamp
3. Ensure foreign key references exist before creating child table

### Issue: Can't apply migration locally

**Symptom:** `supabase db push` fails

**Cause:** Local Supabase not running or connection error

**Fix:**
```bash
# Stop and restart Supabase
supabase stop
supabase start

# Check status
supabase status

# Verify connection
psql "postgresql://postgres:postgres@localhost:54322/postgres"
```

## Migration Checklist

Before creating migration:
- [ ] Design schema change (draw ERD if complex)
- [ ] Consider backward compatibility
- [ ] Plan zero-downtime approach if needed
- [ ] Write migration SQL
- [ ] Add RLS policies for new tables
- [ ] Add indexes for common queries
- [ ] Test migration locally

After creating migration:
- [ ] Apply migration locally: `supabase db push`
- [ ] Verify table/column created: `\d table_name` in psql
- [ ] Test RLS policies with different users
- [ ] Check index usage: `EXPLAIN ANALYZE SELECT ...`
- [ ] Update TypeScript types in `packages/shared/src/types.ts`
- [ ] Write rollback migration if needed
- [ ] Deploy to staging first
- [ ] Deploy to production

## References

- Supabase migrations docs: https://supabase.com/docs/guides/cli/local-development#database-migrations
- PostgreSQL ALTER TABLE: https://www.postgresql.org/docs/current/sql-altertable.html
- RLS docs: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- RidenDine migrations: `backend/supabase/migrations/`
- Supabase CLI: https://supabase.com/docs/guides/cli
