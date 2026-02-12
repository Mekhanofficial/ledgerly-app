import { useState, useEffect, useMemo } from 'react';
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
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useData, Invoice, Template } from '@/context/DataContext';
import { getTemplateById } from '@/utils/templateCatalog';
import { showMessage } from 'react-native-flash-message';
import TemplatePreviewModal from '@/components/templates/TemplatePreviewModal';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallScreen = height <= 667;

interface InvoiceItem {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  stockQuantity?: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  sku: string;
}

export default function CreateInvoiceScreen() {
  const { colors } = useTheme();
  const {
    createInvoice,
    customers,
    inventory,
    templates,
    selectedInvoiceTemplate,
    setInvoiceTemplate,
    refreshTemplates,
  } = useData();
  const { customerId, productId } = useLocalSearchParams<{ customerId?: string; productId?: string }>();
  
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', productId: '', description: '', quantity: 1, unitPrice: 0 },
  ]);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`);
  const [issueDate, setIssueDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customer, setCustomer] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [showIssueDatePicker, setShowIssueDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const tax = subtotal * 0.085;
  const total = subtotal + tax;

  const buildInvoicePayload = (status: Invoice['status']) => {
    const resolvedTemplate = selectedInvoiceTemplate || getTemplateById('standard');
    return {
    number: invoiceNumber,
    customerId: selectedCustomerId || undefined,
    customer,
    customerEmail,
    customerPhone,
    issueDate: issueDate.toISOString(),
    dueDate: dueDate.toISOString(),
    amount: total,
    paidAmount: 0,
    status,
    templateStyle:
      resolvedTemplate?.templateStyle || resolvedTemplate?.id || undefined,
    items: items.map(item => ({
      id: item.id,
      productId: item.productId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    notes,
    };
  };

  const submitInvoice = async (status: Invoice['status'], description: string) => {
    try {
      const invoiceId = await createInvoice(buildInvoicePayload(status));
      showMessage({
        message: 'Success',
        description,
        type: 'success',
        icon: 'success',
        onPress: () => {
          router.back();
          router.push(`/(modals)/invoice-detail?id=${invoiceId}`);
        },
      });
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to create invoice');
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedCustomerId) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }

    await submitInvoice('draft', 'Invoice saved as draft!');
  };

  // Filter products based on search query
  const filteredProducts = inventory.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Set customer from URL param if provided
  useEffect(() => {
    if (customerId) {
      const foundCustomer = customers.find(c => c.id === customerId);
      if (foundCustomer) {
        setSelectedCustomerId(foundCustomer.id);
        setCustomer(foundCustomer.name);
        setCustomerEmail(foundCustomer.email);
        setCustomerPhone(foundCustomer.phone);
      }
    }
  }, [customerId, customers]);

  useEffect(() => {
    if (!templates.length) {
      refreshTemplates();
    }
  }, [templates.length, refreshTemplates]);

  useEffect(() => {
    if (!productId) return;
    const foundProduct = inventory.find(product => product.id === productId);
    if (!foundProduct) return;
    setItems(prev => {
      if (prev.length === 1 && !prev[0].productId) {
        return [{
          ...prev[0],
          productId: foundProduct.id,
          description: foundProduct.name,
          unitPrice: foundProduct.price,
          stockQuantity: foundProduct.quantity,
        }];
      }
      return prev;
    });
  }, [productId, inventory]);

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      productId: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleCustomerSelect = (customerId: string) => {
    const selectedCustomer = customers.find(c => c.id === customerId);
    if (selectedCustomer) {
      setSelectedCustomerId(selectedCustomer.id);
      setCustomer(selectedCustomer.name);
      setCustomerEmail(selectedCustomer.email);
      setCustomerPhone(selectedCustomer.phone);
    }
  };

  const handleProductSelect = (product: Product) => {
    if (selectedItemId) {
      setItems(prev => prev.map(item => 
        item.id === selectedItemId 
          ? { 
              ...item, 
              productId: product.id,
              description: product.name,
              unitPrice: product.price,
              stockQuantity: product.quantity
            } 
          : item
      ));
      setShowProductModal(false);
      setSelectedItemId(null);
      setSearchQuery('');
    }
  };

  const getTemplateColor = (template?: Template) => {
    const primary = template?.colors?.primary;
    if (primary && primary.length >= 3) {
      return `rgb(${primary[0]}, ${primary[1]}, ${primary[2]})`;
    }
    return template?.previewColor || colors.primary500;
  };

  const availableTemplates = useMemo(() => templates, [templates]);

  const handleTemplateSelect = async (template: Template) => {
    if (template.isPremium && !template.hasAccess) {
      Alert.alert(
        'Premium Template',
        `${template.name} is locked. Browse templates to unlock it.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Browse Templates', onPress: () => router.push('/(modals)/settings/templates') },
        ]
      );
      return;
    }

    try {
      await setInvoiceTemplate(template.id);
    } catch (error) {
      Alert.alert('Template Error', 'Unable to select template right now.');
    }
  };

  const handleSaveInvoice = async () => {
    if (!selectedCustomerId) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }

    if (items.some(item => !item.description || item.unitPrice <= 0)) {
      Alert.alert('Error', 'Please select products for all items');
      return;
    }

    await submitInvoice('pending', 'Invoice created successfully!');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: width * 0.05 }]}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>New Invoice</Text>
          <TouchableOpacity 
            onPress={handleSaveInvoice}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.saveButton, { color: colors.primary500 }]}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Content Container */}
        <View style={[styles.contentContainer, { paddingHorizontal: width * 0.05 }]}>
          
          {/* Invoice Details */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Invoice Details</Text>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Invoice Number</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.background, 
                  borderColor: colors.border, 
                  color: colors.text,
                  fontSize: isSmallScreen ? 14 : 16
                }]}
                value={invoiceNumber}
                onChangeText={setInvoiceNumber}
                placeholder="Enter invoice number"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: isTablet ? 16 : 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Issue Date</Text>
                <TouchableOpacity 
                  style={[styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setShowIssueDatePicker(true)}
                >
                  <Text style={[styles.dateText, { color: colors.text, fontSize: isSmallScreen ? 14 : 16 }]}>
                    {formatDate(issueDate)}
                  </Text>
                  <Ionicons name="calendar-outline" size={isSmallScreen ? 18 : 20} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
              
              <View style={[styles.formGroup, { flex: 1, marginLeft: isTablet ? 16 : 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Due Date</Text>
                <TouchableOpacity 
                  style={[styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setShowDueDatePicker(true)}
                >
                  <Text style={[styles.dateText, { color: colors.text, fontSize: isSmallScreen ? 14 : 16 }]}>
                    {formatDate(dueDate)}
                  </Text>
                  <Ionicons name="calendar-outline" size={isSmallScreen ? 18 : 20} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {availableTemplates.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.templateHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Invoice Template</Text>
                <TouchableOpacity
                  style={styles.templateBrowse}
                  onPress={() => router.push('/(modals)/settings/templates')}
                >
                  <Text style={[styles.templateBrowseText, { color: colors.primary500 }]}>Browse Templates</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary500} />
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
                {availableTemplates.map((template) => {
                  const isSelected = selectedInvoiceTemplate?.id === template.id;
                  const isLocked = template.isPremium && !template.hasAccess;
                  return (
                    <TouchableOpacity
                      key={template.id}
                      style={[
                        styles.templateCard,
                        { backgroundColor: colors.background, borderColor: colors.border },
                        isSelected && { borderColor: colors.primary500, borderWidth: 2 },
                      ]}
                      onPress={() => handleTemplateSelect(template)}
                      onLongPress={() => setPreviewTemplate(template)}
                      activeOpacity={0.85}
                    >
                      <View
                        style={[
                          styles.templatePreview,
                          { backgroundColor: getTemplateColor(template), opacity: isLocked ? 0.6 : 1 },
                        ]}
                      />
                      <Text
                        style={[styles.templateName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {template.name}
                      </Text>
                      <Text
                        style={[
                          styles.templateMeta,
                          { color: isLocked ? colors.error : isSelected ? colors.primary500 : colors.textTertiary },
                        ]}
                      >
                        {isLocked ? 'Locked' : isSelected ? 'Selected' : 'Tap to use'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Customer */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer</Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.customerScrollContent}
            >
              <View style={styles.customerList}>
                {customers.map((cust) => (
                  <TouchableOpacity
                    key={cust.id}
                    style={[
                      styles.customerOption,
                      { 
                        backgroundColor: colors.background,
                        borderColor: colors.border
                      },
                      selectedCustomerId === cust.id && [
                        styles.customerOptionActive,
                        { 
                          backgroundColor: colors.primary500,
                          borderColor: colors.primary500
                        }
                      ]
                    ]}
                    onPress={() => handleCustomerSelect(cust.id)}
                  >
                    <Text 
                      style={[
                        styles.customerOptionText,
                        { color: colors.text, fontSize: isSmallScreen ? 12 : 14 },
                        selectedCustomerId === cust.id && styles.customerOptionTextActive
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {cust.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            {customer && (
              <>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Customer Email</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: colors.background, 
                      borderColor: colors.border, 
                      color: colors.text,
                      fontSize: isSmallScreen ? 14 : 16
                    }]}
                    value={customerEmail}
                    onChangeText={setCustomerEmail}
                    placeholder="Customer email"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="email-address"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Customer Phone</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: colors.background, 
                      borderColor: colors.border, 
                      color: colors.text,
                      fontSize: isSmallScreen ? 14 : 16
                    }]}
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                    placeholder="Customer phone"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="phone-pad"
                  />
                </View>
              </>
            )}
            
            <TouchableOpacity 
              style={[styles.addCustomerButton, { borderColor: colors.border }]}
              onPress={() => router.push('/(modals)/add-customer')}
            >
              <Ionicons name="add-circle-outline" size={isSmallScreen ? 18 : 20} color={colors.primary500} />
              <Text style={[styles.addCustomerText, { color: colors.primary500, fontSize: isSmallScreen ? 12 : 14 }]}>
                Add New Customer
              </Text>
            </TouchableOpacity>
          </View>

          {/* Line Items */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Line Items</Text>
              <TouchableOpacity onPress={addItem} style={styles.addItemIcon}>
                <Ionicons name="add-circle" size={isSmallScreen ? 20 : 24} color={colors.primary500} />
              </TouchableOpacity>
            </View>
            
            {items.map((item, index) => (
              <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemNumber, { color: colors.textTertiary, fontSize: isSmallScreen ? 12 : 14 }]}>
                    Item {index + 1}
                  </Text>
                  {items.length > 1 && (
                    <TouchableOpacity 
                      onPress={() => removeItem(item.id)}
                      hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                    >
                      <Ionicons name="close-circle" size={isSmallScreen ? 18 : 20} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Product</Text>
                  <TouchableOpacity 
                    style={[styles.productSelector, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => {
                      setSelectedItemId(item.id);
                      setShowProductModal(true);
                    }}
                  >
                    {item.description ? (
                      <Text style={[styles.productSelected, { color: colors.text, fontSize: isSmallScreen ? 14 : 16 }]}>
                        {item.description}
                      </Text>
                    ) : (
                      <Text style={[styles.productPlaceholder, { color: colors.textTertiary, fontSize: isSmallScreen ? 14 : 16 }]}>
                        Tap to select product
                      </Text>
                    )}
                    <Ionicons name="chevron-down" size={isSmallScreen ? 18 : 20} color={colors.textTertiary} />
                  </TouchableOpacity>
                  {item.stockQuantity !== undefined && (
                    <Text style={[styles.stockInfo, { color: colors.textTertiary, fontSize: isSmallScreen ? 10 : 12 }]}>
                      Available: {item.stockQuantity} units
                    </Text>
                  )}
                </View>

                <View style={[
                  styles.lineItemInputs,
                  {
                    rowGap: isSmallScreen ? 12 : 16,
                  }
                ]}>
                  <View style={[
                    styles.formGroup,
                    {
                      width: '100%',
                    }
                  ]}>
                    <Text style={[styles.label, { color: colors.text }]}>Quantity</Text>
                    <View style={styles.quantityContainer}>
                      <TouchableOpacity 
                        style={[styles.quantityButton, { backgroundColor: colors.primary100 }]}
                        onPress={() => updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))}
                        disabled={!item.productId}
                      >
                        <Text style={[styles.quantityButtonText, { color: colors.primary500 }]}>-</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={[styles.quantityInput, { 
                          color: colors.text,
                          backgroundColor: !item.productId ? colors.background + '80' : colors.background,
                          fontSize: isSmallScreen ? 14 : 16
                        }]}
                        value={item.quantity.toString()}
                        onChangeText={(text) => updateItem(item.id, 'quantity', parseInt(text) || 1)}
                        keyboardType="number-pad"
                        editable={!!item.productId}
                      />
                      <TouchableOpacity 
                        style={[styles.quantityButton, { 
                          backgroundColor: colors.primary100,
                          opacity: !item.productId ? 0.5 : 1
                        }]}
                        onPress={() => updateItem(item.id, 'quantity', item.quantity + 1)}
                        disabled={!item.productId}
                      >
                        <Text style={[styles.quantityButtonText, { color: colors.primary500 }]}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={[
                    styles.formGroup,
                    {
                      width: '100%',
                    }
                  ]}>
                    <Text style={[styles.label, { color: colors.text }]}>Unit Price</Text>
                    <View style={[styles.priceInputContainer, { 
                      backgroundColor: colors.background, 
                      borderColor: colors.border,
                      opacity: !item.productId ? 0.7 : 1
                    }]}>
                      <Text style={[styles.currencySymbol, { color: colors.text }]}>$</Text>
                      <TextInput
                        style={[styles.priceInput, { color: colors.text, fontSize: isSmallScreen ? 14 : 16 }]}
                        value={item.unitPrice.toString()}
                        onChangeText={(text) => updateItem(item.id, 'unitPrice', parseFloat(text) || 0)}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        editable={!!item.productId}
                        placeholderTextColor={colors.textTertiary}
                      />
                    </View>
                  </View>
                </View>

                <View style={[styles.itemTotal, { borderTopColor: colors.border }]}>
                  <Text style={[styles.itemTotalLabel, { color: colors.textTertiary, fontSize: isSmallScreen ? 12 : 14 }]}>
                    Amount
                  </Text>
                  <Text style={[styles.itemTotalValue, { color: colors.text, fontSize: isSmallScreen ? 16 : 18 }]}>
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}

            <TouchableOpacity 
              style={[styles.addItemButton, { borderColor: colors.border }]} 
              onPress={addItem}
            >
              <Ionicons name="add-circle-outline" size={isSmallScreen ? 18 : 20} color={colors.primary500} />
              <Text style={[styles.addItemText, { color: colors.primary500, fontSize: isSmallScreen ? 14 : 16 }]}>
                Add Another Item
              </Text>
            </TouchableOpacity>
          </View>

          {/* Summary */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.text, fontSize: isSmallScreen ? 14 : 16 }]}>
                Subtotal
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text, fontSize: isSmallScreen ? 14 : 16 }]}>
                ${subtotal.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.text, fontSize: isSmallScreen ? 14 : 16 }]}>
                Tax (8.5%)
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text, fontSize: isSmallScreen ? 14 : 16 }]}>
                ${tax.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.text, fontSize: isSmallScreen ? 16 : 18 }]}>
                Total
              </Text>
              <Text style={[styles.totalValue, { color: colors.text, fontSize: isSmallScreen ? 16 : 18 }]}>
                ${total.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Additional Options */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Options</Text>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
              <TextInput
                style={[styles.input, styles.notesInput, { 
                  backgroundColor: colors.background, 
                  borderColor: colors.border, 
                  color: colors.text,
                  fontSize: isSmallScreen ? 14 : 16,
                  minHeight: isSmallScreen ? 80 : 100
                }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any additional notes or terms"
                multiline
                textAlignVertical="top"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.draftButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleSaveDraft}
            >
              <Text style={[styles.draftButtonText, { color: colors.text, fontSize: isSmallScreen ? 14 : 16 }]}>
                Save as Draft
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.createButton, { backgroundColor: colors.primary500 }]}
              onPress={handleSaveInvoice}
            >
              <Ionicons name="checkmark-circle-outline" size={isSmallScreen ? 18 : 20} color="white" />
              <Text style={[styles.createButtonText, { fontSize: isSmallScreen ? 14 : 16 }]}>
                Create Invoice
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.spacer} />
        </View>
      </ScrollView>

      {/* Date Pickers */}
      {(showIssueDatePicker || showDueDatePicker) && (
        <DateTimePicker
          value={showIssueDatePicker ? issueDate : dueDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            const isIssue = showIssueDatePicker;
            setShowIssueDatePicker(false);
            setShowDueDatePicker(false);
            if (event.type === 'set' && selectedDate) {
              if (isIssue) {
                setIssueDate(selectedDate);
              } else {
                setDueDate(selectedDate);
              }
            }
          }}
        />
      )}

      {/* Product Selection Modal */}
      <Modal
        visible={showProductModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowProductModal(false);
          setSelectedItemId(null);
          setSearchQuery('');
        }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Product</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowProductModal(false);
                  setSelectedItemId(null);
                  setSearchQuery('');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={isSmallScreen ? 22 : 24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
              <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="search" size={isSmallScreen ? 18 : 20} color={colors.textTertiary} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text, fontSize: isSmallScreen ? 14 : 16 }]}
                  placeholder="Search products..."
                  placeholderTextColor={colors.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity 
                    onPress={() => setSearchQuery('')}
                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                  >
                    <Ionicons name="close-circle" size={isSmallScreen ? 18 : 20} color={colors.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Products List */}
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.productItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleProductSelect(item)}
                >
                  <View style={styles.productInfo}>
                    <Text style={[styles.productName, { color: colors.text, fontSize: isSmallScreen ? 14 : 16 }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.productSku, { color: colors.textTertiary, fontSize: isSmallScreen ? 10 : 12 }]}>
                      SKU: {item.sku}
                    </Text>
                    {item.description && (
                      <Text style={[styles.productDescription, { color: colors.textTertiary, fontSize: isSmallScreen ? 10 : 12 }]}>
                        {item.description.length > 50 ? item.description.substring(0, 50) + '...' : item.description}
                      </Text>
                    )}
                    <View style={styles.productDetails}>
                      <Text style={[styles.productPrice, { color: colors.text, fontSize: isSmallScreen ? 14 : 16 }]}>
                        ${item.price.toFixed(2)}
                      </Text>
                      <View style={[styles.stockBadge, { 
                        backgroundColor: item.quantity <= 0 ? colors.error + '15' : item.quantity <= 10 ? colors.warning + '15' : colors.success + '15'
                      }]}>
                        <Text style={[styles.stockText, { 
                          color: item.quantity <= 0 ? colors.error : item.quantity <= 10 ? colors.warning : colors.success,
                          fontSize: isSmallScreen ? 9 : 11
                        }]}>
                          {item.quantity} in stock
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={isSmallScreen ? 18 : 20} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="cube-outline" size={isSmallScreen ? 40 : 48} color={colors.textTertiary} />
                  <Text style={[styles.emptyText, { color: colors.text, fontSize: isSmallScreen ? 14 : 16 }]}>
                    {searchQuery ? 'No products found' : 'No products available'}
                  </Text>
                  {!searchQuery && (
                    <TouchableOpacity 
                      style={[styles.addProductButton, { backgroundColor: colors.primary500 }]}
                      onPress={() => {
                        setShowProductModal(false);
                        router.push('/(modals)/add-product');
                      }}
                    >
                      <Text style={[styles.addProductButtonText, { fontSize: isSmallScreen ? 12 : 14 }]}>
                        Add New Product
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
              contentContainerStyle={styles.flatListContent}
            />
          </View>
        </View>
      </Modal>

      <TemplatePreviewModal
        visible={Boolean(previewTemplate)}
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />
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
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: isSmallScreen ? 12 : 16,
    paddingBottom: isSmallScreen ? 16 : 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: isTablet ? 28 : isSmallScreen ? 20 : 24,
    fontWeight: '700',
  },
  saveButton: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: isSmallScreen ? 12 : 16,
    borderRadius: isTablet ? 20 : 16,
    padding: isTablet ? 24 : isSmallScreen ? 16 : 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: isTablet ? 22 : isSmallScreen ? 16 : 18,
    fontWeight: '700',
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: isSmallScreen ? 12 : 16,
  },
  templateBrowse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  templateBrowseText: {
    fontSize: isSmallScreen ? 12 : 14,
    fontWeight: '600',
  },
  templateScroll: {
    marginTop: 4,
  },
  templateCard: {
    width: isSmallScreen ? 120 : 140,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
  },
  templatePreview: {
    height: 48,
    borderRadius: 10,
    marginBottom: 8,
  },
  templateName: {
    fontSize: isSmallScreen ? 12 : 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  templateMeta: {
    fontSize: isSmallScreen ? 10 : 12,
    fontWeight: '500',
  },
  addItemIcon: {
    padding: 4,
  },
  formGroup: {
    marginBottom: isSmallScreen ? 12 : 16,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    rowGap: isSmallScreen ? 8 : 12,
  },
  lineItemInputs: {
    flexDirection: 'column',
  },
  label: {
    fontSize: isSmallScreen ? 12 : 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderRadius: isSmallScreen ? 10 : 12,
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingVertical: isSmallScreen ? 12 : 14,
    fontSize: isSmallScreen ? 14 : 16,
    borderWidth: 1,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: isSmallScreen ? 10 : 12,
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingVertical: isSmallScreen ? 12 : 14,
    borderWidth: 1,
  },
  dateText: {
    fontSize: isSmallScreen ? 14 : 16,
  },
  customerScrollContent: {
    paddingRight: 20,
  },
  customerList: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  customerOption: {
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingVertical: isSmallScreen ? 8 : 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    maxWidth: isTablet ? 200 : 150,
  },
  customerOptionActive: {},
  customerOptionText: {
    fontWeight: '600',
  },
  customerOptionTextActive: {
    color: 'white',
  },
  addCustomerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isSmallScreen ? 10 : 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: isSmallScreen ? 10 : 12,
    gap: 8,
  },
  addCustomerText: {
    fontWeight: '600',
  },
  itemCard: {
    borderRadius: isSmallScreen ? 10 : 12,
    padding: isSmallScreen ? 12 : 16,
    marginBottom: isSmallScreen ? 8 : 12,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 8 : 12,
  },
  itemNumber: {
    fontWeight: '600',
  },
  productSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: isSmallScreen ? 10 : 12,
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingVertical: isSmallScreen ? 12 : 14,
    borderWidth: 1,
  },
  productPlaceholder: {},
  productSelected: {
    fontWeight: '600',
  },
  stockInfo: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isSmallScreen ? 8 : 12,
  },
  quantityButton: {
    width: isSmallScreen ? 32 : 36,
    height: isSmallScreen ? 32 : 36,
    borderRadius: isSmallScreen ? 16 : 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
  },
  quantityInput: {
    flex: 1,
    minWidth: isSmallScreen ? 64 : 80,
    height: isSmallScreen ? 32 : 42,
    borderRadius: isSmallScreen ? 6 : 8,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: isSmallScreen ? 8 : 10,
    lineHeight: isSmallScreen ? 18 : 20,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: isSmallScreen ? 10 : 12,
    borderWidth: 1,
  },
  currencySymbol: {
    fontSize: isSmallScreen ? 14 : 16,
    paddingLeft: isSmallScreen ? 12 : 16,
    paddingRight: isSmallScreen ? 6 : 8,
  },
  priceInput: {
    flex: 1,
    paddingVertical: isSmallScreen ? 12 : 14,
    minWidth: 0,
  },
  itemTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: isSmallScreen ? 8 : 12,
    paddingTop: isSmallScreen ? 8 : 12,
    borderTopWidth: 1,
  },
  itemTotalLabel: {},
  itemTotalValue: {
    fontWeight: '700',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isSmallScreen ? 12 : 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: isSmallScreen ? 10 : 12,
    gap: 8,
  },
  addItemText: {
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 8 : 12,
  },
  summaryLabel: {},
  summaryValue: {
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: isSmallScreen ? 12 : 16,
    borderTopWidth: 2,
  },
  totalLabel: {
    fontWeight: '700',
  },
  totalValue: {
    fontWeight: '700',
  },
  notesInput: {
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: isSmallScreen ? 8 : 12,
    marginTop: isSmallScreen ? 8 : 12,
  },
  draftButton: {
    flex: 1,
    paddingVertical: isSmallScreen ? 14 : 16,
    borderRadius: isSmallScreen ? 10 : 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  draftButtonText: {
    fontWeight: '600',
  },
  createButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallScreen ? 14 : 16,
    borderRadius: isSmallScreen ? 10 : 12,
    gap: 8,
  },
  createButtonText: {
    fontWeight: '600',
    color: 'white',
  },
  spacer: {
    height: isSmallScreen ? 40 : 60,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: isSmallScreen ? '85%' : '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingVertical: isSmallScreen ? 14 : 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
  },
  searchContainer: {
    padding: isSmallScreen ? 12 : 16,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: isSmallScreen ? 10 : 12,
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingVertical: isSmallScreen ? 10 : 14,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: isSmallScreen ? 8 : 12,
  },
  searchInput: {
    flex: 1,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingVertical: isSmallScreen ? 12 : 16,
    borderBottomWidth: 1,
  },
  productInfo: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  productSku: {
    marginBottom: 2,
  },
  productDescription: {
    marginBottom: 6,
  },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isSmallScreen ? 8 : 12,
  },
  productPrice: {
    fontWeight: '700',
  },
  stockBadge: {
    paddingHorizontal: isSmallScreen ? 6 : 8,
    paddingVertical: isSmallScreen ? 2 : 4,
    borderRadius: isSmallScreen ? 4 : 6,
  },
  stockText: {
    fontWeight: '600',
  },
  flatListContent: {
    paddingBottom: isSmallScreen ? 20 : 40,
  },
  emptyContainer: {
    padding: isSmallScreen ? 30 : 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: isSmallScreen ? 12 : 16,
    marginBottom: isSmallScreen ? 16 : 20,
    textAlign: 'center',
  },
  addProductButton: {
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingVertical: isSmallScreen ? 10 : 12,
    borderRadius: isSmallScreen ? 10 : 12,
  },
  addProductButtonText: {
    fontWeight: '600',
    color: 'white',
  },
});
