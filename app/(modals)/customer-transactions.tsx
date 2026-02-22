import { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLocalSearchParams, router } from 'expo-router';
import { useData } from '@/context/DataContext';
import ModalHeader from '@/components/ModalHeader';
import { Ionicons } from '@expo/vector-icons';
import { ROLE_GROUPS } from '@/utils/roleAccess';
import { useRoleGuard } from '@/hooks/useRoleGuard';

interface TransactionItem {
  id: string;
  title: string;
  amount: number;
  date: string;
  status: string;
  type: 'invoice' | 'receipt';
  link: string;
}

export default function CustomerTransactionsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { customers, invoices, receipts, refreshData } = useData();
  const { canAccess } = useRoleGuard(ROLE_GROUPS.business);

  const customer = id ? customers.find((c) => c.id === id) : undefined;
  const customerName = customer?.name;

  useEffect(() => {
    if (!customer) {
      router.back();
      return;
    }

    refreshData();
  }, [customer, refreshData]);

  const transactions = useMemo(() => {
    if (!customerName) return [];

    const customerInvoices = invoices
      .filter((invoice) => invoice.customer === customerName)
      .map<TransactionItem>((invoice) => ({
        id: invoice.id,
        title: `Invoice ${invoice.number}`,
        amount: invoice.amount,
        date: invoice.createdAt,
        status: invoice.status,
        type: 'invoice',
        link: `/(modals)/invoice-detail?id=${invoice.id}`,
      }));

    const customerReceipts = receipts
      .filter((receipt) => receipt.customer === customerName)
      .map<TransactionItem>((receipt) => ({
        id: receipt.id,
        title: `Receipt ${receipt.number}`,
        amount: receipt.amount,
        date: receipt.createdAt,
        status: receipt.status,
        type: 'receipt',
        link: `/(modals)/receipt-detail?id=${receipt.id}`,
      }));

    return [...customerInvoices, ...customerReceipts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [customerName, invoices, receipts]);

  if (!canAccess) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ModalHeader title="Transactions" subtitle={customerName ? `Activity for ${customerName}` : 'Customer records'} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!customerName && (
          <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Customer not found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
              Try returning to the customer list.
            </Text>
          </View>
        )}

        {transactions.length === 0 && customerName && (
          <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No transactions yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
              No invoices or receipts recorded for {customerName}.
            </Text>
          </View>
        )}

        {transactions.map((transaction) => (
          <TouchableOpacity
            key={`${transaction.type}-${transaction.id}`}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push(transaction.link)}
          >
            <View style={styles.cardTop}>
              <Text style={[styles.title, { color: colors.text }]}>{transaction.title}</Text>
              <Text style={[styles.amount, { color: colors.primary500 }]}>
                ${transaction.amount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.cardBottom}>
              <View style={styles.meta}>
                <Ionicons name="calendar-outline" size={16} color={colors.textTertiary} />
                <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                  {new Date(transaction.date).toLocaleString()}
                </Text>
              </View>
              <View style={styles.meta}>
                <Ionicons name={transaction.type === 'invoice' ? 'document-text-outline' : 'receipt-outline'} size={16} color={colors.textTertiary} />
                <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                  {transaction.status}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
