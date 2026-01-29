// services/authService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for AsyncStorage
const USERS_KEY = "ledgerly_users";
const LOGGEDIN_KEY = "ledgerly_loggedInUser";

// User interface
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  sex?: string;
  country?: string;
  currencyCode?: string;
  currencySymbol?: string;
  businessName?: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

// Response interface
interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

// Initialize admin user if not exists
async function initAdmin(): Promise<void> {
  try {
    const usersStr = await AsyncStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    const adminExists = users.find(u => u.email === "admin@ledgerly.com");
    
    if (!adminExists) {
      const adminUser: User = {
        id: "admin_001",
        firstName: "Admin",
        lastName: "User",
        email: "admin@ledgerly.com",
        password: "admin123",
        phoneNumber: "+1 (555) 123-4567",
        sex: "Male",
        country: "United States",
        currencyCode: "USD",
        currencySymbol: "$",
        businessName: "Ledgerly Inc.",
        role: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      users.push(adminUser);
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  } catch (error) {
    console.error("Init admin error:", error);
  }
}

// Initialize on import
initAdmin();

// ------------------- User/Auth functions -------------------

// Register new user (NO auto-login)
export async function registerUser(userData: Omit<User, 'id' | 'role' | 'createdAt' | 'updatedAt'>): Promise<AuthResponse> {
  try {
    const usersStr = await AsyncStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    // Check if user already exists
    const userExists = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (userExists) {
      return { success: false, message: "User already exists with this email" };
    }

    // Create new user object
    const newUser: User = {
      id: `user_${Date.now()}`,
      ...userData,
      role: "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to users array
    users.push(newUser);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

    // DO NOT auto login - user must login manually
    return { success: true, user: newUser, message: "Registration successful" };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, message: "Registration failed. Please try again." };
  }
}

// Login user with specific error messages
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  try {
    const usersStr = await AsyncStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    // Find user by email
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Check password
    if (user.password !== password) {
      return { success: false, message: "Incorrect password" };
    }

    // Store logged in user
    await AsyncStorage.setItem(LOGGEDIN_KEY, JSON.stringify(user));
    
    return { success: true, user, message: "Login successful" };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "Login failed. Please try again." };
  }
}

// Get current logged in user
export async function getCurrentUser(): Promise<User | null> {
  try {
    const userStr = await AsyncStorage.getItem(LOGGEDIN_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

// Logout user
export async function logoutUser(): Promise<{ success: boolean }> {
  try {
    await AsyncStorage.removeItem(LOGGEDIN_KEY);
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false };
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

// Check if user is admin
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "admin";
}

// Update user profile
export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<AuthResponse> {
  try {
    const usersStr = await AsyncStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return { success: false, message: "User not found" };
    }

    // Update user
    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Update current user if it's the same user
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      await AsyncStorage.setItem(LOGGEDIN_KEY, JSON.stringify(users[userIndex]));
    }

    return { success: true, user: users[userIndex], message: "Profile updated successfully" };
  } catch (error) {
    console.error("Update profile error:", error);
    return { success: false, message: "Failed to update profile" };
  }
}

// Get all users (admin only)
export async function getAllUsers(): Promise<{ success: boolean; users?: User[]; message: string }> {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return { success: false, message: "Unauthorized" };
    }
    
    const usersStr = await AsyncStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    return { success: true, users, message: "Users retrieved successfully" };
  } catch (error) {
    console.error("Get all users error:", error);
    return { success: false, message: "Failed to get users" };
  }
}