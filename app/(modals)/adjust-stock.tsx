import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { router, useLocalSearchParams } from 'expo-router';
import { useData } from '@/context/DataContext';
import { ROLE_GROUPS } from '@/utils/roleAccess';
import { useRoleGuard } from '@/hooks/useRoleGuard';

type AdjustType = 'add' | 'remove' | 'set';

export default function AdjustStockScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getProductById, adjustStock, loading } = useData();
  const { canAccess } = useRoleGuard(ROLE_GROUPS.inventoryManage);
  const product = id ? getProductById(id) : undefined;

  const [adjustType, setAdjustType] = useState<AdjustType>('add');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const parsedAmount = useMemo(() => Number(amount), [amount]);

  const resultQuantity = useMemo(() => {
    if (!product || !Number.isFinite(parsedAmount)) return product?.quantity ?? 0;
    if (adjustType === 'add') return product.quantity + parsedAmount;
    if (adjustType === 'remove') return product.quantity - parsedAmount;
    return parsedAmount;
  }, [product, adjustType, parsedAmount]);

  const validate = () => {
    if (!Number.isFinite(parsedAmount)) {
      Alert.alert('Validation Error', 'Enter a valid quantity.');
      return false;
    }
    if (parsedAmount <= 0 && adjustType !== 'set') {
      Alert.alert('Validation Error', 'Quantity must be greater than 0.');
      return false;
    }
    if (adjustType === 'set' && parsedAmount < 0) {
      Alert.alert('Validation Error', 'Quantity must be 0 or greater.');
      return false;
    }
    if (adjustType === 'remove' && product && parsedAmount > product.quantity) {
      Alert.alert('Validation Error', 'Cannot remove more than available stock.');
      return false;
    }
    return true;
  };

  const handleApply = async () => {
    if (!product) return;
    if (!validate()) return;
    setSaving(true);
    try {
      await adjustStock(product.id, Math.abs(parsedAmount), adjustType);
      Alert.alert('Updated', 'Stock level updated successfully.');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update stock.');
    } finally {
      setSaving(false);
    }
  };

  if (!canAccess) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {!product && !loading ? (
        <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Product not found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
            This product may have been removed or is unavailable.
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backAction, { borderColor: colors.border }]}>
            <Ionicons name="arrow-back" size={18} color={colors.text} />
            <Text style={[styles.backActionText, { color: colors.text }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Adjust Stock</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.productName, { color: colors.text }]}>{product?.name}</Text>
            <Text style={[styles.sku, { color: colors.textTertiary }]}>SKU: {product?.sku}</Text>
            <View style={styles.quantityRow}>
              <Text style={[styles.quantityLabel, { color: colors.textTertiary }]}>Available Stock</Text>
              <Text style={[styles.quantityValue, { color: colors.text }]}>{product?.quantity ?? 0}</Text>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Adjustment Type</Text>
            <View style={styles.toggleRow}>
              {(['add', 'remove', 'set'] as AdjustType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.toggleButton,
                    { borderColor: colors.border },
                    adjustType === type && { backgroundColor: colors.primary50, borderColor: colors.primary100 },
                  ]}
                  onPress={() => setAdjustType(type)}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      { color: adjustType === type ? colors.primary500 : colors.textTertiary },
                    ]}
                  >
                    {type === 'add' ? 'Add' : type === 'remove' ? 'Remove' : 'Set'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.textTertiary }]}>
              {adjustType === 'set' ? 'Set quantity to' : 'Quantity'}
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="number-pad"
            />

            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: colors.textTertiary }]}>Resulting Stock</Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>{Number.isFinite(resultQuantity) ? resultQuantity : 0}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary500 }]}
              onPress={handleApply}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>{saving ? 'Updating...' : 'Apply Changes'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 32,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  sku: {
    fontSize: 13,
    marginBottom: 12,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quantityLabel: {
    fontSize: 12,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  resultLabel: {
    fontSize: 12,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  backAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  backActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
