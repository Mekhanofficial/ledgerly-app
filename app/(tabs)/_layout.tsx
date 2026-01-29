import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useState } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '@/components/CustomHeader';
import MoreOptionsModal from '@/components/MoreOptionsModal';
import { StatusBar } from 'expo-status-bar';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';
  const [moreModalVisible, setMoreModalVisible] = useState(false);
  const { colors, isDark } = useTheme();

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

          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
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
          name="inventory"
          options={{
            title: 'Inventory',
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
      </Tabs>

      <MoreOptionsModal
        visible={moreModalVisible}
        onClose={() => setMoreModalVisible(false)}
      />
    </>
  );
}