import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { router } from 'expo-router';
import ModalHeader from '@/components/ModalHeader';

export default function HelpScreen() {
  const { colors } = useTheme();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const openExternal = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert('Unable to open link', 'Please try again later.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open link', 'Please try again later.');
    }
  };

  const faqs = [
    {
      question: 'How do I create an invoice?',
      answer: 'Navigate to the Invoices tab, tap the + button, fill in customer details, add items, and tap "Create Invoice". You can then send it via email or download as PDF.',
    },
    {
      question: 'How do I manage my inventory?',
      answer: 'Go to the Inventory tab to add, edit, or delete items. You can track stock levels, set reorder points, and manage product categories.',
    },
    {
      question: 'Can I export my data?',
      answer: 'Yes! Go to Settings → Data & Storage → Export Data. You can export in CSV, PDF, or Excel formats for accounting purposes.',
    },
    {
      question: 'How do I add payment methods?',
      answer: 'Navigate to Settings → Account → Payment Methods to add credit cards, bank accounts, or digital wallets for accepting payments.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, we use bank-level encryption (AES-256) and comply with GDPR regulations. Your financial data is never shared with third parties.',
    },
  ];

  const contactOptions = [
    {
      icon: 'chatbubble-ellipses-outline',
      label: 'Live Chat',
      description: 'Chat with our support team',
      action: () => router.push('/(modals)/live-chat'),
    },
    {
      icon: 'mail-outline',
      label: 'Email Support',
      description: 'support@ledgerly.com',
      action: () => openExternal('mailto:support@ledgerly.com'),
    },
    {
      icon: 'call-outline',
      label: 'Call Us',
      description: '+1 (555) 123-4567',
      action: () => openExternal('tel:+15551234567'),
    },
    {
      icon: 'document-text-outline',
      label: 'Knowledge Base',
      description: 'Browse articles and guides',
      action: () => openExternal('https://ledgerly.com/help'),
    },
  ];

  const quickGuides = [
    {
      title: 'Getting Started Guide',
      description: 'Learn the basics of Ledgerly',
      icon: 'rocket-outline',
      url: 'https://ledgerly.com/guides/getting-started',
    },
    {
      title: 'Video Tutorials',
      description: 'Watch step-by-step videos',
      icon: 'play-circle-outline',
      url: 'https://ledgerly.com/tutorials',
    },
    {
      title: 'Accounting Tips',
      description: 'Best practices for small businesses',
      icon: 'bulb-outline',
      url: 'https://ledgerly.com/resources/accounting-tips',
    },
    {
      title: 'Tax Preparation',
      description: 'Prepare for tax season',
      icon: 'calculator-outline',
      url: 'https://ledgerly.com/resources/tax-prep',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ModalHeader
        title="Help & Support"
        subtitle="We're here to help you succeed"
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Get in Touch</Text>
          <View style={styles.contactGrid}>
            {contactOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.contactCard, { backgroundColor: colors.surface }]}
                onPress={option.action}
              >
                <View style={[styles.contactIconContainer, { backgroundColor: colors.primary50 }]}>
                  <Ionicons name={option.icon as any} size={24} color={colors.primary500} />
                </View>
                <Text style={[styles.contactLabel, { color: colors.text }]}>{option.label}</Text>
                <Text style={[styles.contactDescription, { color: colors.textTertiary }]}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
          <View style={[styles.faqContainer, { backgroundColor: colors.surface }]}>
            {faqs.map((faq, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.faqItem, { 
                  borderBottomWidth: index < faqs.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border 
                }]}
                onPress={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
              >
                <View style={styles.faqQuestion}>
                  <Text style={[styles.faqQuestionText, { color: colors.text }]}>{faq.question}</Text>
                  <Ionicons
                    name={expandedFAQ === index ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textLight}
                  />
                </View>
                {expandedFAQ === index && (
                  <Text style={[styles.faqAnswer, { color: colors.textTertiary }]}>{faq.answer}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Guides */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Guides</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.guidesScroll}>
            {quickGuides.map((guide, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.guideCard, { backgroundColor: colors.surface }]}
                onPress={() => openExternal(guide.url)}
              >
                <View style={[styles.guideIconContainer, { backgroundColor: colors.primary50 }]}>
                  <Ionicons name={guide.icon as any} size={28} color={colors.primary500} />
                </View>
                <Text style={[styles.guideTitle, { color: colors.text }]}>{guide.title}</Text>
                <Text style={[styles.guideDescription, { color: colors.textTertiary }]}>
                  {guide.description}
                </Text>
                <View style={styles.guideArrow}>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary500} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Business Hours */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Support Hours</Text>
          <View style={[styles.hoursCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.hoursRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.hoursDay, { color: colors.text }]}>Monday - Friday</Text>
              <Text style={[styles.hoursTime, { color: colors.textTertiary }]}>9:00 AM - 8:00 PM EST</Text>
            </View>
            <View style={[styles.hoursRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.hoursDay, { color: colors.text }]}>Saturday</Text>
              <Text style={[styles.hoursTime, { color: colors.textTertiary }]}>10:00 AM - 6:00 PM EST</Text>
            </View>
            <View style={styles.hoursRow}>
              <Text style={[styles.hoursDay, { color: colors.text }]}>Sunday</Text>
              <Text style={[styles.hoursTime, { color: colors.textTertiary }]}>12:00 PM - 5:00 PM EST</Text>
            </View>
            <View style={[styles.emergencyNote, { backgroundColor: `${colors.warning}15` }]}>
              <Ionicons name="warning-outline" size={16} color={colors.warning} />
              <Text style={[styles.emergencyText, { color: colors.warning }]}>
                24/7 emergency support available for account-related issues
              </Text>
            </View>
          </View>
        </View>

        {/* Feedback */}
        <View style={styles.footer}>
          <Text style={[styles.feedbackTitle, { color: colors.text }]}>How can we improve?</Text>
          <Text style={[styles.feedbackSubtitle, { color: colors.textTertiary }]}>
            We value your feedback to make Ledgerly better
          </Text>
          <TouchableOpacity
            style={[styles.feedbackButton, { backgroundColor: colors.primary50 }]}
            onPress={() => openExternal('https://ledgerly.com/feedback')}
          >
            <Ionicons name="chatbox-outline" size={20} color={colors.primary500} />
            <Text style={[styles.feedbackButtonText, { color: colors.primary500 }]}>Submit Feedback</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    marginBottom: 16,
    marginLeft: 4,
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  contactCard: {
    width: '48%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  contactIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  contactDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  faqContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  faqItem: {
    padding: 20,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  guidesScroll: {
    marginLeft: -4,
  },
  guideCard: {
    width: 160,
    borderRadius: 16,
    padding: 20,
    marginRight: 12,
  },
  guideIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  guideDescription: {
    fontSize: 13,
    marginBottom: 12,
    flex: 1,
  },
  guideArrow: {
    alignSelf: 'flex-end',
  },
  hoursCard: {
    borderRadius: 16,
    padding: 20,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  hoursDay: {
    fontSize: 15,
    fontWeight: '500',
  },
  hoursTime: {
    fontSize: 15,
  },
  emergencyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  emergencyText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  feedbackSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  feedbackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
