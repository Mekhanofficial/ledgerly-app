// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import FlashMessage from 'react-native-flash-message';
import { ThemeProvider } from '@/context/ThemeContext';
import { DataProvider } from '@/context/DataContext';
import { LiveChatProvider } from '@/context/LiveChatContext';
import { UserProvider } from '../context/UserContext';
import { useTheme } from '@/context/ThemeContext';

// Component that uses the theme
function RootLayoutContent() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor="transparent" translucent />
      <Stack>
        {/* Redirect from root to appropriate screen based on auth */}
        <Stack.Screen name="index" options={{ headerShown: false }} />

        {/* Welcome/Onboarding screen */}
        <Stack.Screen name="welcome" options={{ headerShown: false }} />

        {/* Authentication screens (login/signup) */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />

        {/* Main app tabs */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* More screens (non-modal) */}
        <Stack.Screen name="(more)" options={{ headerShown: false }} />

        {/* Modal screens */}
        <Stack.Screen name="(modals)" options={{
          headerShown: false,
          presentation: 'modal'
        }} />
      </Stack>
      <FlashMessage
        position="top"
        floating={true}
        statusBarHeight={30}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <UserProvider>
        <DataProvider>
          <LiveChatProvider>
            <RootLayoutContent />
          </LiveChatProvider>
        </DataProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
