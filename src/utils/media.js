import { STORES_API_URL } from '../services/storeApi';

// Use stores API URL as base for media, or explicit MEDIA_URL if set
const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_URL || STORES_API_URL.replace('/api/v1/stores', '');

export const buildMediaUrl = (value) => {
  if (!value) {
    return '';
  }
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  if (value.startsWith('/')) {
    return `${MEDIA_BASE_URL}${value}`;
  }
  return `${MEDIA_BASE_URL}/${value}`;
};
