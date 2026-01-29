import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Platform,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { useUser } from '@/context/UserContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function CreateReceiptScreen() {
  const { colors } = useTheme();
  const { 
    addReceipt, 
    inventory, 
    customers, 
    createReceipt // Import as fallback
  } = useData();
  const { user } = useUser();
  const params = useLocalSearchParams();
  
  const [items, setItems] = useState<ReceiptItem[]>([
    { id: '1', name: 'Office Supplies', price: 25.99, quantity: 1 },
    { id: '2', name: 'Wireless Mouse', price: 39.99, quantity: 1 },
  ]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [sendEmail, setSendEmail] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const companyName = (
    user?.businessName?.trim() ||
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
    'Ledgerly Inc.'
  );
  const companyContacts = [
    user?.phoneNumber,
    user?.email,
    user?.country,
  ].filter(Boolean);
  const companyContactMarkup = companyContacts.length
    ? companyContacts.join('<br>')
    : 'support@ledgerly.com';

  // Load selected products from params if provided
  useEffect(() => {
    if (params.selectedProducts) {
      try {
        const parsedProducts = JSON.parse(params.selectedProducts as string);
        const formattedItems = parsedProducts.map((product: any, index: number) => ({
          id: (Date.now() + index).toString(),
          name: product.name,
          price: parseFloat(product.price),
          quantity: 1,
        }));
        setItems(formattedItems);
      } catch (error) {
        console.error('Error parsing selected products:', error);
      }
    }
  }, [params.selectedProducts]);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.085;
  const discount = 0;
  const total = subtotal + tax - discount;

  const updateQuantity = (id: string, change: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const updatePrice = (id: string, price: string) => {
    const priceValue = parseFloat(price) || 0;
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, price: priceValue };
      }
      return item;
    }));
  };

  const updateName = (id: string, name: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, name };
      }
      return item;
    }));
  };

  const addItem = () => {
    const newItem: ReceiptItem = {
      id: Date.now().toString(),
      name: 'New Item',
      price: 0,
      quantity: 1,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearAll = () => {
    setItems([]);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setNotes('');
    setPaymentMethod('cash');
    setSendEmail(false);
    setSelectedCustomer('');
  };

  const handleCustomerSelect = (customer: string) => {
    setSelectedCustomer(customer);
    const customerData = customers.find(c => c.name === customer);
    if (customerData) {
      setCustomerName(customerData.name);
      setCustomerEmail(customerData.email || '');
      setCustomerPhone(customerData.phone || '');
    }
  };

  const generateReceiptHTML = () => {
    const date = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Receipt</title>
        <style>
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 30px;
            color: #333;
            max-width: 500px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #4F46E5;
            padding-bottom: 20px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #4F46E5;
            margin-bottom: 5px;
          }
          .company-info {
            font-size: 12px;
            color: #666;
            line-height: 1.4;
          }
          .receipt-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 15px;
            background-color: #F9FAFB;
            border-radius: 8px;
          }
          .receipt-number {
            font-weight: bold;
            color: #111827;
          }
          .receipt-date {
            color: #6B7280;
          }
          .customer-info {
            margin-bottom: 25px;
            padding: 15px;
            background-color: #F9FAFB;
            border-radius: 8px;
          }
          .customer-name {
            font-weight: bold;
            margin-bottom: 5px;
            color: #111827;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
          }
          .items-table th {
            background-color: #4F46E5;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 14px;
          }
          .items-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #E5E7EB;
            font-size: 14px;
          }
          .items-table tr:last-child td {
            border-bottom: 2px solid #4F46E5;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .summary {
            margin: 25px 0;
            padding: 20px;
            background-color: #F9FAFB;
            border-radius: 8px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 18px;
            padding-top: 15px;
            border-top: 2px solid #4F46E5;
            margin-top: 15px;
          }
          .payment-method {
            margin: 20px 0;
            padding: 15px;
            background-color: #F9FAFB;
            border-radius: 8px;
            text-align: center;
          }
          .payment-label {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            color: #6B7280;
            font-size: 12px;
            line-height: 1.6;
          }
          .notes {
            margin-top: 20px;
            padding: 15px;
            background-color: #FEF3C7;
            border-radius: 8px;
            border-left: 4px solid #F59E0B;
            font-size: 13px;
          }
          .barcode {
            text-align: center;
            margin: 20px 0;
            font-family: monospace;
            letter-spacing: 8px;
            font-size: 24px;
          }
          @media print {
            body {
              margin: 0;
              padding: 10px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${companyName}</div>
          <div class="company-info">
            ${companyContactMarkup}
          </div>
        </div>
        
        <div class="receipt-info">
          <div>
            <div class="receipt-number">Receipt #RCP-${(Date.now() % 1000).toString().padStart(3, '0')}</div>
            <div class="receipt-date">${date}</div>
          </div>
          <div class="payment-method" style="padding: 0; background: none; margin: 0;">
            <div class="payment-label">Payment Method:</div>
            <div>${paymentMethod.toUpperCase()}</div>
          </div>
        </div>
        
        ${customerName ? `
          <div class="customer-info">
            <div class="customer-name">${customerName}</div>
            ${customerEmail ? `<div>${customerEmail}</div>` : ''}
            ${customerPhone ? `<div>${customerPhone}</div>` : ''}
          </div>
        ` : ''}
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">$${item.price.toFixed(2)}</td>
                <td class="text-right">$${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="summary">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>$${subtotal.toFixed(2)}</span>
          </div>
          ${discount > 0 ? `
            <div class="summary-row">
              <span>Discount:</span>
              <span>-$${discount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="summary-row">
            <span>Tax (8.5%):</span>
            <span>$${tax.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Total Amount:</span>
            <span>$${total.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="payment-method">
          <div class="payment-label">PAYMENT METHOD</div>
          <div style="font-size: 18px; font-weight: bold; color: #4F46E5;">${paymentMethod.toUpperCase()}</div>
          <div style="margin-top: 10px; font-size: 20px; font-weight: bold;">$${total.toFixed(2)}</div>
        </div>
        
        <div class="barcode">
          ||||||| | || ||| | || |||||||||
        </div>
        
        ${notes ? `
          <div class="notes">
            <strong>Notes:</strong><br>
            ${notes}
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Please retain this receipt for your records.</p>
          <p>Items are non-refundable. Store credit only within 30 days with receipt.</p>
          <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrintReceipt = async () => {
    if (items.length === 0) {
      Alert.alert('No Items', 'Please add at least one item to generate a receipt.');
      return;
    }

    if (total <= 0) {
      Alert.alert('Invalid Total', 'Total amount must be greater than zero.');
      return;
    }

    setIsGenerating(true);
    try {
      // Generate HTML for the receipt
      const htmlContent = generateReceiptHTML();
      
      // Create receipt data
      const receiptData = {
        customer: customerName || 'Walk-in Customer',
        customerEmail,
        customerPhone,
        time: new Date().toISOString(),
        amount: parseFloat(total.toFixed(2)),
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        discount,
        paymentMethod,
        status: 'completed' as const,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        notes,
      };

      // Add receipt to database - try addReceipt first, fall back to createReceipt
      let receiptId;
      if (addReceipt) {
        receiptId = await addReceipt(receiptData);
      } else if (createReceipt) {
        receiptId = await createReceipt(receiptData);
      } else {
        throw new Error('No receipt creation method available');
      }
      
      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });
      
      if (Platform.OS === 'web') {
        // For web: download the PDF
        const link = document.createElement('a');
        link.href = uri;
        link.download = `Receipt_${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For mobile: share the PDF
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Receipt',
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('Success', `Receipt saved to: ${uri}`);
        }
      }
      
      // Show success message
      Alert.alert(
        'Success', 
        'Receipt generated successfully!',
        [
          { 
            text: 'View Receipt', 
            onPress: () => router.push(`/(modals)/receipt-detail?id=${receiptId}`)
          },
          { 
            text: 'Create Another', 
            style: 'cancel',
            onPress: () => clearAll()
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Error generating receipt:', error);
      Alert.alert('Error', error.message || 'Failed to generate receipt. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const quickAddProduct = (product: any) => {
    const newItem: ReceiptItem = {
      id: Date.now().toString(),
      name: product.name,
      price: product.price,
      quantity: 1,
    };
    setItems([...items, newItem]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>New Receipt</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={clearAll}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Add Products */}
        {inventory.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Add Products</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScroll}>
              {inventory.slice(0, 5).map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => quickAddProduct(product)}
                >
                  <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={[styles.productPrice, { color: colors.primary500 }]}>
                    ${product.price.toFixed(2)}
                  </Text>
                  <Text style={[styles.productStock, { color: colors.textTertiary }]}>
                    Stock: {product.quantity}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Items Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Items ({items.length})</Text>
          {items.map((item) => (
            <View key={item.id} style={[styles.itemCard, { borderBottomColor: colors.border }]}>
              <View style={styles.itemInfo}>
                <TextInput
                  style={[styles.itemNameInput, { color: colors.text }]}
                  value={item.name}
                  onChangeText={(text) => updateName(item.id, text)}
                  placeholder="Item name"
                  placeholderTextColor={colors.textTertiary}
                />
                <TextInput
                  style={[styles.itemPriceInput, { color: colors.text }]}
                  value={item.price.toString()}
                  onChangeText={(text) => updatePrice(item.id, text)}
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.quantityControls}>
                <TouchableOpacity 
                  style={[styles.quantityButton, { backgroundColor: colors.error + '20' }]}
                  onPress={() => updateQuantity(item.id, -1)}
                >
                  <Ionicons name="remove" size={20} color={colors.error} />
                </TouchableOpacity>
                <Text style={[styles.quantityText, { color: colors.text }]}>{item.quantity}</Text>
                <TouchableOpacity 
                  style={[styles.quantityButton, { backgroundColor: colors.success + '20' }]}
                  onPress={() => updateQuantity(item.id, 1)}
                >
                  <Ionicons name="add" size={20} color={colors.success} />
                </TouchableOpacity>
                <View style={styles.itemTotal}>
                  <Text style={[styles.itemTotalText, { color: colors.text }]}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeItem(item.id)}
                >
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          
          <TouchableOpacity 
            style={[styles.addItemButton, { borderColor: colors.primary500 }]}
            onPress={addItem}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary500} />
            <Text style={[styles.addItemText, { color: colors.primary500 }]}>Add Custom Item</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.text }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.text }]}>Tax (8.5%)</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>${tax.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>${total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Customer Selection */}
        {customers.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Customer (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.customersScroll}>
              <TouchableOpacity
                style={[
                  styles.customerButton,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  selectedCustomer === '' && [styles.customerButtonActive, { borderColor: colors.primary500 }]
                ]}
                onPress={() => handleCustomerSelect('')}
              >
                <Ionicons name="person-add-outline" size={20} color={colors.text} />
                <Text style={[styles.customerButtonText, { color: colors.text }]}>Walk-in</Text>
              </TouchableOpacity>
              {customers.slice(0, 5).map((customer) => (
                <TouchableOpacity
                  key={customer.id}
                  style={[
                    styles.customerButton,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    selectedCustomer === customer.name && [styles.customerButtonActive, { borderColor: colors.primary500 }]
                  ]}
                  onPress={() => handleCustomerSelect(customer.name)}
                >
                  <Ionicons name="person-outline" size={20} color={colors.text} />
                  <Text style={[styles.customerButtonText, { color: colors.text }]} numberOfLines={1}>
                    {customer.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Customer Info */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer Details</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="Customer Name"
            placeholderTextColor={colors.textTertiary}
            value={customerName}
            onChangeText={setCustomerName}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="Email (optional)"
            placeholderTextColor={colors.textTertiary}
            value={customerEmail}
            onChangeText={setCustomerEmail}
            keyboardType="email-address"
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="Phone (optional)"
            placeholderTextColor={colors.textTertiary}
            value={customerPhone}
            onChangeText={setCustomerPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Payment Method */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
          <View style={styles.paymentMethods}>
            {[
              { key: 'cash', label: 'Cash', icon: 'cash-outline' },
              { key: 'card', label: 'Card', icon: 'card-outline' },
              { key: 'transfer', label: 'Transfer', icon: 'swap-horizontal-outline' },
            ].map((method) => (
              <TouchableOpacity
                key={method.key}
                style={[
                  styles.paymentMethodButton,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  paymentMethod === method.key && [styles.paymentMethodButtonActive, { backgroundColor: colors.primary500 }]
                ]}
                onPress={() => setPaymentMethod(method.key as any)}
              >
                <Ionicons 
                  name={method.icon as any} 
                  size={24} 
                  color={paymentMethod === method.key ? 'white' : colors.text} 
                />
                <Text style={[
                  styles.paymentMethodText,
                  { color: paymentMethod === method.key ? 'white' : colors.text }
                ]}>
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes (Optional)</Text>
          <TextInput
            style={[
              styles.input, 
              styles.notesInput, 
              { 
                backgroundColor: colors.background, 
                color: colors.text, 
                borderColor: colors.border,
                minHeight: 100 
              }
            ]}
            placeholder="Add any notes here..."
            placeholderTextColor={colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Email Receipt Toggle */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.emailRow}>
            <View style={styles.emailInfo}>
              <Text style={[styles.emailLabel, { color: colors.text }]}>Email Receipt</Text>
              <Text style={[styles.emailDescription, { color: colors.textTertiary }]}>
                Send receipt to customer email
              </Text>
            </View>
            <Switch
              value={sendEmail}
              onValueChange={setSendEmail}
              trackColor={{ false: colors.border, true: colors.primary500 }}
              thumbColor={colors.background}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.clearButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={clearAll}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
            <Text style={[styles.clearButtonText, { color: colors.error }]}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.generateButton, { backgroundColor: colors.primary500 }]}
            onPress={handlePrintReceipt}
            disabled={isGenerating || items.length === 0}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="print-outline" size={20} color="white" />
            )}
            <Text style={styles.generateButtonText}>
              {isGenerating ? 'Generating...' : 'Generate & Print'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
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
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
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
    marginBottom: 16,
  },
  productsScroll: {
    flexDirection: 'row',
  },
  productCard: {
    width: 120,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 12,
  },
  itemCard: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  itemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemNameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
    paddingVertical: 4,
  },
  itemPriceInput: {
    width: 80,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    paddingVertical: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },
  itemTotal: {
    flex: 1,
    alignItems: 'flex-end',
  },
  itemTotalText: {
    fontSize: 18,
    fontWeight: '700',
  },
  removeButton: {
    padding: 4,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    gap: 8,
  },
  addItemText: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 2,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  customersScroll: {
    flexDirection: 'row',
  },
  customerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    gap: 8,
  },
  customerButtonActive: {
    borderWidth: 2,
  },
  customerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: 80,
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  paymentMethodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  paymentMethodButtonActive: {
    borderWidth: 2,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  notesInput: {
    textAlignVertical: 'top',
  },
  emailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emailInfo: {
    flex: 1,
  },
  emailLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emailDescription: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  generateButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  spacer: {
    height: 20,
  },
});
