import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import ModalHeader from '@/components/ModalHeader';
import { useData } from '@/context/DataContext';
import { useUser } from '@/context/UserContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  TIME_RANGE_OPTIONS,
  TimeRange,
  formatTimeRangeLabel,
  getInvoiceSummary,
  getReceiptSummary,
  createReportHTML,
} from '@/utils/reportUtils';

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const { invoices, receipts, customers, refreshData, loading } = useData();
  const { user } = useUser();
  const [selectedRange, setSelectedRange] = useState<TimeRange>('week');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const invoiceStats = useMemo(() => getInvoiceSummary(invoices), [invoices]);
  const receiptStats = useMemo(() => getReceiptSummary(receipts), [receipts]);
  const totalRevenue = invoiceStats.total + receiptStats.total;
  const outstandingBalance = useMemo(
    () => invoices.reduce((sum, invoice) => sum + Math.max(invoice.amount - invoice.paidAmount, 0), 0),
    [invoices]
  );
  const completedTransactions = useMemo(
    () =>
      receipts.filter((receipt) => receipt.status === 'completed').length +
      invoices.filter((invoice) => invoice.status === 'paid').length,
    [receipts, invoices]
  );
  const timeRangeLabel = formatTimeRangeLabel(selectedRange);

  const companyName = (
    user?.businessName?.trim() ||
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
    'Ledgerly Inc.'
  );
  const companyContacts = [user?.phoneNumber, user?.email, user?.country].filter(Boolean);
  const companyContactMarkup = companyContacts.length
    ? companyContacts.join('<br>')
    : 'support@ledgerly.com';

  const paymentMethods = useMemo(() => {
    const methodTotals: Record<string, { amount: number; count: number }> = {};
    let totalAmount = 0;

    receipts.forEach((receipt) => {
      if (receipt.status === 'completed') {
        const method = receipt.paymentMethod;
        if (!methodTotals[method]) {
          methodTotals[method] = { amount: 0, count: 0 };
        }
        methodTotals[method].amount += receipt.amount;
        methodTotals[method].count += 1;
        totalAmount += receipt.amount;
      }
    });

    const methodMap: Record<string, 'Credit Card' | 'Bank Transfer' | 'Cash' | 'Other'> = {
      cash: 'Cash',
      card: 'Credit Card',
      transfer: 'Bank Transfer',
      mobile: 'Other',
    };

    const methodColors: Record<'Credit Card' | 'Bank Transfer' | 'Cash' | 'Other', string> = {
      'Credit Card': colors.primary500,
      'Bank Transfer': colors.success,
      Cash: colors.warning,
      Other: colors.info || colors.primary400,
    };

    return Object.entries(methodTotals)
      .map(([method, data]) => ({
        type: methodMap[method] || 'Other',
        amount: data.amount,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        count: data.count,
        color: methodColors[methodMap[method] || 'Other'],
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [receipts, colors]);

  const topProducts = useMemo(() => {
    const productSales: Record<string, { amount: number; quantity: number; name: string }> = {};

    receipts.forEach((receipt) => {
      if (receipt.status === 'completed') {
        receipt.items.forEach((item) => {
          if (!productSales[item.name]) {
            productSales[item.name] = { amount: 0, quantity: 0, name: item.name };
          }
          productSales[item.name].amount += item.price * item.quantity;
          productSales[item.name].quantity += item.quantity;
        });
      }
    });

    invoices.forEach((invoice) => {
      if (invoice.status === 'paid') {
        invoice.items.forEach((item) => {
          if (!productSales[item.description]) {
            productSales[item.description] = { amount: 0, quantity: 0, name: item.description };
          }
          productSales[item.description].amount += item.unitPrice * item.quantity;
          productSales[item.description].quantity += item.quantity;
        });
      }
    });

    return Object.values(productSales)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [receipts, invoices]);

  const topCustomers = useMemo(() => {
    return [...customers]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 3);
  }, [customers]);

  const summaryMetrics = [
    {
      label: 'Total Revenue',
      value: `$${formatCurrency(totalRevenue)}`,
      accent: colors.primary500,
    },
    {
      label: 'Outstanding Balance',
      value: `$${formatCurrency(outstandingBalance)}`,
      accent: colors.error,
    },
    {
      label: 'Completed Transactions',
      value: `${completedTransactions}`,
      accent: colors.success,
    },
    {
      label: 'Customers',
      value: `${customers.length}`,
      accent: colors.primary400,
    },
  ];

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await refreshData();
      Alert.alert('Analytics Synced', 'Latest numbers have been refreshed.');
    } catch (error) {
      Alert.alert('Sync Failed', 'Unable to refresh analytics right now.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportSnapshot = async () => {
    try {
      setIsExporting(true);
      const html = createReportHTML({
        companyName,
        companyContact: companyContactMarkup,
        selectedRangeId: selectedRange,
        invoiceSummary: invoiceStats,
        receiptSummary: receiptStats,
        totalRevenue,
      });
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Analytics Snapshot',
        });
      } else {
        Alert.alert('Export Ready', `Snapshot saved to ${uri}`);
      }
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to generate the snapshot PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ModalHeader title="Analytics" subtitle="Revenue health & payment trends" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.companyCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.companyName, { color: colors.text }]}>{companyName}</Text>
          {companyContacts.map((line) => (
            <Text
              key={line}
              style={[styles.companyContact, { color: colors.textTertiary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {line}
            </Text>
          ))}
        </View>

        <View style={styles.rangeSection}>
          {TIME_RANGE_OPTIONS.map((range) => (
            <TouchableOpacity
              key={range.id}
              style={[
                styles.rangeButton,
                { borderColor: colors.border, backgroundColor: colors.surface },
                selectedRange === range.id && {
                  backgroundColor: colors.primary500,
                  borderColor: colors.primary500,
                },
              ]}
              onPress={() => setSelectedRange(range.id)}
            >
              <Text
                style={[
                  styles.rangeButtonText,
                  selectedRange === range.id && { color: 'white' },
                ]}
              >
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.timeLabel, { backgroundColor: colors.primary100 }]}>
          <Text style={[styles.timeLabelText, { color: colors.primary500 }]}>
            Showing data for {timeRangeLabel}
          </Text>
        </View>

        <View style={styles.summaryGrid}>
          {summaryMetrics.map((metric) => (
            <View
              key={metric.label}
              style={[
                styles.summaryTile,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.summaryValue, { color: colors.text }]}>{metric.value}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>
                {metric.label}
              </Text>
              <View style={[styles.summaryAccent, { backgroundColor: metric.accent }]} />
            </View>
          ))}
        </View>

        <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Products</Text>
            <Ionicons name="cube-outline" size={18} color={colors.primary500} />
          </View>
          {topProducts.length > 0 ? (
            topProducts.map((product) => (
              <View key={product.name} style={styles.listRow}>
                <View>
                  <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={[styles.listMeta, { color: colors.textTertiary }]}>
                    {product.quantity} sold
                  </Text>
                </View>
                <Text style={[styles.listValue, { color: colors.text }]}>
                  ${formatCurrency(product.amount)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No product sales recorded yet.
            </Text>
          )}
        </View>

        <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Methods</Text>
            <Ionicons name="cash-outline" size={18} color={colors.primary500} />
          </View>
          {paymentMethods.length > 0 ? (
            paymentMethods.map((method) => (
              <View key={method.type} style={styles.methodRow}>
                <View style={[styles.colorDot, { backgroundColor: method.color }]} />
                <View style={styles.methodInfo}>
                  <Text style={[styles.listTitle, { color: colors.text }]}>{method.type}</Text>
                  <Text style={[styles.listMeta, { color: colors.textTertiary }]}>
                    {method.count} transactions · {method.percentage.toFixed(1)}%
                  </Text>
                </View>
                <Text style={[styles.listValue, { color: colors.text }]}>
                  ${formatCurrency(method.amount)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No completed payments yet.
            </Text>
          )}
        </View>

        <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Customers</Text>
            <Ionicons name="people-outline" size={18} color={colors.primary500} />
          </View>
          {topCustomers.length > 0 ? (
            topCustomers.map((customer) => (
              <View key={customer.id} style={styles.listRow}>
                <View>
                  <Text style={[styles.listTitle, { color: colors.text }]}>{customer.name}</Text>
                  <Text style={[styles.listMeta, { color: colors.textTertiary }]}>
                    ${formatCurrency(customer.totalSpent)} spent
                  </Text>
                </View>
                <Text style={[styles.listValue, { color: customer.outstanding > 0 ? colors.error : colors.success }]}>
                  {customer.outstanding > 0
                    ? `${customer.outstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} owed`
                    : 'Paid in full'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No customer data available.
            </Text>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleSync}
            disabled={isSyncing || loading}
          >
            {isSyncing ? (
              <ActivityIndicator color={colors.primary500} />
            ) : (
              <Ionicons name="sync-outline" size={20} color={colors.primary500} />
            )}
            <Text style={[styles.actionText, { color: colors.primary500 }]}>
              {isSyncing || loading ? 'Syncing...' : 'Sync Data'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary500, borderColor: colors.primary500 }]}
            onPress={handleExportSnapshot}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Ionicons name="download-outline" size={20} color="white" />
            )}
            <Text style={[styles.actionText, { color: 'white' }]}>
              {isExporting ? 'Exporting...' : 'Export Snapshot'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  companyCard: {
    margin: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  companyName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  companyContact: {
    fontSize: 14,
  },
  rangeSection: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  rangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  rangeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeLabel: {
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  timeLabelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryTile: {
    flex: 1,
    minWidth: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    position: 'relative',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryAccent: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  listMeta: {
    fontSize: 12,
  },
  listValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  methodInfo: {
    flex: 1,
    marginLeft: 10,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
