---
name: supabase-rls-patterns
description: |
  Master Supabase Row Level Security (RLS) for RidenDine. Use when: (1) adding new tables,
  (2) modifying RLS policies, (3) debugging access control issues, (4) role-based data access.
  Key insight: All tables use RLS with role-based policies from profiles.role column.
author: Claude Code
version: 1.0.0
---

# Supabase RLS Patterns

## Problem

Supabase Row Level Security (RLS) controls who can see and modify database rows. RidenDine uses role-based RLS policies for 4 roles: customer, chef, driver, admin.

## Context / Trigger Conditions

Use this skill when:
- Creating new database tables (must add RLS policies)
- Users report "Row not found" or permission errors
- Adding new features that touch database
- Debugging data access issues
- Implementing role-based access control

## RidenDine RLS Architecture

**Role Hierarchy:**
- `customer`: Can see own orders, all approved chefs, all dishes
- `chef`: Can manage own dishes, see assigned orders, update own profile
- `driver`: Can see assigned deliveries, update delivery status
- `admin`: Elevated access for management (view all, manage chefs/drivers)

**Pattern:** All policies check `auth.uid()` (current user's ID) against foreign keys or profiles.role.

## Common RLS Patterns

### Pattern 1: Own Data Only (Orders, Profiles)

```sql
-- Customers can only see their own orders
CREATE POLICY "Customers can view own orders" ON orders
  FOR SELECT
  USING (auth.uid() = customer_id);

-- Chefs can manage own dishes
CREATE POLICY "Chefs can manage own dishes" ON dishes
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT profile_id FROM chefs WHERE id = dishes.chef_id
    )
  );
```

### Pattern 2: Public Read, Auth Write (Chefs, Dishes)

```sql
-- Anyone can read approved chefs
CREATE POLICY "Public can view approved chefs" ON chefs
  FOR SELECT
  USING (status = 'approved');

-- Only chef can update own profile
CREATE POLICY "Chefs can update own profile" ON chefs
  FOR UPDATE
  USING (auth.uid() = profile_id);
```

### Pattern 3: Role-Based Access (Admin)

```sql
-- Admins can manage chefs
CREATE POLICY "Admins can manage chefs" ON chefs
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );
```

### Pattern 4: Delivery Assignment (Driver)

```sql
-- Drivers can see assigned deliveries
CREATE POLICY "Drivers can view assigned deliveries" ON deliveries
  FOR SELECT
  USING (
    driver_id IS NOT NULL AND
    auth.uid() IN (
      SELECT profile_id FROM drivers WHERE id = deliveries.driver_id
    )
  );
```

## Creating RLS Policies for New Tables

**Step-by-step:**

1. **Enable RLS:**
   ```sql
   ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
   ```

2. **Add SELECT policy for each role:**
   ```sql
   CREATE POLICY "role_can_view" ON table_name
     FOR SELECT
     USING (condition_based_on_role);
   ```

3. **Add INSERT/UPDATE/DELETE policies:**
   ```sql
   CREATE POLICY "role_can_insert" ON table_name
     FOR INSERT
     WITH CHECK (condition);
   ```

4. **Test with different roles:**
   ```sql
   -- Simulate user context
   SELECT set_config('request.jwt.claims', '{"sub": "user-uuid", "role": "customer"}', TRUE);
   SELECT * FROM table_name; -- Should respect RLS
   ```

## Debugging RLS Issues

### Symptom: "Row not found" error

**Cause:** RLS policy blocking access

**Fix:**
1. Check which user is authenticated: `SELECT auth.uid();`
2. Verify policy matches user's data: `SELECT * FROM profiles WHERE id = auth.uid();`
3. Review policy condition in migration file: `backend/supabase/migrations/`

### Symptom: No rows returned (expect data)

**Cause:** Policy condition too restrictive

**Fix:**
1. Temporarily disable RLS for testing: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`
2. Query returns data? Policy is the issue
3. Re-enable RLS: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
4. Fix policy condition

### Symptom: Supabase client error "permission denied"

**Cause:** Missing policy for operation (INSERT/UPDATE/DELETE)

**Fix:**
1. Check migration - does policy exist for the operation?
2. Add missing policy with `WITH CHECK` for INSERT/UPDATE

## Example: Add Favorites Table with RLS

```sql
-- Create table
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  favoritable_type TEXT NOT NULL CHECK (favoritable_type IN ('chef', 'dish')),
  favoritable_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Users can view own favorites
CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add favorites
CREATE POLICY "Users can add favorites" ON favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete own favorites
CREATE POLICY "Users can delete own favorites" ON favorites
  FOR DELETE
  USING (auth.uid() = user_id);
```

## Verification

After adding RLS policies:

1. **Test with Supabase client:**
   ```typescript
   const { data, error } = await supabase.from('table_name').select();
   if (error) console.error('RLS blocked:', error.message);
   ```

2. **Test each role:**
   - Log in as customer, try to access chef-only data (should fail)
   - Log in as chef, try to access another chef's dishes (should fail)
   - Log in as admin, try to access all data (should succeed)

3. **Check policies in Supabase dashboard:**
   - Navigate to Database → Policies
   - Verify policies exist for all roles + operations

## References

- Supabase RLS docs: https://supabase.com/docs/guides/auth/row-level-security
- RidenDine migrations: `backend/supabase/migrations/`
- Profiles table: `backend/supabase/migrations/20240101000000_init.sql`
