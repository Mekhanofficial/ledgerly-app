// components/RecentActivity.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface ActivityItem {
  id: string;
  customer: string;
  invoice: string;
  amount: string;
  status: 'paid' | 'pending' | 'overdue' | 'draft' | 'completed' | 'refunded';
  time: string;
  type: 'invoice' | 'receipt' | 'payment' | 'customer' | 'product';
  dataId?: string; // Reference to actual data ID
}

export default function RecentActivity() {
  const { colors } = useTheme();
  const { 
    invoices, 
    receipts, 
    customers,
    inventory,
    refreshData,
    loading 
  } = useData();
  
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    generateActivities();
  }, [invoices, receipts, customers, inventory]);

  const generateActivities = () => {
    const newActivities: ActivityItem[] = [];

    // 1. Recent invoices (last 7 days)
    const recentInvoices = invoices
      .filter(inv => {
        const invoiceDate = new Date(inv.createdAt);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return invoiceDate > sevenDaysAgo;
      })
      .slice(0, 5);
    
    recentInvoices.forEach(invoice => {
      newActivities.push({
        id: `inv_${invoice.id}`,
        customer: invoice.customer,
        invoice: invoice.number,
        amount: `$${invoice.amount.toFixed(2)}`,
        status: invoice.status as any,
        time: formatTimeAgo(invoice.createdAt),
        type: 'invoice',
        dataId: invoice.id
      });
    });

    // 2. Recent receipts (last 7 days)
    const recentReceipts = receipts
      .filter(receipt => {
        const receiptDate = new Date(receipt.createdAt);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return receiptDate > sevenDaysAgo;
      })
      .slice(0, 5);
    
    recentReceipts.forEach(receipt => {
      newActivities.push({
        id: `rcpt_${receipt.id}`,
        customer: receipt.customer,
        invoice: receipt.number,
        amount: `$${receipt.amount.toFixed(2)}`,
        status: receipt.status === 'completed' ? 'completed' : 
                receipt.status === 'refunded' ? 'refunded' : 'pending',
        time: formatTimeAgo(receipt.createdAt),
        type: 'receipt',
        dataId: receipt.id
      });
    });

    // 3. Recent customer additions/updates
    const recentCustomers = customers
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 3);
    
    recentCustomers.forEach(customer => {
      newActivities.push({
        id: `cust_${customer.id}`,
        customer: customer.name,
        invoice: 'Customer',
        amount: `$${customer.totalSpent.toFixed(2)} spent`,
        status: customer.status === 'active' ? 'paid' : 'pending',
        time: formatTimeAgo(customer.updatedAt || customer.createdAt),
        type: 'customer',
        dataId: customer.id
      });
    });

    // 4. Recent inventory updates (low stock or new products)
    const recentInventory = inventory
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3);
    
    recentInventory.forEach(product => {
      if (product.status === 'low-stock' || product.status === 'out-of-stock') {
        newActivities.push({
          id: `prod_${product.id}`,
          customer: 'Inventory Alert',
          invoice: product.name,
          amount: `${product.quantity} in stock`,
          status: product.status === 'out-of-stock' ? 'overdue' : 'pending',
          time: formatTimeAgo(product.updatedAt),
          type: 'product',
          dataId: product.id
        });
      }
    });

    // 5. Recent payments
    invoices
      .filter(inv => inv.status === 'paid' && inv.paidAmount > 0)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 2)
      .forEach(invoice => {
        newActivities.push({
          id: `pay_${invoice.id}`,
          customer: invoice.customer,
          invoice: `Payment - ${invoice.number}`,
          amount: `$${invoice.paidAmount.toFixed(2)}`,
          status: 'paid',
          time: formatTimeAgo(invoice.updatedAt || invoice.createdAt),
          type: 'payment',
          dataId: invoice.id
        });
      });

    // Sort all activities by time (most recent first)
    newActivities.sort((a, b) => {
      // For demo, use time string sorting. In real app, use actual timestamps
      return getTimeValue(b.time) - getTimeValue(a.time);
    });

    setActivities(newActivities.slice(0, 10)); // Limit to 10 most recent activities
  };

  // Helper to convert time strings to sortable values
  const getTimeValue = (timeStr: string): number => {
    if (timeStr.includes('Just now')) return 999999;
    if (timeStr.includes('minute')) return parseInt(timeStr) * 60;
    if (timeStr.includes('hour')) return parseInt(timeStr) * 3600;
    if (timeStr.includes('day')) return parseInt(timeStr) * 86400;
    if (timeStr.includes('week')) return parseInt(timeStr) * 604800;
    return 0;
  };

  const formatTimeAgo = (dateString: string): string => {
    if (!dateString) return 'Unknown';
    
    const now = new Date();
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSecs < 0) return 'Future';
    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: ActivityItem['status']) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return colors.success;
      case 'pending':
      case 'draft':
        return colors.warning;
      case 'overdue':
      case 'refunded':
        return colors.error;
      default:
        return colors.textTertiary;
    }
  };

  const getTypeIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'invoice': return 'document-text-outline';
      case 'receipt': return 'receipt-outline';
      case 'payment': return 'cash-outline';
      case 'customer': return 'person-outline';
      case 'product': return 'cube-outline';
      default: return 'time-outline';
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    generateActivities();
    setRefreshing(false);
  };

  const handleViewAll = () => {
    router.push('/(tabs)/invoices');
  };

  const handleActivityPress = (activity: ActivityItem) => {
    if (!activity.dataId) return;

    switch (activity.type) {
      case 'invoice':
        router.push(`/(modals)/invoice-detail?id=${activity.dataId}`);
        break;
      case 'receipt':
        router.push(`/(modals)/receipt-detail?id=${activity.dataId}`);
        break;
      case 'customer':
        router.push(`/(modals)/customer-detail?id=${activity.dataId}`);
        break;
      case 'product':
        router.push(`/(modals)/product-detail?id=${activity.dataId}`);
        break;
      case 'payment':
        router.push(`/(modals)/invoice-detail?id=${activity.dataId}`);
        break;
    }
  };

  const getStatusText = (status: ActivityItem['status']) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'pending': return 'Pending';
      case 'overdue': return 'Overdue';
      case 'draft': return 'Draft';
      case 'completed': return 'Completed';
      case 'refunded': return 'Refunded';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Recent Activity</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={handleRefresh} 
            disabled={refreshing || loading}
            style={styles.refreshButton}
          >
            <Ionicons 
              name="refresh" 
              size={18} 
              color={refreshing || loading ? colors.textTertiary : colors.primary500} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleViewAll}>
            <Text style={[styles.viewAll, { color: colors.primary500 }]}>View All →</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {activities.length === 0 ? (
        <View style={[styles.emptyState, { 
          backgroundColor: colors.surface + '80', 
          borderColor: colors.border 
        }]}>
          <Ionicons name="time-outline" size={40} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No recent activity
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
            Transactions will appear here
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.activityList}
          showsVerticalScrollIndicator={false}
          scrollEnabled={activities.length > 3}
        >
          {activities.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              onPress={() => handleActivityPress(item)}
              style={[
                styles.activityCard, 
                { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor: colors.shadow,
                }
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.activityContent}>
                <View style={styles.customerInfo}>
                  <View style={[styles.iconContainer, { 
                    backgroundColor: getStatusColor(item.status) + '15' 
                  }]}>
                    <Ionicons 
                      name={getTypeIcon(item.type) as any} 
                      size={16} 
                      color={getStatusColor(item.status)} 
                    />
                  </View>
                  <View style={styles.customerDetails}>
                    <Text style={[styles.customerName, { color: colors.text }]} numberOfLines={1}>
                      {item.customer}
                    </Text>
                    <Text style={[styles.invoiceInfo, { color: colors.textTertiary }]} numberOfLines={1}>
                      {item.invoice} • {item.time}
                    </Text>
                  </View>
                </View>
                <View style={styles.amountContainer}>
                  <Text style={[styles.amount, { color: colors.text }]} numberOfLines={1}>
                    {item.amount}
                  </Text>
                  <View style={[styles.statusBadge, { 
                    backgroundColor: `${getStatusColor(item.status)}15` 
                  }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                      {getStatusText(item.status)}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      
      {activities.length > 0 && (
        <Text style={[styles.countText, { color: colors.textTertiary }]}>
          Showing {Math.min(activities.length, 10)} of {activities.length} activities
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  refreshButton: {
    padding: 4,
    borderRadius: 8,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  activityList: {
    maxHeight: 400,
  },
  activityCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  activityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerDetails: {
    flex: 1,
    minWidth: 0, // Important for text truncation
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  invoiceInfo: {
    fontSize: 12,
  },
  amountContainer: {
    alignItems: 'flex-end',
    marginLeft: 12,
    maxWidth: 120,
  },
  amount: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
});