import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { AUTH_TOKEN_KEY } from './storageKeys';

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const PROD_API_BASE_FALLBACK = 'https://ledgerly-backend-iayk.onrender.com';

const isLocalBaseUrl = (value: string) =>
  /localhost|127\.0\.0\.1|10\.0\.2\.2/i.test(value);

const resolveBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    const normalized = stripTrailingSlash(envUrl);
    if (!__DEV__ && isLocalBaseUrl(normalized)) {
      return PROD_API_BASE_FALLBACK;
    }
    return normalized;
  }

  if (__DEV__) {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      Constants.manifest?.hostUri ||
      Constants.expoConfig?.extra?.hostUri;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host) {
        return `http://${host}:7000`;
      }
    }

    return Platform.OS === 'android' ? 'http://10.0.2.2:7000' : 'http://localhost:7000';
  }

  return PROD_API_BASE_FALLBACK;
};

export const API_BASE_URL = resolveBaseUrl();
export const API_PREFIX = '/api/v1';

const normalizeApiPath = (path: string) => {
  if (!path) return API_PREFIX;
  if (path.startsWith('http')) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (normalizedPath.startsWith('/api/')) {
    return normalizedPath;
  }

  return `${API_PREFIX}${normalizedPath}`;
};

const buildUrl = (path: string) => {
  if (path.startsWith('http')) return path;
  const normalizedPath = normalizeApiPath(path);
  return `${API_BASE_URL}${normalizedPath}`;
};

const buildQuery = (params?: Record<string, any>) => {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.append(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

const resolveGetCacheTtlMs = () => {
  const parsed = Number.parseInt(String(process.env.EXPO_PUBLIC_API_CACHE_TTL_MS || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60_000;
};

const DEFAULT_GET_CACHE_TTL_MS = resolveGetCacheTtlMs();
const AUTH_CACHE_EXCLUDE_PATTERNS = [/\/auth\/login/i, /\/auth\/register/i, /\/auth\/logout/i];

type RequestOptions = RequestInit & {
  params?: Record<string, any>;
  cacheTtlMs?: number;
  skipCache?: boolean;
};

type GetCacheEntry = {
  expiresAt: number;
  payload: any;
};

const getResponseCache = new Map<string, GetCacheEntry>();

const getCachedPayload = <T = any>(cacheKey: string): T | null => {
  const cached = getResponseCache.get(cacheKey);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    getResponseCache.delete(cacheKey);
    return null;
  }

  return cached.payload as T;
};

const setCachedPayload = (cacheKey: string, payload: any, ttlMs: number) => {
  const safeTtl = Math.max(ttlMs, 1_000);
  getResponseCache.set(cacheKey, {
    payload,
    expiresAt: Date.now() + safeTtl,
  });
};

const shouldUseGetCache = (url: string) =>
  !AUTH_CACHE_EXCLUDE_PATTERNS.some((pattern) => pattern.test(url));

export const clearApiGetCache = () => {
  getResponseCache.clear();
};

export class ApiError extends Error {
  status: number;
  payload: any;

  constructor(message: string, status: number, payload?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export async function apiRequest<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    params,
    cacheTtlMs = DEFAULT_GET_CACHE_TTL_MS,
    skipCache = false,
    ...requestOptions
  } = options;
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  const method = String(requestOptions.method || 'GET').toUpperCase();
  const headers = new Headers(requestOptions.headers || {});
  const body = requestOptions.body;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const url = buildUrl(path) + buildQuery(params);
  const isCacheableGet = method === 'GET' && !skipCache && shouldUseGetCache(url);

  if (!isFormData && body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (isCacheableGet) {
    const cachedPayload = getCachedPayload<T>(url);
    if (cachedPayload !== null) {
      return cachedPayload;
    }
  }

  const response = await fetch(url, { ...requestOptions, method, headers });
  const contentType = response.headers.get('content-type') || '';

  let payload: any = null;
  if (response.status !== 204) {
    payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text();
  }

  if (!response.ok || (payload && payload.success === false)) {
    const message =
      payload?.error ||
      payload?.message ||
      (typeof payload === 'string' ? payload : 'Request failed');
    throw new ApiError(message, response.status, payload);
  }

  if (isCacheableGet) {
    setCachedPayload(url, payload, cacheTtlMs);
  } else if (method !== 'GET' && method !== 'HEAD') {
    clearApiGetCache();
  }

  return payload as T;
}

type GetRequestOptions = Omit<RequestOptions, 'method' | 'body' | 'params'>;

export const apiGet = <T = any>(
  path: string,
  params?: Record<string, any>,
  options: GetRequestOptions = {}
) => apiRequest<T>(path, { ...options, method: 'GET', params });

export const apiPost = <T = any>(path: string, body?: any) =>
  apiRequest<T>(path, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
  });

export const apiPut = <T = any>(path: string, body?: any) =>
  apiRequest<T>(path, {
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
  });

export const apiPatch = <T = any>(path: string, body?: any) =>
  apiRequest<T>(path, {
    method: 'PATCH',
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
  });

export const apiDelete = <T = any>(path: string) =>
  apiRequest<T>(path, { method: 'DELETE' });
