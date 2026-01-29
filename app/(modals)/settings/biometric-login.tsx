// app/(modals)/settings/biometric-login.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

export default function BiometricLoginScreen() {
  const { colors } = useTheme();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'face' | 'iris' | 'none'>('none');
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
    loadBiometricSettings();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      setIsAvailable(compatible);
      setIsEnrolled(enrolled);

      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('fingerprint');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('face');
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType('iris');
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    }
  };

  const loadBiometricSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('biometricEnabled');
      if (saved !== null) {
        setBiometricEnabled(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading biometric settings:', error);
    }
  };

  const saveBiometricSettings = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem('biometricEnabled', JSON.stringify(enabled));
    } catch (error) {
      console.error('Error saving biometric settings:', error);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      // Request to enable biometric
      const result = await authenticate();
      if (result.success) {
        setBiometricEnabled(true);
        saveBiometricSettings(true);
        Alert.alert('Success', 'Biometric login has been enabled');
      } else {
        Alert.alert('Error', 'Authentication failed. Please try again.');
      }
    } else {
      // Disable biometric
      setBiometricEnabled(false);
      saveBiometricSettings(false);
    }
  };

  const authenticate = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable biometric login',
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });

      return result;
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error };
    }
  };

  const testBiometric = async () => {
    try {
      const result = await authenticate();
      if (result.success) {
        Alert.alert('Success', 'Biometric authentication successful!');
      } else {
        Alert.alert('Failed', 'Biometric authentication failed. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during authentication.');
    }
  };

  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'fingerprint': return 'finger-print';
      case 'face': return 'person';
      case 'iris': return 'eye';
      default: return 'phone-portrait';
    }
  };

  const getBiometricLabel = () => {
    switch (biometricType) {
      case 'fingerprint': return 'Fingerprint';
      case 'face': return 'Face ID';
      case 'iris': return 'Iris Scanner';
      default: return 'Biometric';
    }
  };

  const getPlatformLabel = () => {
    if (Platform.OS === 'ios') {
      if (biometricType === 'face') return 'Face ID';
      if (biometricType === 'fingerprint') return 'Touch ID';
    }
    return getBiometricLabel();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.headerCard, { backgroundColor: colors.primary50, borderColor: colors.primary100 }]}>
          <Ionicons 
            name={getBiometricIcon()} 
            size={48} 
            color={colors.primary500} 
          />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {getPlatformLabel()} Login
          </Text>
          <Text style={[styles.headerDescription, { color: colors.textSecondary }]}>
            Use your {getPlatformLabel().toLowerCase()} for quick and secure access to your account
          </Text>
        </View>

        <View style={styles.statusContainer}>
          <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statusTitle, { color: colors.text }]}>Status</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <Ionicons 
                  name={isAvailable ? 'checkmark-circle' : 'close-circle'} 
                  size={20} 
                  color={isAvailable ? colors.success : colors.error} 
                />
                <Text style={[styles.statusText, { color: colors.text }]}>
                  {isAvailable ? 'Available' : 'Not Available'}
                </Text>
              </View>
              <View style={styles.statusItem}>
                <Ionicons 
                  name={isEnrolled ? 'checkmark-circle' : 'close-circle'} 
                  size={20} 
                  color={isEnrolled ? colors.success : colors.error} 
                />
                <Text style={[styles.statusText, { color: colors.text }]}>
                  {isEnrolled ? 'Enrolled' : 'Not Enrolled'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.mainSetting, { backgroundColor: colors.surface }]}>
          <View style={styles.settingHeader}>
            <View style={styles.settingLeft}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Enable {getPlatformLabel()} Login
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textTertiary }]}>
                Use {getPlatformLabel().toLowerCase()} to quickly sign in to your account
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              disabled={!isAvailable || !isEnrolled}
              trackColor={{ false: colors.border, true: colors.primary300 }}
              thumbColor={biometricEnabled ? colors.primary500 : colors.textLight}
            />
          </View>

          {(!isAvailable || !isEnrolled) && (
            <View style={[styles.warningCard, { backgroundColor: colors.warning + '20' }]}>
              <Ionicons name="warning-outline" size={20} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.text }]}>
                {!isAvailable 
                  ? `${getPlatformLabel()} is not available on this device.`
                  : `${getPlatformLabel()} is not set up on this device. Please set it up in your device settings.`}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: colors.primary500 }]}
          onPress={testBiometric}
          disabled={!biometricEnabled}
        >
          <Ionicons name={getBiometricIcon()} size={20} color="white" />
          <Text style={styles.testButtonText}>Test {getPlatformLabel()}</Text>
        </TouchableOpacity>

        <View style={styles.optionsContainer}>
          <Text style={[styles.optionsTitle, { color: colors.text }]}>Options</Text>
          
          <View style={[styles.optionCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="lock-closed-outline" size={24} color={colors.primary500} />
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>Require on App Launch</Text>
              <Text style={[styles.optionDescription, { color: colors.textTertiary }]}>
                Always require {getPlatformLabel().toLowerCase()} when opening the app
              </Text>
            </View>
            <Switch
              value={true}
              trackColor={{ false: colors.border, true: colors.primary300 }}
              thumbColor={colors.primary500}
            />
          </View>

          <View style={[styles.optionCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary500} />
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>Sensitive Actions</Text>
              <Text style={[styles.optionDescription, { color: colors.textTertiary }]}>
                Require authentication for financial transactions
              </Text>
            </View>
            <Switch
              value={true}
              trackColor={{ false: colors.border, true: colors.primary300 }}
              thumbColor={colors.primary500}
            />
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary500} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Security Note</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Your biometric data is stored securely on your device and never sent to our servers. 
              You can disable biometric login at any time in settings.
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
  headerDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  statusContainer: {
    marginBottom: 24,
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 20,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mainSetting: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLeft: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});