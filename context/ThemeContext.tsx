// @/contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, ThemeColors } from '@/constants/Colors';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  colors: ThemeColors;
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  // Load saved theme from AsyncStorage
  useEffect(() => {
    loadTheme();
  }, []);

  // Update isDark based on theme and system
  useEffect(() => {
    let dark = false;
    if (theme === 'system') {
      dark = systemColorScheme === 'dark';
    } else {
      dark = theme === 'dark';
    }
    setIsDark(dark);
  }, [theme, systemColorScheme]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app-theme');
      if (savedTheme) {
        setThemeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    }
  };

  const saveTheme = async (newTheme: ThemeMode) => {
    try {
      await AsyncStorage.setItem('app-theme', newTheme);
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    saveTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
  };

  // Get colors based on current theme
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}