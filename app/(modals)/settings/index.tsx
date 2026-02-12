// app/(modals)/settings/index.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import ModalHeader from '@/components/ModalHeader';
import { useData } from '@/context/DataContext';
import * as Print from 'expo-print';
import { useUser } from '@/context/UserContext';

export default function SettingsScreen() {
  const { colors, isDark, theme, setTheme, toggleTheme } = useTheme();
  const { customers, inventory, invoices, receipts, categories } = useData();
  const { logoutUser } = useUser();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [cacheSize, setCacheSize] = useState('0 MB');
  const [isThemeModalVisible, setIsThemeModalVisible] = useState(false);

  // Load cache size on mount
  useEffect(() => {
    calculateCacheSize();
  }, []);

  const calculateCacheSize = async () => {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const cacheInfo = await FileSystem.getInfoAsync(cacheDir);
        if (cacheInfo.exists) {
          const sizeInMB = cacheInfo.size / (1024 * 1024);
          setCacheSize(`${sizeInMB.toFixed(1)} MB`);
        }
      }
    } catch (error) {
      console.log('Error calculating cache size:', error);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear all cached data? This may improve app performance.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const cacheDir = FileSystem.cacheDirectory;
              if (cacheDir) {
                await FileSystem.deleteAsync(cacheDir, { idempotent: true });
                await FileSystem.makeDirectoryAsync(cacheDir);
                setCacheSize('0 MB');
                Alert.alert('Success', 'Cache cleared successfully');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    Alert.alert(
      'Export Data',
      'Choose export format:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'CSV',
          onPress: () => exportData('csv'),
        },
        {
          text: 'PDF',
          onPress: () => exportData('pdf'),
        },
        {
          text: 'Excel',
          onPress: () => exportData('xlsx'),
        },
      ]
    );
  };

  const exportData = async (format: string) => {
    try {
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        customers,
        products: inventory,
        invoices,
        receipts,
        categories,
      };

      const escapeCsv = (value: string) => {
        if (value.includes('"') || value.includes(',') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      const toCsv = (rows: Record<string, any>[], columns: string[]) => {
        const header = columns.join(',');
        const body = rows
          .map((row) =>
            columns
              .map((key) => {
                const raw = row[key];
                const value = raw === null || raw === undefined ? '' : String(raw);
                return escapeCsv(value);
              })
              .join(',')
          )
          .join('\n');
        return `${header}\n${body}`;
      };

      const csvSections = [
        {
          title: 'Customers',
          columns: ['id', 'name', 'email', 'phone', 'company', 'outstanding', 'totalSpent'],
          rows: customers,
        },
        {
          title: 'Products',
          columns: ['id', 'name', 'sku', 'price', 'quantity', 'category'],
          rows: inventory,
        },
        {
          title: 'Invoices',
          columns: ['id', 'number', 'customer', 'amount', 'status', 'issueDate', 'dueDate'],
          rows: invoices,
        },
        {
          title: 'Receipts',
          columns: ['id', 'number', 'customer', 'amount', 'status', 'time'],
          rows: receipts,
        },
        {
          title: 'Categories',
          columns: ['id', 'name', 'description'],
          rows: categories,
        },
      ];

      const csvContent = csvSections
        .map((section) => `# ${section.title}\n${toCsv(section.rows, section.columns)}`)
        .join('\n\n');

      const fileName = `ledgerly_export_${Date.now()}.${format}`;
      let fileUri = FileSystem.cacheDirectory + fileName;

      if (format === 'pdf') {
        const html = `
          <html>
            <head>
              <meta charset="UTF-8" />
              <style>
                body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
                h2 { margin-top: 24px; }
                pre { white-space: pre-wrap; font-size: 12px; }
              </style>
            </head>
            <body>
              <h1>Ledgerly Export</h1>
              <p>Generated at: ${exportPayload.exportedAt}</p>
              <pre>${JSON.stringify(exportPayload, null, 2)}</pre>
            </body>
          </html>
        `;
        const { uri } = await Print.printToFileAsync({ html });
        fileUri = uri;
      } else {
        await FileSystem.writeAsStringAsync(fileUri, csvContent);
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType:
            format === 'pdf'
              ? 'application/pdf'
              : format === 'csv'
              ? 'text/csv'
              : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Export Ledgerly Data',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleBackupNow = async () => {
    try {
      // Simulate backup process
      Alert.alert('Backup Started', 'Your data is being backed up to the cloud...');
      
      // In real app, implement actual backup logic here
      setTimeout(() => {
        Alert.alert('Backup Complete', 'Your data has been successfully backed up.');
      }, 2000);
    } catch (error) {
      Alert.alert('Error', 'Backup failed. Please try again.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logoutUser();
            } finally {
              router.replace('/(auth)/login');
            }
          },
        },
      ]
    );
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'System';
    }
  };

  // Load saved settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedNotifications = await AsyncStorage.getItem('notificationsEnabled');
      const savedBiometric = await AsyncStorage.getItem('biometricEnabled');
      const savedAutoBackup = await AsyncStorage.getItem('autoBackupEnabled');
      
      if (savedNotifications !== null) setNotificationsEnabled(JSON.parse(savedNotifications));
      if (savedBiometric !== null) setBiometricEnabled(JSON.parse(savedBiometric));
      if (savedAutoBackup !== null) setAutoBackupEnabled(JSON.parse(savedAutoBackup));
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  // Save settings when they change
  useEffect(() => {
    saveSettings();
  }, [notificationsEnabled, biometricEnabled, autoBackupEnabled]);

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled));
      await AsyncStorage.setItem('biometricEnabled', JSON.stringify(biometricEnabled));
      await AsyncStorage.setItem('autoBackupEnabled', JSON.stringify(autoBackupEnabled));
    } catch (error) {
      console.log('Error saving settings:', error);
    }
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: 'person-outline',
          label: 'Profile Information',
          description: 'Update your personal details',
          action: () => router.push('/(modals)/profile'),
          showChevron: true,
        },
        {
          icon: 'shield-checkmark-outline',
          label: 'Security',
          description: 'Password, 2FA, and security settings',
          action: () => router.push('/(modals)/settings/security'),
          showChevron: true,
        },
        {
          icon: 'card-outline',
          label: 'Payment Methods',
          description: 'Manage your payment options',
          action: () => router.push('/(modals)/settings/payment-method'),
          showChevron: true,
        },
        {
          icon: 'color-palette-outline',
          label: 'Templates',
          description: 'Invoice and receipt styles',
          action: () => router.push('/(modals)/settings/templates'),
          showChevron: true,
        },
        {
          icon: 'notifications-outline',
          label: 'Notification Preferences',
          description: 'Customize your notifications',
          action: () => router.push('/(modals)/settings/notification-preference'),
          showChevron: true,
        },
      ],
    },
    {
      title: 'Appearance',
      items: [
        {
          icon: isDark ? 'sunny' : 'moon',
          label: 'Dark Mode',
          description: isDark ? 'Currently using dark theme' : 'Currently using light theme',
          rightElement: (
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary300 }}
              thumbColor={isDark ? colors.primary500 : colors.textLight}
            />
          ),
        },
        {
          icon: 'contrast-outline',
          label: 'Theme',
          description: getThemeLabel(),
          action: () => setIsThemeModalVisible(true),
          showChevron: true,
          rightElement: (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: colors.textTertiary, marginRight: 8, fontSize: 14 }}>
                {getThemeLabel()}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </View>
          ),
        },
        {
          icon: 'text-outline',
          label: 'Font Size',
          description: 'Medium',
          action: () => router.push('/(modals)/settings/font-size'),
          showChevron: true,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'notifications-outline',
          label: 'Push Notifications',
          description: 'Receive alerts and updates',
          rightElement: (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary300 }}
              thumbColor={notificationsEnabled ? colors.primary500 : colors.textLight}
            />
          ),
        },
        {
          icon: 'finger-print-outline',
          label: 'Biometric Login',
          description: 'Use fingerprint or face ID',
          action: () => router.push('/(modals)/settings/biometric-login'),
          showChevron: true,
          rightElement: (
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: colors.border, true: colors.primary300 }}
              thumbColor={biometricEnabled ? colors.primary500 : colors.textLight}
            />
          ),
        },
        {
          icon: 'language-outline',
          label: 'Language',
          description: 'English (US)',
          action: () => router.push('/(modals)/settings/language'),
          showChevron: true,
        },
        {
          icon: 'cash-outline',
          label: 'Currency',
          description: 'USD ($)',
          action: () => router.push('/(modals)/settings/currency'),
          showChevron: true,
        },
        {
          icon: 'calendar-outline',
          label: 'Date Format',
          description: 'MM/DD/YYYY',
          action: () => router.push('/(modals)/settings/date-format'),
          showChevron: true,
        },
      ],
    },
    {
      title: 'Data & Storage',
      items: [
        {
          icon: 'cloud-upload-outline',
          label: 'Auto Backup',
          description: 'Backup data to cloud automatically',
          rightElement: (
            <Switch
              value={autoBackupEnabled}
              onValueChange={setAutoBackupEnabled}
              trackColor={{ false: colors.border, true: colors.primary300 }}
              thumbColor={autoBackupEnabled ? colors.primary500 : colors.textLight}
            />
          ),
        },
        {
          icon: 'cloud-download-outline',
          label: 'Backup Now',
          description: 'Last backup: Today, 10:30 AM',
          action: handleBackupNow,
          showChevron: false,
        },
        {
          icon: 'trash-outline',
          label: 'Clear Cache',
          description: cacheSize,
          action: handleClearCache,
          showChevron: false,
        },
        {
          icon: 'download-outline',
          label: 'Export Data',
          description: 'Download your data in CSV/PDF/Excel',
          action: handleExportData,
          showChevron: false,
        },
        {
          icon: 'server-outline',
          label: 'Storage Usage',
          description: '2.1 GB of 5 GB used',
          action: () => router.push('/(modals)/settings/storage-usage'),
          showChevron: true,
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          icon: 'information-circle-outline',
          label: 'About Ledgerly',
          description: `Version ${Constants.expoConfig?.version || '2.4.1'}`,
          action: () => Alert.alert(
            'About Ledgerly',
            `Version: ${Constants.expoConfig?.version || '2.4.1'}\nBuild: ${Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '42'}\n\nLedgerly is a comprehensive financial management app for small businesses.`
          ),
          showChevron: true,
        },
        {
          icon: 'document-text-outline',
          label: 'Terms & Conditions',
          description: 'Legal agreements and policies',
          action: () => router.push('/(modals)/settings/terms-conditions'),
          showChevron: true,
        },
        {
          icon: 'lock-closed-outline',
          label: 'Privacy Policy',
          description: 'How we handle your data',
          action: () => router.push('/(modals)/settings/privacy-policy'),
          showChevron: true,
        },
        {
          icon: 'star-outline',
          label: 'Rate Ledgerly',
          description: 'Leave a review on App Store',
          action: () => Alert.alert('Rate App', 'Thank you for using Ledgerly!'),
          showChevron: true,
        },
        {
          icon: 'share-social-outline',
          label: 'Share App',
          description: 'Share with friends & colleagues',
          action: () => Alert.alert('Share', 'Share Ledgerly with others'),
          showChevron: true,
        },
      ],
    },
  ];

  const ThemeSelectorModal = () => (
    <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
      <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Select Theme</Text>
          <TouchableOpacity onPress={() => setIsThemeModalVisible(false)}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.themeOptions}>
          {[
            { value: 'light', label: 'Light', icon: 'sunny' },
            { value: 'dark', label: 'Dark', icon: 'moon' },
            { value: 'system', label: 'System', icon: 'phone-portrait' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.themeOption,
                { 
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
                theme === option.value && { borderColor: colors.primary500, borderWidth: 2 }
              ]}
              onPress={() => {
                setTheme(option.value as any);
                setIsThemeModalVisible(false);
              }}
            >
              <View style={styles.themeOptionLeft}>
                <View style={[styles.themeIconContainer, { backgroundColor: colors.primary50 }]}>
                  <Ionicons 
                    name={option.icon as any} 
                    size={24} 
                    color={colors.primary500} 
                  />
                </View>
                <View>
                  <Text style={[styles.themeOptionLabel, { color: colors.text }]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.themeOptionDescription, { color: colors.textTertiary }]}>
                    {option.value === 'system' 
                      ? 'Follow device settings' 
                      : `Always use ${option.label.toLowerCase()} theme`}
                  </Text>
                </View>
              </View>
              {theme === option.value && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary500} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ModalHeader
        title="Settings"
        subtitle="Customize your app experience"
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {section.title}
            </Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex < section.items.length - 1 && { 
                      borderBottomWidth: 1, 
                      borderBottomColor: colors.border 
                    },
                  ]}
                  onPress={item.action}
                  disabled={!item.action}
                >
                  <View style={styles.itemLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.primary50 }]}>
                      <Ionicons name={item.icon as any} size={22} color={colors.primary500} />
                    </View>
                    <View style={styles.itemTextContainer}>
                      <Text style={[styles.itemLabel, { color: colors.text }]}>
                        {item.label}
                      </Text>
                      <Text style={[styles.itemDescription, { color: colors.textTertiary }]}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  {item.rightElement || (item.showChevron && (
                    <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
                  ))}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: colors.error + '15' }]} 
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>
              Sign Out of Account
            </Text>
          </TouchableOpacity>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            Ledgerly v{Constants.expoConfig?.version || '2.4.1'} - Build {Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '42'} - (c) 2026 Ledgerly Inc.
          </Text>
        </View>
      </ScrollView>

      {isThemeModalVisible && <ThemeSelectorModal />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 72,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
  },
  footer: {
    padding: 24,
    paddingTop: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  themeOptions: {
    padding: 20,
    gap: 12,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  themeOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  themeOptionDescription: {
    fontSize: 14,
  },
});
