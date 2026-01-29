// app/(modals)/settings/privacy-policy.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();
  const [privacySettings, setPrivacySettings] = useState({
    analytics: true,
    personalizedAds: false,
    dataSharing: true,
    emailUpdates: true,
  });

  const handleSettingToggle = async (setting: string, value: boolean) => {
    const updated = { ...privacySettings, [setting]: value };
    setPrivacySettings(updated);
    try {
      await AsyncStorage.setItem('privacySettings', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    }
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(err => 
      console.error('Failed to open link:', err)
    );
  };

  const handleExportData = () => {
    // This would trigger data export
    console.log('Export data requested');
  };

  const handleDeleteData = () => {
    // This would trigger data deletion
    console.log('Delete data requested');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.headerCard, { backgroundColor: colors.primary50, borderColor: colors.primary100 }]}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.primary500} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Privacy Policy
          </Text>
          <Text style={[styles.headerDate, { color: colors.textTertiary }]}>
            Last Updated: December 15, 2025
          </Text>
        </View>

        <View style={styles.privacyControls}>
          <Text style={[styles.controlsTitle, { color: colors.text }]}>
            Your Privacy Choices
          </Text>
          
          <View style={[styles.controlCard, { backgroundColor: colors.surface }]}>
            <View style={styles.controlItem}>
              <View style={styles.controlLeft}>
                <Ionicons name="analytics-outline" size={24} color={colors.primary500} />
                <View>
                  <Text style={[styles.controlTitle, { color: colors.text }]}>
                    Analytics & Usage Data
                  </Text>
                  <Text style={[styles.controlDescription, { color: colors.textTertiary }]}>
                    Help us improve the app by sharing usage statistics
                  </Text>
                </View>
              </View>
              <Switch
                value={privacySettings.analytics}
                onValueChange={(value) => handleSettingToggle('analytics', value)}
                trackColor={{ false: colors.border, true: colors.primary300 }}
                thumbColor={privacySettings.analytics ? colors.primary500 : colors.textLight}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.controlItem}>
              <View style={styles.controlLeft}>
                <Ionicons name="megaphone-outline" size={24} color={colors.primary500} />
                <View>
                  <Text style={[styles.controlTitle, { color: colors.text }]}>
                    Personalized Ads
                  </Text>
                  <Text style={[styles.controlDescription, { color: colors.textTertiary }]}>
                    Show personalized advertisements based on your usage
                  </Text>
                </View>
              </View>
              <Switch
                value={privacySettings.personalizedAds}
                onValueChange={(value) => handleSettingToggle('personalizedAds', value)}
                trackColor={{ false: colors.border, true: colors.primary300 }}
                thumbColor={privacySettings.personalizedAds ? colors.primary500 : colors.textLight}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.controlItem}>
              <View style={styles.controlLeft}>
                <Ionicons name="share-social-outline" size={24} color={colors.primary500} />
                <View>
                  <Text style={[styles.controlTitle, { color: colors.text }]}>
                    Data Sharing with Partners
                  </Text>
                  <Text style={[styles.controlDescription, { color: colors.textTertiary }]}>
                    Share anonymized data with trusted partners
                  </Text>
                </View>
              </View>
              <Switch
                value={privacySettings.dataSharing}
                onValueChange={(value) => handleSettingToggle('dataSharing', value)}
                trackColor={{ false: colors.border, true: colors.primary300 }}
                thumbColor={privacySettings.dataSharing ? colors.primary500 : colors.textLight}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.controlItem}>
              <View style={styles.controlLeft}>
                <Ionicons name="mail-outline" size={24} color={colors.primary500} />
                <View>
                  <Text style={[styles.controlTitle, { color: colors.text }]}>
                    Email Updates & News
                  </Text>
                  <Text style={[styles.controlDescription, { color: colors.textTertiary }]}>
                    Receive updates about new features and improvements
                  </Text>
                </View>
              </View>
              <Switch
                value={privacySettings.emailUpdates}
                onValueChange={(value) => handleSettingToggle('emailUpdates', value)}
                trackColor={{ false: colors.border, true: colors.primary300 }}
                thumbColor={privacySettings.emailUpdates ? colors.primary500 : colors.textLight}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Information We Collect
          </Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            We collect information to provide better services to all our users. The information we collect includes:
            
            {'\n\n'}• Account Information: Your name, email address, phone number, and profile picture.
            {'\n'}• Business Data: Your invoices, customers, products, and financial information.
            {'\n'}• Usage Data: How you use our app, including features you use and time spent.
            {'\n'}• Device Information: Device type, operating system, and app version.
            {'\n'}• Location Data: General location information for regional features.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            How We Use Your Information
          </Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            We use the information we collect to:
            
            {'\n\n'}• Provide, maintain, and improve our services
            {'\n'}• Develop new features and services
            {'\n'}• Personalize your experience
            {'\n'}• Communicate with you about updates
            {'\n'}• Ensure security and prevent fraud
            {'\n'}• Comply with legal obligations
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Data Security
          </Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            We take data security seriously. We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage.
            
            {'\n\n'}All data is encrypted in transit and at rest. We regularly review our security practices and update them as needed.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Your Rights
          </Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            You have the right to:
            
            {'\n\n'}• Access your personal data
            {'\n'}• Correct inaccurate data
            {'\n'}• Request deletion of your data
            {'\n'}• Object to data processing
            {'\n'}• Request data portability
            {'\n'}• Withdraw consent at any time
          </Text>

          <View style={styles.rightsActions}>
            <TouchableOpacity
              style={[styles.rightsButton, { backgroundColor: colors.primary500 }]}
              onPress={handleExportData}
            >
              <Ionicons name="download-outline" size={20} color="white" />
              <Text style={styles.rightsButtonText}>Export My Data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rightsButton, { borderColor: colors.border }]}
              onPress={handleDeleteData}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={[styles.rightsButtonText, { color: colors.error }]}>
                Delete My Data
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.linksSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.linksTitle, { color: colors.text }]}>
            Related Documents
          </Text>
          
          <TouchableOpacity 
            style={[styles.linkButton, { borderColor: colors.border }]}
            onPress={() => handleOpenLink('https://ledgerly.com/terms')}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.primary500} />
            <Text style={[styles.linkText, { color: colors.text }]}>
              Terms & Conditions
            </Text>
            <Ionicons name="open-outline" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.linkButton, { borderColor: colors.border }]}
            onPress={() => handleOpenLink('https://ledgerly.com/cookie-policy')}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary500} />
            <Text style={[styles.linkText, { color: colors.text }]}>
              Cookie Policy
            </Text>
            <Ionicons name="open-outline" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.linkButton, { borderColor: colors.border }]}
            onPress={() => handleOpenLink('https://ledgerly.com/security')}
          >
            <Ionicons name="lock-closed-outline" size={20} color={colors.primary500} />
            <Text style={[styles.linkText, { color: colors.text }]}>
              Security Overview
            </Text>
            <Ionicons name="open-outline" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.contactSection, { backgroundColor: colors.surface }]}>
          <Ionicons name="mail-outline" size={24} color={colors.primary500} />
          <View style={styles.contactContent}>
            <Text style={[styles.contactTitle, { color: colors.text }]}>
              Contact Us
            </Text>
            <Text style={[styles.contactText, { color: colors.textSecondary }]}>
              If you have questions about this Privacy Policy or how we handle your data, please contact our Data Protection Officer at:
              
              {'\n\n'}privacy@ledgerly.com
              {'\n\n'}Ledgerly Inc.
              {'\n'}123 Privacy Street
              {'\n'}San Francisco, CA 94107
              {'\n'}United States
            </Text>
          </View>
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
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerDate: {
    fontSize: 14,
    textAlign: 'center',
  },
  privacyControls: {
    marginBottom: 24,
  },
  controlsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  controlCard: {
    borderRadius: 12,
    padding: 16,
  },
  controlItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  controlLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  controlTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  controlDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  rightsActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  rightsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  rightsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  linksSection: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  linksTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  contactSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderRadius: 12,
    gap: 16,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    lineHeight: 22,
  },
});