// app/(modals)/settings/_layout.tsx (updated)
import { Stack, usePathname } from 'expo-router';
import { useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { ROLE_GROUPS } from '@/utils/roleAccess';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useUser } from '@/context/UserContext';
import { resolvePlanId } from '@/utils/brandingPlan';

export default function SettingsLayout() {
  const { colors } = useTheme();
  const pathname = usePathname();
  const { user } = useUser();
  const isTeamRoute = pathname.includes('/settings/team');
  const planId = resolvePlanId(
    user?.business?.subscription?.plan || user?.plan,
    user?.business?.subscription?.status || user?.subscriptionStatus
  );
  const hasTeamFeature = user?.role === 'super_admin' || ['professional', 'enterprise'].includes(planId);

  const allowedRoles = useMemo(() => {
    if (pathname.includes('/settings/templates')) return ROLE_GROUPS.business;
    if (pathname.includes('/settings/integrations')) return ['admin', 'accountant', 'super_admin'];
    if (pathname.includes('/settings/team')) return ['admin', 'super_admin'];
    return ROLE_GROUPS.settings;
  }, [pathname]);

  const { canAccess } = useRoleGuard(allowedRoles);

  if (!canAccess || (isTeamRoute && !hasTeamFeature)) {
    return null;
  }

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
        name="integrations"
        options={{
          title: 'Integrations',
          presentation: 'card',
        }}
      />
      <Stack.Screen 
        name="billing-plan" 
        options={{ 
          title: 'Billing & Plan',
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="templates" 
        options={{ 
          title: 'Templates',
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
        name="team"
        options={{
          title: 'Team Management',
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
