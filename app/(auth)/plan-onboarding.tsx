import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { initializePublicSubscriptionPayment } from '@/services/billingService';
import { LinearGradient } from 'expo-linear-gradient';

type BillingCycle = 'monthly' | 'yearly';
type PlanId = 'starter' | 'professional' | 'enterprise';
type SignupNavigationOptions = {
  plan: PlanId;
  includePlanContext?: boolean;
  paymentReference?: string;
  paid?: boolean;
};

const PLANS: Array<{
  id: PlanId;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyEquivalent: number;
  description: string;
  features: string[];
  popular?: boolean;
}> = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 2000,
    yearlyPrice: 24000,
    monthlyEquivalent: 2000,
    description: 'For freelancers and solo operators',
    features: [
      '100 invoices/month',
      'Unlimited receipts',
      'Basic reporting',
      'Single user',
      '5 Standard templates',
      'No recurring invoices',
      'No API',
      'No team',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 7000,
    yearlyPrice: 84000,
    monthlyEquivalent: 7000,
    description: 'For growing businesses and small teams',
    popular: true,
    features: [
      'Unlimited invoices',
      'Advanced reporting',
      '5 team members',
      'Recurring invoices',
      'Inventory',
      'Customer database',
      'Multi-currency',
      'Limited API',
      'All Standard + Premium templates',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 30000,
    yearlyPrice: 360000,
    monthlyEquivalent: 30000,
    description: 'For larger businesses and advanced workflows',
    features: [
      'Everything in Professional',
      '20 team members',
      'Full API',
      'White-label branding',
      'Custom workflows',
      'Dedicated manager',
      'SLA guarantee',
      'All templates (Standard + Premium + Elite)',
    ],
  },
];

const CHECKOUT_EMAIL_KEY = 'ledgerly_checkout_email';

const formatNgn = (value: number) => {
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `NGN ${Number(value || 0).toLocaleString('en-NG')}`;
  }
};

const isValidEmail = (value: string) => /^\S+@\S+\.\S+$/.test(String(value || '').trim().toLowerCase());

