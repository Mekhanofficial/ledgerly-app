import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { showMessage } from 'react-native-flash-message';
import { useTheme } from '@/context/ThemeContext';
import { requestPasswordReset } from '@/services/authServices';

const { width, height } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await requestPasswordReset(normalizedEmail);

    if (result.success) {
      setSubmitted(true);
      setEmail(normalizedEmail);
      showMessage({
        message: 'Reset link sent',
        description: 'Check your email for password reset instructions.',
        type: 'success',
        icon: 'success',
      });
    } else {
      setError(result.message);
      showMessage({
        message: 'Unable to send reset link',
        description: result.message,
        type: 'danger',
        icon: 'danger',
      });
    }

    setIsLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>      
      <View style={styles.background} pointerEvents="none">
        <LinearGradient
          colors={[colors.primary50, colors.background, colors.primary100]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.glow,
            {
              backgroundColor: colors.primary500 + '22',
              top: -50,
              right: -40,
            },
          ]}
        />
        <View
          style={[
            styles.glowSmall,
            {
              backgroundColor: colors.info + '18',
              bottom: 80,
              left: -30,
            },
          ]}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.headerContainer}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary500 + '20' }]}>
              <Icon name="lock-reset" size={26} color={colors.primary600} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Forgot Password</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Enter your email to receive a reset link</Text>
          </View>

          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
              <Icon name="alert-circle-outline" size={18} color={colors.error} style={styles.errorIcon} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>            
            {submitted ? (
              <View style={styles.submittedContainer}>
                <Text style={[styles.submittedText, { color: colors.textSecondary }]}>If an account exists for</Text>
                <Text style={[styles.submittedEmail, { color: colors.text }]}>{email}</Text>
                <Text style={[styles.submittedText, { color: colors.textSecondary }]}>we have sent a reset link.</Text>

                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: colors.border }]}
                  onPress={() => {
                    setSubmitted(false);
                    setEmail('');
                  }}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Send another link</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.border }]}>                    
                    <Icon name="email-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="you@example.com"
                      placeholderTextColor={colors.textTertiary}
                      value={email}
                      onChangeText={(value) => {
                        setEmail(value);
                        setError('');
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, { shadowColor: colors.shadow, opacity: isLoading ? 0.7 : 1 }]}
                  onPress={handleSubmit}
                  activeOpacity={0.9}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={[colors.primary500, colors.primary600]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryButtonGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Send reset link</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.backLink}
              onPress={() => router.push('/(auth)/login')}
              disabled={isLoading}
            >
              <Text style={[styles.backLinkText, { color: colors.primary500 }]}>Back to login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  glowSmall: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: width * 0.07,
    paddingTop: height * 0.06,
    paddingBottom: 32,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: width * 0.07,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: width * 0.04,
    textAlign: 'center',
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: width * 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 54,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  primaryButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backLink: {
    marginTop: 18,
    alignItems: 'center',
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 18,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  submittedContainer: {
    alignItems: 'center',
    gap: 6,
  },
  submittedText: {
    fontSize: 14,
    textAlign: 'center',
  },
  submittedEmail: {
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 18,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
