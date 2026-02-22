import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { apiGet, apiPut } from '@/services/apiClient';
import { formatCurrency, resolveCurrencyCode } from '@/utils/currency';
import { hasRole, ROLE_GROUPS } from '@/utils/roleAccess';
import { useRoleGuard } from '@/hooks/useRoleGuard';

type RecurringStatusFilter = 'all' | 'active' | 'paused' | 'completed';

interface RecurringInvoiceCard {
  id: string;
  number: string;
  customerName: string;
  amount: number;
  nextInvoiceDate?: string;
  frequency: string;
  interval: number;
  status: 'active' | 'paused' | 'completed';
}

const STATUS_FILTERS: RecurringStatusFilter[] = ['all', 'active', 'paused', 'completed'];

const toDateLabel = (value?: string) => {
  if (!value) return 'Not scheduled';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not scheduled';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const toTitleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const mapRecurringInvoice = (record: any): RecurringInvoiceCard => ({
  id: record?._id || record?.id,
  number: record?.invoiceNumber || record?.number || 'Invoice',
  customerName: record?.customer?.name || record?.customerName || 'Unknown customer',
  amount: Number(record?.total ?? record?.amount ?? 0),
  nextInvoiceDate: record?.recurring?.nextInvoiceDate,
  frequency: record?.recurring?.frequency || 'monthly',
  interval: Number(record?.recurring?.interval || 1),
  status: record?.recurring?.status || 'active',
});