export default function PlanOnboardingScreen() {
  const { colors } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('starter');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [lastCheckoutReference, setLastCheckoutReference] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(CHECKOUT_EMAIL_KEY)
      .then((value) => {
        const normalized = String(value || '').trim().toLowerCase();
        if (normalized && isValidEmail(normalized)) {
          setCheckoutEmail(normalized);
        }
      })
      .catch(() => undefined);
  }, []);

  const selectedPlanMeta = PLANS.find((plan) => plan.id === selectedPlan) || PLANS[0];
  const selectedPrice =
    billingCycle === 'yearly' ? selectedPlanMeta.yearlyPrice : selectedPlanMeta.monthlyPrice;

  const goToSignup = async ({
    plan,
    includePlanContext = false,
    paymentReference = '',
    paid,
  }: SignupNavigationOptions) => {
    const normalizedEmail = checkoutEmail.trim().toLowerCase();
    if (normalizedEmail && isValidEmail(normalizedEmail)) {
      await AsyncStorage.setItem(CHECKOUT_EMAIL_KEY, normalizedEmail);
    }

    const params: Record<string, string> = {};
    if (includePlanContext) {
      params.selectedPlan = plan;
      params.billingCycle = billingCycle;
    }
    if (normalizedEmail) {
      params.checkoutEmail = normalizedEmail;
    }
    if (paymentReference) {
      params.reference = paymentReference;
    }
    if (typeof paid === 'boolean') {
      params.paid = paid ? '1' : '0';
    }

    router.push({
      pathname: '/signup',
      params,
    } as never);
  };

  const handleStartCheckout = async () => {
    const normalizedEmail = checkoutEmail.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      Alert.alert('Valid Email Required', 'Enter your email to continue paid checkout.');
      return;
    }

    if (selectedPlan === 'starter') {
      await goToSignup({ plan: 'starter' });
      return;
    }

    setIsStartingCheckout(true);
    try {
      await AsyncStorage.setItem(CHECKOUT_EMAIL_KEY, normalizedEmail);
      const response: any = await initializePublicSubscriptionPayment({
        plan: selectedPlan,
        billingCycle,
        email: normalizedEmail,
      });
      const data = response?.data || response || {};
      const authorizationUrl = data?.authorizationUrl || data?.authorization_url;
      const reference = String(data?.reference || '').trim();
      if (!authorizationUrl) {
        throw new Error('Unable to start checkout right now.');
      }
      if (reference) {
        setLastCheckoutReference(reference);
      }

      Alert.alert(
        'Checkout Started',
        'Complete payment in Paystack. Then open the deep-link test action below to continue signup prefilled.',
      );
      await Linking.openURL(authorizationUrl);
    } catch (error: any) {
      Alert.alert('Checkout Failed', error?.message || 'Unable to start checkout.');
    } finally {
      setIsStartingCheckout(false);
    }
  };

  const handleOpenDeepLinkTest = async () => {
    const reference = String(lastCheckoutReference || '').trim();
    if (!reference) {
      Alert.alert('Checkout Reference Missing', 'Start checkout first to generate a payment reference.');
      return;
    }

    const normalizedEmail = checkoutEmail.trim().toLowerCase();
    const searchParams = new URLSearchParams({
      selectedPlan,
      billingCycle,
      reference,
      paid: '1',
    });
    if (normalizedEmail && isValidEmail(normalizedEmail)) {
      searchParams.set('checkoutEmail', normalizedEmail);
    }

    try {
      await Linking.openURL(`ledgerlymobile://checkout?${searchParams.toString()}`);
    } catch (error: any) {
      Alert.alert('Unable To Open Link', error?.message || 'Could not open deep-link test route.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.background} pointerEvents="none">
        <LinearGradient
          colors={[colors.pageGradientStart, colors.background, colors.pageGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.glow,
            {
              backgroundColor: colors.glowCyan,
              top: -70,
              right: -40,
            },
          ]}
        />
        <View
          style={[
            styles.glowSmall,
            {
              backgroundColor: colors.glowBlue,
              bottom: 120,
              left: -24,
            },
          ]}
        />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Choose Your Plan</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Start a free trial or continue to paid checkout before signup.
          </Text>
        </View>

        <View style={[styles.cycleToggle, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => {
            const active = billingCycle === cycle;
            return (
              <TouchableOpacity
                key={cycle}
                style={[
                  styles.cycleButton,
                  {
                    backgroundColor: active ? colors.primary500 : 'transparent',
                  },
                ]}
                onPress={() => setBillingCycle(cycle)}
              >
                <Text style={[styles.cycleText, { color: active ? '#fff' : colors.text }]}>
                  {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.planList}>
          {PLANS.map((plan) => {
            const isActive = selectedPlan === plan.id;
            const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isActive ? colors.primary500 : colors.border,
                  },
                ]}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.92}
              >
                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                  {plan.popular ? (
                    <View style={[styles.popularBadge, { backgroundColor: colors.primary100 }]}>
                      <Text style={[styles.popularText, { color: colors.primary700 }]}>Popular</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.planDescription, { color: colors.textSecondary }]}>{plan.description}</Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.planPrice, { color: colors.text }]}>{formatNgn(price)}</Text>
                  <Text style={[styles.planInterval, { color: colors.textTertiary }]}>
                    /{billingCycle === 'yearly' ? 'year' : 'month'}
                  </Text>
                </View>
                {billingCycle === 'yearly' ? (
                  <Text style={[styles.equivalent, { color: colors.primary600 }]}>
                    {formatNgn(plan.monthlyEquivalent)}/month equivalent
                  </Text>
                ) : null}

                <View style={styles.featureList}>
                  {plan.features.slice(0, 4).map((feature) => (
                    <View key={`${plan.id}-${feature}`} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                      <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.checkoutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.checkoutTitle, { color: colors.text }]}>Checkout Email</Text>
          <Text style={[styles.checkoutHint, { color: colors.textSecondary }]}>
            Required for paid checkout and prefilled signup.
          </Text>
          <TextInput
            value={checkoutEmail}
            onChangeText={setCheckoutEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@business.com"
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.emailInput,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            editable={!isStartingCheckout}
          />

          <TouchableOpacity
            style={[
              styles.primaryAction,
              { backgroundColor: colors.primary500, opacity: isStartingCheckout ? 0.75 : 1 },
            ]}
            onPress={handleStartCheckout}
            disabled={isStartingCheckout}
          >
            {isStartingCheckout ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryActionText}>
                {selectedPlan === 'starter'
                  ? 'Continue With Starter Trial'
                  : `Pay For ${selectedPlanMeta.name}`}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryAction, { borderColor: colors.border }]}
            onPress={() => goToSignup({ plan: 'starter' })}
            disabled={isStartingCheckout}
          >
            <Text style={[styles.secondaryActionText, { color: colors.textSecondary }]}>
              Start Free Trial Instead
            </Text>
          </TouchableOpacity>

          {lastCheckoutReference ? (
            <TouchableOpacity
              style={[styles.testLinkAction, { borderColor: colors.primary500 }]}
              onPress={handleOpenDeepLinkTest}
              disabled={isStartingCheckout}
            >
              <Text style={[styles.testLinkActionText, { color: colors.primary600 }]}>
                Open Deep-Link Test Route
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  glowSmall: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  content: {
    padding: 18,
    paddingBottom: 28,
    gap: 14,
  },
  header: {
    marginTop: 4,
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  cycleToggle: {
    borderWidth: 1,
    borderRadius: 999,
    padding: 4,
    flexDirection: 'row',
    gap: 6,
  },
  cycleButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cycleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  planList: {
    gap: 10,
  },
  planCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
  },
  popularBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '700',
  },
  planDescription: {
    fontSize: 13,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  planPrice: {
    fontSize: 26,
    fontWeight: '800',
  },
  planInterval: {
    fontSize: 12,
    marginBottom: 4,
  },
  equivalent: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  featureList: {
    marginTop: 10,
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    flex: 1,
  },
  checkoutCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  checkoutTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  checkoutHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  emailInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },
  primaryAction: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryAction: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  testLinkAction: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  testLinkActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
