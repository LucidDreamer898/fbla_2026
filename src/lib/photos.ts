/**
 * Photo Storage Utilities
 * 
 * This module provides utilities for working with Supabase Storage
 * for item photos. All photo access uses signed URLs for security.
 * 
 * Security Model:
 * - The item-photos bucket is PRIVATE
 * - Photos are only accessible via time-limited signed URLs
 * - Signed URLs are generated server-side using the service role key
 * - This prevents unauthorized access and hotlinking
 */

import { createClient } from '@supabase/supabase-js';
import { env, serverEnv } from './env';

/**
 * Create a Supabase client with service role key (server-side only)
 * This client has admin privileges and can generate signed URLs
 */
function getSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAdmin() can only be called server-side');
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Generate a signed URL for an item photo
 * 
 * @param photoPath - The path to the photo in the storage bucket
 *                   Format: "items/{clerk_user_id}/{filename}"
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns A signed URL that can be used to access the photo
 * 
 * @example
 * const url = await getItemPhotoUrl('items/user_123/photo.jpg');
 * // Returns: https://xxxxx.supabase.co/storage/v1/object/sign/item-photos/items/user_123/photo.jpg?token=...
 */
export async function getItemPhotoUrl(
  photoPath: string,
  expiresIn: number = 3600
): Promise<string> {
  if (typeof window !== 'undefined') {
    throw new Error('getItemPhotoUrl() can only be called server-side');
  }

  if (!photoPath) {
    throw new Error('Photo path is required');
  }

  // Validate path format: should start with "items/"
  if (!photoPath.startsWith('items/')) {
    throw new Error(`Invalid photo path format. Expected "items/{user_id}/{filename}", got: ${photoPath}`);
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.storage
    .from('item-photos')
    .createSignedUrl(photoPath, expiresIn);

  if (error) {
    console.error('Error generating signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }

  if (!data?.signedUrl) {
    throw new Error('Failed to generate signed URL: No URL returned');
  }

  return data.signedUrl;
}

/**
 * Generate signed URLs for multiple item photos
 * 
 * @param photoPaths - Array of photo paths
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Map of photo paths to signed URLs
 */
export async function getItemPhotoUrls(
  photoPaths: string[],
  expiresIn: number = 3600
): Promise<Map<string, string>> {
  if (typeof window !== 'undefined') {
    throw new Error('getItemPhotoUrls() can only be called server-side');
  }

  const supabase = getSupabaseAdmin();
  const urlMap = new Map<string, string>();

  // Generate signed URLs in parallel
  const promises = photoPaths.map(async (path) => {
    if (!path) return;
    
    try {
      const url = await getItemPhotoUrl(path, expiresIn);
      urlMap.set(path, url);
    } catch (error) {
      console.error(`Failed to generate signed URL for ${path}:`, error);
      // Continue with other photos even if one fails
    }
  });

  await Promise.all(promises);

  return urlMap;
}

/**
 * Generate a signed URL for an item's photo_path field
 * Handles null/empty photo_path gracefully
 * 
 * @param photoPath - The photo_path from the items table (can be null/empty)
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL if photoPath exists, null otherwise
 */
export async function getItemPhotoUrlSafe(
  photoPath: string | null | undefined,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!photoPath) {
    return null;
  }

  try {
    return await getItemPhotoUrl(photoPath, expiresIn);
  } catch (error) {
    console.error('Error generating signed URL for photo:', error);
    return null; // Return null on error to prevent breaking the UI
  }
}

/**
 * Upload a photo to the item-photos bucket
 * 
 * @param file - The file to upload
 * @param clerkUserId - The Clerk user ID (used in path)
 * @param filename - Optional custom filename (defaults to file.name)
 * @returns The path to the uploaded photo
 * 
 * @example
 * const path = await uploadItemPhoto(file, 'user_123');
 * // Returns: "items/user_123/photo.jpg"
 */
export async function uploadItemPhoto(
  file: File,
  clerkUserId: string,
  filename?: string
): Promise<string> {
  if (typeof window !== 'undefined') {
    throw new Error('uploadItemPhoto() can only be called server-side');
  }

  if (!clerkUserId) {
    throw new Error('Clerk user ID is required');
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
  }

  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error(`File size exceeds 5MB limit. Got: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  const supabase = getSupabaseAdmin();
  const finalFilename = filename || file.name;
  const path = `items/${clerkUserId}/${finalFilename}`;

  // Convert File to ArrayBuffer for Supabase
  const arrayBuffer = await file.arrayBuffer();
  const { data, error } = await supabase.storage
    .from('item-photos')
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false, // Don't overwrite existing files
    });

  if (error) {
    console.error('Error uploading photo:', error);
    throw new Error(`Failed to upload photo: ${error.message}`);
  }

  if (!data?.path) {
    throw new Error('Failed to upload photo: No path returned');
  }

  return data.path;
}

/**
 * Delete a photo from the item-photos bucket
 * 
 * @param photoPath - The path to the photo to delete
 */
export async function deleteItemPhoto(photoPath: string): Promise<void> {
  if (typeof window !== 'undefined') {
    throw new Error('deleteItemPhoto() can only be called server-side');
  }

  if (!photoPath) {
    return; // Nothing to delete
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage
    .from('item-photos')
    .remove([photoPath]);

  if (error) {
    console.error('Error deleting photo:', error);
    throw new Error(`Failed to delete photo: ${error.message}`);
  }
}
