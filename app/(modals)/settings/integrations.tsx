import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { API_BASE_URL, ApiError } from '@/services/apiClient';
import {
  DEFAULT_INTEGRATIONS,
  fetchSettings,
  IntegrationProviderId,
  IntegrationsConfig,
  normalizeIntegrations,
  updateIntegration,
} from '@/services/settingsService';

type ProviderCategory = 'Payments' | 'Messaging' | 'Accounting' | 'Automation' | 'Platform';
type FieldType = 'text' | 'password' | 'number' | 'select' | 'checkbox';

type ProviderField = {
  key: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  options?: string[];
};

type ProviderMeta = {
  id: IntegrationProviderId;
  label: string;
  category: ProviderCategory;
  fields: ProviderField[];
};

const PROVIDERS: ProviderMeta[] = [
  {
    id: 'stripe',
    label: 'Stripe',
    category: 'Payments',
    fields: [
      { key: 'publicKey', label: 'Public Key', placeholder: 'pk_live_...' },
      { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'sk_live_...' },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', placeholder: 'whsec_...' },
    ],
  },
  {
    id: 'paypal',
    label: 'PayPal',
    category: 'Payments',
    fields: [
      { key: 'clientId', label: 'Client ID' },
      { key: 'secret', label: 'Secret', type: 'password' },
      { key: 'mode', label: 'Mode', type: 'select', options: ['sandbox', 'live'] },
    ],
  },
  {
    id: 'paystack',
    label: 'Paystack',
    category: 'Payments',
    fields: [
      { key: 'publicKey', label: 'Public Key', placeholder: 'pk_live_...' },
      { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'sk_live_...' },
    ],
  },
  {
    id: 'email',
    label: 'SMTP / Email',
    category: 'Messaging',
    fields: [
      { key: 'provider', label: 'Provider', placeholder: 'smtp' },
      { key: 'host', label: 'Host', placeholder: 'smtp.example.com' },
      { key: 'port', label: 'Port', type: 'number', placeholder: '587' },
      { key: 'secure', label: 'Secure (TLS)', type: 'checkbox' },
      { key: 'username', label: 'Username' },
      { key: 'password', label: 'Password', type: 'password' },
    ],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    category: 'Messaging',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password' },
      { key: 'senderId', label: 'Sender ID' },
    ],
  },
  {
    id: 'sms',
    label: 'SMS',
    category: 'Messaging',
    fields: [
      { key: 'provider', label: 'Provider' },
      { key: 'apiKey', label: 'API Key', type: 'password' },
      { key: 'senderId', label: 'Sender ID' },
    ],
  },
  {
    id: 'quickbooks',
    label: 'QuickBooks',
    category: 'Accounting',
    fields: [
      { key: 'clientId', label: 'Client ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password' },
    ],
  },
  {
    id: 'xero',
    label: 'Xero',
    category: 'Accounting',
    fields: [
      { key: 'clientId', label: 'Client ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password' },
    ],
  },
  {
    id: 'wave',
    label: 'Wave',
    category: 'Accounting',
    fields: [{ key: 'apiKey', label: 'API Key', type: 'password' }],
  },
  {
    id: 'zapier',
    label: 'Zapier',
    category: 'Automation',
    fields: [{ key: 'webhookUrl', label: 'Webhook URL', placeholder: 'https://hooks.zapier.com/...' }],
  },
  {
    id: 'restApi',
    label: 'REST API',
    category: 'Platform',
    fields: [
      { key: 'keyRotationDays', label: 'Key Rotation (days)', type: 'number', placeholder: '90' },
      { key: 'webhookBaseUrl', label: 'Webhook Base URL', placeholder: 'https://api.yourapp.com/webhooks' },
    ],
  },
];

const CATEGORY_ORDER: ProviderCategory[] = [
  'Payments',
  'Messaging',
  'Accounting',
  'Automation',
  'Platform',
];

const CATEGORY_META: Record<ProviderCategory, { icon: keyof typeof Ionicons.glyphMap; hint: string }> = {
  Payments: { icon: 'card-outline', hint: 'Stripe, PayPal, Paystack' },
  Messaging: { icon: 'chatbubble-ellipses-outline', hint: 'SMTP, WhatsApp, SMS' },
  Accounting: { icon: 'calculator-outline', hint: 'QuickBooks, Xero, Wave' },
  Automation: { icon: 'git-network-outline', hint: 'Zapier hooks' },
  Platform: { icon: 'server-outline', hint: 'REST API settings' },
};

