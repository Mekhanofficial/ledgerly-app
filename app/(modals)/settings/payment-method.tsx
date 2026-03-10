// app/(modals)/settings/payment-method.tsx
import React, { useEffect, useState } from 'react';
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
import { apiDelete, apiGet, apiPost, apiPut } from '@/services/apiClient';
import { DEFAULT_PAYMENT_METHOD_KEY } from '@/services/storageKeys';

interface PaymentMethod {
  id: string;
  name: string;
  accountDetails?: string;
  isActive: boolean;
}

interface BankDetailsForm {
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string;
  swiftCode: string;
}

const EMPTY_BANK_FORM: BankDetailsForm = {
  bankName: '',
  accountName: '',
  accountNumber: '',
  routingNumber: '',
  swiftCode: '',
};

const parseBankDetails = (accountDetails?: string): BankDetailsForm => {
  if (!accountDetails) return { ...EMPTY_BANK_FORM };

  try {
    const parsed = JSON.parse(accountDetails);
    if (parsed && typeof parsed === 'object') {
      return {
        bankName: String(parsed.bankName || ''),
        accountName: String(parsed.accountName || ''),
        accountNumber: String(parsed.accountNumber || ''),
        routingNumber: String(parsed.routingNumber || ''),
        swiftCode: String(parsed.swiftCode || ''),
      };
    }
  } catch {
    // Falls back to line-based parsing below.
  }

  const lines = accountDetails.split('\n').map((line) => line.trim());
  const read = (label: string) => {
    const target = `${label.toLowerCase()}:`;
    const line = lines.find((entry) => entry.toLowerCase().startsWith(target));
    return line ? line.slice(target.length).trim() : '';
  };

  return {
    bankName: read('Bank') || read('Bank Name'),
    accountName: read('Account Name'),
    accountNumber: read('Account Number'),
    routingNumber: read('Routing Number') || read('Sort Code'),
    swiftCode: read('SWIFT') || read('SWIFT/BIC'),
  };
};

const formatBankDetails = (details: BankDetailsForm) => {
  const lines = [
    `Bank: ${details.bankName.trim()}`,
    `Account Name: ${details.accountName.trim()}`,
    `Account Number: ${details.accountNumber.trim()}`,
  ];

  if (details.routingNumber.trim()) {
    lines.push(`Routing Number: ${details.routingNumber.trim()}`);
  }

  if (details.swiftCode.trim()) {
    lines.push(`SWIFT/BIC: ${details.swiftCode.trim()}`);
  }

  return lines.join('\n');
};

