/**
 * Client-side image processing utility
 * Resizes images, strips metadata, and compresses before upload
 */

interface ProcessImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
}

/**
 * Process an image file: resize, strip metadata, and compress
 * @param file - The original image file
 * @param options - Processing options
 * @returns Processed image as a File object
 */
export async function processImage(
  file: File,
  options: ProcessImageOptions = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.92,
    outputFormat = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw image to canvas (this strips all EXIF metadata)
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }

            // Create a new File object from the blob
            const processedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '.jpg'), // Change extension to .jpg
              { type: outputFormat }
            );

            resolve(processedFile);
          },
          outputFormat,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Process multiple images in parallel
 * @param files - Array of image files
 * @param options - Processing options
 * @returns Array of processed image files
 */
export async function processMultipleImages(
  files: File[],
  options: ProcessImageOptions = {}
): Promise<File[]> {
  const processPromises = files.map(file => processImage(file, options));
  return Promise.all(processPromises);
}

/**
 * Get file size reduction percentage
 * @param originalSize - Original file size in bytes
 * @param newSize - New file size in bytes
 * @returns Percentage reduction as a string
 */
export function getSizeReduction(originalSize: number, newSize: number): string {
  const reduction = ((originalSize - newSize) / originalSize) * 100;
  return `${Math.round(reduction)}%`;
}

/**
 * Format bytes to human-readable size
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.2 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}