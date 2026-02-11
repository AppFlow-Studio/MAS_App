/**
 * Shared utility functions used across the app.
 * Extracted to avoid duplication in multiple files.
 */

/**
 * Extract a YouTube video ID from a URL string.
 * Handles youtube.com/watch, youtu.be short links, embed URLs,
 * and plain video-ID strings.
 */
export const getVideoIdFromUrl = (url: string): string | null => {
  if (!url) return null;
  // If it looks like a bare video ID (no slashes or query params), return as-is
  if (!url.includes('/') && !url.includes('?')) {
    return url;
  }
  const match = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  return match ? match[1] : null;
};

/**
 * Format a raw digit string (or partially-formatted string) as a US phone
 * number in the shape (XXX) XXX-XXXX.  Accepts up to 10 digits.
 */
export const formatPhoneNumber = (text: string): string => {
  const cleaned = text.replace(/\D/g, '').slice(0, 10);
  let formatted = '';
  if (cleaned.length > 0) {
    formatted = '(' + cleaned.slice(0, 3);
  }
  if (cleaned.length >= 3) {
    formatted += ') ' + cleaned.slice(3, 6);
  }
  if (cleaned.length >= 6) {
    formatted += '-' + cleaned.slice(6, 10);
  }
  return formatted || cleaned;
};
