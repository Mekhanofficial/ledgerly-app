import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RevenueCard from '@/components/dashboard/RevenueCard';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivity from '@/components/dashboard/RecentActivity';
import Alerts from '@/components/dashboard/Alerts';
import { useTheme } from '../../context/ThemeContext' ; // FIXED IMPORT PATH
import { useData } from '../../context/DataContext'; // FIXED IMPORT PATH
import { useUser } from '../../context/UserContext'; // FIXED IMPORT PATH
import { useState, useCallback } from 'react';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { dashboardStats, invoices, customers, refreshData, loading } = useData();
  const { user } = useUser(); // GET USER FROM CONTEXT
  const [refreshing, setRefreshing] = useState(false);
  
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Use actual user from context or show loading/placeholder
  const userName = user 
    ? `${user.firstName} ${user.lastName}`
    : 'User'; // Fallback if user is null

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  // Get recent activity from invoices
  const recentActivity = invoices
    .slice(0, 5)
    .map(invoice => ({
      id: invoice.id,
      customer: invoice.customer,
      invoice: invoice.number,
      time: new Date(invoice.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }) + ' at ' + new Date(invoice.createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      amount: `${invoice.amount.toLocaleString()}`,
      status: invoice.status,
    }));

  // Get alerts
  const alerts = [
    ...invoices
      .filter(inv => inv.status === 'overdue')
      .map(inv => ({
        id: inv.id,
        type: 'Payment Overdue',
        message: `${inv.customer} invoice is overdue`,
        colorType: 'error' as const,
        icon: 'alert-circle' as const,
      })),
    ...customers
      .filter(c => c.outstanding > 5000)
      .map(c => ({
        id: c.id,
        type: 'High Outstanding',
        message: `${c.name} has ${c.outstanding.toLocaleString()} outstanding`,
        colorType: 'warning' as const,
        icon: 'warning' as const,
      })),
  ];

  // Header height based on platform (CustomHeader + status bar)
  const headerHeight = Platform.OS === 'ios' ? 88 : 64;
  const contentPaddingTop = Platform.OS === 'ios' ? headerHeight + 20 : headerHeight + 10;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={{ 
          paddingTop: contentPaddingTop, // Add padding for CustomHeader
          paddingBottom: 20,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={onRefresh}
            tintColor={colors.primary500}
            progressViewOffset={headerHeight} // Offset refresh indicator
          />
        }
      >
        {/* Header - Only Welcome back with username */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textTertiary }]}>Welcome back,</Text>
            <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
          </View>
        </View>

        {/* Date and Download */}
        <View style={[
          styles.dateSection, 
          { 
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          }
        ]}>
          <Text style={[styles.date, { color: colors.text }]}>{formattedDate}</Text>
          <TouchableOpacity 
            style={[
              styles.downloadButton, 
              { 
                backgroundColor: colors.primary50,
                borderColor: colors.primary100,
              }
            ]}
            onPress={refreshData}
            disabled={loading}
          >
            <Ionicons 
              name={loading ? "sync" : "refresh-outline"} 
              size={20} 
              color={loading ? colors.primary400 : colors.primary500} 
            />
            <Text style={[styles.downloadText, { 
              color: loading ? colors.primary400 : colors.primary600 
            }]}>
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dashboard Stats */}
        <View style={styles.statsSection}>
          <RevenueCard
            title="Total Revenue"
            value={`$${dashboardStats.totalRevenue.toLocaleString()}`}
            change={`${dashboardStats.totalPaid > 0 ? '+' : ''}$${dashboardStats.totalPaid.toLocaleString()} collected`}
            color={colors.success}
            icon="trending-up"
          />
          <RevenueCard
            title="Outstanding Payments"
            value={`$${dashboardStats.outstandingPayments.toLocaleString()}`}
            change={`${dashboardStats.overdueInvoices} overdue invoices`}
            color={colors.warning}
            icon="alert-circle"
          />
          <RevenueCard
            title="Low Stock Alert"
            value={`${dashboardStats.lowStockItems} items`}
            change="Need restocking"
            color={colors.error}
            icon="warning"
          />
        </View>

        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Activity */}
        <RecentActivity activities={recentActivity} />

        {/* Alerts */}
        <Alerts alerts={alerts} />
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
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  userName: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  businessName: {
    fontSize: 15,
    marginTop: 6,
    fontWeight: '500',
    opacity: 0.8,
  },
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    letterSpacing: 0.3,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
  },
  downloadText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 16,
  },
});