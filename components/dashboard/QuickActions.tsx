// components/dashboard/QuickActions.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { useUser } from '@/context/UserContext';
import { hasRole, ROLE_GROUPS, normalizeRole } from '@/utils/roleAccess';

const actions = [
  {
    id: '1',
    icon: 'document-text-outline' as const,
    label: 'Create Invoice',
    route: '/(modals)/create-invoice',
  },
  {
    id: '2',
    icon: 'receipt-outline' as const,
    label: 'Generate Receipt',
    route: '/(modals)/create-receipt',
  },
  {
    id: '3',
    icon: 'add-circle-outline' as const,
    label: 'Add Product',
    route: '/(modals)/add-product',
  },
  {
    id: '4',
    icon: 'cube-outline' as const,
    label: 'View Inventory',
    route: '/(tabs)/inventory',
  },
];

export default function QuickActions() {
  const { colors } = useTheme();
  const { user } = useUser();
  const role = normalizeRole(user?.role);
  const isClient = role === 'client';
  const canAccessReceipts = hasRole(role, ROLE_GROUPS.reports);
  const canManageInventory = hasRole(role, ROLE_GROUPS.inventoryManage);
  const canViewInventory = hasRole(role, ROLE_GROUPS.business);

  if (isClient) {
    return null;
  }

  const filteredActions = actions.filter((action) => {
    if (action.id === '2' && !canAccessReceipts) return false;
    if (action.id === '3' && !canManageInventory) return false;
    if (action.id === '4' && !canViewInventory) return false;
    return true;
  });

  const getColor = (id: string) => {
    switch (id) {
      case '1': return colors.primary500;
      case '2': return colors.success;
      case '3': return colors.warning;
      case '4': return colors.info;
      default: return colors.primary500;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Quick Actions</Text>
      <View style={styles.grid}>
        {filteredActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.actionButton, 
              { 
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.text,
              }
            ]}
            onPress={() => router.push(action.route as any)}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${getColor(action.id)}15` }]}>
              <Ionicons name={action.icon} size={24} color={getColor(action.id)} />
            </View>
            <Text style={[styles.label, { color: colors.text }]}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    width: '48%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
