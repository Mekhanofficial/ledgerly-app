import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import {
  loadLocalCurrency,
  saveLocalCurrency,
  saveLocalPreferences,
  syncPreferencesFromBackend,
  updateBusinessCurrency,
  updatePreferences,
} from '@/services/preferencesService';

type CurrencyOption = {
  code: string;
  name: string;
  country: string;
};

const CURRENCIES: CurrencyOption[] = [
  { code: 'USD', name: 'US Dollar', country: 'United States' },
  { code: 'EUR', name: 'Euro', country: 'European Union' },
  { code: 'GBP', name: 'British Pound', country: 'United Kingdom' },
  { code: 'JPY', name: 'Japanese Yen', country: 'Japan' },
  { code: 'CAD', name: 'Canadian Dollar', country: 'Canada' },
  { code: 'AUD', name: 'Australian Dollar', country: 'Australia' },
  { code: 'CHF', name: 'Swiss Franc', country: 'Switzerland' },
  { code: 'CNY', name: 'Chinese Yuan', country: 'China' },
  { code: 'INR', name: 'Indian Rupee', country: 'India' },
  { code: 'BRL', name: 'Brazilian Real', country: 'Brazil' },
  { code: 'MXN', name: 'Mexican Peso', country: 'Mexico' },
  { code: 'ZAR', name: 'South African Rand', country: 'South Africa' },
];

const getCurrencySymbol = (code: string) => {
  try {
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(1);
    return parts.find((part) => part.type === 'currency')?.value || code;
  } catch {
    return code;
  }
};

