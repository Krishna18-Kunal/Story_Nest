export const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {})
    }
  });
  const result = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || `Request failed (${response.status})`);
  return result;
}
