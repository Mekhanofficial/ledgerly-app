import { useEffect, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { LinearGradient } from 'expo-linear-gradient';

const OTP_LENGTH = 6;

export default function VerifyEmailScreen() {
  const { colors } = useTheme();
  const { verifyEmailOtp, resendEmailOtp } = useUser();
  const params = useLocalSearchParams<{ email?: string; notice?: string; noticeType?: string }>();
  const defaultEmail = typeof params.email === 'string' ? params.email : '';
  const initialMessage = typeof params.notice === 'string' ? params.notice : '';
  const initialNoticeType = typeof params.noticeType === 'string' ? params.noticeType : '';

  const [email, setEmail] = useState(defaultEmail);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [notice, setNotice] = useState(initialNoticeType === 'error' ? '' : initialMessage);
  const [error, setError] = useState(initialNoticeType === 'error' ? initialMessage : '');
  const [isVerified, setIsVerified] = useState(false);
  const [redirectSeconds, setRedirectSeconds] = useState(0);

  useEffect(() => {
    if (!isVerified) return;
    if (redirectSeconds <= 0) {
      router.replace('/login');
      return;
    }

    const timer = setTimeout(() => {
      setRedirectSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isVerified, redirectSeconds]);

  const handleVerify = async () => {
    if (isVerified) return;

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (otp.trim().length !== OTP_LENGTH) {
      setError('Enter the 6-digit verification code');
      return;
    }

    setError('');
    setNotice('');
    setIsLoading(true);

    try {
      const result = await verifyEmailOtp(email.trim().toLowerCase(), otp.trim());
      setNotice(result.message || 'Email verified successfully.');
      setIsVerified(true);
      setRedirectSeconds(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (isVerified) {
      return;
    }

    if (!email.trim()) {
      setError('Email is required to resend a code');
      return;
    }

    setError('');
    setNotice('');
    setIsResending(true);

    try {
      const result = await resendEmailOtp(email.trim().toLowerCase());
      setNotice(result.message || 'Verification code sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.background} pointerEvents="none">
        <LinearGradient
          colors={[colors.pageGradientStart, colors.background, colors.pageGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.glow,
            {
              backgroundColor: colors.glowCyan,
              top: -60,
              right: -45,
            },
          ]}
        />
        <View
          style={[
            styles.glowSmall,
            {
              backgroundColor: colors.glowBlue,
              bottom: 110,
              left: -30,
            },
          ]}
        />
      </View>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primary100 }]}>
              <Icon name="email-check-outline" size={28} color={colors.primary600} />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>Verify Your Email</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter the 6-digit code sent to {email.trim() || 'your email'} to complete account setup.
            </Text>

            {error ? (
              <View style={[styles.banner, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
                <Text style={[styles.bannerText, { color: colors.error }]}>{error}</Text>
              </View>
            ) : null}

            {notice ? (
              <View style={[styles.banner, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
                <Text style={[styles.bannerText, { color: colors.success }]}>{notice}</Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setError('');
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text, backgroundColor: colors.input }
                ]}
                placeholder="you@business.com"
                placeholderTextColor={colors.textTertiary}
                editable={!isLoading && !isVerified}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Verification code</Text>
              <TextInput
                value={otp}
                onChangeText={(value) => {
                  setOtp(value.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH));
                  setError('');
                }}
                keyboardType="number-pad"
                style={[
                  styles.input,
                  styles.otpInput,
                  { borderColor: colors.border, color: colors.text, backgroundColor: colors.input }
                ]}
                placeholder="123456"
                placeholderTextColor={colors.textTertiary}
                editable={!isLoading && !isVerified}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary500, opacity: isLoading ? 0.7 : 1 }]}
              disabled={isLoading || isVerified}
              onPress={handleVerify}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>{isVerified ? 'Verified' : 'Verify Email'}</Text>
              )}
            </TouchableOpacity>

            {isVerified ? (
              <Text style={[styles.redirectText, { color: colors.success }]}>
                Verified successfully. Redirecting to login in {redirectSeconds}s...
              </Text>
            ) : null}

            <TouchableOpacity
              style={styles.linkButton}
              disabled={isResending || isLoading || isVerified}
              onPress={handleResend}
            >
              {isResending ? (
                <ActivityIndicator color={colors.primary500} />
              ) : (
                <Text style={[styles.linkText, { color: colors.primary500 }]}>Resend code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/login')}>
              <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>Back to login</Text>
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
  keyboard: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  banner: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bannerText: {
    fontSize: 13,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  otpInput: {
    letterSpacing: 6,
    textAlign: 'center',
    fontWeight: '700',
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  secondaryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  redirectText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: -4,
  },
});
