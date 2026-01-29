// app/(modals)/settings/terms-conditions.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function TermsConditionsScreen() {
  const { colors } = useTheme();

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(err => 
      console.error('Failed to open link:', err)
    );
  };

  const handleAccept = () => {
    router.back();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.headerCard, { backgroundColor: colors.primary50, borderColor: colors.primary100 }]}>
          <Ionicons name="document-text-outline" size={48} color={colors.primary500} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Terms & Conditions
          </Text>
          <Text style={[styles.headerDate, { color: colors.textTertiary }]}>
            Last Updated: December 15, 2025
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            1. Agreement to Terms
          </Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            By accessing and using Ledgerly, you accept and agree to be bound by the terms and provision of this agreement. 
            In addition, when using this app's particular services, you shall be subject to any posted guidelines or rules applicable to such services.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            2. User Accounts
          </Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            When you create an account with us, you must provide information that is accurate, complete, and current at all times. 
            Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service.
            
            {'\n\n'}You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            3. Subscription and Payments
          </Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Some parts of the service are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis. 
            At the end of each period, your subscription will automatically renew under the exact same conditions unless you cancel it.
            
            {'\n\n'}A valid payment method, including credit card or PayPal, is required to process the payment for your subscription.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            4. Intellectual Property
          </Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            The service and its original content, features, and functionality are and will remain the exclusive property of Ledgerly Inc. 
            and its licensors. The service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            5. User Content
          </Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, 
            or other material. You are responsible for the content that you post to the service, including its legality, reliability, and appropriateness.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            6. Termination
          </Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, 
            including without limitation if you breach the Terms.
            
            {'\n\n'}Upon termination, your right to use the service will immediately cease. If you wish to terminate your account, 
            you may simply discontinue using the service.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            7. Limitation of Liability
          </Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            In no event shall Ledgerly Inc., nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, 
            incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, 
            or other intangible losses, resulting from your access to or use of or inability to access or use the service.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            8. Changes to Terms
          </Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
            If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect.
          </Text>
        </View>

        <View style={[styles.linksSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.linksTitle, { color: colors.text }]}>
            Related Documents
          </Text>
          
          <TouchableOpacity 
            style={[styles.linkButton, { borderColor: colors.border }]}
            onPress={() => router.push('/(modals)/settings/privacy-policy')}
          >
            <Ionicons name="lock-closed-outline" size={20} color={colors.primary500} />
            <Text style={[styles.linkText, { color: colors.text }]}>
              Privacy Policy
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
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
            onPress={() => handleOpenLink('https://ledgerly.com/data-processing')}
          >
            <Ionicons name="server-outline" size={20} color={colors.primary500} />
            <Text style={[styles.linkText, { color: colors.text }]}>
              Data Processing Agreement
            </Text>
            <Ionicons name="open-outline" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: colors.primary500 }]}
            onPress={handleAccept}
          >
            <Text style={styles.acceptButtonText}>
              I Accept Terms & Conditions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.printButton, { borderColor: colors.border }]}
            onPress={() => handleOpenLink('https://ledgerly.com/terms.pdf')}
          >
            <Ionicons name="print-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.printButtonText, { color: colors.textSecondary }]}>
              Print Terms
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.noteCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary500} />
          <View style={styles.noteContent}>
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              If you have any questions about these Terms, please contact us at legal@ledgerly.com
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
  section: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
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
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  acceptButton: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  printButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  noteContent: {
    flex: 1,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
});