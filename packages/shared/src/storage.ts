/**
 * Supabase Storage utilities for image uploads
 */

export const STORAGE_BUCKETS = {
  CHEF_PHOTOS: 'chef-photos',
  DISH_PHOTOS: 'dish-photos',
  DELIVERY_PROOF: 'delivery-proof',
} as const;

/**
 * Generate public URL for chef photo
 */
export function getChefPhotoUrl(
  supabaseUrl: string,
  chefId: string,
  filename: string
): string | null {
  if (!supabaseUrl || !chefId || !filename) return null;

  return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKETS.CHEF_PHOTOS}/${chefId}/${filename}`;
}

/**
 * Generate public URL for dish photo
 */
export function getDishPhotoUrl(
  supabaseUrl: string,
  dishId: string,
  filename: string
): string | null {
  if (!supabaseUrl || !dishId || !filename) return null;

  return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKETS.DISH_PHOTOS}/${dishId}/${filename}`;
}

/**
 * Generate public URL for delivery proof photo
 */
export function getDeliveryProofUrl(
  supabaseUrl: string,
  orderId: string,
  filename: string
): string | null {
  if (!supabaseUrl || !orderId || !filename) return null;

  return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKETS.DELIVERY_PROOF}/${orderId}/${filename}`;
}

/**
 * Generate storage path with unique timestamp
 */
export function getStoragePath(folder: string, filename: string): string {
  const timestamp = Date.now();
  return `${folder}/${timestamp}-${filename}`;
}

/**
 * Validate image file type
 */
export function isValidImageFile(mimeType: string): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  return validTypes.includes(mimeType);
}

/**
 * Resize image to max width (browser only)
 * Returns null in non-browser environments
 */
export async function resizeImage(
  file: File,
  maxWidth: number = 1200
): Promise<File | null> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Check if resizing is needed
        if (img.width <= maxWidth) {
          resolve(file);
          return;
        }

        // Calculate new dimensions
        const ratio = maxWidth / img.width;
        const newWidth = maxWidth;
        const newHeight = img.height * ratio;

        // Create canvas and resize
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          0.9
        );
      };

      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadImage(
  supabaseClient: {
    storage: {
      from: (bucket: string) => {
        upload: (
          path: string,
          file: File,
          options?: { cacheControl?: string; upsert?: boolean }
        ) => Promise<{ data: { path: string } | null; error: Error | null }>;
      };
    };
  },
  bucket: string,
  path: string,
  file: File
): Promise<{ data: { path: string } | null; error: Error | null }> {
  try {
    // Validate file type
    if (!isValidImageFile(file.type)) {
      return {
        data: null,
        error: new Error(`Invalid file type: ${file.type}. Only images are allowed.`),
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        data: null,
        error: new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max size is 5MB.`),
      };
    }

    // Resize image if needed
    let fileToUpload = file;
    if (typeof window !== 'undefined') {
      const resized = await resizeImage(file);
      if (resized) {
        fileToUpload = resized;
      }
    }

    // Upload to Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(path, fileToUpload, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error during upload'),
    };
  }
}
