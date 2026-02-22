import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { useData } from '@/context/DataContext';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { showMessage } from 'react-native-flash-message';
import { ROLE_GROUPS } from '@/utils/roleAccess';
import { useRoleGuard } from '@/hooks/useRoleGuard';


const UNITS = ['Piece', 'Kilogram', 'Liter', 'Meter', 'Box', 'Package', 'Set'];

export default function AddProductScreen() {
  const { colors } = useTheme();
  const { createProduct, createCategory, categories } = useData();
  const { canAccess } = useRoleGuard(ROLE_GROUPS.inventoryManage);
  const [productName, setProductName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [unitOfMeasurement, setUnitOfMeasurement] = useState('');
  const [barcode, setBarcode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [tags, setTags] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const categoryOptions = useMemo(
    () => categories.map((category) => category.name).sort(),
    [categories]
  );

  const generateSKU = () => {
    if (productName) {
      const prefix = productName.substring(0, 3).toUpperCase();
      const randomNum = Math.floor(100 + Math.random() * 900);
      const sku = `${prefix}-${randomNum}`;
      setSku(sku);
      return sku;
    }
    return '';
  };

  const calculateProfitMargin = () => {
    const unit = parseFloat(unitPrice) || 0;
    const cost = parseFloat(costPrice) || 0;
    if (cost === 0) return { margin: 0, percentage: '0%' };
    const margin = unit - cost;
    const percentage = ((margin / cost) * 100).toFixed(1);
    return { margin, percentage: `${percentage}%` };
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      const asset = result.assets?.[0];
      if (result.canceled || !asset?.uri) {
        return;
      }

      if (asset.base64) {
        const mimeType = asset.mimeType && asset.mimeType.startsWith('image/')
          ? asset.mimeType
          : 'image/jpeg';
        setImage(`data:${mimeType};base64,${asset.base64}`);
      } else {
        setImage(asset.uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      showMessage({
        message: 'Error',
        description: 'Failed to pick image',
        type: 'danger',
        icon: 'danger',
      });
    }
  };

  const handleAddNewCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const newCat = newCategory.trim();
      await createCategory(newCat);
      setCategory(newCat);
      setNewCategory('');
      setShowCategoryModal(false);
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const validateForm = () => {
    if (!productName.trim()) {
      Alert.alert('Validation Error', 'Product name is required');
      return false;
    }
    if (!category) {
      Alert.alert('Validation Error', 'Please select a category');
      return false;
    }
    if (!unitPrice || parseFloat(unitPrice) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid unit price');
      return false;
    }
    if (!costPrice || parseFloat(costPrice) < 0) {
      Alert.alert('Validation Error', 'Please enter a valid cost price');
      return false;
    }
    if (!stockQuantity || parseInt(stockQuantity) < 0) {
      Alert.alert('Validation Error', 'Please enter a valid stock quantity');
      return false;
    }
    return true;
  };

  const handleSaveProduct = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const productData = {
        name: productName.trim(),
        sku: sku.trim() || generateSKU(),
        price: parseFloat(unitPrice),
        costPrice: parseFloat(costPrice),
        quantity: parseInt(stockQuantity),
        lowStockThreshold: parseInt(lowStockThreshold) || 10,
        category,
        description: description.trim(),
        supplier: supplierName.trim(),
        barcode: barcode.trim(),
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        image: image || undefined,
      };

      const productId = await createProduct(productData);
      
      
      showMessage({
        message: "Success",
        description: "Product added successfully!",
        type: "success",
        icon: "success",
        onPress: () => {
          router.back();
          router.push(`/(modals)/product-detail?id=${productId}`);
        }
      });

      resetForm();
      router.back();
// ...

    } catch (error) {
      Alert.alert('Error', 'Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProductName('');
    setSku('');
    setCategory('');
    setDescription('');
    setUnitPrice('');
    setCostPrice('');
    setStockQuantity('');
    setLowStockThreshold('10');
    setUnitOfMeasurement('');
    setBarcode('');
    setSupplierName('');
    setTags('');
    setImage(null);
  };

  const profitData = calculateProfitMargin();

  if (!canAccess) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Add Product</Text>
          <TouchableOpacity onPress={handleSaveProduct} disabled={loading}>
            <Text style={[styles.saveButton, { color: loading ? colors.textTertiary : colors.primary500 }]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Product Photo */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Product Image</Text>
          <TouchableOpacity style={styles.photoUpload} onPress={pickImage}>
            {image ? (
              <View style={styles.imagePreview}>
                <Image 
                  source={{ uri: image }} 
                  style={styles.productImage}
                  contentFit="cover"
                />
                <TouchableOpacity 
                  style={[styles.removeImageButton, { backgroundColor: colors.error }]}
                  onPress={() => setImage(null)}
                >
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="camera-outline" size={40} color={colors.textTertiary} />
                <Text style={[styles.photoText, { color: colors.textTertiary }]}>
                  Tap to upload product image
                </Text>
                <Text style={[styles.photoSubtext, { color: colors.textLight }]}>
                  Recommended: 1:1 ratio, max 5MB
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Basic Information */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Product Name <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter product name"
              placeholderTextColor={colors.textTertiary}
              value={productName}
              onChangeText={setProductName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Category <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TouchableOpacity 
              style={[styles.categorySelector, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={category ? [styles.categorySelected, { color: colors.text }] : [styles.categoryPlaceholder, { color: colors.textTertiary }]}>
                {category || 'Select category'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>SKU</Text>
            <View style={styles.skuContainer}>
              <TextInput
                style={[styles.input, styles.skuInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Will auto-generate"
                placeholderTextColor={colors.textTertiary}
                value={sku}
                onChangeText={setSku}
              />
              <TouchableOpacity 
                style={[styles.generateButton, { backgroundColor: colors.primary50 }]}
                onPress={generateSKU}
              >
                <Text style={[styles.generateButtonText, { color: colors.primary500 }]}>Generate</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter product description (optional)"
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Pricing */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Pricing</Text>
          
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>
                Unit Price ($) <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <View style={[styles.priceInputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.currencySymbol, { color: colors.text }]}>$</Text>
                <TextInput
                  style={[styles.priceInput, { color: colors.text }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  value={unitPrice}
                  onChangeText={setUnitPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>
                Cost Price ($) <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <View style={[styles.priceInputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.currencySymbol, { color: colors.text }]}>$</Text>
                <TextInput
                  style={[styles.priceInput, { color: colors.text }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  value={costPrice}
                  onChangeText={setCostPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          <View style={[styles.profitMargin, { 
            backgroundColor: profitData.margin > 0 ? `${colors.success}15` : profitData.margin < 0 ? `${colors.error}15` : colors.primary50 
          }]}>
            <View style={styles.profitRow}>
              <Text style={[styles.profitLabel, { color: colors.text }]}>Profit Margin</Text>
              <Text style={[
                styles.profitValue, 
                { color: profitData.margin > 0 ? colors.success : profitData.margin < 0 ? colors.error : colors.text }
              ]}>
                {profitData.percentage}
              </Text>
            </View>
            <Text style={[styles.profitAmount, { 
              color: profitData.margin > 0 ? colors.success : profitData.margin < 0 ? colors.error : colors.text 
            }]}>
              ${profitData.margin.toFixed(2)} per unit
            </Text>
            <Text style={[styles.profitNote, { color: colors.textTertiary }]}>
              Calculated automatically based on unit and cost price
            </Text>
          </View>
        </View>

        {/* Stock Information */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Stock Information</Text>
          
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>
                Initial Quantity <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                value={stockQuantity}
                onChangeText={setStockQuantity}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Low Stock Alert</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="10"
                placeholderTextColor={colors.textTertiary}
                value={lowStockThreshold}
                onChangeText={setLowStockThreshold}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Unit of Measurement</Text>
            <TouchableOpacity 
              style={[styles.unitSelector, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setShowUnitModal(true)}
            >
              <Text style={unitOfMeasurement ? [styles.unitSelected, { color: colors.text }] : [styles.unitPlaceholder, { color: colors.textTertiary }]}>
                {unitOfMeasurement || 'Select unit (optional)'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Additional Details */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Details</Text>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Barcode</Text>
            <View style={styles.barcodeContainer}>
              <TextInput
                style={[styles.input, styles.barcodeInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter barcode (optional)"
                placeholderTextColor={colors.textTertiary}
                value={barcode}
                onChangeText={setBarcode}
              />
              <TouchableOpacity style={[styles.scanButton, { backgroundColor: colors.primary50 }]}>
                <Ionicons name="barcode-outline" size={20} color={colors.primary500} />
                <Text style={[styles.scanButtonText, { color: colors.primary500 }]}>Scan</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Supplier Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter supplier name (optional)"
              placeholderTextColor={colors.textTertiary}
              value={supplierName}
              onChangeText={setSupplierName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Tags</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., electronics, premium, wireless (comma separated)"
              placeholderTextColor={colors.textTertiary}
              value={tags}
              onChangeText={setTags}
            />
            <Text style={[styles.hintText, { color: colors.textTertiary }]}>
              Add tags to help organize and search products
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]} 
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.saveButton, { 
              backgroundColor: loading ? colors.primary300 : colors.primary500,
              opacity: loading ? 0.7 : 1
            }]}
            onPress={handleSaveProduct}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.saveButtonText}>Saving...</Text>
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                <Text style={styles.saveButtonText}>Save Product</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.categoryList}>
              {categoryOptions.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryItem,
                    { borderBottomColor: colors.border },
                    category === cat && { backgroundColor: colors.primary50 }
                  ]}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={[styles.categoryItemText, { color: colors.text }]}>{cat}</Text>
                  {category === cat && (
                    <Ionicons name="checkmark" size={20} color={colors.primary500} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={[styles.addCategorySection, { borderTopColor: colors.border }]}>
              <Text style={[styles.addCategoryLabel, { color: colors.text }]}>Add New Category</Text>
              <View style={styles.addCategoryRow}>
                <TextInput
                  style={[styles.addCategoryInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="Enter new category"
                  placeholderTextColor={colors.textTertiary}
                  value={newCategory}
                  onChangeText={setNewCategory}
                />
                <TouchableOpacity 
                  style={[styles.addCategoryButton, { backgroundColor: colors.primary500 }]}
                  onPress={handleAddNewCategory}
                >
                  <Text style={styles.addCategoryButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Unit Selection Modal */}
      <Modal
        visible={showUnitModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUnitModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Unit</Text>
              <TouchableOpacity onPress={() => setShowUnitModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.categoryList}>
              {UNITS.map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.categoryItem,
                    { borderBottomColor: colors.border },
                    unitOfMeasurement === unit && { backgroundColor: colors.primary50 }
                  ]}
                  onPress={() => {
                    setUnitOfMeasurement(unit);
                    setShowUnitModal(false);
                  }}
                >
                  <Text style={[styles.categoryItemText, { color: colors.text }]}>{unit}</Text>
                  {unitOfMeasurement === unit && (
                    <Ionicons name="checkmark" size={20} color={colors.primary500} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  photoUpload: {
    alignItems: 'center',
  },
  photoPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 20,
  },
  photoText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  photoSubtext: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  imagePreview: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  skuContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  skuInput: {
    flex: 1,
    minWidth: 0,
  },
  generateButton: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  categoryPlaceholder: {
    fontSize: 16,
  },
  categorySelected: {
    fontSize: 16,
    fontWeight: '600',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  currencySymbol: {
    fontSize: 16,
    paddingLeft: 16,
    paddingRight: 8,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    minWidth: 0,
  },
  profitMargin: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  profitLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  profitValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  profitAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  profitNote: {
    fontSize: 12,
  },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  unitPlaceholder: {
    fontSize: 16,
  },
  unitSelected: {
    fontSize: 16,
    fontWeight: '600',
  },
  barcodeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  barcodeInput: {
    flex: 1,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 4,
  },
  scanButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 30,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  spacer: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  categoryList: {
    maxHeight: 300,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  categoryItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  addCategorySection: {
    padding: 20,
    borderTopWidth: 1,
  },
  addCategoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  addCategoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addCategoryInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  addCategoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCategoryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
