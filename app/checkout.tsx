import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';

const readSearchParam = (value?: string | string[]) =>
  String(Array.isArray(value) ? value[0] || '' : value || '').trim();

const normalizePlanId = (value?: string | string[]) => {
  const normalized = readSearchParam(value).toLowerCase();
  if (normalized === 'pro') return 'professional';
  if (normalized === 'starter' || normalized === 'professional' || normalized === 'enterprise') {
    return normalized;
  }
  return '';
};

const normalizeBillingCycle = (value?: string | string[]) =>
  readSearchParam(value).toLowerCase() === 'yearly' ? 'yearly' : 'monthly';

const normalizePaidFlag = (value?: string | string[]) => {
  const normalized = readSearchParam(value).toLowerCase();
  if (!normalized) return '';
  if (['1', 'true', 'yes', 'paid', 'success', 'successful'].includes(normalized)) return '1';
  if (['0', 'false', 'no', 'failed', 'failure', 'cancelled', 'canceled'].includes(normalized)) return '0';
  return '';
};

const isValidEmail = (value: string) => /^\S+@\S+\.\S+$/.test(String(value || '').trim().toLowerCase());

export default function CheckoutDeepLinkBridgeScreen() {
  const { colors } = useTheme();
  const hasRedirected = useRef(false);
  const params = useLocalSearchParams<{
    selectedPlan?: string | string[];
    plan?: string | string[];
    billingCycle?: string | string[];
    cycle?: string | string[];
    checkoutEmail?: string | string[];
    email?: string | string[];
    reference?: string | string[];
    trxref?: string | string[];
    trxRef?: string | string[];
    ref?: string | string[];
    paymentReference?: string | string[];
    paid?: string | string[];
    status?: string | string[];
  }>();

  useEffect(() => {
    if (hasRedirected.current) return;
    hasRedirected.current = true;

    const selectedPlan = normalizePlanId(params.selectedPlan || params.plan);
    const billingCycle = normalizeBillingCycle(params.billingCycle || params.cycle);
    const checkoutEmail = readSearchParam(params.checkoutEmail || params.email).toLowerCase();
    const reference = readSearchParam(
      params.reference || params.trxref || params.trxRef || params.ref || params.paymentReference
    );
    const paid = normalizePaidFlag(params.paid || params.status);

    const signupParams: Record<string, string> = {};
    if (selectedPlan) {
      signupParams.selectedPlan = selectedPlan;
      signupParams.billingCycle = billingCycle;
    }
    if (reference) {
      signupParams.reference = reference;
    }
    if (checkoutEmail && isValidEmail(checkoutEmail)) {
      signupParams.checkoutEmail = checkoutEmail;
    }
    if (paid) {
      signupParams.paid = paid;
    }

    if (!Object.keys(signupParams).length) {
      router.replace('/plan-onboarding');
      return;
    }

    router.replace({
      pathname: '/signup',
      params: signupParams,
    } as never);
  }, [params]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ActivityIndicator size="small" color={colors.primary500} />
        <Text style={[styles.title, { color: colors.text }]}>Opening Checkout Result</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Redirecting to signup with your selected plan details.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 16,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});
