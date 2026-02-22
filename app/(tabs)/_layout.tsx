import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, router, useSegments } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '@/components/CustomHeader';
import MoreOptionsModal from '@/components/MoreOptionsModal';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '@/context/UserContext';
import { hasRole, ROLE_GROUPS } from '@/utils/roleAccess';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';
  const [moreModalVisible, setMoreModalVisible] = useState(false);
  const { colors, isDark } = useTheme();
  const { user, loading } = useUser();
  const segments = useSegments();

  const canAccessDashboard = hasRole(user?.role, ROLE_GROUPS.app);
  const canAccessInvoices = hasRole(user?.role, ROLE_GROUPS.app);
  const canAccessRecurring = hasRole(user?.role, ROLE_GROUPS.business);
  const canAccessInventory = hasRole(user?.role, ROLE_GROUPS.business);

  const allowedTabNames = useMemo(() => {
    const tabs: string[] = [];
    if (canAccessDashboard) tabs.push('index');
    if (canAccessInvoices) tabs.push('invoices');
    if (canAccessRecurring) tabs.push('recurring');
    if (canAccessInventory) tabs.push('inventory');
    tabs.push('more');
    return tabs;
  }, [canAccessDashboard, canAccessInvoices, canAccessRecurring, canAccessInventory]);

  const tabNameToPath = (tabName: string) => {
    if (tabName === 'index') return '/(tabs)';
    return `/(tabs)/${tabName}`;
  };

  const fallbackTab = tabNameToPath(allowedTabNames[0] || 'more');

  useEffect(() => {
    if (loading) return;
    const isInTabs = segments[0] === '(tabs)';
    if (!isInTabs) return;
    const currentTab = segments[1] ?? 'index';
    const isAllowed = allowedTabNames.includes(currentTab);
    if (!isAllowed) {
      router.replace(fallbackTab as any);
    }
  }, [loading, segments, allowedTabNames, fallbackTab]);

  return (
    <>
      {/* StatusBar - Ensure it's visible */}
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        backgroundColor={colors.header}
        translucent={false}
      />

      <Tabs
        screenOptions={{
          /* ---------- Header ---------- */
          header: () => <CustomHeader />,
          headerTitleAlign: 'center',

          headerStyle: {
            backgroundColor: colors.header, // Set background to match header
            shadowColor: 'transparent',
            elevation: 0,
          },

          headerTitleContainerStyle: {
            display: 'none',
          },

          /* ---------- Tab Bar ---------- */
          tabBarActiveTintColor: colors.primary500,
          tabBarInactiveTintColor: colors.textTertiary,

          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: isIOS ? 70 : 60,
            paddingBottom: isIOS ? insets.bottom : 6,
            paddingTop: 8,
            elevation: 8,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: isDark ? 0.1 : 0.04,
            shadowRadius: 8,
          },

        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            href: canAccessDashboard ? undefined : null,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="invoices"
          options={{
            title: 'Invoices',
            href: canAccessInvoices ? undefined : null,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'document-text' : 'document-text-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="recurring"
          options={{
            title: 'Recurring',
            href: null,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'repeat' : 'repeat-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="inventory"
          options={{
            title: 'Inventory',
            href: canAccessInventory ? undefined : null,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'cube' : 'cube-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="more"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setMoreModalVisible(true);
            },
          }}
          options={{
            title: 'More',
            tabBarIcon: ({ color }) => (
              <Ionicons name="ellipsis-horizontal" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="analytics" options={{ href: null }} />
        <Tabs.Screen name="customers" options={{ href: null }} />
        <Tabs.Screen name="receipts" options={{ href: null }} />
      </Tabs>

      <MoreOptionsModal
        visible={moreModalVisible}
        onClose={() => setMoreModalVisible(false)}
      />
    </>
  );
}
