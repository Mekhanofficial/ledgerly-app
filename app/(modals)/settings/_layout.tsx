// app/(modals)/settings/_layout.tsx (updated)
import { Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

export default function SettingsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="payment-method" 
        options={{ 
          title: 'Payment Methods',
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="notification-preference" 
        options={{ 
          title: 'Notification Preferences',
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="font-size" 
        options={{ 
          title: 'Font Size',
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="biometric-login" 
        options={{ 
          title: 'Biometric Login',
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="language" 
        options={{ 
          title: 'Language',
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="currency" 
        options={{ 
          title: 'Currency',
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="date-format" 
        options={{ 
          title: 'Date Format',
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="security" 
        options={{ 
          title: 'Security',
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="storage-usage" 
        options={{ 
          title: 'Storage Usage',
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="terms-conditions" 
        options={{ 
          title: 'Terms & Conditions',
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="privacy-policy" 
        options={{ 
          title: 'Privacy Policy',
          presentation: 'card',
        }} 
      />
    </Stack>
  );
}