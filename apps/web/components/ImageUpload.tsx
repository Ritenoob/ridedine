"use client";

import Image from "next/image";
import React, { useState, useRef } from "react";
import { uploadImage, isValidImageFile, resizeImage } from "@home-chef/shared";

interface ImageUploadProps {
  onUploadComplete: (path: string, url: string) => void;
  onError?: (error: string) => void;
  currentImageUrl?: string;
  bucketName: string;
  storagePath: string;
  supabaseClient: {
    storage: {
      from: (bucket: string) => {
        upload: (
          path: string,
          file: File,
          options?: { cacheControl?: string; upsert?: boolean }
        ) => Promise<{ data: { path: string } | null; error: Error | null }>;
        getPublicUrl: (path: string) => { data: { publicUrl: string } };
      };
    };
  };
  className?: string;
}

export default function ImageUpload({
  onUploadComplete,
  onError,
  currentImageUrl,
  bucketName,
  storagePath,
  supabaseClient,
  className = "",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!isValidImageFile(file.type)) {
      onError?.(`Invalid file type: ${file.type}. Only images are allowed.`);
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      onError?.(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max size is 5MB.`);
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      setProgress(30);

      // Resize image
      const resizedFile = await resizeImage(file, 1200);
      const fileToUpload = resizedFile || file;

      setProgress(50);

      // Upload to Supabase Storage
      const { data, error } = await uploadImage(
        supabaseClient,
        bucketName,
        storagePath,
        fileToUpload
      );

      if (error || !data) {
        throw error || new Error('Upload failed');
      }

      setProgress(90);

      // Get public URL
      const { data: urlData } = supabaseClient.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      setProgress(100);

      onUploadComplete(data.path, urlData.publicUrl);
    } catch (err: unknown) {
      console.error('Upload error:', err);
      const message = err instanceof Error ? err.message : 'Failed to upload image';
      onError?.(message);
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`image-upload ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        disabled={uploading}
        style={{ display: 'none' }}
      />

      {previewUrl ? (
        <div style={{ position: 'relative' }}>
          <Image
            src={previewUrl}
            alt="Preview"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          />
          {!uploading && (
            <button
              onClick={handleRemoveImage}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                padding: '4px 8px',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              Remove
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn btn-outline"
          style={{
            width: '100%',
            height: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            border: '2px dashed var(--border)',
            background: 'var(--bg-secondary)',
          }}
        >
          <div style={{ fontSize: 48 }}>📷</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Click to upload image
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            Max 5MB • JPEG, PNG, WebP, GIF
          </div>
        </button>
      )}

      {uploading && (
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              height: 4,
              background: 'var(--bg-secondary)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'var(--primary, #FF7A00)',
                width: `${progress}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              color: 'var(--text-secondary)',
              textAlign: 'center',
            }}
          >
            Uploading... {progress}%
          </div>
        </div>
      )}
    </div>
  );
}
