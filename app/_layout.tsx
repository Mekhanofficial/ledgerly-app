// app/_layout.tsx
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import FlashMessage from 'react-native-flash-message';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { ThemeProvider } from '@/context/ThemeContext';
import { DataProvider } from '@/context/DataContext';
import { LiveChatProvider } from '@/context/LiveChatContext';
import { UserProvider } from '../context/UserContext';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useEffect, useState } from 'react';

// Component that uses the theme
function RootLayoutContent() {
  const { isDark, colors } = useTheme();
  const { user, isAuthenticated } = useUser();
  const router = useRouter();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const status = String(user?.business?.subscription?.status || 'active').toLowerCase();
    if (isAuthenticated && status === 'expired') {
      setShowUpgradeModal(true);
    } else {
      setShowUpgradeModal(false);
    }
  }, [isAuthenticated, user?.business?.subscription?.status]);

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

      <Modal visible={showUpgradeModal} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />
          <View style={{
            width: '88%',
            borderRadius: 16,
            padding: 20,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border
          }}>
            <Text style={{ color: colors.primary500, fontSize: 12, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase' }}>
              Upgrade Required
            </Text>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700', marginTop: 6 }}>
              Your subscription has expired
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 10 }}>
              Upgrade to keep creating invoices, exporting PDFs, and using premium templates.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.primary500,
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: 'center'
                }}
                onPress={() => {
                  setShowUpgradeModal(false);
                  router.push('/(modals)/settings/billing-plan');
                }}
              >
                <Text style={{ color: 'white', fontWeight: '700' }}>Upgrade Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: 'center'
                }}
                onPress={() => setShowUpgradeModal(false)}
              >
                <Text style={{ color: colors.text, fontWeight: '600' }}>Not Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
