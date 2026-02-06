
import { API_BASE_URL } from '../config/api.config';

/**
 * Utility to generate full image URLs from paths stored in the database for React Native.
 */
export const getImageUrl = (path) => {
  if (!path) return 'https://randomuser.me/api/portraits/men/32.jpg'; // Fallback
  if (path.startsWith('http')) return path;

  let cleanPath = path;
  
  // Handle absolute paths stored in DB (e.g., F:/.../uploads/image.jpg)
  const uploadsIndex = path.indexOf('uploads');
  if (uploadsIndex !== -1) {
    cleanPath = path.substring(uploadsIndex);
  }

  // Use the API_BASE_URL which already contains host and port
  const baseUrl = API_BASE_URL.replace('/api', '');
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
};
