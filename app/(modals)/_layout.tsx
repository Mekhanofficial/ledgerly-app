// app/(modals)/_layout.tsx
import { useTheme } from '@/context/ThemeContext';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ModalsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
        contentStyle: {
          backgroundColor: colors.background,
          // Add padding to prevent content from touching status bar
          paddingTop: insets.top,
        },
      }}
    >
      {/* All modal screens will have automatic safe area spacing */}
      <Stack.Screen name="settings" />
      <Stack.Screen name="help" />
      <Stack.Screen name="live-chat" />
      <Stack.Screen name="create-receipt" />
      <Stack.Screen name="notification" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="customer-transactions" />
    </Stack>
  );
}
