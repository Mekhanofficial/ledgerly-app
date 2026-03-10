// app/(modals)/_layout.tsx
import { useTheme } from '@/context/ThemeContext';
import { Stack } from 'expo-router';
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
    />
  );
}
