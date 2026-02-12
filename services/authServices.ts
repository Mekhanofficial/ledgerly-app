import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet, apiPost, apiPut, API_BASE_URL } from './apiClient';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from './storageKeys';

export interface UserBusiness {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  logo?: string;
  currency?: string;
}

export interface User {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  role: 'admin' | 'accountant' | 'sales' | 'viewer' | 'user';
  business?: UserBusiness;
  businessName?: string;
  country?: string;
  currencyCode?: string;
  currencySymbol?: string;
  profileImage?: string;
  permissions?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  businessName: string;
  sex?: string;
  country?: string;
  currencyCode?: string;
  currencySymbol?: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

const resolveMediaUrl = (path?: string) => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${normalized}`;
};

const splitName = (name?: string) => {
  if (!name) return { firstName: '', lastName: '' };
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
};

const mapBusiness = (business: any): UserBusiness | undefined => {
  if (!business) return undefined;
  return {
    id: business._id || business.id,
    name: business.name,
    email: business.email,
    phone: business.phone,
    address: business.address,
    logo: resolveMediaUrl(business.logo),
    currency: business.currency,
  };
};

const mapUser = (user: any): User => {
  const { firstName, lastName } = splitName(user?.name);
  const business = typeof user?.business === 'object' ? mapBusiness(user.business) : undefined;

  return {
    id: user?._id || user?.id,
    name: user?.name || '',
    firstName,
    lastName,
    email: user?.email || '',
    phone: user?.phone,
    phoneNumber: user?.phone,
    role: user?.role || 'user',
    business,
    businessName: business?.name,
    country: business?.address?.country,
    profileImage: resolveMediaUrl(user?.profileImage),
    permissions: user?.permissions,
    createdAt: user?.createdAt,
    updatedAt: user?.updatedAt,
  };
};

const saveAuth = async (token: string | null, user: User | null) => {
  if (token) {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  }
  if (user) {
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
};

const clearAuth = async () => {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
};

export async function registerUser(userData: RegisterPayload): Promise<AuthResponse> {
  try {
    const name = [userData.firstName, userData.lastName].filter(Boolean).join(' ').trim();
    const payload = {
      name,
      email: userData.email,
      password: (userData as any).password,
      phone: userData.phoneNumber || userData.phone,
      businessName: userData.businessName,
    };

    const response: any = await apiPost('/api/v1/auth/register', payload);
    const user = mapUser(response.user || response.data);

    return { success: true, user, message: 'Registration successful' };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Registration failed. Please try again.',
    };
  }
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  try {
    const response: any = await apiPost('/api/v1/auth/login', { email, password });
    const token = response.token;
    if (token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    }

    let user: User | undefined;
    try {
      const meResponse: any = await apiGet('/api/v1/auth/me');
      user = mapUser(meResponse.data || meResponse.user || meResponse);
    } catch (error) {
      user = mapUser(response.user || response.data);
    }

    await saveAuth(token || null, user || null);
    return { success: true, user, message: 'Login successful' };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Login failed. Please try again.',
    };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    return null;
  }

  try {
    const meResponse: any = await apiGet('/api/v1/auth/me');
    const user = mapUser(meResponse.data || meResponse.user || meResponse);
    await saveAuth(token, user);
    return user;
  } catch (error) {
    const storedUser = await AsyncStorage.getItem(AUTH_USER_KEY);
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    await clearAuth();
    return null;
  }
}

export async function logoutUser(): Promise<{ success: boolean }> {
  try {
    try {
      await apiGet('/api/v1/auth/logout');
    } catch (error) {
      // Ignore network errors during logout
    }

    await clearAuth();
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  return Boolean(token);
}

export async function isAdmin(): Promise<boolean> {
  const storedUser = await AsyncStorage.getItem(AUTH_USER_KEY);
  if (!storedUser) return false;
  const user: User = JSON.parse(storedUser);
  return user.role === 'admin';
}

export async function updateUserProfile(
  _userId: string,
  updates: Partial<User> & { profileImage?: string; password?: string }
): Promise<AuthResponse> {
  try {
    const formData = new FormData();
    let hasUserUpdates = false;

    const name =
      updates.name ||
      [updates.firstName, updates.lastName].filter(Boolean).join(' ').trim();
    if (name) {
      formData.append('name', name);
      hasUserUpdates = true;
    }
    if (updates.email) {
      formData.append('email', updates.email);
      hasUserUpdates = true;
    }
    if (updates.phoneNumber || updates.phone) {
      formData.append('phone', updates.phoneNumber || updates.phone || '');
      hasUserUpdates = true;
    }

    const profileImage = updates.profileImage;
    const isLocalImage =
      typeof profileImage === 'string' &&
      (profileImage.startsWith('file://') ||
        profileImage.startsWith('content://') ||
        profileImage.startsWith('ph://'));
    if (isLocalImage) {
      formData.append('profileImage', {
        uri: profileImage,
        name: `profile-${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);
      hasUserUpdates = true;
    }

    if (hasUserUpdates) {
      await apiPut('/api/v1/auth/updatedetails', formData);
    }

    const businessPayload: any = {};
    if (updates.businessName) {
      businessPayload.name = updates.businessName;
    }
    if (updates.country) {
      businessPayload.address = { country: updates.country };
    }
    if (Object.keys(businessPayload).length > 0) {
      await apiPut('/api/v1/business', businessPayload);
    }

    const meResponse: any = await apiGet('/api/v1/auth/me');
    const user = mapUser(meResponse.data || meResponse.user || meResponse);
    await saveAuth(null, user);

    return { success: true, user, message: 'Profile updated successfully' };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Failed to update profile',
    };
  }
}
