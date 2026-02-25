# Supabase Setup (Current)

This guide replaces the older SQL-only setup file and reflects the migrations in
`backend/supabase/migrations/`.

## Recommended: Supabase CLI

```bash
# Install CLI
npm install -g supabase

# Login and link project
cd backend/supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Apply all migrations
supabase db push
```

## Manual SQL (If CLI is not available)

Run the migrations in lexicographical order (as in `backend/supabase/migrations/`):

1. `backend/supabase/migrations/20240101000000_initial_schema.sql`
2. `backend/supabase/migrations/20240102000000_enhanced_schema.sql`
3. `backend/supabase/migrations/20240103000000_seed_data.sql`
4. `backend/supabase/migrations/20240104000000_add_missing_features.sql`
5. `backend/supabase/migrations/20240105000000_add_payment_tracking.sql`
6. `backend/supabase/migrations/20240106000000_add_commission_system.sql`
7. `backend/supabase/migrations/20240107000000_schema_reconciliation.sql`
8. `backend/supabase/migrations/20240107000000_add_storage_buckets.sql`
9. `backend/supabase/migrations/20240108000000_add_favorites.sql`
10. `backend/supabase/migrations/20240109000000_add_reviews.sql`
11. `backend/supabase/migrations/20240110000000_add_push_tokens.sql`
12. `backend/supabase/migrations/20240111000000_enhance_driver_module.sql`
13. `backend/supabase/migrations/20240112000000_add_location_indexes.sql`
14. `backend/supabase/migrations/20240113000000_add_audit_log.sql`
15. `backend/supabase/migrations/20240114000000_add_driver_scoring.sql`
16. `backend/supabase/migrations/20240115000000_auto_assignment_pipeline.sql`
17. `backend/supabase/migrations/20240116000000_fix_driver_id_fk.sql`
18. `backend/supabase/migrations/20240117000000_add_geocode_cache.sql`
19. `backend/supabase/migrations/20240118000000_add_route_cache.sql`

## Notes

- The `backend/supabase/migrations/20240116000000_fix_driver_id_fk.sql` migration
  corrects `deliveries.driver_id` to reference `drivers(id)`.
- Do not use the old `SETUP_SUPABASE.sql` file (it has been removed).
