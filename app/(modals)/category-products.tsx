import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { router, useLocalSearchParams } from 'expo-router';
import { useData } from '@/context/DataContext';

export default function CategoryProductsScreen() {
  const { colors } = useTheme();
  const { category } = useLocalSearchParams();
  const { inventory } = useData();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (category) {
      const categoryProducts = inventory.filter(item => item.category === category);
      setProducts(categoryProducts);
    }
  }, [category, inventory]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-stock': return colors.success;
      case 'low-stock': return colors.warning;
      case 'out-of-stock': return colors.error;
      default: return colors.textLight;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'in-stock': return 'In Stock';
      case 'low-stock': return 'Low Stock';
      case 'out-of-stock': return 'Out of Stock';
      default: return status;
    }
  };

  const totalValue = products.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.categoryName, { color: colors.text }]}>{category}</Text>
            <Text style={[styles.productCount, { color: colors.textTertiary }]}>
              {products.length} products
            </Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Category Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{products.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Total Products</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              ${totalValue.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Total Value</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {products.filter(p => p.status === 'in-stock').length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Available</Text>
          </View>
        </View>

        {/* Products List */}
        <View style={styles.productsList}>
          {products.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={60} color={colors.textTertiary} />
              <Text style={[styles.emptyStateText, { color: colors.text }]}>No products in this category</Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textTertiary }]}>
                Add products to this category from the inventory screen
              </Text>
            </View>
          ) : (
            products.map((product) => (
              <TouchableOpacity 
                key={product.id} 
                style={[
                  styles.productCard,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border
                  }
                ]}
                onPress={() => router.push(`/(modals)/product-detail?id=${product.id}`)}
              >
                <View style={styles.productHeader}>
                  <View style={styles.productInfo}>
                    <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
                    <Text style={[styles.productSku, { color: colors.textTertiary }]}>{product.sku}</Text>
                  </View>
                  <Text style={[styles.productPrice, { color: colors.text }]}>
                    ${product.price.toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.productDetails}>
                  <View style={styles.quantityContainer}>
                    <Text style={[styles.quantityLabel, { color: colors.textTertiary }]}>Remaining:</Text>
                    <Text style={[styles.quantityValue, { color: colors.text }]}>{product.quantity}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(product.status)}15` }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(product.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(product.status) }]}>
                      {getStatusText(product.status)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
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
  headerCenter: {
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 24,
    fontWeight: '700',
  },
  productCount: {
    fontSize: 14,
    marginTop: 4,
  },
  headerRight: {
    width: 40,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
  },
  productsList: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  productCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  productSku: {
    fontSize: 14,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '700',
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityLabel: {
    fontSize: 14,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
    lineHeight: 20,
  },
  spacer: {
    height: 20,
  },
});
