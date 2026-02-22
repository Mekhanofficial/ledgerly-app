import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform, TextInput } from 'react-native';
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
import { normalizeRole } from '@/utils/roleAccess';
import { formatCurrency, resolveCurrencyCode } from '@/utils/currency';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { dashboardStats, invoices, customers, refreshData, loading } = useData();
  const { user } = useUser(); // GET USER FROM CONTEXT
  const role = normalizeRole(user?.role);
  const isClient = role === 'client';
  const currencyCode = resolveCurrencyCode(user || undefined);
  const formatMoney = (value: number, options = {}) => formatCurrency(value, currencyCode, options);
  const formatMoneyNoDecimals = (value: number) =>
    formatMoney(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const handleSearchPress = () => {
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/(more)/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/(more)/search');
    }
  };

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
      amount: formatMoney(invoice.amount || 0),
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
        message: `${c.name} has ${formatMoneyNoDecimals(c.outstanding || 0)} outstanding`,
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

        {/* Search Bar */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            }
          ]}
        >
          <Ionicons name="search-outline" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search invoices, customers, products..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearchPress}
          />
          <TouchableOpacity onPress={handleSearchPress} style={styles.searchAction}>
            <Ionicons name="arrow-forward" size={18} color={colors.primary500} />
          </TouchableOpacity>
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
        {!isClient && (
          <View style={styles.statsSection}>
            <RevenueCard
              title="Total Revenue"
              value={formatMoneyNoDecimals(dashboardStats.totalRevenue || 0)}
              change={`${dashboardStats.totalPaid > 0 ? '+' : ''}${formatMoneyNoDecimals(dashboardStats.totalPaid || 0)} collected`}
              color={colors.success}
              icon="trending-up"
            />
            <RevenueCard
              title="Outstanding Payments"
              value={formatMoneyNoDecimals(dashboardStats.outstandingPayments || 0)}
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
        )}

        {/* Quick Actions */}
        {!isClient && <QuickActions />}

        {/* Recent Activity */}
        <RecentActivity activities={recentActivity} />

        {/* Alerts */}
        {!isClient && <Alerts alerts={alerts} />}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  searchAction: {
    padding: 4,
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
