// app/(modals)/product-detail.tsx
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
import { useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { hasRole, ROLE_GROUPS } from '@/utils/roleAccess';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useUser } from '@/context/UserContext';
import { formatCurrency, resolveCurrencyCode } from '@/utils/currency';

export default function ProductDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getProductById, notifications, loading } = useData();
  const { user } = useUser();
  const { role, canAccess } = useRoleGuard(ROLE_GROUPS.business);
  const canManageInventory = hasRole(role, ROLE_GROUPS.inventoryManage);
  const currencyCode = resolveCurrencyCode(user || undefined);
  const formatMoney = (value: number, options = {}) => formatCurrency(value, currencyCode, options);
  const product = id ? getProductById(id) : undefined;

  const formatDateTime = (value: string | Date) => {
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleString();
  };

  const statusLabel = (status?: string) => {
    switch (status) {
      case 'in-stock':
        return 'In Stock';
      case 'low-stock':
        return 'Low Stock';
      case 'out-of-stock':
        return 'Out of Stock';
      default:
        return 'Unknown';
    }
  };

  const statusColor = (status?: string) => {
    switch (status) {
      case 'in-stock':
        return colors.success;
      case 'low-stock':
        return colors.warning;
      case 'out-of-stock':
        return colors.error;
      default:
        return colors.textTertiary;
    }
  };

  const stockHistory = useMemo(() => {
    if (!product) return [];
    const baseHistory = [
      {
        id: `${product.id}_created`,
        type: 'Product Created',
        detail: 'Added to inventory',
        date: formatDateTime(product.createdAt),
        timestamp: new Date(product.createdAt).getTime(),
      },
      {
        id: `${product.id}_updated`,
        type: 'Last Updated',
        detail: 'Most recent update',
        date: formatDateTime(product.updatedAt),
        timestamp: new Date(product.updatedAt).getTime(),
      },
    ];

    const notificationHistory = notifications
      .filter((notification) => notification.dataId === product.id)
      .map((notification) => {
        const match = notification.message.match(/Added\\s+(\\d+)\\s+units/i);
        const change = match ? `+${match[1]}` : undefined;
        return {
          id: notification.id,
          type: notification.title,
          detail: notification.message,
          date: formatDateTime(notification.createdAt),
          timestamp: new Date(notification.createdAt).getTime(),
          change,
        };
      });

    return [...notificationHistory, ...baseHistory].sort((a, b) => {
      return b.timestamp - a.timestamp;
    });
  }, [notifications, product]);

  const totalInventoryValue = product ? product.quantity * product.price : 0;

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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="share-outline" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Product Info */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.productName, { color: colors.text }]}>{product?.name}</Text>
          <Text style={[styles.sku, { color: colors.textTertiary }]}>SKU: {product?.sku}</Text>
          <Text style={[styles.description, { color: colors.text }]}>
            {product?.description || 'No description provided.'}
          </Text>
        </View>

        {/* Stock & Pricing */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Stock & Pricing</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Remaining Stock</Text>
              <View style={styles.stockInfo}>
                <Text style={[styles.stockQuantity, { color: colors.text }]}>{product?.quantity ?? 0}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor(product?.status)}15` }]}>
                  <Text style={[styles.statusText, { color: statusColor(product?.status) }]}>
                    {statusLabel(product?.status)}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Low Stock Threshold</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{product?.lowStockThreshold ?? 0} units</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Unit Price</Text>
              <Text style={[styles.statPrice, { color: colors.text }]}>{formatMoney(product?.price || 0)}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Cost Price</Text>
              <Text style={[styles.statPrice, { color: colors.text }]}>{formatMoney(product?.costPrice || 0)}</Text>
            </View>
          </View>

          <View style={[styles.inventoryValue, { borderTopColor: colors.border }]}>
            <Text style={[styles.inventoryLabel, { color: colors.text }]}>Total Inventory Value</Text>
            <Text style={[styles.inventoryAmount, { color: colors.text }]}>{formatMoney(totalInventoryValue)}</Text>
          </View>
        </View>

        {/* Stock History */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Stock History</Text>
            <TouchableOpacity>
              <Text style={[styles.viewAllText, { color: colors.primary500 }]}>
                View Full History {'>'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {stockHistory.length === 0 ? (
            <Text style={[styles.emptyHistory, { color: colors.textTertiary }]}>
              No stock activity yet.
            </Text>
          ) : (
            stockHistory.map((item) => (
              <View key={item.id} style={[styles.historyItem, { borderBottomColor: colors.border }]}>
                <View style={styles.historyInfo}>
                  <Text style={[styles.historyType, { color: colors.text }]}>{item.type}</Text>
                  {item.detail ? (
                    <Text style={[styles.historyDetail, { color: colors.text }]}>{item.detail}</Text>
                  ) : null}
                  <Text style={[styles.historyDate, { color: colors.textTertiary }]}>{item.date}</Text>
                </View>
                {item.change ? (
                  <Text style={[
                    styles.historyChange,
                    item.change.startsWith('+') ? [styles.positiveChange, { color: colors.success }] : [styles.negativeChange, { color: colors.error }]
                  ]}>
                    {item.change}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {canManageInventory && (
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.primary50, borderColor: colors.primary100 }]}
              onPress={() => product && router.push(`/(modals)/edit-product?id=${product.id}`)}
              disabled={!product}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary500} />
              <Text style={[styles.editButtonText, { color: colors.primary500 }]}>Edit Product</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.secondaryActions}>
            {canManageInventory && (
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => product && router.push(`/(modals)/adjust-stock?id=${product.id}`)}
                disabled={!product}
              >
                <Ionicons name="swap-vertical-outline" size={20} color={colors.primary500} />
                <Text style={[styles.secondaryButtonText, { color: colors.primary500 }]}>Adjust Stock</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => product && router.push(`/(modals)/create-invoice?productId=${product.id}`)}
              disabled={!product}
            >
              <Ionicons name="document-outline" size={20} color={colors.primary500} />
              <Text style={[styles.secondaryButtonText, { color: colors.primary500 }]}>Invoice</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.spacer} />
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
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIcon: {
    padding: 8,
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
  productName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  sku: {
    fontSize: 14,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  statItem: {
    width: '48%',
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stockQuantity: {
    fontSize: 32,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  statPrice: {
    fontSize: 24,
    fontWeight: '700',
  },
  inventoryValue: {
    paddingTop: 20,
    borderTopWidth: 2,
  },
  inventoryLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  inventoryAmount: {
    fontSize: 32,
    fontWeight: '700',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  historyInfo: {
    flex: 1,
  },
  historyType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyDetail: {
    fontSize: 14,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
  },
  historyChange: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  positiveChange: {},
  negativeChange: {},
  emptyHistory: {
    fontSize: 14,
    paddingBottom: 4,
  },
  actionButtons: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  spacer: {
    height: 20,
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
