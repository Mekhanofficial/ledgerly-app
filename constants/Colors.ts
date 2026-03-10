// @/constants/Colors.ts
export const lightColors = {
  // Primary
  primary50: '#f0f9ff',
  primary100: '#e0f2fe',
  primary200: '#bae6fd',
  primary300: '#7dd3fc',
  primary400: '#38bdf8',
  primary500: '#0ea5e9',
  primary600: '#0284c7',
  primary700: '#0369a1',
  primary800: '#075985',
  primary900: '#0c4a6e',
  
  // Gray/Neutral
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1e293b',
  gray900: '#0f172a',
  
  // Neutral
  background: '#f5f7ff',
  surface: '#ffffff',
  card: '#ffffff',
  cardSecondary: '#eef2ff',

  // Brand/Page gradients (aligned with website)
  pageGradientStart: '#f5f7ff',
  pageGradientEnd: '#eef2ff',
  brandGradientStart: '#0891b2',
  brandGradientEnd: '#2563eb',
  glowCyan: 'rgba(14, 165, 233, 0.16)',
  glowBlue: 'rgba(59, 130, 246, 0.14)',
  
  // Text
  text: '#1e293b',
  textSecondary: '#475569',
  textTertiary: '#64748b',
  textLight: '#94a3b8',
  textLighter: '#cbd5e1',
  
  // UI
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderDark: '#cbd5e1',
  
  // Status
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  backdrop: 'rgba(15, 23, 42, 0.1)',
  
  // Misc
  shadow: '#000000',
  divider: '#f1f5f9',
  
  // Specific Components
  tabBar: '#ffffff',
  header: '#f5f7ff',
  input: '#ffffff',
};

export const darkColors = {
  // Primary (same primaries for consistency)
  primary50: '#0c4a6e',
  primary100: '#075985',
  primary200: '#0369a1',
  primary300: '#0284c7',
  primary400: '#0ea5e9',
  primary500: '#38bdf8',
  primary600: '#7dd3fc',
  primary700: '#bae6fd',
  primary800: '#e0f2fe',
  primary900: '#f0f9ff',
  
  // Gray/Neutral
  gray50: '#0f172a',
  gray100: '#1e293b',
  gray200: '#334155',
  gray300: '#475569',
  gray400: '#64748b',
  gray500: '#94a3b8',
  gray600: '#cbd5e1',
  gray700: '#e2e8f0',
  gray800: '#f1f5f9',
  gray900: '#f8fafc',
  
  // Neutral
  background: '#020617',
  surface: '#0f172a',
  card: '#0f172a',
  cardSecondary: '#1e293b',

  // Brand/Page gradients (aligned with website dark treatment)
  pageGradientStart: '#020617',
  pageGradientEnd: '#0f172a',
  brandGradientStart: '#06b6d4',
  brandGradientEnd: '#3b82f6',
  glowCyan: 'rgba(6, 182, 212, 0.22)',
  glowBlue: 'rgba(59, 130, 246, 0.2)',
  
  // Text
  text: '#f1f5f9',
  textSecondary: '#e2e8f0',
  textTertiary: '#cbd5e1',
  textLight: '#94a3b8',
  textLighter: '#475569',
  
  // UI
  border: '#334155',
  borderLight: '#475569',
  borderDark: '#1e293b',
  
  // Status
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  backdrop: 'rgba(15, 23, 42, 0.7)',
  
  // Misc
  shadow: '#000000',
  divider: '#334155',
  
  // Specific Components
  tabBar: '#0f172a',
  header: '#020617',
  input: '#1e293b',
};

// Default export (will be overridden by theme context)
export const Colors = lightColors;

export type ThemeColors = typeof lightColors;
