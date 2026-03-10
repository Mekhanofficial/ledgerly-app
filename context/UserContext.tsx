// contexts/UserContext.tsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as authService from '../services/authServices';
import { User, RegisterPayload, AuthResponse } from '../services/authServices';
import { showMessage } from 'react-native-flash-message';

// Create context
interface UserContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginUser: (email: string, password: string) => Promise<User | null>;
  logoutUser: () => Promise<void>;
  registerUser: (userData: RegisterPayload) => Promise<AuthResponse>;
  verifyEmailOtp: (email: string, otp: string) => Promise<AuthResponse>;
  resendEmailOtp: (email: string) => Promise<AuthResponse>;
  updateProfile: (updates: Partial<User>) => Promise<User | null>;
  refreshUser: () => Promise<User | null>;
  isAdmin: () => Promise<boolean>;
  checkAuth: () => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Custom hook to use the UserContext
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize user from AsyncStorage on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function using authService with specific error handling
  const loginUser = useCallback(async (email: string, password: string): Promise<User | null> => {
    setLoading(true);
    
    const result = await authService.loginUser(email, password);
    
    if (!result.success) {
      // Pass through the specific error message from authService
      setLoading(false);
      throw new Error(result.message);
    }

    setUser(result.user!);
    setIsAuthenticated(true);
    setLoading(false);
    
    showMessage({
      message: 'Success',
      description: 'Login successful!',
      type: 'success',
      icon: 'success',
    });
    return result.user!;
  }, []);

  // Register function using authService (NO auto-login)
  const registerUser = useCallback(async (userData: RegisterPayload): Promise<AuthResponse> => {
    setLoading(true);

    const result = await authService.registerUser(userData);
    
    if (!result.success) {
      // Pass through the specific error message from authService
      setLoading(false);
      throw new Error(result.message);
    }

    // DO NOT auto login - just return success
    setLoading(false);
    const otpSent = result.otpSent !== false;
    showMessage({
      message: otpSent ? 'Success' : 'Warning',
      description: result.message,
      type: otpSent ? 'success' : 'warning',
      icon: otpSent ? 'success' : 'warning',
    });
    return result;
  }, []);

  const verifyEmailOtp = useCallback(async (email: string, otp: string): Promise<AuthResponse> => {
    const result = await authService.verifyEmailOtp(email, otp);
    if (!result.success) {
      throw new Error(result.message);
    }

    showMessage({
      message: 'Success',
      description: result.message,
      type: 'success',
      icon: 'success',
    });
    return result;
  }, []);

  const resendEmailOtp = useCallback(async (email: string): Promise<AuthResponse> => {
    const result = await authService.resendEmailOtp(email);
    if (!result.success) {
      throw new Error(result.message);
    }

    showMessage({
      message: 'Success',
      description: result.message,
      type: 'success',
      icon: 'success',
    });
    return result;
  }, []);

  // Logout function using authService
  const logoutUser = useCallback(async () => {
    await authService.logoutUser();
    setUser(null);
    setIsAuthenticated(false);
    showMessage({
      message: 'Success',
      description: 'Logged out successfully',
      type: 'success',
      icon: 'success',
    });
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
    setIsAuthenticated(Boolean(currentUser));
    return currentUser;
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (updates: Partial<User>): Promise<User | null> => {
    try {
      if (!user) throw new Error('No user logged in');
      
      const result = await authService.updateUserProfile(user.id, updates);
      
      if (!result.success) {
        throw new Error(result.message);
      }

      setUser(result.user!);
      showMessage({
        message: 'Success',
        description: 'Profile updated successfully',
        type: 'success',
        icon: 'success',
      });
      return result.user!;
    } catch (error) {
      showMessage({
        message: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        type: 'danger',
        icon: 'danger',
      });
      throw error;
    }
  }, [user]);

  // Check if user is admin
  const isAdmin = useCallback(async (): Promise<boolean> => {
    return await authService.isAdmin();
  }, []);

  // Check if user is authenticated
  const checkAuth = useCallback(async (): Promise<boolean> => {
    return await authService.isAuthenticated();
  }, []);

  // Context value
  const value: UserContextType = {
    user,
    loading,
    isAuthenticated,
    loginUser,
    logoutUser,
    registerUser,
    verifyEmailOtp,
    resendEmailOtp,
    updateProfile,
    refreshUser,
    isAdmin,
    checkAuth,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Hook for checking auth state in components
export const useAuth = () => {
  const { isAuthenticated, loading } = useUser();
  
  return {
    isAuthenticated,
    isLoading: loading,
  };
};
