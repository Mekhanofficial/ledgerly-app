// @/hooks/useThemeColors.ts
import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors } from '@/constants/Colors';

export function useThemeColors() {
  const { colors } = useTheme();
  return colors;
}

// Helper to get specific theme colors
export function getThemeColors(isDark: boolean) {
  return isDark ? darkColors : lightColors;
}