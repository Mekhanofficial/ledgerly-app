import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Section */}
        <View style={styles.topSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Ionicons name="receipt-outline" size={60} color={colors.primary500} />
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>LEDGERLY</Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
            Professional Invoice & Inventory Management
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.middleSection}>
          <Text style={[styles.featuresTitle, { color: colors.text }]}>Everything You Need</Text>
          <Text style={[styles.featuresSubtitle, { color: colors.textSecondary }]}>
            Manage your business efficiently
          </Text>
          
          <View style={styles.featuresContainer}>
            <View style={[styles.featureCard, { 
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.shadow
            }]}>
              <View style={[styles.featureIconContainer, { backgroundColor: colors.primary100 }]}>
                <Ionicons name="bar-chart" size={32} color={colors.primary500} />
              </View>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Dashboard Overview</Text>
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Track revenue, payments, and inventory at a glance
              </Text>
            </View>

            <View style={[styles.featureCard, { 
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.shadow
            }]}>
              <View style={[styles.featureIconContainer, { backgroundColor: colors.primary100 }]}>
                <Ionicons name="document-text-outline" size={32} color={colors.primary500} />
              </View>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Quick Invoicing</Text>
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Create professional invoices in seconds
              </Text>
            </View>

            <View style={[styles.featureCard, { 
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.shadow
            }]}>
              <View style={[styles.featureIconContainer, { backgroundColor: colors.primary100 }]}>
                <Ionicons name="phone-portrait" size={32} color={colors.primary500} />
              </View>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Mobile Receipts</Text>
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Generate and send receipts on the go
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, { shadowColor: colors.shadow }]}
              onPress={() => router.push('/(auth)/login')}
            >
              <LinearGradient
                colors={[colors.primary500, colors.primary600]}
                style={styles.buttonGradient}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryButton, 
                { 
                  borderColor: colors.primary500, 
                  backgroundColor: colors.surface 
                }
              ]}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary500 }]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            By continuing, you agree to our{' '}
            <Text style={[styles.footerLink, { color: colors.primary500 }]}>Terms</Text> &{' '}
            <Text style={[styles.footerLink, { color: colors.primary500 }]}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.05,
    paddingBottom: 40,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width * 0.8,
  },
  middleSection: {
    marginBottom: 40,
  },
  featuresTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  featuresSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  featuresContainer: {
    gap: 16,
  },
  featureCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  featureIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSection: {
    marginTop: 'auto',
  },
  buttonsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});