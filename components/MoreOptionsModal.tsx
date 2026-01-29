// components/MoreOptionsModal.tsx
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export interface MoreOption {
  id: string;
  icon: string;
  label: string;
  screen?: string;
  onPress?: () => void;
}

interface MoreOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  options?: MoreOption[];
}

export default function MoreOptionsModal({ 
  visible, 
  onClose, 
  options 
}: MoreOptionsModalProps) {
  const { colors, toggleTheme, isDark } = useTheme();
  
  const defaultOptions: MoreOption[] = [
    {
      id: '1',
      icon: 'receipt-outline',
      label: 'Receipts',
      screen: '/(more)/receipt',
    },
    {
      id: '2',
      icon: 'people-outline',
      label: 'Customers',
      screen: '/(more)/customer',
    },
    {
      id: '3',
      icon: 'stats-chart-outline',
      label: 'Reports',
      screen: '/(more)/reports',
    },
        {
      id: '4',
      icon: isDark ? 'sunny-outline' : 'moon-outline',
      label: isDark ? 'Light Mode' : 'Dark Mode',
      onPress: toggleTheme,
    },
    {
      id: '5',
      icon: 'help-circle-outline',
      label: 'Help & Support',
      screen: '/(modals)/help',
    },
    {
      id: '6',
      icon: 'chatbubble-ellipses-outline',
      label: 'Live Chat',
      screen: '/(modals)/live-chat',
    },
    {
      id: '7',
      icon: 'settings-outline',
      label: 'Settings',
      screen: '/(modals)/settings',
    },
    {
      id: '8',
      icon: 'log-out-outline',
      label: 'Logout',
      onPress: () => {
        console.log('Logout pressed');
      },
    },
  ];

  const modalOptions = options || defaultOptions;

  const handleOptionPress = (option: MoreOption) => {
    onClose();
    if (option.screen) {
      router.push(option.screen as any);
    } else if (option.onPress) {
      option.onPress();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>More Options</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            {modalOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionItem, { borderBottomColor: colors.border }]}
                onPress={() => handleOptionPress(option)}
              >
                <View style={[styles.optionIconContainer, { backgroundColor: colors.primary50 }]}>
                  <Ionicons name={option.icon as any} size={24} color={colors.primary500} />
                </View>
                <Text style={[styles.optionLabel, { color: colors.text }]}>{option.label}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 30,
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
  closeButton: {
    padding: 8,
  },
  optionsList: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
});
