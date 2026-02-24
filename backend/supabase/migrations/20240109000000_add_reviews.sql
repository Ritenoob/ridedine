-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chef_id UUID NOT NULL REFERENCES chefs(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(order_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_reviews_chef_id ON reviews(chef_id);
CREATE INDEX idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX idx_reviews_order_id ON reviews(order_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
CREATE POLICY "anyone_can_view_reviews"
ON reviews FOR SELECT
USING (true);

CREATE POLICY "customers_can_create_own_reviews"
ON reviews FOR INSERT TO authenticated
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "customers_can_update_own_reviews"
ON reviews FOR UPDATE TO authenticated
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "customers_can_delete_own_reviews"
ON reviews FOR DELETE TO authenticated
USING (auth.uid() = customer_id);

-- Add rating column to chefs table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chefs' AND column_name = 'rating'
  ) THEN
    ALTER TABLE chefs ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.00;
    ALTER TABLE chefs ADD COLUMN review_count INTEGER DEFAULT 0;
  END IF;
END$$;

-- Function to update chef rating
CREATE OR REPLACE FUNCTION update_chef_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update chef's average rating and review count
  UPDATE chefs
  SET
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE chef_id = COALESCE(NEW.chef_id, OLD.chef_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE chef_id = COALESCE(NEW.chef_id, OLD.chef_id)
    )
  WHERE id = COALESCE(NEW.chef_id, OLD.chef_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update chef rating on review insert/update/delete
DROP TRIGGER IF EXISTS trigger_update_chef_rating_on_insert ON reviews;
CREATE TRIGGER trigger_update_chef_rating_on_insert
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_chef_rating();

DROP TRIGGER IF EXISTS trigger_update_chef_rating_on_update ON reviews;
CREATE TRIGGER trigger_update_chef_rating_on_update
AFTER UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_chef_rating();

DROP TRIGGER IF EXISTS trigger_update_chef_rating_on_delete ON reviews;
CREATE TRIGGER trigger_update_chef_rating_on_delete
AFTER DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_chef_rating();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_reviews_updated_at_trigger ON reviews;
CREATE TRIGGER update_reviews_updated_at_trigger
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_reviews_updated_at();
