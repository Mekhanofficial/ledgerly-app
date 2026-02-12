import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { LinearGradient } from 'expo-linear-gradient';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

export default function ReceiptsScreen() {
  const { colors } = useTheme();
  const { 
    receipts, 
    inventory: products, 
    addReceipt, 
    getReceiptById,
    createReceipt, // Also import createReceipt as fallback
  } = useData();  
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState(receipts);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Filter receipts based on search query
    if (searchQuery.trim() === '') {
      setFilteredReceipts(receipts);
    } else {
      const filtered = receipts.filter(receipt =>
        receipt.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.customerPhone?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredReceipts(filtered);
    }
  }, [searchQuery, receipts]);

  const getPaymentMethodIcon = (method: 'cash' | 'card' | 'transfer' | 'mobile') => {
    switch (method) {
      case 'cash': return 'cash-outline';
      case 'card': return 'card-outline';
      case 'transfer': return 'swap-horizontal-outline';
      case 'mobile': return 'phone-portrait-outline';
      default: return 'card-outline';
    }
  };

  const getPaymentMethodColor = (method: 'cash' | 'card' | 'transfer' | 'mobile') => {
    switch (method) {
      case 'cash': return colors.success;
      case 'card': return colors.primary500;
      case 'transfer': return colors.warning;
      case 'mobile': return colors.info || colors.primary400;
      default: return colors.primary500;
    }
  };

  const getStatusColor = (status: 'completed' | 'refunded' | 'pending') => {
    switch (status) {
      case 'completed': return colors.success;
      case 'refunded': return colors.error;
      case 'pending': return colors.warning;
      default: return colors.textTertiary;
    }
  };

  const toggleProductSelection = (product: Product) => {
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((total, product) => {
      return total + product.price;
    }, 0).toFixed(2);
  };

  const calculateSubtotal = () => {
    return selectedProducts.reduce((total, product) => total + product.price, 0);
  };

  const handleGenerateReceipt = async () => {
    if (selectedProducts.length === 0) {
      Alert.alert('No Items', 'Please select at least one item to generate a receipt.');
      return;
    }

    setIsGenerating(true);
    
    try {
      const subtotal = calculateSubtotal();
      const tax = subtotal * 0.085; // 8.5% tax
      const amount = subtotal + tax;

      const receiptData = {
        customer: 'Walk-in Customer',
        customerEmail: '',
        customerPhone: '',
        time: new Date().toISOString(),
        amount: parseFloat(amount.toFixed(2)),
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        discount: 0,
        paymentMethod: 'cash' as const,
        status: 'completed' as const,
        items: selectedProducts.map(product => ({
          id: `item_${Date.now()}_${product.id}`,
          name: product.name,
          quantity: 1,
          price: product.price,
        })),
        notes: 'Generated from quick selection',
      };

      let receiptId;
      
      // Try addReceipt first, fall back to createReceipt
      if (addReceipt) {
        receiptId = await addReceipt(receiptData);
      } else if (createReceipt) {
        receiptId = await createReceipt(receiptData);
      } else {
        throw new Error('No receipt creation method available');
      }
      
      // Navigate to the new receipt detail
      router.push(`/(modals)/receipt-detail?id=${receiptId}`);
      
      // Clear selected products
      setSelectedProducts([]);
      
      Alert.alert('Success', 'Receipt generated successfully!');
    } catch (error: any) {
      console.error('Error generating receipt:', error);
      Alert.alert('Error', error.message || 'Failed to generate receipt. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateNewReceipt = () => {
    router.push({
      pathname: '/(modals)/create-receipt',
      params: { 
        selectedProducts: JSON.stringify(selectedProducts.map(p => ({
          ...p,
          price: p.price.toString()
        })))
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getTotalRevenue = () => {
    return receipts
      .filter(receipt => receipt.status === 'completed')
      .reduce((total, receipt) => total + receipt.amount, 0);
  };

  const getTotalReceiptsToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return receipts.filter(receipt => {
      const receiptDate = new Date(receipt.createdAt);
      receiptDate.setHours(0, 0, 0, 0);
      return receiptDate.getTime() === today.getTime() && receipt.status === 'completed';
    }).length;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Stats */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Receipts</Text>
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.primary500 + '20' }]}>
              <Ionicons name="receipt-outline" size={20} color={colors.primary500} />
              <Text style={[styles.statValue, { color: colors.text }]}>{receipts.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Total Receipts</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="cash-outline" size={20} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.text }]}>{formatAmount(getTotalRevenue())}</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Revenue</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.warning + '20' }]}>
              <Ionicons name="today-outline" size={20} color={colors.warning} />
              <Text style={[styles.statValue, { color: colors.text }]}>{getTotalReceiptsToday()}</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Today</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.generateButton}
            onPress={handleCreateNewReceipt}
          >
            <LinearGradient
              colors={[colors.primary600, colors.primary700]}
              style={styles.generateButtonGradient}
            >
              <Ionicons name="add" size={20} color="white" style={styles.generateIcon} />
              <Text style={styles.generateText}>Create Receipt</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textTertiary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search receipts by number, customer, email..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Quick Add Products */}
        {products.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Add Products</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScroll}>
              {products.slice(0, 10).map((product) => {
                const isSelected = selectedProducts.some(p => p.id === product.id);
                return (
                  <TouchableOpacity
                    key={product.id}
                    style={[
                      styles.productCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      isSelected && [
                        styles.productCardSelected,
                        { borderColor: colors.primary500 }
                      ]
                    ]}
                    onPress={() => toggleProductSelection(product)}
                  >
                    <View style={styles.productContent}>
                      <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
                        {product.name || 'Unnamed Product'}
                      </Text>
                      <Text style={[styles.productPrice, { color: colors.text }]}>
                        {formatAmount(product.price || 0)}
                      </Text>
                      <Text style={[styles.productCategory, { color: colors.textTertiary }]}>
                        {product.category || 'Uncategorized'}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={[styles.selectedIndicator, { backgroundColor: colors.primary500 }]}>
                        <Ionicons name="checkmark" size={20} color="white" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Selected Products Summary */}
        {selectedProducts.length > 0 && (
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>Selected Items ({selectedProducts.length})</Text>
            <View style={styles.summaryItems}>
              {selectedProducts.map((product) => (
                <View key={product.id} style={styles.summaryItem}>
                  <Text style={[styles.summaryItemName, { color: colors.text }]} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={[styles.summaryItemPrice, { color: colors.text }]}>
                    {formatAmount(product.price)}
                  </Text>
                </View>
              ))}
            </View>
            <View style={[styles.totalContainer, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total:</Text>
              <Text style={[styles.totalAmount, { color: colors.text }]}>
                {formatAmount(parseFloat(calculateTotal()))}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.checkoutButton}
              onPress={handleGenerateReceipt}
              disabled={isGenerating}
            >
              <LinearGradient
                colors={[colors.primary600, colors.primary700]}
                style={styles.checkoutButtonGradient}
              >
                {isGenerating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="receipt-outline" size={20} color="white" />
                )}
                <Text style={styles.checkoutText}>
                  {isGenerating ? 'Generating...' : 'Generate Receipt'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Receipts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Receipts</Text>
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={[styles.viewAllText, { color: colors.primary500 }]}>
                {searchQuery ? 'Clear Search' : 'View All'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {filteredReceipts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyStateText, { color: colors.text }]}>
                {searchQuery ? 'No receipts found' : 'No receipts yet'}
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textTertiary }]}>
                {searchQuery ? 'Try a different search term' : 'Create your first receipt to get started'}
              </Text>
            </View>
          ) : (
            <View style={styles.receiptsList}>
              {filteredReceipts.map((receipt) => (
                <TouchableOpacity 
                  key={receipt.id} 
                  style={[
                    styles.receiptCard,
                    { backgroundColor: colors.surface, borderColor: colors.border }
                  ]}
                  onPress={() => router.push(`/(modals)/receipt-detail?id=${receipt.id}`)}
                >
                  <View style={styles.receiptInfo}>
                    <View style={styles.receiptHeader}>
                      <Text style={[styles.receiptNumber, { color: colors.text }]}>{receipt.number}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(receipt.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(receipt.status) }]}>
                          {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.receiptCustomer, { color: colors.text }]}>{receipt.customer}</Text>
                    <Text style={[styles.receiptTime, { color: colors.textTertiary }]}>
                      {formatDate(receipt.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.receiptAmountContainer}>
                    <Text style={[styles.receiptAmount, { color: colors.text }]}>
                      {formatAmount(receipt.amount)}
                    </Text>
                    <View style={styles.paymentMethod}>
                      <Ionicons 
                        name={getPaymentMethodIcon(receipt.paymentMethod)} 
                        size={16} 
                        color={getPaymentMethodColor(receipt.paymentMethod)} 
                      />
                      <Text style={[styles.paymentText, { color: getPaymentMethodColor(receipt.paymentMethod) }]}>
                        {receipt.paymentMethod.charAt(0).toUpperCase() + receipt.paymentMethod.slice(1)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtonsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  generateButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  generateIcon: {
    marginRight: 4,
  },
  generateText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  productsScroll: {
    flexDirection: 'row',
  },
  productCard: {
    width: 140,
    borderRadius: 16,
    padding: 20,
    marginRight: 12,
    borderWidth: 2,
    position: 'relative',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  productCardSelected: {},
  productContent: {
    alignItems: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 13,
    fontWeight: '500',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryItems: {
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryItemName: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  summaryItemPrice: {
    fontSize: 15,
    fontWeight: '600',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '700',
  },
  checkoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  checkoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  receiptsList: {
    gap: 12,
  },
  receiptCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  receiptInfo: {
    flex: 1,
    marginRight: 12,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  receiptNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  receiptCustomer: {
    fontSize: 15,
    marginBottom: 2,
  },
  receiptTime: {
    fontSize: 13,
    fontWeight: '500',
  },
  receiptAmountContainer: {
    alignItems: 'flex-end',
  },
  receiptAmount: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