export default function RecurringInvoicesScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const { role, canAccess } = useRoleGuard(ROLE_GROUPS.app);
  const canManageRecurring = hasRole(role, ROLE_GROUPS.business);
  const currencyCode = resolveCurrencyCode(user || undefined);
  const formatMoney = (value: number, options = {}) => formatCurrency(value, currencyCode, options);
  const formatMoneyNoDecimals = (value: number) =>
    formatMoney(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoiceCard[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<RecurringStatusFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const headerHeight = Platform.OS === 'ios' ? 88 : 64;
  const contentPaddingTop = Platform.OS === 'ios' ? headerHeight + 20 : headerHeight + 10;

  const statusCount = useMemo(() => {
    const active = recurringInvoices.filter((item) => item.status === 'active').length;
    const paused = recurringInvoices.filter((item) => item.status === 'paused').length;
    const completed = recurringInvoices.filter((item) => item.status === 'completed').length;
    return { active, paused, completed, total: recurringInvoices.length };
  }, [recurringInvoices]);

  const getStatusColor = (status: RecurringInvoiceCard['status']) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'paused':
        return colors.warning;
      case 'completed':
        return colors.primary500;
      default:
        return colors.textTertiary;
    }
  };

  const fetchRecurringInvoices = useCallback(
    async (isPullToRefresh = false) => {
      if (isPullToRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response: any = await apiGet('/api/v1/invoices/recurring', {
          status: selectedFilter === 'all' ? undefined : selectedFilter,
          search: searchTerm || undefined,
          limit: 100,
        });
        const records = Array.isArray(response?.data) ? response.data : [];
        setRecurringInvoices(records.map(mapRecurringInvoice));
      } catch (error: any) {
        const message = error?.message || 'Failed to load recurring invoices';
        if (!isPullToRefresh) {
          Alert.alert('Recurring Invoices', message);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchTerm, selectedFilter]
  );

  useEffect(() => {
    if (!canAccess) return;
    fetchRecurringInvoices();
  }, [canAccess, fetchRecurringInvoices]);

  const onRefresh = useCallback(async () => {
    await fetchRecurringInvoices(true);
  }, [fetchRecurringInvoices]);

  const handlePauseOrResume = async (invoice: RecurringInvoiceCard) => {
    if (!canManageRecurring) return;

    const action = invoice.status === 'paused' ? 'resume' : 'pause';
    const actionLabel = action === 'resume' ? 'Resume' : 'Pause';

    try {
      await apiPut(`/api/v1/invoices/recurring/${invoice.id}/${action}`);
      await fetchRecurringInvoices();
    } catch (error: any) {
      Alert.alert('Recurring Invoices', error?.message || `Unable to ${actionLabel.toLowerCase()} invoice`);
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
          paddingTop: contentPaddingTop,
          paddingBottom: 20,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={onRefresh}
            tintColor={colors.primary500}
            progressViewOffset={headerHeight}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>Recurring</Text>
            <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
              Manage repeating invoices
            </Text>
          </View>
          {canManageRecurring && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary500 }]}
              onPress={() => router.push('/(modals)/create-invoice')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Total</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{statusCount.total}</Text>
          </View>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Active</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>{statusCount.active}</Text>
          </View>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Paused</Text>
            <Text style={[styles.statValue, { color: colors.warning }]}>{statusCount.paused}</Text>
          </View>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={() => setSearchTerm(searchInput.trim())}
            placeholder="Search by invoice number or customer"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: colors.primary500 }]}
            onPress={() => setSearchTerm(searchInput.trim())}
          >
            <Text style={styles.searchButtonText}>Go</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {STATUS_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  selectedFilter === filter && {
                    backgroundColor: colors.primary500,
                    borderColor: colors.primary500,
                  },
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: selectedFilter === filter ? 'white' : colors.text },
                  ]}
                >
                  {toTitleCase(filter)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.listContainer}>
          {recurringInvoices.length > 0 ? (
            recurringInvoices.map((invoice) => {
              const statusColor = getStatusColor(invoice.status);
              return (
                <TouchableOpacity
                  key={invoice.id}
                  style={[
                    styles.invoiceCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      shadowColor: colors.shadow,
                    },
                  ]}
                  onPress={() => router.push(`/(modals)/invoice-detail?id=${invoice.id}`)}
                  activeOpacity={0.8}
                >
                  <View style={styles.invoiceHeader}>
                    <View style={styles.invoiceMain}>
                      <Text style={[styles.invoiceNumber, { color: colors.text }]}>{invoice.number}</Text>
                      <Text style={[styles.customerName, { color: colors.textTertiary }]}>
                        {invoice.customerName}
                      </Text>
                    </View>
                    <Text style={[styles.amountText, { color: colors.text }]}>
                      {formatMoneyNoDecimals(invoice.amount)}
                    </Text>
                  </View>

                  <View style={styles.invoiceMetaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="repeat-outline" size={14} color={colors.textTertiary} />
                      <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                        {toTitleCase(invoice.frequency)} x {invoice.interval}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
                      <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                        Next {toDateLabel(invoice.nextInvoiceDate)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.invoiceFooter}>
                    <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {toTitleCase(invoice.status)}
                      </Text>
                    </View>
                    {canManageRecurring && (
                      <TouchableOpacity
                        style={[styles.actionButton, { borderColor: colors.border }]}
                        onPress={(event) => {
                          event.stopPropagation();
                          handlePauseOrResume(invoice);
                        }}
                      >
                        <Text style={[styles.actionButtonText, { color: colors.primary500 }]}>
                          {invoice.status === 'paused' ? 'Resume' : 'Pause'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="repeat-outline" size={44} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No recurring invoices</Text>
              <Text style={[styles.emptyMessage, { color: colors.textTertiary }]}>
                Create an invoice and enable recurring to see it here.
              </Text>
              {canManageRecurring && (
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: colors.primary500 }]}
                  onPress={() => router.push('/(modals)/create-invoice')}
                >
                  <Text style={styles.emptyButtonText}>Create Invoice</Text>
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 20,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginBottom: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
  },
  searchButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  invoiceCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invoiceMain: {
    flex: 1,
    paddingRight: 8,
  },
  invoiceNumber: {
    fontSize: 15,
    fontWeight: '700',
  },
  customerName: {
    fontSize: 13,
    marginTop: 3,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
  },
  invoiceMetaRow: {
    marginTop: 10,
    gap: 7,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  invoiceFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 36,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyMessage: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 16,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
});
