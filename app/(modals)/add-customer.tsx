import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { useData } from '@/context/DataContext';
import { showMessage } from 'react-native-flash-message';

export default function AddCustomerScreen() {
  const { colors } = useTheme();
  const { createCustomer } = useData();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [loading, setLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Customer name is required');
      return false;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSaveCustomer = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const customerData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        company: company.trim(),
        address: address.trim(),
        notes: notes.trim(),
        status,
        outstanding: 0,
        totalSpent: 0,
        lastTransaction: 'Never',
      };

      const customerId = await createCustomer(customerData);
      


      
      showMessage({
        message: "Success",
        description: "Customer added successfully!",
        type: "success",
        icon: "success",
        onPress: () => {
          router.back();
          router.push(`/(modals)/customer-detail?id=${customerId}`);
        }
      });

      resetForm();
      router.back();
// ...

    } catch (error) {
      Alert.alert('Error', 'Failed to add customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setAddress('');
    setNotes('');
    setStatus('active');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Add Customer</Text>
          <TouchableOpacity onPress={handleSaveCustomer} disabled={loading}>
            <Text style={[styles.saveButton, { color: loading ? colors.textTertiary : colors.primary500 }]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Customer Form */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Customer Name <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter customer name"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Company</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter company name (optional)"
              placeholderTextColor={colors.textTertiary}
              value={company}
              onChangeText={setCompany}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter email address"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Phone</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textTertiary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Status</Text>
            <TouchableOpacity 
              style={[styles.statusSelector, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setShowStatusModal(true)}
            >
              <View style={styles.statusContent}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: status === 'active' ? colors.success : colors.textTertiary }
                ]} />
                <Text style={[styles.statusText, { color: colors.text }]}>
                  {status === 'active' ? 'Active' : 'Inactive'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter address (optional)"
              placeholderTextColor={colors.textTertiary}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Additional notes (optional)"
              placeholderTextColor={colors.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]} 
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.saveButtonFull, { 
              backgroundColor: loading ? colors.primary300 : colors.primary500,
              opacity: loading ? 0.7 : 1
            }]}
            onPress={handleSaveCustomer}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.saveButtonText}>Saving...</Text>
            ) : (
              <>
                <Ionicons name="person-add-outline" size={20} color="white" />
                <Text style={styles.saveButtonText}>Add Customer</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Status Selection Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.statusOption,
                { borderBottomColor: colors.border },
                status === 'active' && { backgroundColor: colors.primary50 }
              ]}
              onPress={() => {
                setStatus('active');
                setShowStatusModal(false);
              }}
            >
              <View style={styles.statusOptionContent}>
                <View style={[styles.statusOptionDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.statusOptionText, { color: colors.text }]}>Active</Text>
              </View>
              {status === 'active' && (
                <Ionicons name="checkmark" size={20} color={colors.primary500} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusOption,
                { borderBottomColor: colors.border },
                status === 'inactive' && { backgroundColor: colors.primary50 }
              ]}
              onPress={() => {
                setStatus('inactive');
                setShowStatusModal(false);
              }}
            >
              <View style={styles.statusOptionContent}>
                <View style={[styles.statusOptionDot, { backgroundColor: colors.textTertiary }]} />
                <Text style={[styles.statusOptionText, { color: colors.text }]}>Inactive</Text>
              </View>
              {status === 'inactive' && (
                <Ionicons name="checkmark" size={20} color={colors.primary500} />
              )}
            </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  statusSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 30,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonFull: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  spacer: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  statusOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusOptionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});