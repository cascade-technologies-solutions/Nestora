/**
 * Resolves an image URL so it always displays properly regardless of whether
 * it is a full HTTP URL, an Unsplash image, an internal /uploads/... URL,
 * or a raw Neon S3 storage URL that requires the backend proxy to prevent 403 Forbidden.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1');
  const backendRoot = apiBase.replace(/\/api(\/v1)?\/?$/, '');

  // If it's a Neon S3 URL (which returns 403 without auth), route through the backend proxy
  const neonMatch = trimmed.match(/storage\.[^/]+\.neon\.tech\/uploads\/(.+)$/);
  if (neonMatch) {
    return `${backendRoot}/uploads/${neonMatch[1]}`;
  }

  // If it's a relative /uploads/... path
  if (trimmed.startsWith('/uploads/')) {
    return `${backendRoot}${trimmed}`;
  }

  // If it's already an absolute HTTP/HTTPS or data URL, return directly
  return trimmed;
}