export default function PaymentMethodScreen() {
  const { colors } = useTheme();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [defaultMethodId, setDefaultMethodId] = useState<string | null>(null);
  const [bankMethodId, setBankMethodId] = useState<string | null>(null);
  const [bankForm, setBankForm] = useState<BankDetailsForm>({ ...EMPTY_BANK_FORM });
  const [savingBankDetails, setSavingBankDetails] = useState(false);

  useEffect(() => {
    loadDefaultMethod();
    fetchPaymentMethods();
  }, []);

  const loadDefaultMethod = async () => {
    try {
      const savedDefault = await AsyncStorage.getItem(DEFAULT_PAYMENT_METHOD_KEY);
      if (savedDefault) setDefaultMethodId(savedDefault);
    } catch (error) {
      console.error('Error loading default payment method:', error);
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

      const existingBankMethod = mapped.find((method: PaymentMethod) =>
        method.name.toLowerCase().includes('bank')
      );

      if (existingBankMethod) {
        setBankMethodId(existingBankMethod.id);
        setBankForm(parseBankDetails(existingBankMethod.accountDetails));
      } else {
        setBankMethodId(null);
      }
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

              if (bankMethodId === id) {
                setBankMethodId(null);
                setBankForm({ ...EMPTY_BANK_FORM });
              }

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
      'Choose a payment method type. For bank transfers, use the Bank Details form below.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Credit/Debit Card', onPress: () => addNewMethod('card') },
        { text: 'Mobile Wallet', onPress: () => addNewMethod('mobile') },
        { text: 'Cash', onPress: () => addNewMethod('cash') },
      ]
    );
  };

  const addNewMethod = async (type: 'card' | 'mobile' | 'cash') => {
    try {
      const name = type === 'card' ? 'Card' : type === 'mobile' ? 'Mobile Wallet' : 'Cash';
      const accountDetails =
        type === 'card'
          ? 'Card payments accepted'
          : type === 'mobile'
          ? 'Mobile wallet payments accepted'
          : 'Cash payments accepted';

      const response: any = await apiPost('/api/v1/business/payment-methods', {
        name,
        accountDetails,
      });

      const method = response?.data ?? response;
      const mapped: PaymentMethod = {
        id: method._id || method.id,
        name: method.name || name,
        accountDetails: method.accountDetails || accountDetails,
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

  const handleSaveBankDetails = async () => {
    const payload: BankDetailsForm = {
      bankName: bankForm.bankName.trim(),
      accountName: bankForm.accountName.trim(),
      accountNumber: bankForm.accountNumber.replace(/\s+/g, ''),
      routingNumber: bankForm.routingNumber.trim(),
      swiftCode: bankForm.swiftCode.trim(),
    };

    if (!payload.bankName || !payload.accountName || !payload.accountNumber) {
      Alert.alert('Missing Details', 'Bank name, account name, and account number are required.');
      return;
    }

    if (!/^\d{6,20}$/.test(payload.accountNumber)) {
      Alert.alert('Invalid Account Number', 'Account number should contain 6 to 20 digits.');
      return;
    }

    try {
      setSavingBankDetails(true);

      const methodPayload = {
        name: 'Bank Transfer',
        accountDetails: formatBankDetails(payload),
      };

      let response: any;
      if (bankMethodId) {
        response = await apiPut(`/api/v1/business/payment-methods/${bankMethodId}`, methodPayload);
      } else {
        response = await apiPost('/api/v1/business/payment-methods', methodPayload);
      }

      const method = response?.data ?? response;
      const mapped: PaymentMethod = {
        id: method._id || method.id,
        name: method.name || 'Bank Transfer',
        accountDetails: method.accountDetails || methodPayload.accountDetails,
        isActive: method.isActive !== false,
      };

      setPaymentMethods((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === mapped.id);
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = mapped;
          return next;
        }
        return [mapped, ...prev];
      });

      setBankMethodId(mapped.id);
      setBankForm(payload);

      if (!defaultMethodId) {
        handleSetDefault(mapped.id);
      }

      Alert.alert('Saved', 'Bank details saved for Bank Transfer payments.');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Unable to save bank details.');
    } finally {
      setSavingBankDetails(false);
    }
  };

  const getMethodIcon = (name: string) => {
    const value = name.toLowerCase();
    if (value.includes('bank')) return 'business-outline';
    if (value.includes('mobile') || value.includes('wallet')) return 'phone-portrait-outline';
    if (value.includes('cash')) return 'cash-outline';
    return 'card-outline';
  };

  const renderMethodDetails = (method: PaymentMethod) => {
    const isBankMethod = method.name.toLowerCase().includes('bank');
    if (!isBankMethod) {
      return (
        <Text style={[styles.methodDetails, { color: colors.textTertiary }]} numberOfLines={2}>
          {method.accountDetails || (method.isActive ? 'Active' : 'Inactive')}
        </Text>
      );
    }

    const details = parseBankDetails(method.accountDetails);
    const rows = [
      { label: 'Bank', value: details.bankName },
      { label: 'Account Name', value: details.accountName },
      { label: 'Account No.', value: details.accountNumber },
      { label: 'Routing', value: details.routingNumber },
      { label: 'SWIFT/BIC', value: details.swiftCode },
    ].filter((entry) => entry.value);

    if (!rows.length) {
      return (
        <Text style={[styles.methodDetails, { color: colors.textTertiary }]}>
          No bank details saved yet.
        </Text>
      );
    }

    return (
      <View style={[styles.bankDetailsCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
        {rows.map((row) => (
          <View key={row.label} style={styles.bankDetailsRow}>
            <Text style={[styles.bankDetailsLabel, { color: colors.textTertiary }]}>{row.label}</Text>
            <Text style={[styles.bankDetailsValue, { color: colors.text }]} numberOfLines={1}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Payment Methods</Text>
        <Text style={[styles.sectionDescription, { color: colors.textTertiary }]}>Manage and organize your payment options</Text>

        <View style={styles.methodsList}>
          {loading && paymentMethods.length === 0 ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={colors.primary500} />
              <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading methods...</Text>
            </View>
          ) : paymentMethods.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No payment methods yet. Add one to get started.</Text>
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
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.methodName, { color: colors.text }]}>{method.name}</Text>
                      {renderMethodDetails(method)}
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
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleSetDefault(method.id)}>
                      <Ionicons name="checkmark-circle-outline" size={20} color={colors.textSecondary} />
                      <Text style={[styles.actionText, { color: colors.textSecondary }]}>Set as Default</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteMethod(method.id)}>
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary500 }]} onPress={handleAddMethod}>
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Payment Method</Text>
        </TouchableOpacity>

        <View style={[styles.bankCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.bankHeader}>
            <View style={[styles.bankIcon, { backgroundColor: colors.primary50 }]}> 
              <Ionicons name="business-outline" size={22} color={colors.primary500} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bankTitle, { color: colors.text }]}>Bank Details</Text>
              <Text style={[styles.bankSubtitle, { color: colors.textTertiary }]}>
                Add your business bank account for customers who prefer transfer payments.
              </Text>
            </View>
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Bank Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="e.g. Access Bank"
            placeholderTextColor={colors.textTertiary}
            value={bankForm.bankName}
            onChangeText={(value) => setBankForm((prev) => ({ ...prev, bankName: value }))}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Account Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="e.g. Ledgerly Ventures Ltd"
            placeholderTextColor={colors.textTertiary}
            value={bankForm.accountName}
            onChangeText={(value) => setBankForm((prev) => ({ ...prev, accountName: value }))}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Account Number</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="e.g. 0123456789"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            value={bankForm.accountNumber}
            onChangeText={(value) => setBankForm((prev) => ({ ...prev, accountNumber: value.replace(/[^0-9]/g, '') }))}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Routing/Sort Code (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="e.g. 044150149"
            placeholderTextColor={colors.textTertiary}
            value={bankForm.routingNumber}
            onChangeText={(value) => setBankForm((prev) => ({ ...prev, routingNumber: value }))}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SWIFT/BIC (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="e.g. ABNGNGLA"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
            value={bankForm.swiftCode}
            onChangeText={(value) => setBankForm((prev) => ({ ...prev, swiftCode: value }))}
          />

          <TouchableOpacity
            style={[
              styles.saveBankButton,
              { backgroundColor: colors.primary500, opacity: savingBankDetails ? 0.7 : 1 },
            ]}
            disabled={savingBankDetails}
            onPress={handleSaveBankDetails}
          >
            {savingBankDetails ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="white" />
                <Text style={styles.saveBankButtonText}>{bankMethodId ? 'Update Bank Details' : 'Save Bank Details'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}> 
          <Ionicons name="information-circle-outline" size={24} color={colors.primary500} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Online gateway keys (Stripe, Paystack, PayPal) are now managed under Settings {'>'} Integrations.
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
    flex: 1,
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
    lineHeight: 18,
    marginTop: 2,
  },
  bankDetailsCard: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
    gap: 4,
  },
  bankDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  bankDetailsLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  bankDetailsValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
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
  bankCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  bankIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  bankSubtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },
  saveBankButton: {
    marginTop: 14,
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveBankButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
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
});
