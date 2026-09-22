// Where the API and the product photos live.
//
// On the web both sit at the same origin as the app. A packaged Android build
// has no server of its own, so it is built with VITE_API_BASE pointing at a
// deployed CraftLink (for example https://craftlink.onrender.com/api).
const configuredApiBase = import.meta.env?.VITE_API_BASE || '';

export const API_BASE = configuredApiBase || '/api';

export const MEDIA_BASE = configuredApiBase
  ? String(configuredApiBase).replace(/\/api\/?$/, '')
  : '';

/** Absolute URL for a server path like /uploads/… ; leaves full URLs alone. */
export const mediaUrl = (path) => {
  if (typeof path !== 'string' || !path) return path;
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
  return path.startsWith('/') ? `${MEDIA_BASE}${path}` : path;
};
