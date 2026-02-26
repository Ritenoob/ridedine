-- Migration: Add Storage Buckets for Image Uploads
-- Created: 2024-01-07
-- Description: Creates storage buckets for chef photos, dish photos, and delivery proof images
-- Implements RLS policies for public read access and authenticated upload

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('chef-photos', 'chef-photos', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']),
  ('dish-photos', 'dish-photos', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']),
  ('delivery-proof', 'delivery-proof', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for chef-photos bucket

-- Allow public read access to chef photos
CREATE POLICY "chef_photos_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chef-photos');

-- Allow authenticated chefs to upload their own photos
CREATE POLICY "chef_photos_authenticated_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chef-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow chefs to update their own photos
CREATE POLICY "chef_photos_authenticated_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chef-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow chefs to delete their own photos
CREATE POLICY "chef_photos_authenticated_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chef-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policies for dish-photos bucket

-- Allow public read access to dish photos
CREATE POLICY "dish_photos_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'dish-photos');

-- Allow authenticated chefs to upload dish photos
CREATE POLICY "dish_photos_authenticated_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dish-photos'
  AND EXISTS (
    SELECT 1 FROM public.dishes
    WHERE id::text = (storage.foldername(name))[1]
    AND chef_id = auth.uid()
  )
);

-- Allow chefs to update their dish photos
CREATE POLICY "dish_photos_authenticated_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'dish-photos'
  AND EXISTS (
    SELECT 1 FROM public.dishes
    WHERE id::text = (storage.foldername(name))[1]
    AND chef_id = auth.uid()
  )
);

-- Allow chefs to delete their dish photos
CREATE POLICY "dish_photos_authenticated_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'dish-photos'
  AND EXISTS (
    SELECT 1 FROM public.dishes
    WHERE id::text = (storage.foldername(name))[1]
    AND chef_id = auth.uid()
  )
);

-- RLS Policies for delivery-proof bucket

-- Allow authenticated read access to delivery proof (not public)
CREATE POLICY "delivery_proof_authenticated_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'delivery-proof');

-- Allow drivers to upload delivery proof for any order (they are assigned through backend logic)
CREATE POLICY "delivery_proof_driver_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'delivery-proof'
  AND EXISTS (
    SELECT 1 FROM public.drivers
    WHERE profile_id = auth.uid()
  )
);

-- Allow drivers to update delivery proof
CREATE POLICY "delivery_proof_driver_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'delivery-proof'
  AND EXISTS (
    SELECT 1 FROM public.drivers
    WHERE profile_id = auth.uid()
  )
);
