// components/dashboard/RevenueCard.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { router } from 'expo-router';

interface RevenueCardProps {
  title: string;
  value: string;
  change: string;
  color: string;
  icon: string;
  type?: 'revenue' | 'invoices' | 'customers' | 'receipts' | 'outstanding';
  onPress?: () => void;
}

export default function RevenueCard({ 
  title, 
  value, 
  change, 
  color, 
  icon, 
  type,
  onPress 
}: RevenueCardProps) {
  const { colors } = useTheme();
  const { dashboardStats } = useData();

  // Default press handler based on type
  const handlePress = onPress || (() => {
    if (type) {
      switch (type) {
        case 'revenue':
          router.push('/(tabs)/analytics');
          break;
        case 'invoices':
          router.push('/(tabs)/invoices');
          break;
        case 'customers':
          router.push('/(tabs)/customers');
          break;
        case 'receipts':
          router.push('/(tabs)/receipts');
          break;
        case 'outstanding':
          router.push('/(tabs)/invoices?filter=overdue');
          break;
      }
    }
  });

  // Format value if it's a number
  const formatValue = (val: string) => {
    if (val.startsWith('$')) {
      return val; // Already formatted
    }
    // Check if it's a number
    const num = parseFloat(val);
    if (!isNaN(num)) {
      return num >= 1000 ? `$${(num / 1000).toFixed(1)}k` : `$${num}`;
    }
    return val;
  };

  return (
    <TouchableOpacity 
      onPress={handlePress}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{formatValue(value)}</Text>
      <View style={styles.changeRow}>
        <Text style={[styles.change, { color }]}>{change}</Text>
        <Ionicons 
          name="chevron-forward" 
          size={16} 
          color={colors.textLight} 
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minWidth: 160,
    flex: 1,
    margin: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  change: {
    fontSize: 14,
    fontWeight: '600',
  },
});