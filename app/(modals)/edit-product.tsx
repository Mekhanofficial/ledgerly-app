import React, { useEffect, useState } from 'react';
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

export default function EditProductScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getProductById, updateProduct, loading } = useData();
  const product = id ? getProductById(id) : undefined;

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [supplier, setSupplier] = useState('');
  const [barcode, setBarcode] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!product) return;
    setName(product.name);
    setSku(product.sku);
    setCategory(product.category);
    setDescription(product.description);
    setPrice(product.price.toString());
    setCostPrice(product.costPrice.toString());
    setQuantity(product.quantity.toString());
    setLowStockThreshold(product.lowStockThreshold.toString());
    setSupplier(product.supplier);
    setBarcode(product.barcode);
    setTags(product.tags.join(', '));
  }, [product]);

  const parseNumber = (value: string, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Product name is required.');
      return false;
    }
    if (!category.trim()) {
      Alert.alert('Validation Error', 'Category is required.');
      return false;
    }
    if (parseNumber(price, -1) < 0) {
      Alert.alert('Validation Error', 'Unit price must be 0 or greater.');
      return false;
    }
    if (parseNumber(costPrice, -1) < 0) {
      Alert.alert('Validation Error', 'Cost price must be 0 or greater.');
      return false;
    }
    if (parseNumber(quantity, -1) < 0) {
      Alert.alert('Validation Error', 'Quantity must be 0 or greater.');
      return false;
    }
    if (parseNumber(lowStockThreshold, -1) < 0) {
      Alert.alert('Validation Error', 'Low stock threshold must be 0 or greater.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!product) return;
    if (!validateForm()) return;
    setSaving(true);
    try {
      await updateProduct(product.id, {
        name: name.trim(),
        sku: sku.trim() || product.sku,
        category: category.trim(),
        description: description.trim(),
        price: parseNumber(price, product.price),
        costPrice: parseNumber(costPrice, product.costPrice),
        quantity: parseNumber(quantity, product.quantity),
        lowStockThreshold: parseNumber(lowStockThreshold, product.lowStockThreshold),
        supplier: supplier.trim(),
        barcode: barcode.trim(),
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      Alert.alert('Saved', 'Product updated successfully.');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update product.');
    } finally {
      setSaving(false);
    }
  };

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
            <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Product</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Details</Text>

            <Text style={[styles.label, { color: colors.textTertiary }]}>Product Name</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Product name"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.label, { color: colors.textTertiary }]}>SKU</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="SKU"
              placeholderTextColor={colors.textTertiary}
              value={sku}
              onChangeText={setSku}
              autoCapitalize="characters"
            />

            <Text style={[styles.label, { color: colors.textTertiary }]}>Category</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Category"
              placeholderTextColor={colors.textTertiary}
              value={category}
              onChangeText={setCategory}
            />

            <Text style={[styles.label, { color: colors.textTertiary }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.multiline, { color: colors.text, borderColor: colors.border }]}
              placeholder="Description"
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Pricing & Stock</Text>

            <Text style={[styles.label, { color: colors.textTertiary }]}>Unit Price</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.label, { color: colors.textTertiary }]}>Cost Price</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              value={costPrice}
              onChangeText={setCostPrice}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.label, { color: colors.textTertiary }]}>Quantity</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
            />

            <Text style={[styles.label, { color: colors.textTertiary }]}>Low Stock Threshold</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              value={lowStockThreshold}
              onChangeText={setLowStockThreshold}
              keyboardType="number-pad"
            />
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Supplier & Tags</Text>

            <Text style={[styles.label, { color: colors.textTertiary }]}>Supplier</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Supplier name"
              placeholderTextColor={colors.textTertiary}
              value={supplier}
              onChangeText={setSupplier}
            />

            <Text style={[styles.label, { color: colors.textTertiary }]}>Barcode</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Barcode"
              placeholderTextColor={colors.textTertiary}
              value={barcode}
              onChangeText={setBarcode}
            />

            <Text style={[styles.label, { color: colors.textTertiary }]}>Tags</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Comma-separated tags"
              placeholderTextColor={colors.textTertiary}
              value={tags}
              onChangeText={setTags}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary500 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
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
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
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
