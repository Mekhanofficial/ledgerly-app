import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { router, useLocalSearchParams } from 'expo-router';
import { useData } from '@/context/DataContext';
import { ROLE_GROUPS } from '@/utils/roleAccess';
import { useRoleGuard } from '@/hooks/useRoleGuard';

export default function CustomerDetailScreen() {
  const { colors } = useTheme();
  const { customers, deleteCustomer, getCustomerById } = useData();
  const { id } = useLocalSearchParams();
  const { canAccess } = useRoleGuard(ROLE_GROUPS.business);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) {
      const foundCustomer = getCustomerById(id as string);
      if (foundCustomer) {
        setCustomer(foundCustomer);
      } else {
        // If not found, try to find in customers array
        const found = customers.find(c => c.id === id);
        if (found) {
          setCustomer(found);
        } else {
          Alert.alert('Error', 'Customer not found');
          router.back();
        }
      }
      setLoading(false);
    } else {
      Alert.alert('Error', 'No customer ID provided');
      router.back();
    }
  }, [id, customers]);

  if (!canAccess) {
    return null;
  }

  const handleDelete = () => {
    if (customer) {
      deleteCustomer(customer.id);
      router.back();
    }
  };

  const handleEdit = () => {
    if (customer) {
      router.push(`/(modals)/edit-customer?id=${customer.id}`);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary500} />
          <Text style={[styles.loadingText, { color: colors.text, marginTop: 16 }]}>Loading customer...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!customer) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={[styles.loadingText, { color: colors.text, marginTop: 16 }]}>Customer not found</Text>
          <TouchableOpacity 
            style={[styles.backButton, { marginTop: 20 }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: colors.primary500 }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
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
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => setShowEditModal(true)}
            disabled={loading}
          >
            <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
          
          {customer.company && (
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={20} color={colors.textTertiary} />
              <Text style={[styles.infoText, { color: colors.text }]}>{customer.company}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={colors.textTertiary} />
            <Text style={[styles.infoText, { color: colors.text }]}>{customer.email || 'No email'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color={colors.textTertiary} />
            <Text style={[styles.infoText, { color: colors.text }]}>{customer.phone || 'No phone'}</Text>
          </View>
          
          {customer.address && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={colors.textTertiary} />
              <Text style={[styles.infoText, { color: colors.text }]}>{customer.address}</Text>
            </View>
          )}
        </View>

        {/* Financial Summary */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Financial Summary</Text>
          
          <View style={styles.financialRow}>
            <View style={styles.financialItem}>
              <Text style={[styles.financialLabel, { color: colors.textTertiary }]}>Outstanding Balance</Text>
              <Text style={[
                styles.financialValue,
                { color: customer.outstanding > 0 ? colors.error : colors.success }
              ]}>
                ${customer.outstanding.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.financialItem}>
              <Text style={[styles.financialLabel, { color: colors.textTertiary }]}>Total Spent</Text>
              <Text style={[styles.financialValue, { color: colors.text }]}>
                ${customer.totalSpent.toLocaleString()}
              </Text>
            </View>
          </View>
          
          <View style={styles.lastTransaction}>
            <Text style={[styles.lastTransactionLabel, { color: colors.textTertiary }]}>Last Transaction</Text>
            <Text style={[styles.lastTransactionValue, { color: colors.text }]}>
              {customer.lastTransaction === 'Never' ? 'No transactions yet' : customer.lastTransaction}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {customer.notes && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
            <Text style={[styles.notesText, { color: colors.text }]}>{customer.notes}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: colors.primary500 }]}
            onPress={() => router.push(`/(modals)/create-invoice?customerId=${customer.id}`)}
          >
            <Ionicons name="add-circle-outline" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Create Invoice</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push({
              pathname: '/(modals)/customer-transactions',
              params: { id: customer.id },
            })}
          >
            <Ionicons name="receipt-outline" size={20} color={colors.primary500} />
            <Text style={[styles.secondaryButtonText, { color: colors.primary500 }]}>View Transactions</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Edit/Delete Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEditModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => {
                setShowEditModal(false);
                handleEdit();
              }}
            >
              <Ionicons name="create-outline" size={20} color={colors.text} />
              <Text style={[styles.modalOptionText, { color: colors.text }]}>Edit Customer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => {
                setShowEditModal(false);
                setShowDeleteModal(true);
              }}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={[styles.modalOptionText, { color: colors.error }]}>Delete Customer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={[styles.confirmationOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.confirmationContent, { backgroundColor: colors.surface }]}>
            <Ionicons name="warning-outline" size={48} color={colors.error} style={styles.warningIcon} />
            <Text style={[styles.confirmationTitle, { color: colors.text }]}>Delete Customer</Text>
            <Text style={[styles.confirmationMessage, { color: colors.textTertiary }]}>
              Are you sure you want to delete {customer.name}? This action cannot be undone.
            </Text>
            
            <View style={styles.confirmationButtons}>
              <TouchableOpacity 
                style={[styles.confirmationButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={[styles.confirmationButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmationButton, { backgroundColor: colors.error }]}
                onPress={handleDelete}
              >
                <Text style={styles.confirmationButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  customerName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuButton: {
    padding: 8,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    flex: 1,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  financialItem: {
    flex: 1,
    alignItems: 'center',
  },
  financialLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  financialValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: '100%',
  },
  lastTransaction: {
    alignItems: 'center',
    marginTop: 8,
  },
  lastTransactionLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  lastTransactionValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    margin: 20,
    borderRadius: 16,
    padding: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  confirmationOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationContent: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  warningIcon: {
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationMessage: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  confirmationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
