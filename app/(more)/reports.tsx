// app/(tabs)/reports.tsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { useUser } from '@/context/UserContext';
import { router } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { apiGet, apiPost } from '@/services/apiClient';
import { ROLE_GROUPS } from '@/utils/roleAccess';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { resolveCurrencyCode } from '@/utils/currency';
import {
  TIME_RANGE_OPTIONS,
  TimeRange,
  formatTimeRangeLabel,
  getInvoiceSummary,
  getReceiptSummary,
  createReportHTML,
} from '@/utils/reportUtils';

interface PaymentMethodData {
  type: 'Credit Card' | 'Bank Transfer' | 'Cash' | 'Other';
  percentage: number;
  amount: number;
  color: string;
  count: number;
}

type ReportType =
  | 'summary'
  | 'sales'
  | 'revenue'
  | 'inventory'
  | 'customer'
  | 'profit'
  | 'expenses'
  | 'performance';

interface ReportHistoryItem {
  id: string;
  title: string;
  type: ReportType;
  format?: string;
  status?: string;
  progress?: number;
  createdAt?: string;
  generatedAt?: string;
  downloads?: number;
}

const REPORT_TYPES: { id: ReportType; label: string; icon: string }[] = [
  { id: 'summary', label: 'Summary', icon: 'analytics-outline' },
  { id: 'sales', label: 'Sales', icon: 'trending-up-outline' },
  { id: 'revenue', label: 'Revenue', icon: 'cash-outline' },
  { id: 'inventory', label: 'Inventory', icon: 'cube-outline' },
  { id: 'customer', label: 'Customers', icon: 'people-outline' },
  { id: 'profit', label: 'Profit', icon: 'stats-chart-outline' },
  { id: 'expenses', label: 'Expenses', icon: 'wallet-outline' },
  { id: 'performance', label: 'Performance', icon: 'rocket-outline' },
];

