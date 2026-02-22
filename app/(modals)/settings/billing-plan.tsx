import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Switch,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { fetchBillingSummary, initializeSubscriptionPayment, updateAddOns } from '@/services/billingService';

type Plan = {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
};

type BillingSummary = {
  planCatalog?: Record<string, Plan>;
  subscription?: {
    plan?: string;
    billingCycle?: 'monthly' | 'yearly';
    status?: string;
    subscriptionStart?: string;
    subscriptionEnd?: string;
  };
  addOns?: {
    whiteLabelEnabled?: boolean;
    extraSeats?: number;
    analyticsEnabled?: boolean;
  };
  currency?: string;
  businessName?: string;
};

const PLAN_FEATURES: Record<string, string[]> = {
  starter: [
    '100 invoices per month',
    'Unlimited receipts',
    'Basic reporting',
    'Email support',
    'Single user',
    'Mobile app access',
    'Standard templates only',
  ],
  professional: [
    'Unlimited invoices',
    'Advanced reporting',
    '5 team members',
    'Priority support',
    'Recurring invoices',
    'Inventory management',
    'Customer database',
    'Multi-currency',
    'Standard + Premium templates',
  ],
  enterprise: [
    'Everything in Professional',
    '20 team members',
    'Full API access',
    'White-label branding',
    'Custom workflows',
    'Dedicated manager',
    'SLA guarantee',
    'All templates (Elite included)',
  ],
};

const PLAN_ORDER = ['starter', 'professional', 'enterprise'];

const FALLBACK_PLANS: Plan[] = [
  { id: 'starter', name: 'Starter', monthlyPrice: 9, yearlyPrice: Number((9 * 12 * 0.8).toFixed(2)) },
  { id: 'professional', name: 'Professional', monthlyPrice: 29, yearlyPrice: Number((29 * 12 * 0.8).toFixed(2)) },
  { id: 'enterprise', name: 'Enterprise', monthlyPrice: 79, yearlyPrice: Number((79 * 12 * 0.8).toFixed(2)) },
];

const formatDate = (value?: string) => {
  if (!value) return 'Not set';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not set';
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatCurrency = (value: number, currency = 'USD') => {
  if (!Number.isFinite(value)) return String(value);
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  } catch (error) {
    return `${currency} ${value.toFixed(2)}`;
  }
};