const formatMoney = (code: string, decimalPlaces: number) => {
  const amount = 1234.56;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(decimalPlaces)}`;
  }
};

export default function CurrencyScreen() {
  const { colors } = useTheme();
  const { user, refreshUser } = useUser();
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [loading, setLoading] = useState(true);
  const [savingCurrency, setSavingCurrency] = useState<string | null>(null);
  const [savingDecimals, setSavingDecimals] = useState(false);

  const currentCurrencyMeta = useMemo(
    () => CURRENCIES.find((item) => item.code === selectedCurrency) || CURRENCIES[0],
    [selectedCurrency]
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [localCurrency, preferences] = await Promise.all([
          loadLocalCurrency(),
          syncPreferencesFromBackend(),
        ]);

        const backendCurrency = String(user?.business?.currency || '').trim().toUpperCase();
        setSelectedCurrency(backendCurrency || localCurrency || 'USD');
        setDecimalPlaces(preferences.currencyDecimalPlaces ?? 2);
      } catch (error) {
        console.error('Failed to load currency settings:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.business?.currency]);

  const persistCurrency = async (currencyCode: string) => {
    const nextCode = String(currencyCode || '').trim().toUpperCase();
    try {
      setSavingCurrency(nextCode);
      setSelectedCurrency(nextCode);
      await saveLocalCurrency(nextCode);
      await updateBusinessCurrency(nextCode);
      await refreshUser();
      Alert.alert(
        'Currency Updated',
        `Business currency set to ${nextCode}. Existing invoices and receipts keep their original currency.`
      );
    } catch (error: any) {
      console.error('Failed to sync currency:', error);
      Alert.alert(
        'Saved Locally',
        error?.message
          ? `Updated on this device, but backend sync failed: ${error.message}`
          : 'Updated on this device, but backend sync failed.'
      );
    } finally {
      setSavingCurrency(null);
    }
  };

  const persistDecimalPlaces = async (value: number) => {
    try {
      setSavingDecimals(true);
      setDecimalPlaces(value);
      await saveLocalPreferences({ currencyDecimalPlaces: value });
      await updatePreferences({ currencyDecimalPlaces: value });
    } catch (error: any) {
      console.error('Failed to sync decimal places:', error);
      Alert.alert(
        'Saved Locally',
        error?.message
          ? `Decimal places saved on this device, but backend sync failed: ${error.message}`
          : 'Decimal places saved on this device, but backend sync failed.'
      );
    } finally {
      setSavingDecimals(false);
    }
  };

  const confirmCurrencyChange = (currencyCode: string) => {
    if (savingCurrency) return;
    Alert.alert(
      'Change Currency',
      `Change business currency to ${currencyCode}? Existing transactions will not be converted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Change', onPress: () => persistCurrency(currencyCode) },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerState, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary500} />
        <Text style={[styles.centerStateText, { color: colors.textTertiary }]}>
          Loading currency settings...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.heroCard, { backgroundColor: colors.primary50, borderColor: colors.primary100 }]}>
        <Text style={[styles.heroLabel, { color: colors.text }]}>Current Business Currency</Text>
        <View style={styles.heroRow}>
          <View style={[styles.heroBadge, { backgroundColor: colors.primary500 }]}>
            <Text style={styles.heroBadgeText}>{getCurrencySymbol(selectedCurrency)}</Text>
          </View>
          <View style={styles.heroDetails}>
            <Text style={[styles.heroCode, { color: colors.text }]}>{selectedCurrency}</Text>
            <Text style={[styles.heroName, { color: colors.textTertiary }]}>{currentCurrencyMeta.name}</Text>
            <Text style={[styles.heroExample, { color: colors.textSecondary }]}>
              Example: {formatMoney(selectedCurrency, decimalPlaces)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Currency</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>
          Syncs with your business profile in Ledgerly backend.
        </Text>

        {CURRENCIES.map((currency) => {
          const isSelected = selectedCurrency === currency.code;
          const isSaving = savingCurrency === currency.code;
          return (
            <TouchableOpacity
              key={currency.code}
              style={[
                styles.itemCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                isSelected && { borderColor: colors.primary500, backgroundColor: colors.primary50 },
              ]}
              onPress={() => confirmCurrencyChange(currency.code)}
              disabled={Boolean(savingCurrency)}
            >
              <View style={styles.itemLeft}>
                <View
                  style={[
                    styles.symbolBadge,
                    { backgroundColor: isSelected ? colors.primary500 : colors.primary100 },
                  ]}
                >
                  <Text
                    style={[
                      styles.symbolBadgeText,
                      { color: isSelected ? 'white' : colors.primary500 },
                    ]}
                  >
                    {getCurrencySymbol(currency.code)}
                  </Text>
                </View>
                <View style={styles.itemTextWrap}>
                  <Text style={[styles.itemTitle, { color: colors.text }]}>
                    {currency.code} • {currency.name}
                  </Text>
                  <Text style={[styles.itemSubtitle, { color: colors.textTertiary }]}>{currency.country}</Text>
                </View>
              </View>
              <View style={styles.itemRight}>
                <Text style={[styles.itemExample, { color: colors.textSecondary }]}>
                  {formatMoney(currency.code, decimalPlaces)}
                </Text>
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.primary500} />
                ) : isSelected ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary500} />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Format</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>
          Decimal places are stored in your synced app preferences.
        </Text>

        <View style={[styles.formatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.formatRow}>
            <Text style={[styles.formatLabel, { color: colors.text }]}>Decimal Places</Text>
            <View style={styles.formatOptions}>
              {[0, 2, 3].map((value) => {
                const active = decimalPlaces === value;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.decimalButton,
                      {
                        backgroundColor: active ? colors.primary500 : colors.card,
                        borderColor: active ? colors.primary500 : colors.border,
                      },
                    ]}
                    onPress={() => persistDecimalPlaces(value)}
                    disabled={savingDecimals}
                  >
                    <Text style={[styles.decimalButtonText, { color: active ? 'white' : colors.text }]}>
                      {value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.formatPreviewTitle, { color: colors.text }]}>Preview</Text>
          <Text style={[styles.formatPreviewText, { color: colors.textTertiary }]}>
            {formatMoney(selectedCurrency, decimalPlaces)}
          </Text>
          {savingDecimals && (
            <Text style={[styles.syncText, { color: colors.textTertiary }]}>Saving format preference...</Text>
          )}
        </View>
      </View>

      <View style={[styles.noteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="information-circle-outline" size={20} color={colors.primary500} />
        <Text style={[styles.noteText, { color: colors.textSecondary }]}>
          Changing the base business currency affects defaults for new documents. Existing invoices and receipts remain unchanged.
        </Text>
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
    paddingBottom: 28,
    gap: 18,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  centerStateText: {
    fontSize: 14,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  heroDetails: {
    flex: 1,
    gap: 2,
  },
  heroCode: {
    fontSize: 20,
    fontWeight: '700',
  },
  heroName: {
    fontSize: 14,
  },
  heroExample: {
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 4,
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  itemTextWrap: {
    flex: 1,
  },
  symbolBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  itemExample: {
    fontSize: 12,
  },
  formatCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  formatRow: {
    gap: 10,
  },
  formatLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  formatOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  decimalButton: {
    minWidth: 44,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decimalButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  formatPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  formatPreviewText: {
    fontSize: 18,
    marginTop: 4,
  },
  syncText: {
    fontSize: 12,
    marginTop: 8,
  },
  noteCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
