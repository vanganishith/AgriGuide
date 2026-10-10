// AgriGuide API Configuration
// Resolves the backend base URL (e.g., http://localhost:5000/api, http://localhost:5001/api, or /api)

export const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL || 
  (typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:5001/api' : '/api');

export async function fetchApi<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; error?: { code: string; message: string } }> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach authoritative farmer session headers if farmer has confirmed mobile
  if (typeof localStorage !== 'undefined') {
    try {
      const savedProfileStr = localStorage.getItem('agriguide_farmer_profile') || localStorage.getItem('ag_active_farmer_profile');
      if (savedProfileStr) {
        const profile = JSON.parse(savedProfileStr);
        if (profile?.id && !headers.has('x-farmer-id')) {
          headers.set('x-farmer-id', profile.id);
        }
        if (profile?.phone && !headers.has('x-farmer-phone')) {
          headers.set('x-farmer-phone', profile.phone);
        }
      }
    } catch (_) {}
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const errorCode = json?.error?.code || `HTTP_${response.status}`;
    const errorMessage = json?.error?.message || json?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMessage) as any;
    error.code = errorCode;
    error.statusCode = response.status;
    throw error;
  }

  return json;
}
