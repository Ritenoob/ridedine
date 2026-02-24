-- Migration: Auto-Assignment Pipeline
-- Created: 2024-01-15
-- Purpose: Automatically create deliveries and assign drivers when orders become 'ready'

-- Enable pg_net extension for HTTP calls from database triggers
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create atomic driver assignment function (race-safe with SELECT FOR UPDATE SKIP LOCKED)
CREATE OR REPLACE FUNCTION assign_driver_atomic(
  p_driver_id UUID,
  p_delivery_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Lock the driver row with SKIP LOCKED to prevent concurrent assignments
  -- If the driver is already locked by another transaction, this will skip it
  PERFORM 1
  FROM drivers
  WHERE id = p_driver_id
    AND is_available = true
  FOR UPDATE SKIP LOCKED;

  -- If we couldn't lock the driver (already taken), abort
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Driver % is not available or already locked', p_driver_id;
  END IF;

  -- Update driver availability
  UPDATE drivers
  SET is_available = false
  WHERE id = p_driver_id;

  -- Update delivery assignment
  UPDATE deliveries
  SET
    driver_id = p_driver_id,
    status = 'assigned'
  WHERE id = p_delivery_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION assign_driver_atomic TO service_role;
GRANT EXECUTE ON FUNCTION assign_driver_atomic TO authenticated;

-- Trigger function for auto-assignment when order becomes 'ready'
CREATE OR REPLACE FUNCTION auto_assign_delivery()
RETURNS TRIGGER AS $$
DECLARE
  v_chef_lat DOUBLE PRECISION;
  v_chef_lng DOUBLE PRECISION;
  v_chef_address TEXT;
  v_customer_lat DOUBLE PRECISION;
  v_customer_lng DOUBLE PRECISION;
  v_customer_address TEXT;
  v_delivery_id UUID;
  v_supabase_url TEXT;
  v_service_role_key TEXT;
BEGIN
  -- Only process when order status changes to 'ready'
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'ready' THEN

    -- Duplicate guard: Check if delivery already exists for this order
    IF EXISTS (SELECT 1 FROM deliveries WHERE order_id = NEW.id) THEN
      RAISE NOTICE 'Delivery already exists for order %', NEW.id;
      RETURN NEW;
    END IF;

    -- Get chef location from chefs table
    SELECT c.lat, c.lng, c.address
    INTO v_chef_lat, v_chef_lng, v_chef_address
    FROM chefs c
    WHERE c.profile_id = NEW.chef_id;

    -- CRITICAL: Validate chef has lat/lng set
    -- If NULL, revert order to 'preparing' and abort
    IF v_chef_lat IS NULL OR v_chef_lng IS NULL THEN
      UPDATE orders
      SET status = 'preparing'
      WHERE id = NEW.id;

      -- TODO: Insert notification for chef to set delivery address
      RAISE NOTICE 'Chef must set delivery address before marking order ready. Order % reverted to preparing.', NEW.id;
      RETURN NEW;
    END IF;

    -- Get customer delivery address from order
    -- Assuming customer lat/lng are stored in profiles or orders table
    -- For now, using placeholder - this should be adapted to actual schema
    SELECT delivery_lat, delivery_lng, delivery_address
    INTO v_customer_lat, v_customer_lng, v_customer_address
    FROM orders
    WHERE id = NEW.id;

    -- Validate customer address exists
    IF v_customer_lat IS NULL OR v_customer_lng IS NULL THEN
      RAISE NOTICE 'Customer delivery address missing for order %', NEW.id;
      RETURN NEW;
    END IF;

    -- Create delivery record with status='pending' (will be assigned by edge function)
    INSERT INTO deliveries (
      order_id,
      status,
      pickup_address,
      pickup_lat,
      pickup_lng,
      dropoff_address,
      dropoff_lat,
      dropoff_lng,
      delivery_fee_cents
    )
    VALUES (
      NEW.id,
      'pending',  -- Status 'pending' now allowed (added in migration 20240114)
      v_chef_address,
      v_chef_lat,
      v_chef_lng,
      v_customer_address,
      v_customer_lat,
      v_customer_lng,
      500  -- Default delivery fee $5.00
    )
    RETURNING id INTO v_delivery_id;

    -- Get Supabase configuration from environment
    -- These should be set via `ALTER DATABASE postgres SET app.supabase_url = '...'`
    v_supabase_url := current_setting('app.supabase_url', true);
    v_service_role_key := current_setting('app.service_role_key', true);

    -- Fallback to environment variables if database settings not configured
    IF v_supabase_url IS NULL OR v_service_role_key IS NULL THEN
      RAISE NOTICE 'Supabase configuration not set. Edge function will not be called automatically.';
      RAISE NOTICE 'Set via: ALTER DATABASE postgres SET app.supabase_url = ''...'';';
      RETURN NEW;
    END IF;

    -- Call assign_driver edge function via pg_net (asynchronous HTTP call)
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/assign_driver',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_role_key
      ),
      body := jsonb_build_object(
        'delivery_id', v_delivery_id
      )
    );

    RAISE NOTICE 'Auto-assignment triggered for delivery %', v_delivery_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trigger_auto_assign_delivery ON orders;
CREATE TRIGGER trigger_auto_assign_delivery
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_delivery();

-- Grant execute permission on trigger function
GRANT EXECUTE ON FUNCTION auto_assign_delivery TO service_role;
GRANT EXECUTE ON FUNCTION auto_assign_delivery TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION assign_driver_atomic IS 'Race-safe driver assignment using SELECT FOR UPDATE SKIP LOCKED';
COMMENT ON FUNCTION auto_assign_delivery IS 'Automatically creates delivery and calls assign_driver when order status → ready';
COMMENT ON TRIGGER trigger_auto_assign_delivery ON orders IS 'Fires auto-assignment pipeline when order becomes ready';

-- Instructions for configuration (to be run manually):
-- ALTER DATABASE postgres SET app.supabase_url = 'https://your-project.supabase.co';
-- ALTER DATABASE postgres SET app.service_role_key = 'your-service-role-key';
