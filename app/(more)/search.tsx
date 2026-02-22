import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';

const FILTERS = ['all', 'invoices', 'customers', 'products', 'receipts'] as const;

type FilterKey = typeof FILTERS[number];

export default function SearchScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const initialQuery = typeof params.q === 'string' ? params.q : '';
  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const { searchData } = useData();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;

  const invoiceResults = useMemo(() => {
    if (!hasQuery) return [];
    return searchData(trimmedQuery, 'invoices');
  }, [hasQuery, trimmedQuery, searchData]);

  const customerResults = useMemo(() => {
    if (!hasQuery) return [];
    return searchData(trimmedQuery, 'customers');
  }, [hasQuery, trimmedQuery, searchData]);

  const productResults = useMemo(() => {
    if (!hasQuery) return [];
    return searchData(trimmedQuery, 'products');
  }, [hasQuery, trimmedQuery, searchData]);

  const receiptResults = useMemo(() => {
    if (!hasQuery) return [];
    return searchData(trimmedQuery, 'receipts');
  }, [hasQuery, trimmedQuery, searchData]);

  const totalResults =
    invoiceResults.length +
    customerResults.length +
    productResults.length +
    receiptResults.length;

  const filters = [
    { key: 'all', label: 'All', count: totalResults },
    { key: 'invoices', label: 'Invoices', count: invoiceResults.length },
    { key: 'customers', label: 'Customers', count: customerResults.length },
    { key: 'products', label: 'Products', count: productResults.length },
    { key: 'receipts', label: 'Receipts', count: receiptResults.length },
  ] as const;

  const handleClear = () => {
    setQuery('');
  };

  const handleSearchSubmit = () => {
    if (!trimmedQuery) return;
    router.replace({
      pathname: '/(more)/search',
      params: { q: trimmedQuery }
    });
  };

  const navigateToResult = (type: FilterKey, item: any) => {
    switch (type) {
      case 'invoices':
        if (item?.id) router.push(`/(modals)/invoice-detail?id=${item.id}`);
        return;
      case 'customers':
        if (item?.id) router.push(`/(modals)/customer-detail?id=${item.id}`);
        return;
      case 'products':
        if (item?.id) router.push(`/(modals)/product-detail?id=${item.id}`);
        return;
      case 'receipts':
        if (item?.id) router.push(`/(modals)/receipt-detail?id=${item.id}`);
        return;
      default:
        return;
    }
  };

  const renderResultRow = (type: FilterKey, item: any) => {
    let title = '';
    let subtitle = '';
    let meta = '';
    let iconName: keyof typeof Ionicons.glyphMap = 'search-outline';

    if (type === 'invoices') {
      title = item?.number ? `Invoice ${item.number}` : 'Invoice';
      subtitle = item?.customer || 'Customer';
      meta = item?.status || '';
      iconName = 'document-text-outline';
    }

    if (type === 'customers') {
      title = item?.name || 'Customer';
      subtitle = item?.email || item?.phone || 'Customer record';
      meta = item?.company || '';
      iconName = 'people-outline';
    }

    if (type === 'products') {
      title = item?.name || 'Product';
      subtitle = item?.sku ? `SKU ${item.sku}` : item?.category || 'Inventory item';
      meta = item?.status || '';
      iconName = 'cube-outline';
    }

    if (type === 'receipts') {
      title = item?.number ? `Receipt ${item.number}` : 'Receipt';
      subtitle = item?.customer || 'Customer';
      meta = item?.paymentMethod || '';
      iconName = 'receipt-outline';
    }

    return (
      <TouchableOpacity
        key={`${type}-${item?.id || title}`}
        style={[styles.resultRow, { borderColor: colors.border }]}
        onPress={() => navigateToResult(type, item)}
      >
        <View style={[styles.resultIcon, { backgroundColor: colors.primary50 }]}>          
          <Ionicons name={iconName} size={18} color={colors.primary600} />
        </View>
        <View style={styles.resultText}>          
          <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        {meta ? (
          <Text style={[styles.resultMeta, { color: colors.textTertiary }]} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderSection = (label: string, type: FilterKey, items: any[]) => {
    if (items.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {label} ({items.length})
        </Text>
        <View style={styles.sectionBody}>
          {items.map((item) => renderResultRow(type, item))}
        </View>
      </View>
    );
  };

  const renderResults = () => {
    if (!hasQuery) {
      return (
        <View style={[styles.emptyState, { borderColor: colors.border, backgroundColor: colors.surface }]}>          
          <Ionicons name="search-outline" size={28} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Start searching</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Find invoices, customers, products, and receipts.
          </Text>
        </View>
      );
    }

    if (totalResults === 0) {
      return (
        <View style={[styles.emptyState, { borderColor: colors.border, backgroundColor: colors.surface }]}>          
          <Ionicons name="alert-circle-outline" size={28} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No results</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Try another keyword.</Text>
        </View>
      );
    }

    if (activeFilter === 'all') {
      return (
        <View style={styles.resultsContainer}>
          {renderSection('Invoices', 'invoices', invoiceResults)}
          {renderSection('Customers', 'customers', customerResults)}
          {renderSection('Products', 'products', productResults)}
          {renderSection('Receipts', 'receipts', receiptResults)}
        </View>
      );
    }

    const filteredItems =
      activeFilter === 'invoices'
        ? invoiceResults
        : activeFilter === 'customers'
          ? customerResults
          : activeFilter === 'products'
            ? productResults
            : receiptResults;

    return (
      <View style={styles.resultsContainer}>
        {filteredItems.map((item) => renderResultRow(activeFilter, item))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>      
      <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>        
        <Ionicons name="search-outline" size={18} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search invoices, customers, products..."
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={handleSearchSubmit}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {filters.map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? colors.primary500 : colors.surface,
                  borderColor: isActive ? colors.primary500 : colors.border,
                },
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text
                style={{
                  color: isActive ? 'white' : colors.textSecondary,
                  fontWeight: '600',
                  fontSize: 12,
                }}
              >
                {filter.label} ({filter.count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.resultsScroll}>{renderResults()}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  clearButton: {
    paddingLeft: 6,
  },
  filterRow: {
    marginTop: 14,
    marginBottom: 6,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  resultsScroll: {
    paddingVertical: 12,
    paddingBottom: 24,
  },
  resultsContainer: {
    gap: 12,
  },
  section: {
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionBody: {
    gap: 10,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  resultIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  resultSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  resultMeta: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});
