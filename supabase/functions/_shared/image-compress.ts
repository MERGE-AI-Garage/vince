// ABOUTME: Pure-JS PNG-to-JPEG compression for podcast cover images.
// ABOUTME: Apple Podcasts requires artwork under 512KB — raw Gemini PNGs are 5-7MB.

import UPNG from "npm:upng-js@2.1.0";
import jpeg from "npm:jpeg-js@0.4.4";

/**
 * Convert PNG bytes to JPEG at the given quality (1-100).
 * Strips alpha channel automatically — Apple Podcasts requires no transparency.
 * Returns JPEG bytes typically 200-400KB for 2048×2048 artwork.
 */
export function pngToJpeg(pngBytes: Uint8Array, quality: number = 85): Uint8Array {
  const png = UPNG.decode(pngBytes.buffer);
  const frames = UPNG.toRGBA8(png);
  const rgba = new Uint8Array(frames[0]);

  const rawImageData = {
    data: rgba,
    width: png.width,
    height: png.height,
  };

  const jpegData = jpeg.encode(rawImageData, quality);
  return new Uint8Array(jpegData.data);
}

/**
 * Compress image bytes if they exceed the size limit.
 * Apple Podcasts requires artwork under 512KB.
 * Returns { bytes, mimeType } — JPEG if compressed, original if already small enough.
 */
export function compressForPodcast(
  imageBytes: Uint8Array,
  originalMimeType: string,
  maxBytes: number = 450_000, // aim below 512KB with margin
): { bytes: Uint8Array; mimeType: string } {
  // Already small enough — return as-is
  if (imageBytes.length <= maxBytes) {
    console.log(`COMPRESS: Image already under limit (${(imageBytes.length / 1024).toFixed(0)}KB)`);
    return { bytes: imageBytes, mimeType: originalMimeType };
  }

  console.log(`COMPRESS: Image is ${(imageBytes.length / 1024).toFixed(0)}KB, converting to JPEG...`);

  // If it's already JPEG, return as-is
  if (originalMimeType.includes('jpeg') || originalMimeType.includes('jpg')) {
    console.log('COMPRESS: Already JPEG, returning as-is');
    return { bytes: imageBytes, mimeType: originalMimeType };
  }

  // Convert PNG to JPEG — wrapped in try/catch because 2048×2048 decode
  // requires ~16MB RAM which can exceed Supabase edge function limits
  try {
    let quality = 88;
    let compressed = pngToJpeg(imageBytes, quality);

    // If still too large, reduce quality iteratively
    while (compressed.length > maxBytes && quality > 50) {
      quality -= 8;
      compressed = pngToJpeg(imageBytes, quality);
      console.log(`COMPRESS: Quality ${quality} → ${(compressed.length / 1024).toFixed(0)}KB`);
    }

    console.log(`COMPRESS: Final size ${(compressed.length / 1024).toFixed(0)}KB at quality ${quality}`);
    return { bytes: compressed, mimeType: 'image/jpeg' };
  } catch (err) {
    console.warn(`COMPRESS: Failed (likely memory limit), returning original PNG: ${err}`);
    return { bytes: imageBytes, mimeType: originalMimeType };
  }
}
