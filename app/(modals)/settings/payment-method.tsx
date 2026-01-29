// app/(modals)/settings/payment-method.tsx
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
import { router } from 'expo-router';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'mobile' | 'cash';
  name: string;
  lastFour?: string;
  expiryDate?: string;
  isDefault: boolean;
}

export default function PaymentMethodScreen() {
  const { colors } = useTheme();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: '1', type: 'card', name: 'Visa', lastFour: '4242', expiryDate: '12/25', isDefault: true },
    { id: '2', type: 'card', name: 'MasterCard', lastFour: '8888', expiryDate: '08/24', isDefault: false },
  ]);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const saved = await AsyncStorage.getItem('paymentMethods');
      if (saved) {
        setPaymentMethods(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const savePaymentMethods = async (methods: PaymentMethod[]) => {
    try {
      await AsyncStorage.setItem('paymentMethods', JSON.stringify(methods));
    } catch (error) {
      console.error('Error saving payment methods:', error);
    }
  };

  const handleSetDefault = (id: string) => {
    const updated = paymentMethods.map(method => ({
      ...method,
      isDefault: method.id === id,
    }));
    setPaymentMethods(updated);
    savePaymentMethods(updated);
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
          onPress: () => {
            const updated = paymentMethods.filter(method => method.id !== id);
            setPaymentMethods(updated);
            savePaymentMethods(updated);
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
      ]
    );
  };

  const addNewMethod = (type: PaymentMethod['type']) => {
    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      type,
      name: type === 'card' ? 'New Card' : type === 'bank' ? 'Bank Account' : 'Mobile Wallet',
      lastFour: '0000',
      expiryDate: '12/30',
      isDefault: paymentMethods.length === 0,
    };

    const updated = [...paymentMethods, newMethod];
    setPaymentMethods(updated);
    savePaymentMethods(updated);
  };

  const getMethodIcon = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'card': return 'card-outline';
      case 'bank': return 'business-outline';
      case 'mobile': return 'phone-portrait-outline';
      case 'cash': return 'cash-outline';
      default: return 'card-outline';
    }
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
          {paymentMethods.map((method) => (
            <View
              key={method.id}
              style={[styles.methodCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.methodHeader}>
                <View style={styles.methodLeft}>
                  <View style={[styles.methodIcon, { backgroundColor: colors.primary50 }]}>
                    <Ionicons name={getMethodIcon(method.type)} size={24} color={colors.primary500} />
                  </View>
                  <View>
                    <Text style={[styles.methodName, { color: colors.text }]}>
                      {method.name} {method.lastFour ? `•••• ${method.lastFour}` : ''}
                    </Text>
                    <Text style={[styles.methodDetails, { color: colors.textTertiary }]}>
                      {method.type === 'card' && method.expiryDate ? `Expires ${method.expiryDate}` : method.type}
                    </Text>
                  </View>
                </View>
                {method.isDefault && (
                  <View style={[styles.defaultBadge, { backgroundColor: colors.success + '20' }]}>
                    <Text style={[styles.defaultText, { color: colors.success }]}>Default</Text>
                  </View>
                )}
              </View>

              <View style={[styles.methodActions, { borderTopColor: colors.border }]}>
                {!method.isDefault && (
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
          ))}
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary500 }]}
          onPress={handleAddMethod}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Payment Method</Text>
        </TouchableOpacity>

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
});