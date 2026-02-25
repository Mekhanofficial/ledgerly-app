// app/(modals)/settings/payment-method.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiDelete, apiGet, apiPost, apiPut, API_BASE_URL } from '@/services/apiClient';
import { DEFAULT_PAYMENT_METHOD_KEY } from '@/services/storageKeys';

interface PaymentMethod {
  id: string;
  name: string;
  accountDetails?: string;
  isActive: boolean;
}

interface PaystackSettings {
  enabled: boolean;
  webhookEnabled?: boolean;
  connectedAt?: string | null;
  updatedAt?: string | null;
  publicKey?: string;
  publicKeyMasked?: string;
  hasSecretKey?: boolean;
  secretKeyMasked?: string;
}

export default function PaymentMethodScreen() {
  const { colors } = useTheme();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [defaultMethodId, setDefaultMethodId] = useState<string | null>(null);
  const [paystackSettings, setPaystackSettings] = useState<PaystackSettings | null>(null);
  const [paystackPublicKey, setPaystackPublicKey] = useState('');
  const [paystackSecretKey, setPaystackSecretKey] = useState('');
  const [loadingPaystack, setLoadingPaystack] = useState(false);
  const [savingPaystack, setSavingPaystack] = useState(false);

  useEffect(() => {
    loadDefaultMethod();
    fetchPaymentMethods();
    fetchPaystackSettings();
  }, []);

  const loadDefaultMethod = async () => {
    try {
      const savedDefault = await AsyncStorage.getItem(DEFAULT_PAYMENT_METHOD_KEY);
      if (savedDefault) setDefaultMethodId(savedDefault);
    } catch (error) {
      console.error('Error loading default payment method:', error);
    }
  };

  const fetchPaystackSettings = async () => {
    try {
      setLoadingPaystack(true);
      const response: any = await apiGet('/api/v1/business/paystack');
      const data = response?.data ?? response ?? null;
      setPaystackSettings(data);
      setPaystackPublicKey(data?.publicKey || '');
      setPaystackSecretKey('');
    } catch (error) {
      console.error('Error loading Paystack settings:', error);
    } finally {
      setLoadingPaystack(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response: any = await apiGet('/api/v1/business/payment-methods');
      const methods = response?.data ?? response ?? [];
      const mapped = methods.map((method: any) => ({
        id: method._id || method.id,
        name: method.name || 'Payment Method',
        accountDetails: method.accountDetails || '',
        isActive: method.isActive !== false,
      }));
      setPaymentMethods(mapped);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      Alert.alert('Error', 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setDefaultMethodId(id);
    try {
      await AsyncStorage.setItem(DEFAULT_PAYMENT_METHOD_KEY, id);
    } catch (error) {
      console.error('Error saving default payment method:', error);
    }
  };

  const handleDeleteMethod = (id: string) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiDelete(`/api/v1/business/payment-methods/${id}`);
              setPaymentMethods((prev) => prev.filter((method) => method.id !== id));
              if (defaultMethodId === id) {
                setDefaultMethodId(null);
                await AsyncStorage.removeItem(DEFAULT_PAYMENT_METHOD_KEY);
              }
            } catch (error) {
              Alert.alert('Error', 'Unable to remove payment method.');
            }
          },
        },
      ]
    );
  };

  const handleAddMethod = () => {
    Alert.alert(
      'Add Payment Method',
      'Which type of payment method would you like to add?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Credit/Debit Card', onPress: () => addNewMethod('card') },
        { text: 'Bank Account', onPress: () => addNewMethod('bank') },
        { text: 'Mobile Wallet', onPress: () => addNewMethod('mobile') },
        { text: 'Cash', onPress: () => addNewMethod('cash') },
      ]
    );
  };

  const addNewMethod = async (type: 'card' | 'bank' | 'mobile' | 'cash') => {
    try {
      const name =
        type === 'card'
          ? 'Card'
          : type === 'bank'
          ? 'Bank Transfer'
          : type === 'mobile'
          ? 'Mobile Wallet'
          : 'Cash';
      const response: any = await apiPost('/api/v1/business/payment-methods', {
        name,
        accountDetails: 'Added via mobile app',
      });
      const method = response?.data ?? response;
      const mapped: PaymentMethod = {
        id: method._id || method.id,
        name: method.name || name,
        accountDetails: method.accountDetails || 'Added via mobile app',
        isActive: method.isActive !== false,
      };
      setPaymentMethods((prev) => [mapped, ...prev]);
      if (!defaultMethodId) {
        handleSetDefault(mapped.id);
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to add payment method.');
    }
  };

  const getMethodIcon = (name: string) => {
    const value = name.toLowerCase();
    if (value.includes('bank')) return 'business-outline';
    if (value.includes('mobile') || value.includes('wallet')) return 'phone-portrait-outline';
    if (value.includes('cash')) return 'cash-outline';
    return 'card-outline';
  };

  const handleSavePaystack = async () => {
    const trimmedPublic = paystackPublicKey.trim();
    const trimmedSecret = paystackSecretKey.trim();

    if (!trimmedPublic && !trimmedSecret) {
      Alert.alert('Missing Keys', 'Enter a Paystack public key and secret key to connect.');
      return;
    }

    if (!trimmedPublic && !paystackSettings?.publicKey) {
      Alert.alert('Missing Public Key', 'Enter your business Paystack public key.');
      return;
    }

    if (!trimmedSecret && !paystackSettings?.hasSecretKey) {
      Alert.alert('Missing Secret Key', 'Enter your business Paystack secret key.');
      return;
    }

    try {
      setSavingPaystack(true);
      const response: any = await apiPut('/api/v1/business/paystack', {
        publicKey: trimmedPublic || undefined,
        secretKey: trimmedSecret || undefined,
        enabled: true,
        webhookEnabled: true,
      });
      const data = response?.data ?? response;
      setPaystackSettings(data);
      setPaystackPublicKey(data?.publicKey || trimmedPublic);
      setPaystackSecretKey('');
      Alert.alert('Saved', 'Paystack invoice payment settings updated.');
    } catch (error: any) {
      console.error('Error saving Paystack settings:', error);
      Alert.alert('Error', error?.message || 'Unable to save Paystack settings.');
    } finally {
      setSavingPaystack(false);
    }
  };

  const handleDisconnectPaystack = () => {
    Alert.alert(
      'Disconnect Paystack',
      'This will disable online invoice payments until you reconnect your keys.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              setSavingPaystack(true);
              const response: any = await apiDelete('/api/v1/business/paystack');
              const data = response?.data ?? response ?? null;
              setPaystackSettings(data);
              setPaystackSecretKey('');
              Alert.alert('Disconnected', 'Paystack invoice payments have been disabled.');
            } catch (error: any) {
              console.error('Error disconnecting Paystack:', error);
              Alert.alert('Error', error?.message || 'Unable to disconnect Paystack.');
            } finally {
              setSavingPaystack(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Your Payment Methods
        </Text>
        <Text style={[styles.sectionDescription, { color: colors.textTertiary }]}>
          Manage and organize your payment options
        </Text>

        <View style={styles.methodsList}>
          {loading && paymentMethods.length === 0 ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={colors.primary500} />
              <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading methods...</Text>
            </View>
          ) : paymentMethods.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No payment methods yet. Add one to get started.
            </Text>
          ) : (
            paymentMethods.map((method) => (
            <View
              key={method.id}
              style={[styles.methodCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.methodHeader}>
                <View style={styles.methodLeft}>
                  <View style={[styles.methodIcon, { backgroundColor: colors.primary50 }]}>
                    <Ionicons name={getMethodIcon(method.name)} size={24} color={colors.primary500} />
                  </View>
                  <View>
                    <Text style={[styles.methodName, { color: colors.text }]}>
                      {method.name}
                    </Text>
                    <Text style={[styles.methodDetails, { color: colors.textTertiary }]}>
                      {method.accountDetails || (method.isActive ? 'Active' : 'Inactive')}
                    </Text>
                  </View>
                </View>
                {defaultMethodId === method.id && (
                  <View style={[styles.defaultBadge, { backgroundColor: colors.success + '20' }]}>
                    <Text style={[styles.defaultText, { color: colors.success }]}>Default</Text>
                  </View>
                )}
              </View>

              <View style={[styles.methodActions, { borderTopColor: colors.border }]}>
                {defaultMethodId !== method.id && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleSetDefault(method.id)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={20} color={colors.textSecondary} />
                    <Text style={[styles.actionText, { color: colors.textSecondary }]}>Set as Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteMethod(method.id)}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
          )}
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary500 }]}
          onPress={handleAddMethod}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Payment Method</Text>
        </TouchableOpacity>

        <View style={[styles.paystackCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.paystackHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={[styles.methodIcon, { backgroundColor: colors.primary50 }]}>
                <Ionicons name="flash-outline" size={24} color={colors.primary500} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.methodName, { color: colors.text }]}>Paystack (Invoice Payments)</Text>
                <Text style={[styles.methodDetails, { color: colors.textTertiary }]}>
                  Business-owned Paystack keys for customer invoice checkout
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.defaultBadge,
                {
                  backgroundColor:
                    paystackSettings?.enabled && paystackSettings?.hasSecretKey
                      ? colors.success + '20'
                      : colors.warning + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.defaultText,
                  {
                    color:
                      paystackSettings?.enabled && paystackSettings?.hasSecretKey
                        ? colors.success
                        : colors.warning,
                  },
                ]}
              >
                {paystackSettings?.enabled && paystackSettings?.hasSecretKey ? 'Connected' : 'Not Connected'}
              </Text>
            </View>
          </View>

          {loadingPaystack ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={colors.primary500} />
              <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading Paystack settings...</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Public Key</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                ]}
                placeholder="pk_live_..."
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                value={paystackPublicKey}
                onChangeText={setPaystackPublicKey}
              />
              {paystackSettings?.publicKeyMasked ? (
                <Text style={[styles.helperText, { color: colors.textTertiary }]}>
                  Current key: {paystackSettings.publicKeyMasked}
                </Text>
              ) : null}

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>
                Secret Key
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                ]}
                placeholder={
                  paystackSettings?.hasSecretKey ? 'Leave blank to keep current secret key' : 'sk_live_...'
                }
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                value={paystackSecretKey}
                onChangeText={setPaystackSecretKey}
              />
              {paystackSettings?.secretKeyMasked ? (
                <Text style={[styles.helperText, { color: colors.textTertiary }]}>
                  Stored secret: {paystackSettings.secretKeyMasked}
                </Text>
              ) : null}

              <Text style={[styles.helperText, { color: colors.textTertiary, marginTop: 12 }]}>
                Webhook URL: {API_BASE_URL}/api/v1/webhooks/paystack
              </Text>

              <View style={styles.paystackActions}>
                <TouchableOpacity
                  style={[
                    styles.paystackButton,
                    { backgroundColor: colors.primary500, opacity: savingPaystack ? 0.7 : 1 },
                  ]}
                  disabled={savingPaystack}
                  onPress={handleSavePaystack}
                >
                  {savingPaystack ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.paystackButtonText}>Save Paystack Keys</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paystackButtonSecondary,
                    { borderColor: colors.border, opacity: savingPaystack ? 0.7 : 1 },
                  ]}
                  disabled={savingPaystack}
                  onPress={handleDisconnectPaystack}
                >
                  <Text style={[styles.paystackButtonSecondaryText, { color: colors.error }]}>
                    Disconnect
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary500} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Your payment information is encrypted and secure. We use industry-standard encryption to protect your data.
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
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 24,
  },
  methodsList: {
    gap: 12,
    marginBottom: 24,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
  },
  methodCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  methodDetails: {
    fontSize: 14,
  },
  defaultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '600',
  },
  methodActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  paystackCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  paystackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
  },
  paystackActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  paystackButton: {
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 160,
  },
  paystackButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  paystackButtonSecondary: {
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  paystackButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
