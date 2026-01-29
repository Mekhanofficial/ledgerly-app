import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { showMessage } from 'react-native-flash-message';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { colors } = useTheme();
  const { loginUser } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await loginUser(email, password);
      // Login successful - navigate to tabs
      router.replace('/(tabs)');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      
      // Check the error message from authService
      if (errorMessage.includes('User not found')) {
        setError('No account found with this email. Please check your email or sign up.');
      } else if (errorMessage.includes('Incorrect password')) {
        setError('Incorrect password. Please try again.');
      } else {
        setError(errorMessage);
      }
      
      // Also show flash message
      showMessage({
        message: 'Login Failed',
        description: errorMessage,
        type: 'danger',
        icon: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
          {/* Header with Logo */}
          <View style={styles.headerContainer}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primary100 }]}>
              <Icon name="receipt" size={width * 0.12} color={colors.primary500} />
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>LEDGERLY</Text>
            <Text style={[styles.tagline, { color: colors.textTertiary }]}>
              Professional Invoice Management
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
              <Icon name="alert-circle-outline" size={20} color={colors.error} style={styles.errorIcon} />
              <View style={styles.errorContent}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                <View style={styles.errorActions}>
                  <TouchableOpacity onPress={clearError}>
                    <Text style={[styles.errorActionText, { color: colors.error }]}>Dismiss</Text>
                  </TouchableOpacity>
                  {error.includes('No account found') && (
                    <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                      <Text style={[styles.errorActionText, { color: colors.primary500 }]}>Create account</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ) : null}

          {/* Login Form */}
          <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.formHeader}>
              <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Sign in to continue to your account
              </Text>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
              <View style={[styles.inputWrapper, { 
                backgroundColor: colors.input,
                borderColor: colors.border,
              }]}>
                <Icon name="email-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    clearError();
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
                <TouchableOpacity disabled={isLoading}>
                  <Text style={[styles.forgotPassword, { color: colors.primary500 }]}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputWrapper, { 
                backgroundColor: colors.input,
                borderColor: colors.border,
              }]}>
                <Icon name="lock-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text, flex: 1 }]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    clearError();
                  }}
                  secureTextEntry={secureText}
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setSecureText(!secureText)}
                  disabled={isLoading}
                >
                  <Icon 
                    name={secureText ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color={colors.textTertiary} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              style={[styles.loginButton, { shadowColor: colors.shadow, opacity: isLoading ? 0.7 : 1 }]} 
              onPress={handleLogin}
              activeOpacity={0.9}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[colors.primary500, colors.primary600]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Sign In</Text>
                    <Icon name="arrow-right" size={20} color="white" style={styles.buttonIcon} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or</Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </View>

            {/* Google Sign In */}
            <TouchableOpacity 
              style={[styles.googleButton, { borderColor: colors.border }]}
              disabled={isLoading}
            >
              <Icon name="google" size={20} color="#DB4437" />
              <Text style={[styles.googleButtonText, { color: colors.text }]}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Don&apos;t have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup')} disabled={isLoading}>
                <Text style={[styles.footerLink, { color: colors.primary500 }]}>
                  Sign up
                </Text>
              </TouchableOpacity>
            </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: width * 0.06,
    paddingTop: height * 0.02,
    paddingBottom: 20,
    minHeight: height,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: height * 0.04,
    marginTop: height * 0.02,
  },
  logoContainer: {
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: width * 0.1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: width * 0.08,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: width * 0.035,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  errorIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  errorContent: {
    flex: 1,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 16,
  },
  errorActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  formContainer: {
    borderRadius: 24,
    padding: width * 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  formHeader: {
    marginBottom: 32,
  },
  title: {
    fontSize: width * 0.07,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: width * 0.04,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 0,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});