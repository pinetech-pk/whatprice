/**
 * ImageKit Service
 *
 * Handles image operations with ImageKit CDN
 */

import ImageKit from 'imagekit';

let imagekit: ImageKit | null = null;

function getImageKit(): ImageKit | null {
  if (!imagekit) {
    if (!process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY ||
        !process.env.IMAGEKIT_PRIVATE_KEY ||
        !process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT) {
      console.warn('[ImageKit] Not configured - missing environment variables');
      return null;
    }
    imagekit = new ImageKit({
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
    });
  }
  return imagekit;
}

/**
 * Extract ImageKit file ID from URL
 * ImageKit URLs typically look like: https://ik.imagekit.io/your_id/path/to/file.jpg
 * The file ID can be extracted from the URL or we need to search by URL
 */
function extractFileIdFromUrl(url: string): string | null {
  if (!url) return null;

  // ImageKit URLs contain the file path after the URL endpoint
  // We need to extract the path portion
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  if (!urlEndpoint || !url.includes(urlEndpoint)) {
    return null;
  }

  // Extract the path after the endpoint
  const path = url.replace(urlEndpoint, '').replace(/^\//, '');
  return path || null;
}

/**
 * Delete a single image from ImageKit by URL
 */
export async function deleteImageByUrl(imageUrl: string): Promise<boolean> {
  const ik = getImageKit();
  if (!ik) {
    console.warn('[ImageKit] Cannot delete - not configured');
    return false;
  }

  try {
    const filePath = extractFileIdFromUrl(imageUrl);
    if (!filePath) {
      console.warn(`[ImageKit] Could not extract file path from URL: ${imageUrl}`);
      return false;
    }

    // Search for the file by name/path to get its fileId
    const files = await ik.listFiles({
      name: filePath.split('/').pop() || '',
      limit: 1,
    });

    if (files.length === 0) {
      console.warn(`[ImageKit] File not found: ${filePath}`);
      return false;
    }

    // Check if it's a file (has fileId) not a folder
    const file = files[0];
    if (!('fileId' in file)) {
      console.warn(`[ImageKit] Found folder instead of file: ${filePath}`);
      return false;
    }

    // Delete by fileId
    await ik.deleteFile(file.fileId);
    console.log(`[ImageKit] Deleted file: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`[ImageKit] Error deleting image ${imageUrl}:`, error);
    return false;
  }
}

/**
 * Delete multiple images from ImageKit
 * Returns count of successfully deleted images
 */
export async function deleteImages(imageUrls: string[]): Promise<{ deleted: number; failed: number }> {
  const ik = getImageKit();
  if (!ik) {
    console.warn('[ImageKit] Cannot delete - not configured');
    return { deleted: 0, failed: imageUrls.length };
  }

  let deleted = 0;
  let failed = 0;

  for (const url of imageUrls) {
    if (!url || !url.includes('imagekit')) {
      // Skip non-ImageKit URLs
      continue;
    }

    const success = await deleteImageByUrl(url);
    if (success) {
      deleted++;
    } else {
      failed++;
    }
  }

  return { deleted, failed };
}

/**
 * Delete all images in a folder (for bulk cleanup)
 */
export async function deleteFolder(folderPath: string): Promise<boolean> {
  const ik = getImageKit();
  if (!ik) {
    console.warn('[ImageKit] Cannot delete folder - not configured');
    return false;
  }

  try {
    await ik.deleteFolder(folderPath);
    console.log(`[ImageKit] Deleted folder: ${folderPath}`);
    return true;
  } catch (error) {
    console.error(`[ImageKit] Error deleting folder ${folderPath}:`, error);
    return false;
  }
}

/**
 * Bulk delete files by fileIds
 */
export async function bulkDeleteByIds(fileIds: string[]): Promise<{ deleted: number; failed: number }> {
  const ik = getImageKit();
  if (!ik || fileIds.length === 0) {
    return { deleted: 0, failed: fileIds.length };
  }

  try {
    // ImageKit supports bulk delete
    await ik.bulkDeleteFiles(fileIds);
    console.log(`[ImageKit] Bulk deleted ${fileIds.length} files`);
    return { deleted: fileIds.length, failed: 0 };
  } catch (error) {
    console.error('[ImageKit] Bulk delete error:', error);
    return { deleted: 0, failed: fileIds.length };
  }
}
