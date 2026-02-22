import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { AUTH_TOKEN_KEY } from './storageKeys';

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const resolveBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return stripTrailingSlash(envUrl);
  }

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

type RequestOptions = RequestInit & { params?: Record<string, any> };

export async function apiRequest<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  const headers = new Headers(options.headers || {});
  const body = options.body;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (!isFormData && body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = buildUrl(path) + buildQuery(options.params);
  const response = await fetch(url, { ...options, headers });
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
    throw new Error(message);
  }

  return payload as T;
}

export const apiGet = <T = any>(path: string, params?: Record<string, any>) =>
  apiRequest<T>(path, { method: 'GET', params });

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
