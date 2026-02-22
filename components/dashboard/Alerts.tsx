// components/Alerts.tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { useUser } from '@/context/UserContext';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { formatCurrency, resolveCurrencyCode } from '@/utils/currency';

interface AlertItem {
  id: string;
  type: string;
  message: string;
  colorType: 'error' | 'warning' | 'success' | 'info';
  icon: string;
  action?: {
    label: string;
    route: string;
  };
  time: string;
}

export default function Alerts() {
  const { colors } = useTheme();
  const { user } = useUser();
  const currencyCode = resolveCurrencyCode(user || undefined);
  const formatMoney = (value: number, options = {}) => formatCurrency(value, currencyCode, options);
  const { 
    invoices, 
    inventory, 
    dashboardStats, // This is the computed property, not a function
    notifications, 
    refreshData 
  } = useData();
  
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateAlerts();
  }, [invoices, inventory, notifications, dashboardStats]); // Add dashboardStats to dependencies

  const generateAlerts = () => {
    setLoading(true);
    const newAlerts: AlertItem[] = [];
    const now = new Date();
    
    // 1. Overdue invoices
    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
    overdueInvoices.forEach(inv => {
      const overdueDays = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      newAlerts.push({
        id: `overdue_${inv.id}`,
        type: 'Invoice Overdue',
        message: `Invoice #${inv.number} for ${inv.customer} is ${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue`,
        colorType: 'error',
        icon: 'alert-circle-outline',
        action: { 
          label: 'View Invoice', 
          route: `/(modals)/invoice-detail?id=${inv.id}` 
        },
        time: formatTimeAgo(new Date(inv.dueDate))
      });
    });

    // 2. Low stock items
    const lowStockItems = inventory.filter(item => 
      item.status === 'low-stock' || item.status === 'out-of-stock'
    );
    lowStockItems.forEach(item => {
      newAlerts.push({
        id: `stock_${item.id}`,
        type: item.status === 'out-of-stock' ? 'Out of Stock' : 'Low Stock',
        message: `${item.name} (${item.quantity} left) - ${item.status === 'out-of-stock' ? 'Restock needed' : 'Running low'}`,
        colorType: item.status === 'out-of-stock' ? 'error' : 'warning',
        icon: item.status === 'out-of-stock' ? 'cube-outline' : 'trending-down-outline',
        action: { 
          label: 'Manage Stock', 
          route: `/(modals)/product-detail?id=${item.id}` 
        },
        time: formatTimeAgo(new Date(item.updatedAt))
      });
    });

    // 3. Recent notifications (unread)
    const recentNotifications = notifications
      .filter(n => !n.read)
      .slice(0, 3); // Show only top 3 unread
      
    recentNotifications.forEach(notif => {
      newAlerts.push({
        id: `notif_${notif.id}`,
        type: notif.title,
        message: notif.message,
        colorType: getAlertColorType(notif.type),
        icon: getIconForType(notif.type),
        action: notif.action,
        time: notif.time
      });
    });

    // 4. Dashboard stats alerts
    if (dashboardStats.overdueInvoices > 0) {
      newAlerts.push({
        id: 'stats_overdue',
        type: 'Multiple Overdue Invoices',
        message: `You have ${dashboardStats.overdueInvoices} overdue invoice${dashboardStats.overdueInvoices > 1 ? 's' : ''}`,
        colorType: 'error',
        icon: 'document-text-outline',
        action: { 
          label: 'View Invoices', 
          route: '/(tabs)/invoices' 
        },
        time: 'Today'
      });
    }

    if (dashboardStats.lowStockItems > 0) {
      newAlerts.push({
        id: 'stats_lowstock',
        type: 'Low Stock Items',
        message: `${dashboardStats.lowStockItems} product${dashboardStats.lowStockItems > 1 ? 's' : ''} need${dashboardStats.lowStockItems === 1 ? 's' : ''} restocking`,
        colorType: 'warning',
        icon: 'warning-outline',
        action: { 
          label: 'View Inventory', 
          route: '/(tabs)/inventory' 
        },
        time: 'Today'
      });
    }

    // 5. Upcoming due dates (invoices due in next 3 days)
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    invoices
      .filter(inv => {
        const dueDate = new Date(inv.dueDate);
        return dueDate > now && 
               dueDate <= threeDaysFromNow && 
               inv.status !== 'paid' && 
               inv.status !== 'cancelled';
      })
      .forEach(invoice => {
        const dueInDays = Math.ceil((new Date(invoice.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        newAlerts.push({
          id: `upcoming_${invoice.id}`,
          type: 'Upcoming Due Date',
          message: `Invoice #${invoice.number} is due in ${dueInDays} day${dueInDays > 1 ? 's' : ''}`,
          colorType: 'warning',
          icon: 'calendar-outline',
          action: { 
            label: 'View Invoice', 
            route: `/(modals)/invoice-detail?id=${invoice.id}` 
          },
          time: 'Upcoming'
        });
      });

    // 6. High outstanding payments
    if (dashboardStats.outstandingPayments > 1000) {
      newAlerts.push({
        id: 'high_outstanding',
        type: 'High Outstanding Balance',
        message: `Total outstanding payments: ${formatMoney(dashboardStats.outstandingPayments || 0)}`,
        colorType: 'warning',
        icon: 'cash-outline',
        action: { 
          label: 'View Payments', 
          route: '/(tabs)/invoices?filter=pending' 
        },
        time: 'Now'
      });
    }

    // Sort by priority: error > warning > success > info
    const priority = { error: 0, warning: 1, success: 2, info: 3 };
    newAlerts.sort((a, b) => priority[a.colorType] - priority[b.colorType]);
    
    // Limit to 8 alerts maximum
    setAlerts(newAlerts.slice(0, 8));
    setLoading(false);
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getAlertColorType = (notificationType: string): AlertItem['colorType'] => {
    switch (notificationType) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'success': return 'success';
      case 'payment': return 'success';
      case 'invoice': return 'info';
      case 'info':
      default: return 'info';
    }
  };

  const getIconForType = (type: string): string => {
    switch (type) {
      case 'payment': return 'cash-outline';
      case 'invoice': return 'document-text-outline';
      case 'success': return 'checkmark-circle-outline';
      case 'warning': return 'warning-outline';
      case 'error': return 'alert-circle-outline';
      case 'info':
      default: return 'information-circle-outline';
    }
  };

  const getColor = (colorType: AlertItem['colorType']) => {
    switch (colorType) {
      case 'error': return colors.error;
      case 'warning': return colors.warning;
      case 'success': return colors.success;
      default: return colors.primary500;
    }
  };

  const handleRefresh = async () => {
    await refreshData();
    generateAlerts();
  };

  const handleAlertPress = (alert: AlertItem) => {
    if (alert.action) {
      router.push(alert.action.route as any);
    }
  };

  if (alerts.length === 0 && !loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Alerts</Text>
          <TouchableOpacity onPress={handleRefresh} disabled={loading}>
            <Ionicons 
              name="refresh" 
              size={20} 
              color={loading ? colors.textTertiary : colors.primary500} 
            />
          </TouchableOpacity>
        </View>
        <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No alerts at the moment</Text>
          <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
            Everything is running smoothly
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Alerts</Text>
        <TouchableOpacity onPress={handleRefresh} disabled={loading}>
          <Ionicons 
            name="refresh" 
            size={20} 
            color={loading ? colors.textTertiary : colors.primary500} 
          />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {alerts.map((alert) => (
          <TouchableOpacity
            key={alert.id}
            onPress={() => handleAlertPress(alert)}
            style={[
              styles.alertCard, 
              { 
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderLeftColor: getColor(alert.colorType),
                shadowColor: colors.shadow,
              }
            ]}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${getColor(alert.colorType)}15` }]}>
              <Ionicons name={alert.icon as any} size={20} color={getColor(alert.colorType)} />
            </View>
            <View style={styles.alertContent}>
              <View style={styles.alertHeader}>
                <Text style={[styles.alertType, { color: colors.text }]}>{alert.type}</Text>
                <Text style={[styles.alertTime, { color: colors.textTertiary }]}>{alert.time}</Text>
              </View>
              <Text style={[styles.alertMessage, { color: colors.textSecondary }]} numberOfLines={2}>
                {alert.message}
              </Text>
              {alert.action && (
                <View style={styles.actionContainer}>
                  <Text style={[styles.actionText, { color: colors.primary500 }]}>
                    {alert.action.label}
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.primary500} />
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  alertCard: {
    width: 280,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  alertType: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  alertTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  alertMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
