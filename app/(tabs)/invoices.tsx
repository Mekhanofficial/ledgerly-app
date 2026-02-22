import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext'; // FIXED IMPORT PATH
import { router } from 'expo-router';
import { useData } from '../../context/DataContext'; // FIXED IMPORT PATH
import { hasRole, ROLE_GROUPS } from '@/utils/roleAccess';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useUser } from '@/context/UserContext';
import { formatCurrency, resolveCurrencyCode } from '@/utils/currency';

type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'draft';
type StatusFilter = 'all' | InvoiceStatus;

export default function InvoicesScreen() {
  const { colors } = useTheme();
  const { invoices, dashboardStats, deleteInvoice, refreshData, loading } = useData();
  const { user } = useUser();
  const { role, canAccess } = useRoleGuard(ROLE_GROUPS.app);
  const canManageInvoices = hasRole(role, ROLE_GROUPS.business);
  const currencyCode = resolveCurrencyCode(user || undefined);
  const formatMoney = (value: number, options = {}) => formatCurrency(value, currencyCode, options);
  const formatMoneyNoDecimals = (value: number) =>
    formatMoney(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Header height based on platform (CustomHeader + status bar)
  const headerHeight = Platform.OS === 'ios' ? 88 : 64;
  const contentPaddingTop = Platform.OS === 'ios' ? headerHeight + 20 : headerHeight + 10;

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid': return colors.success;
      case 'pending': return colors.warning;
      case 'overdue': return colors.error;
      case 'draft': return colors.primary500;
      default: return colors.textLight;
    }
  };

  const filteredInvoices = selectedFilter === 'all' 
    ? invoices 
    : invoices.filter(invoice => invoice.status === selectedFilter);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const handleDeleteInvoice = async (id: string) => {
    try {
      await deleteInvoice(id);
    } catch (error) {
      console.error('Failed to delete invoice:', error);
    }
  };

  if (!canAccess) {
    return null;
  }

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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Invoices</Text>
            <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
              Manage and track your invoices
            </Text>
          </View>
          {canManageInvoices && (
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: colors.primary500 }]}
              onPress={() => router.push('/(modals)/create-invoice')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { 
            backgroundColor: colors.surface, 
            borderColor: colors.border,
            shadowColor: colors.shadow,
          }]}>
            <View style={styles.statIconContainer}>
              <Ionicons name="document-text-outline" size={24} color={colors.primary500} />
            </View>
            <Text style={[styles.statTitle, { color: colors.textTertiary }]}>Total Invoices</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{dashboardStats.totalInvoices}</Text>
            <Text style={[styles.statSubtitle, { color: colors.textTertiary }]}>
              {formatMoneyNoDecimals(dashboardStats.outstandingPayments || 0)} outstanding
            </Text>
          </View>
          <View style={[styles.statCard, { 
            backgroundColor: colors.surface, 
            borderColor: colors.border,
            shadowColor: colors.shadow,
          }]}>
            <View style={styles.statIconContainer}>
              <Ionicons name="cash-outline" size={24} color={colors.success} />
            </View>
            <Text style={[styles.statTitle, { color: colors.textTertiary }]}>Total Paid</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatMoneyNoDecimals(dashboardStats.totalPaid || 0)}
            </Text>
            <Text style={[styles.statSubtitle, { color: colors.textTertiary }]}>Revenue collected</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {(['all', 'paid', 'pending', 'overdue', 'draft'] as StatusFilter[]).map((filter) => {
              const count = filter === 'all' 
                ? invoices.length 
                : invoices.filter(inv => inv.status === filter).length;
              
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterButton,
                    { 
                      backgroundColor: colors.surface,
                      borderColor: colors.border
                    },
                    selectedFilter === filter && [
                      styles.filterButtonActive,
                      { 
                        backgroundColor: colors.primary500,
                        borderColor: colors.primary500
                      }
                    ]
                  ]}
                  onPress={() => setSelectedFilter(filter)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.filterText,
                    { color: colors.text },
                    selectedFilter === filter && styles.filterTextActive
                  ]}>
                    {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    {count > 0 && (
                      <Text style={[
                        styles.filterCount,
                        { color: selectedFilter === filter ? 'white' : colors.textTertiary }
                      ]}>
                        {' '}({count})
                      </Text>
                    )}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Invoice Count */}
        <View style={styles.invoiceCountContainer}>
          <Text style={[styles.invoiceCount, { color: colors.textTertiary }]}>
            {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
          </Text>
          {filteredInvoices.length === 0 && canManageInvoices && (
            <TouchableOpacity onPress={() => router.push('/(modals)/create-invoice')}>
              <Text style={[styles.createInvoiceLink, { color: colors.primary500 }]}>
                Create your first invoice
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Invoice List */}
        <View style={styles.invoicesList}>
          {filteredInvoices.length > 0 ? (
            filteredInvoices.map((invoice) => (
              <TouchableOpacity 
                key={invoice.id} 
                style={[
                  styles.invoiceCard,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    shadowColor: colors.shadow,
                  }
                ]}
                onPress={() => router.push(`/(modals)/invoice-detail?id=${invoice.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.invoiceHeader}>
                  <View style={styles.invoiceInfo}>
                    <Text style={[styles.invoiceNumber, { color: colors.text }]}>{invoice.number}</Text>
                    <Text style={[styles.invoiceCustomer, { color: colors.textTertiary }]}>
                      {invoice.customer}
                    </Text>
                  </View>
                  <Text style={[styles.invoiceAmount, { color: colors.text }]}>
                    {formatMoneyNoDecimals(invoice.amount || 0)}
                  </Text>
                </View>
                
                <View style={styles.invoiceDetails}>
                  <View style={styles.invoiceDate}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
                    <Text style={[styles.dateText, { color: colors.textTertiary }]}>
                      Due {new Date(invoice.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.invoiceActions}>
                    <View style={[
                      styles.statusBadge, 
                      { backgroundColor: `${getStatusColor(invoice.status)}20` }
                    ]}>
                      <Ionicons 
                        name={invoice.status === 'paid' ? 'checkmark-circle' : 
                               invoice.status === 'overdue' ? 'alert-circle' : 
                               invoice.status === 'pending' ? 'time' : 'create'}
                        size={12} 
                        color={getStatusColor(invoice.status)} 
                        style={styles.statusIcon}
                      />
                      <Text style={[styles.statusText, { color: getStatusColor(invoice.status) }]}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Text>
                    </View>
                    {canManageInvoices && (
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteInvoice(invoice.id);
                        }}
                        style={styles.deleteButton}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Ionicons name="document-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No invoices found</Text>
              <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
                {selectedFilter !== 'all' 
                  ? `No ${selectedFilter} invoices` 
                  : 'Create your first invoice to get started'}
              </Text>
              {canManageInvoices && (
                <TouchableOpacity 
                  style={[styles.createButton, { backgroundColor: colors.primary500 }]}
                  onPress={() => router.push('/(modals)/create-invoice')}
                >
                  <Ionicons name="add" size={20} color="white" />
                  <Text style={styles.createButtonText}>Create Invoice</Text>
                </TouchableOpacity>
              )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.8,
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginRight: 10,
    borderWidth: 1,
  },
  filterButtonActive: {},
  filterText: {
    fontSize: 15,
    fontWeight: '600',
  },
  filterTextActive: {
    color: 'white',
  },
  filterCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  invoiceCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  invoiceCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  createInvoiceLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  invoicesList: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  invoiceCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  invoiceInfo: {
    flex: 1,
    marginRight: 12,
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  invoiceCustomer: {
    fontSize: 15,
    opacity: 0.8,
  },
  invoiceAmount: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  invoiceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  invoiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  emptyState: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
