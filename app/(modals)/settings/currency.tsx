// app/(modals)/settings/currency.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  country: string;
}

export default function CurrencyScreen() {
  const { colors } = useTheme();
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [currencies, setCurrencies] = useState<Currency[]>([
    { code: 'USD', name: 'US Dollar', symbol: '$', country: 'United States' },
    { code: 'EUR', name: 'Euro', symbol: '€', country: 'European Union' },
    { code: 'GBP', name: 'British Pound', symbol: '£', country: 'United Kingdom' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', country: 'Japan' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', country: 'Canada' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', country: 'Australia' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', country: 'Switzerland' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', country: 'China' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', country: 'India' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', country: 'Brazil' },
    { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', country: 'Mexico' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R', country: 'South Africa' },
  ]);

  useEffect(() => {
    loadCurrency();
  }, []);

  const loadCurrency = async () => {
    try {
      const saved = await AsyncStorage.getItem('selectedCurrency');
      if (saved) {
        setSelectedCurrency(saved);
      }
    } catch (error) {
      console.error('Error loading currency:', error);
    }
  };

  const saveCurrency = async (currencyCode: string) => {
    try {
      await AsyncStorage.setItem('selectedCurrency', currencyCode);
      setSelectedCurrency(currencyCode);
      
      Alert.alert(
        'Currency Updated',
        `Currency has been changed to ${currencyCode}. Existing transactions will not be converted.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving currency:', error);
    }
  };

  const handleCurrencySelect = (currencyCode: string) => {
    Alert.alert(
      'Change Currency',
      `Change currency to ${currencyCode}? Note: Existing transactions will keep their original currency.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: () => saveCurrency(currencyCode),
        },
      ]
    );
  };

  const getCurrencyExample = (symbol: string) => {
    const amount = 1234.56;
    return `${symbol}${amount.toLocaleString()}`;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.currentCurrency, { backgroundColor: colors.primary50, borderColor: colors.primary100 }]}>
          <Text style={[styles.currentCurrencyTitle, { color: colors.text }]}>
            Current Currency
          </Text>
          
          <View style={styles.currentCurrencyContent}>
            <View style={[styles.currencySymbol, { backgroundColor: colors.primary500 }]}>
              <Text style={styles.currencySymbolText}>
                {currencies.find(c => c.code === selectedCurrency)?.symbol}
              </Text>
            </View>
            <View style={styles.currentCurrencyInfo}>
              <Text style={[styles.currencyCode, { color: colors.text }]}>
                {selectedCurrency}
              </Text>
              <Text style={[styles.currencyName, { color: colors.textTertiary }]}>
                {currencies.find(c => c.code === selectedCurrency)?.name}
              </Text>
              <Text style={[styles.currencyExample, { color: colors.textSecondary }]}>
                Example: {getCurrencyExample(currencies.find(c => c.code === selectedCurrency)?.symbol || '$')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.currenciesList}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Available Currencies
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textTertiary }]}>
            Select your preferred currency for displaying amounts
          </Text>

          {currencies.map((currency) => (
            <TouchableOpacity
              key={currency.code}
              style={[
                styles.currencyCard,
                { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                selectedCurrency === currency.code && {
                  borderColor: colors.primary500,
                  backgroundColor: colors.primary50,
                }
              ]}
              onPress={() => handleCurrencySelect(currency.code)}
            >
              <View style={styles.currencyLeft}>
                <View style={[
                  styles.currencySymbolSmall,
                  { backgroundColor: selectedCurrency === currency.code ? colors.primary500 : colors.primary100 }
                ]}>
                  <Text style={[
                    styles.currencySymbolTextSmall,
                    { color: selectedCurrency === currency.code ? 'white' : colors.primary500 }
                  ]}>
                    {currency.symbol}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.currencyCardCode, { color: colors.text }]}>
                    {currency.code} - {currency.name}
                  </Text>
                  <Text style={[styles.currencyCardCountry, { color: colors.textTertiary }]}>
                    {currency.country}
                  </Text>
                </View>
              </View>
              
              <View style={styles.currencyRight}>
                <Text style={[styles.currencyExampleSmall, { color: colors.textSecondary }]}>
                  {getCurrencyExample(currency.symbol)}
                </Text>
                {selectedCurrency === currency.code ? (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary500} />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.noteCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary500} />
          <View style={styles.noteContent}>
            <Text style={[styles.noteTitle, { color: colors.text }]}>
              Important Note
            </Text>
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Changing currency only affects how amounts are displayed. 
              Existing transactions will not be converted to the new currency.
              Use currency conversion features for actual exchange calculations.
            </Text>
          </View>
        </View>

        <View style={styles.formatSection}>
          <Text style={[styles.formatTitle, { color: colors.text }]}>
            Format Options
          </Text>
          
          <View style={[styles.formatCard, { backgroundColor: colors.surface }]}>
            <View style={styles.formatRow}>
              <Text style={[styles.formatLabel, { color: colors.text }]}>
                Decimal Places
              </Text>
              <View style={styles.formatOptions}>
                <TouchableOpacity 
                  style={[
                    styles.formatOption,
                    { backgroundColor: colors.card, borderColor: colors.border }
                  ]}
                >
                  <Text style={[styles.formatOptionText, { color: colors.text }]}>2</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.formatOption,
                    { backgroundColor: colors.primary500, borderColor: colors.primary500 }
                  ]}
                >
                  <Text style={[styles.formatOptionText, { color: 'white' }]}>3</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.formatOption,
                    { backgroundColor: colors.card, borderColor: colors.border }
                  ]}
                >
                  <Text style={[styles.formatOptionText, { color: colors.text }]}>0</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <View style={styles.formatRow}>
              <Text style={[styles.formatLabel, { color: colors.text }]}>
                Format Examples
              </Text>
              <View style={styles.formatExamples}>
                <Text style={[styles.formatExample, { color: colors.textTertiary }]}>
                  $1,234.56 (With comma)
                </Text>
                <Text style={[styles.formatExample, { color: colors.textTertiary }]}>
                  1234.56 (No comma)
                </Text>
                <Text style={[styles.formatExample, { color: colors.textTertiary }]}>
                  1 234,56 (European)
                </Text>
              </View>
            </View>
          </View>
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
  currentCurrency: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  currentCurrencyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  currentCurrencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  currencySymbol: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencySymbolText: {
    color: 'white',
    fontSize: 32,
    fontWeight: '700',
  },
  currentCurrencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  currencyName: {
    fontSize: 16,
    marginBottom: 8,
  },
  currencyExample: {
    fontSize: 14,
  },
  currenciesList: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 20,
  },
  currencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  currencySymbolSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencySymbolTextSmall: {
    fontSize: 18,
    fontWeight: '600',
  },
  currencyCardCode: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  currencyCardCountry: {
    fontSize: 14,
  },
  currencyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencyExampleSmall: {
    fontSize: 14,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
  formatSection: {
    marginBottom: 24,
  },
  formatTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  formatCard: {
    padding: 16,
    borderRadius: 12,
  },
  formatRow: {
    marginBottom: 16,
  },
  formatLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  formatOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  formatOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  formatOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  formatExamples: {
    gap: 8,
  },
  formatExample: {
    fontSize: 14,
  },
});