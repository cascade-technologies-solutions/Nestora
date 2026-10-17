/**
 * Nestora Production API Client
 * Typed REST client communicating with the backend Express API.
 * Handles authentication headers, response envelopes, and automatic silent token refresh.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    fields?: Record<string, string[]>;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    [key: string]: any;
  };
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: any;
  fields?: Record<string, string[]>;

  constructor(status: number, message: string, code = 'API_ERROR', details?: any, fields?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.fields = fields;
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1').replace(/\/$/, '');

// In-memory token storage with localStorage fallback
let adminAccessToken: string | null = null;
let publicAccessToken: string | null = null;

try {
  adminAccessToken = localStorage.getItem('nestora_admin_access_token');
  publicAccessToken = localStorage.getItem('nestora_public_access_token');
} catch {
  // In-memory only
}

export function setAdminToken(token: string | null) {
  adminAccessToken = token;
  try {
    if (token) {
      localStorage.setItem('nestora_admin_access_token', token);
    } else {
      localStorage.removeItem('nestora_admin_access_token');
    }
  } catch {
    // Ignore storage errors
  }
}

export function getAdminToken(): string | null {
  return adminAccessToken;
}

export function setPublicToken(token: string | null) {
  publicAccessToken = token;
  try {
    if (token) {
      localStorage.setItem('nestora_public_access_token', token);
    } else {
      localStorage.removeItem('nestora_public_access_token');
    }
  } catch {
    // Ignore storage errors
  }
}

export function getPublicToken(): string | null {
  return publicAccessToken;
}

interface RequestOptions extends RequestInit {
  authType?: 'admin' | 'public' | 'none';
  skipRefresh?: boolean;
}

let isRefreshingAdmin = false;
let adminRefreshSubscribers: ((token: string) => void)[] = [];

function onAdminRefreshed(token: string) {
  adminRefreshSubscribers.forEach((cb) => cb(token));
  adminRefreshSubscribers = [];
}

async function refreshAdminToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      setAdminToken(null);
      return null;
    }
    const data: ApiResponse<{ accessToken: string }> = await res.json();
    if (data.success && data.data?.accessToken) {
      setAdminToken(data.data.accessToken);
      return data.data.accessToken;
    }
    setAdminToken(null);
    return null;
  } catch {
    setAdminToken(null);
    return null;
  }
}

export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { authType = 'none', skipRefresh = false, headers = {}, ...rest } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  // Attach auth token if specified or auto-detected by path
  const isAdmin = authType === 'admin' || (authType !== 'public' && endpoint.includes('/admin/'));
  const isPublicAuth = authType === 'public' || (!isAdmin && (endpoint.startsWith('/wishlist') || endpoint.startsWith('/auth/me')));

  if (isAdmin && adminAccessToken) {
    requestHeaders['Authorization'] = `Bearer ${adminAccessToken}`;
  } else if (isPublicAuth && publicAccessToken) {
    requestHeaders['Authorization'] = `Bearer ${publicAccessToken}`;
  }

  // If body is FormData, delete Content-Type so browser sets boundary
  if (rest.body instanceof FormData) {
    delete requestHeaders['Content-Type'];
  }

  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
    credentials: 'include',
  });

  // Handle 401 Unauthorized with silent refresh
  if (response.status === 401 && !skipRefresh) {
    if (isAdmin) {
      if (!isRefreshingAdmin) {
        isRefreshingAdmin = true;
        const newToken = await refreshAdminToken();
        isRefreshingAdmin = false;
        if (newToken) {
          onAdminRefreshed(newToken);
          return apiRequest<T>(endpoint, { ...options, skipRefresh: true });
        }
      } else {
        return new Promise<T>((resolve, reject) => {
          adminRefreshSubscribers.push((token) => {
            if (token) {
              resolve(apiRequest<T>(endpoint, { ...options, skipRefresh: true }));
            } else {
              reject(new ApiError(401, 'Session expired. Please log in again.', 'UNAUTHENTICATED'));
            }
          });
        });
      }
    }
  }

  // Parse JSON response
  let json: ApiResponse<T>;
  try {
    json = await response.json();
  } catch (err) {
    throw new ApiError(response.status, `Network response was not valid JSON (${response.statusText})`);
  }

  if (!response.ok || !json.success) {
    const error = json.error || {
      code: 'API_ERROR',
      message: response.statusText || 'An error occurred during request',
    };
    throw new ApiError(response.status, error.message, error.code, error.details, error.fields);
  }

  return (json.data as T) ?? (json as any);
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),

  baseUrl: API_BASE_URL,
};