export default function BillingPlanScreen() {
  const { colors } = useTheme();
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('starter');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [addOns, setAddOns] = useState({
    whiteLabelEnabled: false,
    extraSeats: 0,
    analyticsEnabled: false,
  });
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingAddOns, setSavingAddOns] = useState(false);

  const loadSummary = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response: any = await fetchBillingSummary();
      const data: BillingSummary = response?.data ?? response ?? {};
      setBilling(data);
      setSelectedPlan(data?.subscription?.plan || 'starter');
      setBillingCycle(data?.subscription?.billingCycle === 'yearly' ? 'yearly' : 'monthly');
      setAddOns({
        whiteLabelEnabled: Boolean(data?.addOns?.whiteLabelEnabled),
        extraSeats: Number.isFinite(Number(data?.addOns?.extraSeats))
          ? Number(data?.addOns?.extraSeats)
          : 0,
        analyticsEnabled: Boolean(data?.addOns?.analyticsEnabled),
      });
    } catch (err: any) {
      setError(err?.message || 'Unable to load billing summary.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const planCatalog = useMemo(() => {
    const catalog = billing?.planCatalog || {};
    const ordered = PLAN_ORDER.map((id) => catalog[id]).filter(Boolean);
    return ordered.length ? ordered : FALLBACK_PLANS;
  }, [billing]);

  const currentSubscription = billing?.subscription || {};
  const currentPlan = currentSubscription?.plan || 'starter';
  const currentCycle = currentSubscription?.billingCycle || 'monthly';
  const currentStatus = String(currentSubscription?.status || 'active').toLowerCase();
  const hasPlanChanges = selectedPlan !== currentPlan || billingCycle !== currentCycle;

  const hasAddOnChanges = useMemo(() => {
    if (!billing?.addOns) return true;
    return (
      Boolean(billing.addOns.whiteLabelEnabled) !== Boolean(addOns.whiteLabelEnabled) ||
      Number(billing.addOns.extraSeats || 0) !== Number(addOns.extraSeats || 0) ||
      Boolean(billing.addOns.analyticsEnabled) !== Boolean(addOns.analyticsEnabled)
    );
  }, [billing, addOns]);

  const canUseWhiteLabel = currentStatus !== 'trial' && ['professional', 'enterprise'].includes(currentPlan);
  const canUseExtraSeats = currentStatus !== 'trial' && ['professional', 'enterprise'].includes(currentPlan);

  const handleUpdatePlan = async () => {
    if (!hasPlanChanges) return;
    setSavingPlan(true);
    try {
      const response: any = await initializeSubscriptionPayment({ plan: selectedPlan, billingCycle });
      const data = response?.data ?? response ?? {};
      const url = data?.authorizationUrl || data?.authorization_url;
      if (url) {
        await Linking.openURL(url);
        Alert.alert('Complete Payment', 'Finish the Paystack checkout to activate your plan.');
        return;
      }
      setError('Unable to start payment.');
    } catch (err: any) {
      setError(err?.message || 'Unable to update subscription.');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleUpdateAddOns = async () => {
    setSavingAddOns(true);
    try {
      await updateAddOns({
        whiteLabelEnabled: canUseWhiteLabel ? addOns.whiteLabelEnabled : false,
        extraSeats: canUseExtraSeats ? addOns.extraSeats : 0,
        analyticsEnabled: addOns.analyticsEnabled,
      });
      await loadSummary(true);
    } catch (err: any) {
      setError(err?.message || 'Unable to update add-ons.');
    } finally {
      setSavingAddOns(false);
    }
  };

  const handleExtraSeatsChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    const nextValue = cleaned === '' ? 0 : Number(cleaned);
    setAddOns((prev) => ({ ...prev, extraSeats: Number.isFinite(nextValue) ? nextValue : 0 }));
  };

  const currency = billing?.currency || 'USD';
  const statusLabel = String(currentSubscription?.status || 'active').replace(/_/g, ' ');
  const statusKey = String(currentSubscription?.status || 'active').toLowerCase();
  const statusColor =
    statusKey === 'active'
      ? colors.success
      : statusKey === 'trial'
        ? colors.primary500
        : colors.warning;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadSummary(true);
            }}
            tintColor={colors.primary500}
            colors={[colors.primary500]}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.primary500} />
            <Text style={[styles.loadingText, { color: colors.textTertiary }]}>
              Loading billing details...
            </Text>
          </View>
        ) : (
          <>
            {error && (
              <View style={[styles.noticeCard, { backgroundColor: colors.error + '12' }]}>
                <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
                <Text style={[styles.noticeText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            <View
              style={[
                styles.summaryCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.summaryHeader}>
                <View>
                  <Text style={[styles.summaryTitle, { color: colors.text }]}>Current Plan</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                </View>
              </View>
              <View style={styles.summaryMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={18} color={colors.textTertiary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    Renewal: {formatDate(currentSubscription?.subscriptionEnd)}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="cash-outline" size={18} color={colors.textTertiary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    Billing: {currentCycle}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="business-outline" size={18} color={colors.textTertiary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {billing?.businessName || 'Ledgerly'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Plan Options</Text>
                <View style={styles.cycleToggle}>
                  {(['monthly', 'yearly'] as const).map((cycle) => {
                    const isActive = billingCycle === cycle;
                    return (
                      <TouchableOpacity
                        key={cycle}
                        style={[
                          styles.cycleButton,
                          {
                            backgroundColor: isActive ? colors.primary500 : colors.surface,
                            borderColor: isActive ? colors.primary500 : colors.border,
                          },
                        ]}
                        onPress={() => setBillingCycle(cycle)}
                      >
                        <Text style={[styles.cycleButtonText, { color: isActive ? 'white' : colors.text }]}>
                          {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {planCatalog.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                const isPopular = plan.id === 'professional';
                const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
                const features = PLAN_FEATURES[plan.id] || [];

                return (
                  <View
                    key={plan.id}
                    style={[
                      styles.planCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: isSelected ? colors.primary500 : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.planHeader}>
                      <Text style={[styles.planTitle, { color: colors.text }]}>{plan.name}</Text>
                      {isPopular && (
                        <View style={[styles.popularBadge, { backgroundColor: colors.primary500 }]}>
                          <Text style={styles.popularText}>Popular</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.planPriceRow}>
                      <Text style={[styles.planPrice, { color: colors.text }]}>
                        {formatCurrency(price, currency)}
                      </Text>
                      <Text style={[styles.planInterval, { color: colors.textTertiary }]}>
                        /{billingCycle === 'yearly' ? 'year' : 'month'}
                      </Text>
                    </View>
                    <View style={styles.featureList}>
                      {features.map((feature) => (
                        <View key={feature} style={styles.featureItem}>
                          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                          <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                            {feature}
                          </Text>
                        </View>
                      ))}
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.selectButton,
                        {
                          backgroundColor: isSelected ? colors.primary500 : 'transparent',
                          borderColor: isSelected ? colors.primary500 : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedPlan(plan.id)}
                    >
                      <Text style={[styles.selectButtonText, { color: isSelected ? 'white' : colors.text }]}>
                        {isSelected ? 'Selected' : 'Select Plan'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              <TouchableOpacity
                style={[
                  styles.primaryAction,
                  { backgroundColor: colors.primary500 },
                  (!hasPlanChanges || savingPlan) && { opacity: 0.5 },
                ]}
                onPress={handleUpdatePlan}
                disabled={!hasPlanChanges || savingPlan}
              >
                {savingPlan ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.primaryActionText}>Update Plan</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Add-ons</Text>

              <View style={[styles.addOnCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.addOnHeader}>
                  <View style={styles.addOnInfo}>
                    <Text style={[styles.addOnTitle, { color: colors.text }]}>White-label</Text>
                    <Text style={[styles.addOnSubtitle, { color: colors.textTertiary }]}>
                      Remove Ledgerly branding (Professional+)
                    </Text>
                  </View>
                  <Switch
                    value={addOns.whiteLabelEnabled}
                    onValueChange={(value) => canUseWhiteLabel && setAddOns((prev) => ({
                      ...prev,
                      whiteLabelEnabled: value,
                    }))}
                    trackColor={{ false: colors.border, true: colors.primary300 }}
                    thumbColor={addOns.whiteLabelEnabled ? colors.primary500 : colors.textLight}
                    disabled={!canUseWhiteLabel}
                  />
                </View>
                {!canUseWhiteLabel && (
                  <Text style={[styles.addOnNote, { color: colors.warning }]}>
                    Upgrade to Professional to enable this add-on.
                  </Text>
                )}
              </View>

              <View style={[styles.addOnCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.addOnHeader}>
                  <View style={styles.addOnInfo}>
                    <Text style={[styles.addOnTitle, { color: colors.text }]}>Extra seats</Text>
                    <Text style={[styles.addOnSubtitle, { color: colors.textTertiary }]}>
                      $5 per additional seat
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.seatInput,
                      {
                        backgroundColor: colors.input,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                      !canUseExtraSeats && { opacity: 0.5 },
                    ]}
                    value={String(addOns.extraSeats || 0)}
                    onChangeText={handleExtraSeatsChange}
                    keyboardType="numeric"
                    editable={canUseExtraSeats}
                  />
                </View>
                {!canUseExtraSeats && (
                  <Text style={[styles.addOnNote, { color: colors.warning }]}>
                    Upgrade to Professional to add seats.
                  </Text>
                )}
              </View>

              <View style={[styles.addOnCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.addOnHeader}>
                  <View style={styles.addOnInfo}>
                    <Text style={[styles.addOnTitle, { color: colors.text }]}>Analytics AI</Text>
                    <Text style={[styles.addOnSubtitle, { color: colors.textTertiary }]}>
                      $10 per month
                    </Text>
                  </View>
                  <Switch
                    value={addOns.analyticsEnabled}
                    onValueChange={(value) => setAddOns((prev) => ({
                      ...prev,
                      analyticsEnabled: value,
                    }))}
                    trackColor={{ false: colors.border, true: colors.primary300 }}
                    thumbColor={addOns.analyticsEnabled ? colors.primary500 : colors.textLight}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryAction,
                  { backgroundColor: colors.primary500 },
                  (!hasAddOnChanges || savingAddOns) && { opacity: 0.5 },
                ]}
                onPress={handleUpdateAddOns}
                disabled={!hasAddOnChanges || savingAddOns}
              >
                {savingAddOns ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.primaryActionText}>Save Add-ons</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingState: {
    paddingTop: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  noticeCard: {
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  cycleToggle: {
    flexDirection: 'row',
    gap: 10,
  },
  cycleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
  },
  cycleButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  planCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  popularBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  popularText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  planPrice: {
    fontSize: 26,
    fontWeight: '700',
  },
  planInterval: {
    fontSize: 13,
    marginBottom: 4,
  },
  featureList: {
    marginTop: 12,
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
  },
  selectButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryAction: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryActionText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  addOnCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  addOnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  addOnInfo: {
    flex: 1,
  },
  addOnTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  addOnSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  addOnNote: {
    fontSize: 12,
    marginTop: 8,
  },
  seatInput: {
    minWidth: 70,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 14,
  },
});
