const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/api\/?$/, '');

// Backend returns paths like "/uploads/complaint-images/xxx.png" (served from
// the API origin, not under /api) — this resolves them against the configured
// env, so builds outside localhost don't silently break.
export const mediaUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path}`;
};
