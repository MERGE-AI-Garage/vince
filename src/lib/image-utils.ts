// ABOUTME: Shared utilities for image URL conversion, optimization, and base64 encoding
// ABOUTME: Includes Supabase storage image transformations and GCS URI conversion

/**
 * Convert a Google Cloud Storage URI (gs://) to a public HTTPS URL
 */
export function convertGcsUri(uri: string): string {
  if (!uri) return uri;
  if (uri.startsWith('gs://')) {
    return uri.replace('gs://', 'https://storage.googleapis.com/');
  }
  return uri;
}

/**
 * Fetch an image from a URL and return as a data:image base64 string
 */
export async function fetchImageAsBase64(url: string): Promise<string> {
  const publicUrl = convertGcsUri(url);
  const response = await fetch(publicUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Strip the data:image/...;base64, prefix from a data URL to get raw base64
 */
export function stripBase64Prefix(dataUrl: string): string {
  if (dataUrl.includes('base64,')) {
    return dataUrl.split('base64,')[1];
  }
  return dataUrl;
}

/**
 * Convert a File object to a raw base64 string (no data: prefix)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(stripBase64Prefix(result));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a File object to a data URL (with data:mime;base64, prefix)
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
