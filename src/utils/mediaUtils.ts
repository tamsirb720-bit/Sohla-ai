/**
 * Utility functions for compressing, resizing, and processing images & media files
 * for SOHLA Admin direct device/gallery upload.
 * Preserves high visual fidelity while reducing payload size for fast mobile uploads and safe persistence.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 - 1.0
  mimeType?: string;
}

/**
 * Resizes and compresses an image File from the device camera/gallery into a base64 Data URL.
 */
export async function compressImageFile(
  file: File,
  options: CompressOptions = {}
): Promise<string> {
  const {
    maxWidth = 1600,
    maxHeight = 1200,
    quality = 0.82,
    mimeType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    // If SVG or GIF, preserve raw data URL to maintain vector sharpness/animations
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calculate scaled dimensions keeping aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to raw data url if canvas context unavailable
          resolve(e.target?.result as string);
          return;
        }

        // Clean rendering smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized compressed base64 data URL
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      };

      img.onerror = () => {
        // Fallback to raw data url if image failed to load in element
        resolve(e.target?.result as string);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read image file from device'));
    reader.readAsDataURL(file);
  });
}

/**
 * Processes multiple image files from the device gallery/file picker sequentially or in parallel.
 */
export async function compressMultipleImageFiles(
  files: FileList | File[],
  options: CompressOptions = {}
): Promise<string[]> {
  const fileArray = Array.from(files);
  const results: string[] = [];

  for (const file of fileArray) {
    if (!file.type.startsWith('image/')) continue;
    try {
      const compressed = await compressImageFile(file, options);
      results.push(compressed);
    } catch (err) {
      console.warn('Failed to process photo file:', file.name, err);
    }
  }

  return results;
}

/**
 * Reads a video file (MP4, WebM, QuickTime) into a Data URL.
 * Checks max file size (default 30MB) to protect browser memory.
 */
export async function readVideoFile(
  file: File,
  maxSizeBytes: number = 30 * 1024 * 1024
): Promise<{ dataUrl: string; sizeKb: number; name: string }> {
  if (file.size > maxSizeBytes) {
    throw new Error(`Video file is too large (${Math.round(file.size / (1024 * 1024))}MB). Please choose a video under 30MB.`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        dataUrl: reader.result as string,
        sizeKb: Math.round(file.size / 1024),
        name: file.name
      });
    };
    reader.onerror = () => reject(new Error('Failed to read video file'));
    reader.readAsDataURL(file);
  });
}