export default function ReportsScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const { 
    invoices, 
    receipts, 
    customers,
    inventory,
    dashboardStats,
    refreshData,
    loading,
  } = useData();
  const { canAccess } = useRoleGuard(ROLE_GROUPS.reports);
  const currencyCode = resolveCurrencyCode(user || undefined);
  
  const [selectedRange, setSelectedRange] = useState<TimeRange>('week');
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('summary');
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [reportHistory, setReportHistory] = useState<ReportHistoryItem[]>([]);
  const [reportHistoryLoading, setReportHistoryLoading] = useState(false);

  // Update current time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setCurrentTime(timeString);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  const mapReportHistory = useCallback((report: any): ReportHistoryItem => {
    return {
      id: report.id || report._id,
      title: report.title || 'Report',
      type: report.type || 'summary',
      format: report.format,
      status: report.status,
      progress: report.progress,
      createdAt: report.createdAt,
      generatedAt: report.generatedAt,
      downloads: report.downloads,
    };
  }, []);

  const loadReportHistory = useCallback(async () => {
    try {
      setReportHistoryLoading(true);
      const response: any = await apiGet('/api/v1/reports/history');
      const data = response?.data ?? response ?? [];
      setReportHistory(data.map(mapReportHistory));
    } catch (error) {
      console.error('Failed to load report history:', error);
    } finally {
      setReportHistoryLoading(false);
    }
  }, [mapReportHistory]);

  useEffect(() => {
    loadReportHistory();
  }, [loadReportHistory]);

  const recordReportDownload = useCallback(
    async (id: string) => {
      try {
        const response: any = await apiPost(`/api/v1/reports/history/${id}/download`);
        const updated = response?.data ?? response;
        if (updated) {
          setReportHistory((prev) =>
            prev.map((report) => (report.id === id ? mapReportHistory(updated) : report))
          );
        }
      } catch (error) {
        console.error('Failed to record report download:', error);
      }
    },
    [mapReportHistory]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshData(), loadReportHistory()]);
    setRefreshing(false);
  };

  const timeRanges = TIME_RANGE_OPTIONS;

  const companyName = (
    user?.businessName?.trim() ||
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
    'Ledgerly Inc.'
  );
  const companyContacts = [
    user?.phoneNumber,
    user?.email,
    user?.country,
  ].filter(Boolean);
  const companyContactMarkup = companyContacts.length
    ? companyContacts.join('<br>')
    : 'support@ledgerly.com';
  const currentRangeLabel = formatTimeRangeLabel(selectedRange);

  const invoiceStats = useMemo(() => getInvoiceSummary(invoices), [invoices]);
  const receiptStats = useMemo(() => getReceiptSummary(receipts), [receipts]);

  const totalRevenue = invoiceStats.total + receiptStats.total;

  const resolveReportMeta = (type: ReportType) =>
    REPORT_TYPES.find((item) => item.id === type) || REPORT_TYPES[0];

  const buildReportPayload = (type: ReportType) => {
    const meta = resolveReportMeta(type);
    const generatedAt = new Date().toISOString();
    return {
      title: `${meta.label} Report`,
      description: `${meta.label} insights for ${currentRangeLabel}`,
      type,
      format: 'pdf',
      filters: { range: selectedRange },
      options: {
        includeCharts: true,
        sections: ['summary', 'charts', 'tables', 'details'],
      },
      metadata: {
        dateRange: selectedRange,
        rangeLabel: currentRangeLabel,
        generated: generatedAt,
      },
      summary: {
        totalRevenue,
        totalInvoices: dashboardStats.totalInvoices,
        totalReceipts: dashboardStats.totalReceipts,
        totalCustomers: dashboardStats.totalCustomers,
        outstandingPayments: dashboardStats.outstandingPayments,
      },
      breakdown: {
        invoiceSummary: invoiceStats,
        receiptSummary: receiptStats,
        paymentMethods,
        topProducts,
        topCustomers,
        revenueTrend,
        profit: profitData,
      },
      status: 'completed',
      progress: 100,
      generatedAt,
    };
  };

  const handleExportReport = async (type: ReportType = selectedReportType) => {
    const meta = resolveReportMeta(type);
    try {
      const html = createReportHTML({
        companyName,
        companyContact: companyContactMarkup,
        selectedRangeId: selectedRange,
        invoiceSummary: invoiceStats,
        receiptSummary: receiptStats,
        totalRevenue,
        currencyCode,
        reportTitle: `${meta.label} Report`,
        reportTypeLabel: meta.label,
      });
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Export ${meta.label} Report`,
        });
      } else {
        Alert.alert('Export Ready', `Report saved to ${uri}`);
      }

      try {
        const payload = buildReportPayload(type);
        const response: any = await apiPost('/api/v1/reports/history', payload);
        const record = response?.data ?? response;
        if (record) {
          setReportHistory((prev) => [mapReportHistory(record), ...prev]);
        }
      } catch (error) {
        console.error('Failed to store report history:', error);
      }
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to generate the report PDF. Please try again.');
    }
  };

  // Calculate payment method data from real receipts
  const paymentMethods: PaymentMethodData[] = useMemo(() => {
    const methodTotals: Record<string, { amount: number; count: number }> = {};
    let totalAmount = 0;

    receipts.forEach((receipt: { status: string; paymentMethod: string; amount: number }) => {
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

    // Map to proper display types
    const methodMap: Record<string, PaymentMethodData['type']> = {
      'cash': 'Cash',
      'card': 'Credit Card',
      'transfer': 'Bank Transfer',
      'mobile': 'Other'
    };

    const methodColors: Record<PaymentMethodData['type'], string> = {
      'Credit Card': colors.primary500,
      'Bank Transfer': colors.success,
      'Cash': colors.warning,
      'Other': colors.info || colors.primary400
    };

    return Object.entries(methodTotals)
      .map(([method, data]) => ({
        type: methodMap[method] || 'Other',
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        amount: data.amount,
        color: methodColors[methodMap[method] || 'Other'],
        count: data.count
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [receipts, colors]);

  // Calculate top products from real inventory and receipts
  const topProducts = useMemo(() => {
    const productSales: Record<string, { amount: number; quantity: number; name: string }> = {};

    // Calculate from receipts
    receipts.forEach((receipt: { status: string; items: Array<{ name: string; price: number; quantity: number }> }) => {
      if (receipt.status === 'completed') {
        receipt.items.forEach((item: { name: string; price: number; quantity: number }) => {
          if (!productSales[item.name]) {
            productSales[item.name] = { amount: 0, quantity: 0, name: item.name };
          }
          productSales[item.name].amount += item.price * item.quantity;
          productSales[item.name].quantity += item.quantity;
        });
      }
    });

    // Calculate from invoices
    invoices.forEach((invoice: { status: string; items: Array<{ description: string; unitPrice: number; quantity: number }> }) => {
      if (invoice.status === 'paid') {
        invoice.items.forEach((item: { description: string; unitPrice: number; quantity: number }) => {
          if (!productSales[item.description]) {
            productSales[item.description] = { amount: 0, quantity: 0, name: item.description };
          }
          productSales[item.description].amount += item.unitPrice * item.quantity;
          productSales[item.description].quantity += item.quantity;
        });
      }
    });

    const sortedProducts = Object.values(productSales)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);

    const totalAmount = sortedProducts.reduce((sum, product) => sum + product.amount, 0);

    return sortedProducts.map(product => ({
      name: product.name,
      amount: product.amount,
      percentage: totalAmount > 0 ? (product.amount / totalAmount) * 100 : 0,
      quantity: product.quantity
    }));
  }, [invoices, receipts]);

  // Calculate top customers from real data
  const topCustomers = useMemo(() => {
    const sortedCustomers = [...customers]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
    
    return sortedCustomers.map(customer => ({
      name: customer.name,
      amount: customer.totalSpent,
      transactions: customer.invoices?.length || 0,
      outstanding: customer.outstanding
    }));
  }, [customers]);

  // Calculate invoice status counts
  const invoiceStatusCounts = useMemo(() => {
    const counts = {
      paid: 0,
      pending: 0,
      overdue: 0,
      draft: 0,
      sent: 0,
      cancelled: 0
    };

    invoices.forEach((invoice: { status: string }) => {
      counts[invoice.status as keyof typeof counts]++;
    });

    return counts;
  }, [invoices]);

  // Calculate outstanding payments by age
  const outstandingPaymentsByAge = useMemo(() => {
    const now = new Date();
    const categories = {
      '0-30': { amount: 0, count: 0 },
      '31-60': { amount: 0, count: 0 },
      '60+': { amount: 0, count: 0 }
    };

    invoices.forEach((invoice: { status: string; dueDate: string; amount: number; paidAmount: number }) => {
      if (invoice.status === 'pending' || invoice.status === 'overdue') {
        const dueDate = new Date(invoice.dueDate);
        const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const amount = invoice.amount - invoice.paidAmount;

        if (daysDiff <= 30) {
          categories['0-30'].amount += amount;
          categories['0-30'].count++;
        } else if (daysDiff <= 60) {
          categories['31-60'].amount += amount;
          categories['31-60'].count++;
        } else {
          categories['60+'].amount += amount;
          categories['60+'].count++;
        }
      }
    });

    const totalOutstanding = categories['0-30'].amount + categories['31-60'].amount + categories['60+'].amount;

    return {
      categories,
      total: totalOutstanding
    };
  }, [invoices]);

  const resolveProductCost = (productId?: string, name?: string) => {
    if (!inventory || inventory.length === 0) return 0;
    const byId = productId ? inventory.find((item) => item.id === productId) : undefined;
    if (byId?.costPrice) return byId.costPrice;
    if (name) {
      const byName = inventory.find((item) => item.name?.toLowerCase() === name.toLowerCase());
      if (byName?.costPrice) return byName.costPrice;
    }
    return 0;
  };

  const calculateRevenueAndCost = (startDate?: Date, endDate?: Date) => {
    const inRange = (dateValue?: string) => {
      if (!dateValue) return false;
      const date = new Date(dateValue);
      if (startDate && date < startDate) return false;
      if (endDate && date >= endDate) return false;
      return true;
    };

    const paidInvoices = invoices.filter((invoice) => {
      if (invoice.status !== 'paid') return false;
      if (!startDate && !endDate) return true;
      return inRange(invoice.issueDate || invoice.createdAt);
    });

    const completedReceipts = receipts.filter((receipt) => {
      if (receipt.status !== 'completed') return false;
      if (!startDate && !endDate) return true;
      return inRange(receipt.time || receipt.createdAt);
    });

    const revenue =
      paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0) +
      completedReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);

    const invoiceCost = paidInvoices.reduce((sum, invoice) => {
      const itemsCost = invoice.items.reduce((itemSum, item) => {
        const cost = resolveProductCost(item.productId, item.description);
        return itemSum + cost * item.quantity;
      }, 0);
      return sum + itemsCost;
    }, 0);

    const receiptCost = completedReceipts.reduce((sum, receipt) => {
      const itemsCost = receipt.items.reduce((itemSum, item) => {
        const cost = resolveProductCost(undefined, item.name);
        return itemSum + cost * item.quantity;
      }, 0);
      return sum + itemsCost;
    }, 0);

    return {
      revenue,
      cost: invoiceCost + receiptCost,
    };
  };

  const profitData = useMemo(() => {
    const now = new Date();
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousEnd = currentStart;

    const current = calculateRevenueAndCost(currentStart, now);
    const previous = calculateRevenueAndCost(previousStart, previousEnd);

    const profit = current.revenue - current.cost;
    const margin = current.revenue > 0 ? (profit / current.revenue) * 100 : 0;
    const previousProfit = previous.revenue - previous.cost;
    const trend =
      previousProfit !== 0 ? ((profit - previousProfit) / Math.abs(previousProfit)) * 100 : 0;

    return {
      margin: margin.toFixed(1),
      profit,
      trend: trend >= 0 ? `+${trend.toFixed(1)}` : trend.toFixed(1),
    };
  }, [invoices, receipts, inventory]);

  // Calculate average transaction value
  const calculateAverageTransaction = () => {
    const totalTransactions = receipts.length + invoices.filter((inv: { status: string }) => inv.status === 'paid').length;
    const avgValue = totalTransactions > 0 ? dashboardStats.totalRevenue / totalTransactions : 0;
    
    return {
      count: totalTransactions,
      avgValue: avgValue.toFixed(2)
    };
  };

  const transactionData = calculateAverageTransaction();

  const revenueTrend = useMemo(() => {
    const now = new Date();
    const labels: string[] = [];
    const values: number[] = [];

    for (let i = 5; i >= 0; i -= 1) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const revenue = calculateRevenueAndCost(monthStart, monthEnd).revenue;
      labels.push(monthStart.toLocaleString('en-US', { month: 'short' }));
      values.push(revenue);
    }

    return { labels, values };
  }, [invoices, receipts, inventory]);

  const maxTrendValue = Math.max(1, ...revenueTrend.values);

  const handleViewOutstandingDetails = () => {
    router.push('/(tabs)/invoices?filter=overdue');
  };

  const handleViewTopProducts = () => {
    router.push('/(tabs)/inventory');
  };

  const handleViewTopCustomers = () => {
    router.push('/(more)/customer');
  };

  const handleViewAnalytics = () => {
    router.push('/(modals)/analytics');
  };

  const handleScheduleReport = () => {
    router.push('/(modals)/schedule-report');
  };

  if (!canAccess) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={onRefresh}
            tintColor={colors.primary500}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Reports & Analytics</Text>
          <View style={[styles.timeIndicator, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="time-outline" size={20} color={colors.textTertiary} />
            <Text style={[styles.timeText, { color: colors.text }]}>
              {currentTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {/* Time Range Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.timeRangeTabs}
          contentContainerStyle={styles.timeRangeContent}
        >
          {timeRanges.map((range) => (
            <TouchableOpacity
              key={range.id}
              style={[
                styles.timeRangeTab,
                { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                },
                selectedRange === range.id && [
                  styles.timeRangeTabActive,
                  { 
                    backgroundColor: colors.primary500,
                    borderColor: colors.primary500
                  }
                ]
              ]}
              onPress={() => setSelectedRange(range.id)}
            >
              <Text style={[
                styles.timeRangeText,
                { color: colors.text },
                selectedRange === range.id && styles.timeRangeTextActive
              ]}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Time Range Display */}
          <View style={[styles.timeRangeDisplay, { backgroundColor: colors.primary100 + '20' }]}>
            <Text style={[styles.timeRangeDisplayText, { color: colors.primary500 }]}>
              Showing data for {currentRangeLabel}
            </Text>
          </View>

        {/* Report Types */}
        <View style={styles.reportTypeSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Report Types</Text>
            <TouchableOpacity onPress={() => handleExportReport(selectedReportType)}>
              <Text style={[styles.viewAllText, { color: colors.primary500 }]}>Generate</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.reportTypeScroll}
          >
            {REPORT_TYPES.map((type) => {
              const isActive = selectedReportType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.reportTypeChip,
                    {
                      backgroundColor: isActive ? colors.primary500 : colors.surface,
                      borderColor: isActive ? colors.primary500 : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedReportType(type.id)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={16}
                    color={isActive ? 'white' : colors.text}
                  />
                  <Text
                    style={[
                      styles.reportTypeText,
                      { color: isActive ? 'white' : colors.text },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Total Revenue */}
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statHeader}>
            <Text style={[styles.statTitle, { color: colors.text }]}>Total Revenue</Text>
            <View style={[styles.trendBadge, { backgroundColor: `${colors.success}15` }]}>
              <Ionicons name="trending-up" size={16} color={colors.success} />
              <Text style={[styles.trendText, { color: colors.success }]}>{dashboardStats.revenueChange} vs last period</Text>
            </View>
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>${dashboardStats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          <Text style={[styles.statSubtitle, { color: colors.textTertiary }]}>
            {dashboardStats.todayReceipts} sales today - ${dashboardStats.receiptsRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>

        {/* Outstanding Payments */}
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statHeader}>
            <Text style={[styles.statTitle, { color: colors.text }]}>Outstanding Payments</Text>
            <TouchableOpacity onPress={handleViewOutstandingDetails}>
              <Text style={[styles.viewDetailsText, { color: colors.primary500 }]}>View Details -></Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>${outstandingPaymentsByAge.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          <Text style={[styles.statSubtitle, { color: colors.error }]}>{dashboardStats.overdueInvoices} Overdue</Text>
          
          <View style={styles.paymentBreakdown}>
            {Object.entries(outstandingPaymentsByAge.categories).map(([range, data]) => (
              <View key={range} style={styles.paymentItem}>
                <View style={styles.paymentBarContainer}>
                  <View style={[styles.paymentBar, { backgroundColor: colors.border }]}>
                    <View style={[
                      styles.paymentBarFill, 
                      { 
                        width: `${(data.amount / outstandingPaymentsByAge.total) * 100}%`,
                        backgroundColor: range === '0-30' ? colors.warning : 
                                     range === '31-60' ? colors.error : 
                                     colors.error
                      }
                    ]} />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={[styles.paymentLabel, { color: colors.textTertiary }]}>{range} days</Text>
                    <View style={styles.paymentDetails}>
                      <Text style={[styles.paymentAmount, { color: colors.text }]}>${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                      <Text style={[styles.paymentCount, { color: colors.textTertiary }]}>{data.count} invoices</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.gridCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.gridCardHeader}>
              <Text style={[styles.gridTitle, { color: colors.text }]}>Profit Margin</Text>
              <Ionicons name="trending-up" size={20} color={colors.success} />
            </View>
            <Text style={[styles.gridValue, { color: colors.text }]}>{profitData.margin}%</Text>
            <Text style={[styles.gridSubtitle, { color: colors.textTertiary }]}>
              {profitData.trend}% vs previous period
            </Text>
            <Text style={[styles.gridProfit, { color: colors.success }]}>
              ${profitData.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} profit
            </Text>
          </View>
          
          <View style={[styles.gridCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.gridCardHeader}>
              <Text style={[styles.gridTitle, { color: colors.text }]}>Transactions</Text>
              <Ionicons name="receipt-outline" size={20} color={colors.primary500} />
            </View>
            <Text style={[styles.gridValue, { color: colors.text }]}>{transactionData.count}</Text>
            <Text style={[styles.gridSubtitle, { color: colors.textTertiary }]}>
              Avg: ${transactionData.avgValue} per transaction
            </Text>
            <Text style={[styles.gridTransaction, { color: colors.primary500 }]}>
              {dashboardStats.totalReceipts} receipts - {dashboardStats.totalInvoices} invoices
            </Text>
          </View>
        </View>

        {/* Revenue Trend Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Revenue Trend</Text>
            <Text style={[styles.chartPeriod, { color: colors.textTertiary }]}>Last 6 months</Text>
          </View>
          <View style={styles.chartPlaceholder}>
            <View style={styles.chartContainer}>
              {revenueTrend.values.map((value: number, index: number) => (
                <View key={index} style={styles.chartBarContainer}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: `${(value / maxTrendValue) * 100}%`,
                        backgroundColor: colors.primary500,
                      }
                    ]}
                  />
                  <Text style={[styles.chartLabel, { color: colors.textTertiary }]}>
                    {revenueTrend.labels[index]}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.chartYAxis}>
              <Text style={[styles.chartYLabel, { color: colors.textTertiary }]}>${maxTrendValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Text>
              <Text style={[styles.chartYLabel, { color: colors.textTertiary }]}>${(maxTrendValue / 2).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Text>
              <Text style={[styles.chartYLabel, { color: colors.textTertiary }]}>$0</Text>
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Methods</Text>
          <View style={styles.paymentMethods}>
            {paymentMethods.map((method, index) => (
              <View key={index} style={styles.paymentMethodItem}>
                <View style={styles.paymentMethodHeader}>
                  <View style={[styles.colorDot, { backgroundColor: method.color }]} />
                  <Text style={[styles.paymentMethodType, { color: colors.text }]}>{method.type}</Text>
                </View>
                <View style={styles.paymentMethodStats}>
                  <View style={styles.paymentMethodNumbers}>
                    <Text style={[styles.paymentMethodPercentage, { color: colors.text }]}>{method.percentage.toFixed(1)}%</Text>
                    <Text style={[styles.paymentMethodAmount, { color: colors.textTertiary }]}>
                      ${method.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <Text style={[styles.paymentMethodCount, { color: colors.textTertiary }]}>{method.count} transactions</Text>
                </View>
              </View>
            ))}
          </View>
          {paymentMethods.length === 0 && (
            <Text style={[styles.emptyDataText, { color: colors.textTertiary }]}>
              No payment data available
            </Text>
          )}
        </View>

        {/* Invoice Status */}
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Invoice Status</Text>
          <View style={styles.invoiceStatus}>
            <View style={styles.invoiceStatusItem}>
              <View style={[styles.invoiceStatusBadge, { backgroundColor: colors.success }]} />
              <Text style={[styles.invoiceStatusLabel, { color: colors.textTertiary }]}>Paid</Text>
              <Text style={[styles.invoiceStatusValue, { color: colors.text }]}>{invoiceStatusCounts.paid}</Text>
            </View>
            <View style={styles.invoiceStatusItem}>
              <View style={[styles.invoiceStatusBadge, { backgroundColor: colors.warning }]} />
              <Text style={[styles.invoiceStatusLabel, { color: colors.textTertiary }]}>Pending</Text>
              <Text style={[styles.invoiceStatusValue, { color: colors.text }]}>{invoiceStatusCounts.pending}</Text>
            </View>
            <View style={styles.invoiceStatusItem}>
              <View style={[styles.invoiceStatusBadge, { backgroundColor: colors.error }]} />
              <Text style={[styles.invoiceStatusLabel, { color: colors.textTertiary }]}>Overdue</Text>
              <Text style={[styles.invoiceStatusValue, { color: colors.text }]}>{invoiceStatusCounts.overdue}</Text>
            </View>
          </View>
          <Text style={[styles.invoiceStatusTotal, { color: colors.textTertiary }]}>
            Total Invoices: {dashboardStats.totalInvoices}
          </Text>
        </View>

        {/* Top Products */}
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Products</Text>
            <TouchableOpacity onPress={handleViewTopProducts}>
              <Text style={[styles.viewAllText, { color: colors.primary500 }]}>View All -></Text>
            </TouchableOpacity>
          </View>
          
          {topProducts.length > 0 ? (
            topProducts.map((product, index) => (
              <View key={index} style={[styles.topItem, { borderBottomColor: colors.border }]}>
                <View style={styles.topItemInfo}>
                  <Text style={[styles.topItemName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                    {product.name}
                  </Text>
                  <View style={styles.topItemMeta}>
                    <Text style={[styles.topItemPercentage, { color: colors.textTertiary }]}>{product.percentage.toFixed(1)}%</Text>
                    <Text style={[styles.topItemQuantity, { color: colors.textTertiary }]}>{product.quantity} sold</Text>
                  </View>
                </View>
                <Text style={[styles.topItemAmount, { color: colors.text }]}>
                  ${product.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyDataText, { color: colors.textTertiary }]}>
              No product sales data available
            </Text>
          )}
        </View>

        {/* Top Customers */}
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Customers</Text>
            <TouchableOpacity onPress={handleViewTopCustomers}>
              <Text style={[styles.viewAllText, { color: colors.primary500 }]}>View All -></Text>
            </TouchableOpacity>
          </View>
          
          {topCustomers.length > 0 ? (
            topCustomers.map((customer, index) => (
              <View key={index} style={[styles.topItem, { borderBottomColor: colors.border }]}>
                <View style={styles.topItemInfo}>
                  <Text style={[styles.topItemName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                    {customer.name}
                  </Text>
                  <View style={styles.topItemMeta}>
                    <Text style={[styles.topItemTransactions, { color: colors.textTertiary }]}>
                      {customer.transactions} transaction{customer.transactions !== 1 ? 's' : ''}
                    </Text>
                    {customer.outstanding > 0 && (
                      <Text style={[styles.topItemOutstanding, { color: colors.error }]}>
                        ${customer.outstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} outstanding
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.customerAmountContainer}>
                  <Text style={[styles.topItemAmount, { color: colors.text }]}>
                    ${customer.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyDataText, { color: colors.textTertiary }]}>
              No customer data available
            </Text>
          )}
        </View>

        {/* Generated Reports */}
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Generated Reports</Text>
            <TouchableOpacity onPress={loadReportHistory}>
              <Text style={[styles.viewAllText, { color: colors.primary500 }]}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {reportHistoryLoading ? (
            <View style={styles.reportHistoryLoading}>
              <ActivityIndicator color={colors.primary500} />
              <Text style={[styles.emptyDataText, { color: colors.textTertiary }]}>
                Loading reports...
              </Text>
            </View>
          ) : reportHistory.length > 0 ? (
            reportHistory.slice(0, 5).map((report) => {
              const meta = REPORT_TYPES.find((item) => item.id === report.type);
              const label = meta?.label || report.type;
              const generatedAt = report.generatedAt || report.createdAt;
              return (
                <View key={report.id} style={[styles.reportHistoryItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.reportHistoryInfo}>
                    <Text style={[styles.reportHistoryTitle, { color: colors.text }]} numberOfLines={1}>
                      {report.title || `${label} Report`}
                    </Text>
                    <Text style={[styles.reportHistoryMeta, { color: colors.textTertiary }]}>
                      {label} - {generatedAt ? new Date(generatedAt).toLocaleDateString('en-US') : 'Recent'}
                    </Text>
                    <View style={styles.reportHistoryBadges}>
                      {report.status && (
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                report.status === 'completed'
                                  ? colors.success + '20'
                                  : colors.warning + '20',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              { color: report.status === 'completed' ? colors.success : colors.warning },
                            ]}
                          >
                            {report.status.toUpperCase()}
                          </Text>
                        </View>
                      )}
                      {typeof report.downloads === 'number' && (
                        <View style={[styles.statusBadge, { backgroundColor: colors.primary100 }]}>
                          <Text style={[styles.statusBadgeText, { color: colors.primary500 }]}>
                            {report.downloads} downloads
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.reportHistoryAction, { backgroundColor: colors.primary100 }]}
                    onPress={async () => {
                      const reportType = REPORT_TYPES.some((item) => item.id === report.type)
                        ? (report.type as ReportType)
                        : selectedReportType;
                      await handleExportReport(reportType);
                      if (report.id) {
                        recordReportDownload(report.id);
                      }
                    }}
                  >
                    <Ionicons name="download-outline" size={18} color={colors.primary500} />
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <Text style={[styles.emptyDataText, { color: colors.textTertiary }]}>
              No generated reports yet.
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.reportActions}>
          <TouchableOpacity 
            style={[styles.reportActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleExportReport}
          >
            <Ionicons name="download-outline" size={20} color={colors.primary500} />
            <Text style={[styles.reportActionText, { color: colors.primary500 }]}>Export Report</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.reportActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleViewAnalytics}
          >
            <Ionicons name="analytics-outline" size={20} color={colors.primary500} />
            <Text style={[styles.reportActionText, { color: colors.primary500 }]}>View Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.reportActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleScheduleReport}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.primary500} />
            <Text style={[styles.reportActionText, { color: colors.primary500 }]}>Schedule</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
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
    flex: 1,
  },
  timeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeRangeTabs: {
    marginBottom: 12,
  },
  timeRangeContent: {
    paddingHorizontal: 20,
  },
  timeRangeTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  timeRangeTabActive: {},
  timeRangeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeRangeTextActive: {
    color: 'white',
  },
  timeRangeDisplay: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  timeRangeDisplayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    flexShrink: 1,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentBreakdown: {
    marginTop: 16,
  },
  paymentItem: {
    marginBottom: 16,
  },
  paymentBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  paymentBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  paymentInfo: {
    width: 120,
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentCount: {
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  gridCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
  },
  gridCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  gridValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  gridSubtitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  gridProfit: {
    fontSize: 12,
    fontWeight: '600',
  },
  gridTransaction: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  chartPeriod: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartPlaceholder: {
    height: 200,
    flexDirection: 'row',
  },
  chartContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 24,
    paddingRight: 20,
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 12,
  },
  chartYAxis: {
    width: 60,
    justifyContent: 'space-between',
    paddingBottom: 24,
    alignItems: 'flex-end',
  },
  chartYLabel: {
    fontSize: 10,
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
  paymentMethods: {
    gap: 16,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  paymentMethodType: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  paymentMethodStats: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  paymentMethodNumbers: {
    alignItems: 'flex-end',
  },
  paymentMethodPercentage: {
    fontSize: 15,
    fontWeight: '700',
  },
  paymentMethodAmount: {
    fontSize: 12,
    marginTop: 2,
  },
  paymentMethodCount: {
    fontSize: 11,
    marginTop: 4,
  },
  invoiceStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  invoiceStatusItem: {
    alignItems: 'center',
    flex: 1,
  },
  invoiceStatusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 8,
  },
  invoiceStatusLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  invoiceStatusValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  invoiceStatusTotal: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  topItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  topItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  topItemName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  topItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topItemPercentage: {
    fontSize: 12,
    fontWeight: '600',
  },
  topItemQuantity: {
    fontSize: 12,
  },
  topItemTransactions: {
    fontSize: 12,
  },
  topItemOutstanding: {
    fontSize: 11,
    fontWeight: '600',
  },
  customerAmountContainer: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  topItemAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyDataText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  reportActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    gap: 10,
  },
  reportActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    minHeight: 50,
  },
  reportActionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  reportTypeSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  reportTypeScroll: {
    paddingVertical: 4,
  },
  reportTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 10,
  },
  reportTypeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  reportHistoryLoading: {
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  reportHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  reportHistoryInfo: {
    flex: 1,
    marginRight: 12,
  },
  reportHistoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  reportHistoryMeta: {
    fontSize: 12,
    marginBottom: 6,
  },
  reportHistoryBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reportHistoryAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  spacer: {
    height: 40,
  },
});
