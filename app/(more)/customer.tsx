import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { useData } from '@/context/DataContext';
import { ROLE_GROUPS } from '@/utils/roleAccess';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useUser } from '@/context/UserContext';
import { formatCurrency, resolveCurrencyCode } from '@/utils/currency';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  company: string;
  outstanding: number;
  totalSpent: number;
  lastTransaction: string;
  status: 'active' | 'inactive';
  notes?: string;
}

export default function CustomersScreen() {
  const { colors } = useTheme();
  const { customers, deleteCustomer } = useData();
  const { user } = useUser();
  const { canAccess } = useRoleGuard(ROLE_GROUPS.business);
  const currencyCode = resolveCurrencyCode(user || undefined);
  const formatMoney = (value: number, options = {}) => formatCurrency(value, currencyCode, options);
  const formatMoneyNoDecimals = (value: number) =>
    formatMoney(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const totalCustomers = customers.length;
  const totalOutstanding = customers.reduce((sum, customer) => sum + customer.outstanding, 0);
  const activeCustomers = customers.filter(c => c.status === 'active').length;

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || customer.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleDeleteCustomer = (customerId: string, customerName: string) => {
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete ${customerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteCustomer(customerId)
        }
      ]
    );
  };

  if (!canAccess) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Customers</Text>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary500 }]}
            onPress={() => router.push('/(modals)/add-customer')}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textTertiary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search customers..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statTitle, { color: colors.textTertiary }]}>Total Customers</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{totalCustomers}</Text>
            <Text style={[styles.statSubtitle, { color: colors.textTertiary }]}>{activeCustomers} active</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statTitle, { color: colors.textTertiary }]}>Outstanding</Text>
            <Text style={[
              styles.statValue, 
              { color: totalOutstanding > 0 ? colors.error : colors.text }
            ]}>
              {formatMoneyNoDecimals(totalOutstanding)}
            </Text>
            <Text style={[styles.statSubtitle, { color: colors.textTertiary }]}>Amount receivable</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {['All', 'Active', 'Inactive'].map((filterOption) => (
              <TouchableOpacity
                key={filterOption}
                style={[
                  styles.filterButton,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border
                  },
                  filter === filterOption.toLowerCase() && [
                    styles.filterButtonActive,
                    { 
                      backgroundColor: colors.primary500,
                      borderColor: colors.primary500
                    }
                  ]
                ]}
                onPress={() => setFilter(filterOption.toLowerCase() as any)}
              >
                <Text style={[
                  styles.filterText,
                  { color: colors.text },
                  filter === filterOption.toLowerCase() && styles.filterTextActive
                ]}>
                  {filterOption}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Customers List */}
        <View style={styles.customersList}>
          {filteredCustomers.map((customer) => (
            <TouchableOpacity 
              key={customer.id} 
              style={[
                styles.customerCard,
                { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }
              ]}
              onPress={() => router.push(`/(modals)/customer-detail?id=${customer.id}`)}
            >
              <View style={styles.customerHeader}>
                <View style={styles.customerInfo}>
                  <View style={styles.nameContainer}>
                    <Text style={[styles.customerName, { color: colors.text }]}>{customer.name}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: customer.status === 'active' ? `${colors.success}15` : `${colors.textTertiary}15` }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: customer.status === 'active' ? colors.success : colors.textTertiary }
                      ]}>
                        {customer.status === 'active' ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                  {customer.company && (
                    <Text style={[styles.customerCompany, { color: colors.text }]}>{customer.company}</Text>
                  )}
                  <Text style={[styles.customerContact, { color: colors.textTertiary }]}>{customer.email}</Text>
                  <Text style={[styles.customerContact, { color: colors.textTertiary }]}>{customer.phone}</Text>
                </View>
                <View style={styles.customerStats}>
                  <View style={styles.outstandingContainer}>
                    <Text style={[styles.outstandingLabel, { color: colors.textTertiary }]}>Outstanding</Text>
                    <Text style={[
                      styles.outstandingAmount,
                      { color: customer.outstanding > 0 ? colors.error : colors.success }
                    ]}>
                      {formatMoneyNoDecimals(customer.outstanding || 0)}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={[styles.customerFooter, { borderTopColor: colors.border }]}>
                <View style={styles.footerInfo}>
                  <Text style={[styles.totalSpent, { color: colors.text }]}>Total Spent: {formatMoneyNoDecimals(customer.totalSpent || 0)}</Text>
                  <Text style={[styles.lastTransaction, { color: colors.textTertiary }]}>Last: {customer.lastTransaction}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteCustomer(customer.id, customer.name);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterButtonActive: {},
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: 'white',
  },
  customersList: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  customerCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  customerInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
  },
  customerCompany: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  customerContact: {
    fontSize: 14,
    marginBottom: 2,
  },
  customerStats: {
    alignItems: 'flex-end',
  },
  outstandingContainer: {
    alignItems: 'flex-end',
  },
  outstandingLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  outstandingAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  customerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  footerInfo: {
    flex: 1,
  },
  totalSpent: {
    fontSize: 14,
    marginBottom: 4,
  },
  lastTransaction: {
    fontSize: 12,
  },
  actionButton: {
    padding: 8,
  },
});
