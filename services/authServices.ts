import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet, apiPost, apiPut, API_BASE_URL, ApiError } from './apiClient';
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
  timezone?: string;
  currency?: string;
  subscription?: {
    plan?: string;
    status?: string;
    currentPeriodEnd?: string;
    trialEndsAt?: string;
  };
}

export interface User {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  role: 'super_admin' | 'admin' | 'accountant' | 'staff' | 'sales' | 'viewer' | 'client' | 'user';
  business?: UserBusiness;
  businessName?: string;
  country?: string;
  timezone?: string;
  currencyCode?: string;
  currencySymbol?: string;
  profileImage?: string;
  businessLogo?: string;
  plan?: string;
  subscriptionStatus?: string;
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
  permissions?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  phoneNumber?: string;
  businessName: string;
  sex?: string;
  country?: string;
  currencyCode?: string;
  currencySymbol?: string;
  paymentReference?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  requiresEmailVerification?: boolean;
  verificationEmail?: string;
  expiresInMinutes?: number;
  otpSent?: boolean;
  otpError?: string;
}

const resolveMediaUrl = (path?: string) => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${normalized}`;
};

const isLocalMediaAsset = (value?: string) => {
  if (typeof value !== 'string') return false;
  return value.startsWith('file://')
    || value.startsWith('content://')
    || value.startsWith('ph://');
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
    timezone: business.timezone,
    currency: business.currency,
    subscription: business.subscription,
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
    timezone: business?.timezone,
    currencyCode: business?.currency,
    profileImage: resolveMediaUrl(user?.profileImage),
    businessLogo: business?.logo,
    plan: user?.plan || business?.subscription?.plan,
    subscriptionStatus: user?.subscriptionStatus || business?.subscription?.status,
    trialEndsAt: user?.trialEndsAt || business?.subscription?.trialEndsAt,
    subscriptionEndsAt: user?.subscriptionEndsAt || business?.subscription?.currentPeriodEnd,
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
  await AsyncStorage.multiRemove([
    AUTH_TOKEN_KEY,
    AUTH_USER_KEY,
    'premium_templates_access',
    'template_purchases'
  ]);
};

const AUTH_INVALID_ERROR_PATTERNS = [
  /user no longer exists/i,
  /unauthori[sz]ed/i,
  /not authorized/i,
  /invalid token/i,
  /token expired/i,
  /jwt/i,
  /forbidden/i,
];

const isInvalidAuthSessionError = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) return true;
    if (error.status === 404 && /user/i.test(error.message)) return true;
  }

  const message = error instanceof Error ? error.message : String(error ?? '');
  return AUTH_INVALID_ERROR_PATTERNS.some((pattern) => pattern.test(message));
};

export async function registerUser(userData: RegisterPayload): Promise<AuthResponse> {
  try {
    const name = [userData.firstName, userData.lastName].filter(Boolean).join(' ').trim();
    const paymentReference = String(userData.paymentReference || '').trim();
    const payload = {
      name,
      email: userData.email,
      password: (userData as any).password,
      phone: userData.phoneNumber || userData.phone,
      businessName: userData.businessName,
      country: userData.country,
      currencyCode: userData.currencyCode,
      paymentReference: paymentReference || undefined,
    };

    const response: any = await apiPost('/api/v1/auth/register', payload);
    const otpSent = response?.data?.otpSent !== false;
    const otpError = response?.data?.otpError || '';
    const message = otpSent
      ? (response?.message || 'Registration successful. Verify your email to continue.')
      : (otpError || response?.message || 'We could not send verification code right now. Please try again shortly.');

    return {
      success: true,
      message,
      requiresEmailVerification: true,
      verificationEmail: response?.data?.email || payload.email,
      expiresInMinutes: response?.data?.expiresInMinutes,
      otpSent,
      otpError,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Registration failed. Please try again.',
    };
  }
}

export async function verifyEmailOtp(email: string, otp: string): Promise<AuthResponse> {
  try {
    const response: any = await apiPost('/api/v1/auth/verify-email-otp', { email, otp });
    return {
      success: true,
      message: response?.message || 'Email verified successfully.',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Email verification failed.',
    };
  }
}

export async function resendEmailOtp(email: string): Promise<AuthResponse> {
  try {
    const response: any = await apiPost('/api/v1/auth/resend-email-otp', { email });
    const otpSent = response?.data?.otpSent !== false;
    const otpError = response?.data?.otpError || '';
    const message = otpSent
      ? (response?.message || 'Verification code sent.')
      : (otpError || response?.message || 'We could not send verification code right now. Please try again shortly.');

    return {
      success: otpSent,
      message,
      verificationEmail: response?.data?.email || email,
      expiresInMinutes: response?.data?.expiresInMinutes,
      otpSent,
      otpError,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Failed to resend verification code.',
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

export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  try {
    await apiPost('/api/v1/auth/forgotpassword', { email });
    return { success: true, message: 'Password reset instructions sent' };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Failed to send reset instructions',
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
    if (isInvalidAuthSessionError(error)) {
      await clearAuth();
      return null;
    }

    const storedUser = await AsyncStorage.getItem(AUTH_USER_KEY);
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        await AsyncStorage.removeItem(AUTH_USER_KEY);
      }
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
  return user.role === 'admin' || user.role === 'super_admin';
}

export async function updateUserProfile(
  _userId: string,
  updates: Partial<User> & {
    profileImage?: string;
    businessLogo?: string;
    removeBusinessLogo?: boolean;
    password?: string;
  }
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
    const isLocalImage = isLocalMediaAsset(profileImage);
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
    if (updates.currencyCode) {
      businessPayload.currency = updates.currencyCode;
    }
    if (updates.timezone) {
      businessPayload.timezone = updates.timezone;
    }
    if (updates.country) {
      businessPayload.address = { country: updates.country };
    }
    const businessLogo = updates.businessLogo;
    const isLocalBusinessLogo = isLocalMediaAsset(businessLogo);
    const shouldRemoveBusinessLogo = Boolean(updates.removeBusinessLogo);
    if (Object.keys(businessPayload).length > 0 || isLocalBusinessLogo || shouldRemoveBusinessLogo) {
      if (isLocalBusinessLogo || shouldRemoveBusinessLogo) {
        const businessFormData = new FormData();
        if (businessPayload.name) {
          businessFormData.append('name', businessPayload.name);
        }
        if (businessPayload.currency) {
          businessFormData.append('currency', businessPayload.currency);
        }
        if (businessPayload.timezone) {
          businessFormData.append('timezone', businessPayload.timezone);
        }
        if (businessPayload.address) {
          businessFormData.append('address', JSON.stringify(businessPayload.address));
        }
        if (shouldRemoveBusinessLogo) {
          businessFormData.append('logo', '');
        }
        if (isLocalBusinessLogo) {
          businessFormData.append('logo', {
            uri: businessLogo,
            name: `business-logo-${Date.now()}.jpg`,
            type: 'image/jpeg',
          } as any);
        }
        await apiPut('/api/v1/business', businessFormData);
      } else {
        await apiPut('/api/v1/business', businessPayload);
      }
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
