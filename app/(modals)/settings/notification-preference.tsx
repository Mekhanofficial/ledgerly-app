// app/(modals)/settings/notification-preference.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  category: 'payment' | 'invoice' | 'inventory' | 'system' | 'marketing';
}

export default function NotificationPreferenceScreen() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<NotificationSetting[]>([
    { id: '1', title: 'Payment Notifications', description: 'Get notified when payments are received', enabled: true, category: 'payment' },
    { id: '2', title: 'Invoice Alerts', description: 'Alerts for new, due, and overdue invoices', enabled: true, category: 'invoice' },
    { id: '3', title: 'Low Stock Alerts', description: 'Get notified when inventory is running low', enabled: true, category: 'inventory' },
    { id: '4', title: 'System Updates', description: 'Important app updates and maintenance', enabled: true, category: 'system' },
    { id: '5', title: 'Marketing Emails', description: 'News, tips, and promotional offers', enabled: false, category: 'marketing' },
    { id: '6', title: 'New Features', description: 'Updates about new features and improvements', enabled: true, category: 'system' },
    { id: '7', title: 'Security Alerts', description: 'Important security notifications', enabled: true, category: 'system' },
    { id: '8', title: 'Daily Summary', description: 'Daily business summary and reports', enabled: false, category: 'marketing' },
  ]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('notificationSettings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const saveSettings = async (newSettings: NotificationSetting[]) => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const toggleSetting = (id: string) => {
    const updated = settings.map(setting =>
      setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
    );
    setSettings(updated);
    saveSettings(updated);
  };

  const toggleAll = (enabled: boolean) => {
    const updated = settings.map(setting => ({ ...setting, enabled }));
    setSettings(updated);
    saveSettings(updated);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payment': return 'cash-outline';
      case 'invoice': return 'document-text-outline';
      case 'inventory': return 'cube-outline';
      case 'system': return 'settings-outline';
      case 'marketing': return 'megaphone-outline';
      default: return 'notifications-outline';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'payment': return colors.success;
      case 'invoice': return colors.primary500;
      case 'inventory': return colors.warning;
      case 'system': return colors.info;
      case 'marketing': return colors.primary400;
      default: return colors.primary500;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.headerCard, { backgroundColor: colors.primary50, borderColor: colors.primary100 }]}>
          <Ionicons name="notifications-outline" size={32} color={colors.primary500} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Notification Preferences
          </Text>
          <Text style={[styles.headerDescription, { color: colors.textSecondary }]}>
            Choose what notifications you want to receive and how you want to receive them
          </Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => toggleAll(true)}
          >
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={[styles.quickActionText, { color: colors.text }]}>Enable All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => toggleAll(false)}
          >
            <Ionicons name="close-circle" size={24} color={colors.error} />
            <Text style={[styles.quickActionText, { color: colors.text }]}>Disable All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsList}>
          {settings.map((setting) => (
            <View
              key={setting.id}
              style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.settingHeader}>
                <View style={styles.settingLeft}>
                  <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(setting.category) + '20' }]}>
                    <Ionicons 
                      name={getCategoryIcon(setting.category) as any} 
                      size={20} 
                      color={getCategoryColor(setting.category)} 
                    />
                  </View>
                  <View>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                      {setting.title}
                    </Text>
                    <Text style={[styles.settingDescription, { color: colors.textTertiary }]}>
                      {setting.description}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={setting.enabled}
                  onValueChange={() => toggleSetting(setting.id)}
                  trackColor={{ false: colors.border, true: colors.primary300 }}
                  thumbColor={setting.enabled ? colors.primary500 : colors.textLight}
                />
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.noteCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            Notification changes may take a few minutes to take effect
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  headerCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingsList: {
    gap: 12,
    marginBottom: 24,
  },
  settingCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