const toRoleLabel = (role?: string) => {
  const normalized = String(role || '')
    .toLowerCase()
    .replace(/_/g, ' ');
  return normalized ? `${normalized[0].toUpperCase()}${normalized.slice(1)}` : 'Admin';
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Not synced';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not synced';
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default function IntegrationsSettingsScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const { width } = useWindowDimensions();
  const isWide = width >= 920;

  const [integrations, setIntegrations] = useState<IntegrationsConfig>(DEFAULT_INTEGRATIONS);
  const [activeProvider, setActiveProvider] = useState<IntegrationProviderId>('stripe');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingProvider, setSavingProvider] = useState<IntegrationProviderId | ''>('');
  const [readOnly, setReadOnly] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const groupedProviders = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        providers: PROVIDERS.filter((provider) => provider.category === category),
      })),
    []
  );

  const activeMeta = useMemo(
    () => PROVIDERS.find((provider) => provider.id === activeProvider) || PROVIDERS[0],
    [activeProvider]
  );

  const activeConfig = integrations[activeProvider] as Record<string, any>;
  const providerEnabled = Boolean(activeConfig?.enabled);

  const loadIntegrations = async (pullToRefresh = false) => {
    try {
      if (pullToRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const settings = await fetchSettings();
      setIntegrations(normalizeIntegrations(settings?.integrations));
      setErrorMessage('');
      setReadOnly(false);
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setReadOnly(true);
        setErrorMessage('You do not have permission to update integrations.');
      } else {
        setErrorMessage((error as Error)?.message || 'Failed to load integrations.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  const setProviderField = (providerId: IntegrationProviderId, key: string, value: any) => {
    setIntegrations((prev) => ({
      ...prev,
      [providerId]: {
        ...(prev[providerId] as Record<string, any>),
        [key]: value,
      },
    }));
  };

  const getSavePayload = (providerId: IntegrationProviderId) => {
    const providerMeta = PROVIDERS.find((provider) => provider.id === providerId);
    const providerConfig = { ...(integrations[providerId] as Record<string, any>) };

    providerConfig.enabled = Boolean(providerConfig.enabled);

    (providerMeta?.fields || []).forEach((field) => {
      const raw = providerConfig[field.key];
      if (field.type === 'number') {
        const parsed = Number(raw);
        providerConfig[field.key] = Number.isFinite(parsed) ? parsed : 0;
        return;
      }
      if (field.type === 'checkbox') {
        providerConfig[field.key] = Boolean(raw);
        return;
      }
      providerConfig[field.key] = String(raw ?? '');
    });

    return providerConfig;
  };

  const handleSaveProvider = async () => {
    try {
      setSavingProvider(activeProvider);
      const saved = await updateIntegration(activeProvider, getSavePayload(activeProvider));
      setIntegrations((prev) => ({
        ...prev,
        [activeProvider]: {
          ...(prev[activeProvider] as Record<string, any>),
          ...(saved || {}),
        },
      }));
      setLastSyncedAt(new Date().toISOString());
      Alert.alert('Saved', `${activeMeta.label} settings saved.`);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setReadOnly(true);
        Alert.alert('Permission denied', 'You do not have permission to update integrations.');
        return;
      }
      Alert.alert('Save failed', (error as Error)?.message || `Failed to save ${activeMeta.label} settings.`);
    } finally {
      setSavingProvider('');
    }
  };

  const renderField = (field: ProviderField) => {
    const value = activeConfig?.[field.key];

    if (field.type === 'checkbox') {
      return (
        <View
          key={field.key}
          style={[
            styles.toggleFieldCard,
            { borderColor: colors.border, backgroundColor: colors.card },
            isWide && styles.fieldBlockWide,
          ]}
        >
          <Text style={[styles.fieldLabel, { color: colors.text }]}>{field.label}</Text>
          <Switch
            value={Boolean(value)}
            onValueChange={(next) => setProviderField(activeProvider, field.key, next)}
            disabled={readOnly}
            trackColor={{ false: colors.border, true: colors.primary300 }}
            thumbColor={Boolean(value) ? colors.primary500 : colors.textLight}
          />
        </View>
      );
    }

    if (field.type === 'select') {
      return (
        <View key={field.key} style={[styles.fieldBlock, isWide && styles.fieldBlockWide]}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{field.label}</Text>
          <View style={styles.optionRow}>
            {(field.options || []).map((option) => {
              const isSelected = String(value || field.options?.[0] || '') === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: isSelected ? colors.primary500 : colors.surface,
                      borderColor: isSelected ? colors.primary500 : colors.border,
                    },
                  ]}
                  onPress={() => setProviderField(activeProvider, field.key, option)}
                  disabled={readOnly}
                >
                  <Text style={[styles.optionChipText, { color: isSelected ? 'white' : colors.text }]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }

    const displayValue =
      field.type === 'number'
        ? String(Number.isFinite(Number(value)) ? Number(value) : '')
        : String(value ?? '');

    return (
      <View key={field.key} style={[styles.fieldBlock, isWide && styles.fieldBlockWide]}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{field.label}</Text>
        <TextInput
          style={[
            styles.fieldInput,
            { borderColor: colors.border, backgroundColor: colors.background, color: colors.text },
            readOnly && { opacity: 0.65 },
          ]}
          value={displayValue}
          placeholder={field.placeholder || field.label}
          placeholderTextColor={colors.textTertiary}
          editable={!readOnly}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={field.type === 'password'}
          keyboardType={field.type === 'number' ? 'numeric' : 'default'}
          onChangeText={(text) => {
            if (field.type === 'number') {
              const numeric = text.replace(/[^0-9]/g, '');
              setProviderField(activeProvider, field.key, numeric === '' ? 0 : Number(numeric));
              return;
            }
            setProviderField(activeProvider, field.key, text);
          }}
        />
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadIntegrations(true)}
          tintColor={colors.primary500}
          colors={[colors.primary500]}
        />
      }
    >
      <View style={[styles.businessCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <View style={styles.businessHeader}>
          <View style={styles.businessHeaderCopy}>
            <Text style={[styles.breadcrumb, { color: colors.textTertiary }]}>Admin / Settings</Text>
            <Text style={[styles.businessTitle, { color: colors.text }]}>Business Settings</Text>
            <Text style={[styles.businessSubtitle, { color: colors.textSecondary }]}>
              Manage account preferences, automation, and business configuration.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.refreshButton, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => loadIntegrations(true)}
            disabled={loading}
          >
            <Ionicons name="refresh-outline" size={16} color={colors.text} />
            <Text style={[styles.refreshButtonText, { color: colors.text }]}>Refresh</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.integrationsIntro, { borderColor: colors.border, backgroundColor: colors.card }]}> 
          <View style={[styles.introIconWrap, { backgroundColor: colors.primary50 }]}> 
            <Ionicons name="git-network-outline" size={18} color={colors.primary500} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.introTitle, { color: colors.text }]}>Integrations</Text>
            <Text style={[styles.introSubtitle, { color: colors.textTertiary }]}>
              Configure business-level integrations (payment gateways, accounting sync, messaging providers,
              automation hooks, and API settings). This is for admins/business setup.
            </Text>
          </View>
        </View>

        <Text style={[styles.adminAccess, { color: colors.primary500 }]}>{toRoleLabel(user?.role)} settings access</Text>
      </View>

      {errorMessage ? (
        <View style={[styles.noticeCard, { backgroundColor: colors.error + '14', borderColor: colors.error + '55' }]}> 
          <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
          <Text style={[styles.noticeText, { color: colors.error }]}>{errorMessage}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.primary500} />
          <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading integrations...</Text>
        </View>
      ) : (
        <View style={[styles.mainGrid, isWide && styles.mainGridWide]}>
          <View
            style={[
              styles.providersCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              isWide && styles.providersCardWide,
            ]}
          >
            {groupedProviders.map((group) => {
              const meta = CATEGORY_META[group.category];
              return (
                <View key={group.category} style={styles.providerGroup}>
                  <View style={styles.groupHeader}> 
                    <Ionicons name={meta.icon} size={13} color={colors.textTertiary} />
                    <Text style={[styles.groupTitle, { color: colors.textTertiary }]}>{group.category}</Text>
                  </View>
                  <Text style={[styles.groupHint, { color: colors.textLight }]}>{meta.hint}</Text>

                  {group.providers.map((provider) => {
                    const isActive = activeProvider === provider.id;
                    const enabled = Boolean((integrations[provider.id] as Record<string, any>)?.enabled);
                    return (
                      <TouchableOpacity
                        key={provider.id}
                        style={[
                          styles.providerRow,
                          {
                            borderColor: isActive ? colors.primary500 : colors.border,
                            backgroundColor: isActive ? colors.primary500 : colors.card,
                          },
                        ]}
                        onPress={() => setActiveProvider(provider.id)}
                      >
                        <Text style={[styles.providerLabel, { color: isActive ? 'white' : colors.text }]}>
                          {provider.label}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor: isActive
                                ? 'rgba(255,255,255,0.18)'
                                : enabled
                                  ? colors.success + '20'
                                  : colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              {
                                color: isActive
                                  ? 'white'
                                  : enabled
                                    ? colors.success
                                    : colors.textTertiary,
                              },
                            ]}
                          >
                            {enabled ? 'On' : 'Off'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </View>

          <View style={styles.detailColumn}>
            <View style={[styles.providerInfoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <View>
                <Text style={[styles.detailTitle, { color: colors.text }]}>{activeMeta.label}</Text>
                <Text style={[styles.detailSubtitle, { color: colors.textTertiary }]}>
                  {activeMeta.category} integration settings
                </Text>
              </View>
              <View
                style={[
                  styles.activeStatus,
                  {
                    backgroundColor: providerEnabled ? colors.success + '20' : colors.warning + '20',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.activeStatusText,
                    { color: providerEnabled ? colors.success : colors.warning },
                  ]}
                >
                  {providerEnabled ? 'On' : 'Off'}
                </Text>
              </View>
            </View>

            <View style={[styles.enableCard, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
              <View style={{ flex: 1 }}>
                <Text style={[styles.enableTitle, { color: colors.text }]}>Enable {activeMeta.label}</Text>
                <Text style={[styles.enableSubtitle, { color: colors.textTertiary }]}>
                  Toggle this integration on or off for your business.
                </Text>
              </View>
              <Switch
                value={providerEnabled}
                onValueChange={(next) => setProviderField(activeProvider, 'enabled', next)}
                disabled={readOnly}
                trackColor={{ false: colors.border, true: colors.primary300 }}
                thumbColor={providerEnabled ? colors.primary500 : colors.textLight}
              />
            </View>

            <View style={[styles.fieldsCard, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
              <View style={[styles.fieldGrid, isWide && styles.fieldGridWide]}>{activeMeta.fields.map(renderField)}</View>

              {activeProvider === 'paystack' && (
                <Text style={[styles.helperText, { color: colors.textTertiary }]}> 
                  Webhook URL: {API_BASE_URL}/api/v1/webhooks/paystack
                </Text>
              )}
            </View>

            <View style={[styles.saveRow, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <Text style={[styles.saveHelp, { color: colors.textTertiary }]}>
                Save writes provider settings to your business settings profile.
              </Text>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: readOnly ? colors.border : colors.primary500,
                  },
                ]}
                onPress={handleSaveProvider}
                disabled={Boolean(savingProvider) || readOnly}
              >
                {savingProvider === activeProvider ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={16} color="white" />
                    <Text style={styles.saveButtonText}>Save {activeMeta.label}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.systemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <Text style={[styles.systemTitle, { color: colors.text }]}>System Information</Text>
        <View style={styles.systemRow}>
          <Text style={[styles.systemLabel, { color: colors.textTertiary }]}>App Version</Text>
          <Text style={[styles.systemValue, { color: colors.text }]}>Ledgerly v{Constants.expoConfig?.version || '1.0.0'}</Text>
        </View>
        <View style={styles.systemRow}>
          <Text style={[styles.systemLabel, { color: colors.textTertiary }]}>Last Updated</Text>
          <Text style={[styles.systemValue, { color: colors.text }]}>{formatDateTime(lastSyncedAt)}</Text>
        </View>
        <View style={styles.systemRow}>
          <Text style={[styles.systemLabel, { color: colors.textTertiary }]}>API Endpoint</Text>
          <Text style={[styles.systemValue, { color: colors.text }]} numberOfLines={1}>
            {API_BASE_URL}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  businessCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  businessHeaderCopy: {
    flex: 1,
  },
  breadcrumb: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  businessTitle: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '700',
  },
  businessSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  refreshButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refreshButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  integrationsIntro: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  introIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  introTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  introSubtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
  },
  adminAccess: {
    fontSize: 12,
    fontWeight: '600',
  },
  noticeCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  loadingState: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
  },
  mainGrid: {
    gap: 12,
  },
  mainGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  providersCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  providersCardWide: {
    width: 320,
  },
  providerGroup: {
    gap: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  groupHint: {
    fontSize: 11,
    marginTop: -2,
    marginBottom: 2,
  },
  providerRow: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  providerLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailColumn: {
    flex: 1,
    gap: 12,
  },
  providerInfoCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  detailSubtitle: {
    marginTop: 3,
    fontSize: 12,
  },
  activeStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  activeStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  enableCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  enableTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  enableSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 16,
  },
  fieldsCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  fieldGrid: {
    gap: 10,
  },
  fieldGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  fieldBlock: {
    gap: 6,
  },
  fieldBlockWide: {
    width: '48%',
  },
  toggleFieldCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    borderWidth: 1,
    borderRadius: 999,
    minHeight: 34,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  helperText: {
    fontSize: 12,
    lineHeight: 16,
  },
  saveRow: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  saveHelp: {
    fontSize: 12,
    lineHeight: 16,
  },
  saveButton: {
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  systemCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  systemTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  systemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  systemLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  systemValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '500',
  },
});
