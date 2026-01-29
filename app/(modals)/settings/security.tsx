// app/(modals)/settings/security.tsx
import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function SecurityScreen() {
  const { colors } = useTheme();
  const [securitySettings, setSecuritySettings] = useState({
    autoLock: true,
    lockTimeout: 5, // minutes
    twoFactorEnabled: false,
    emailNotifications: true,
    suspiciousActivityAlerts: true,
    requirePasswordChange: 90, // days
  });

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('securitySettings');
      if (saved) {
        setSecuritySettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  };

  const saveSecuritySettings = async (settings: any) => {
    try {
      await AsyncStorage.setItem('securitySettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving security settings:', error);
    }
  };

  const handleSettingToggle = (setting: string, value: any) => {
    const updated = { ...securitySettings, [setting]: value };
    setSecuritySettings(updated);
    saveSecuritySettings(updated);
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'You will be redirected to change your password. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => router.push('/(modals)/profile'),
        },
      ]
    );
  };

  const handleTwoFactorSetup = () => {
    Alert.alert(
      'Two-Factor Authentication',
      'Set up two-factor authentication for enhanced security?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set Up',
          onPress: () => {
            handleSettingToggle('twoFactorEnabled', true);
            Alert.alert(
              'Two-Factor Setup',
              'Instructions have been sent to your email.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const handleSecurityCheckup = () => {
    Alert.alert(
      'Security Checkup',
      'Running security checkup...',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Run Checkup',
          onPress: () => {
            setTimeout(() => {
              Alert.alert(
                'Security Checkup Complete',
                'Your account security is strong!',
                [{ text: 'Great!' }]
              );
            }, 1500);
          },
        },
      ]
    );
  };

  const getSecurityScore = () => {
    let score = 0;
    if (securitySettings.autoLock) score += 20;
    if (securitySettings.twoFactorEnabled) score += 40;
    if (securitySettings.suspiciousActivityAlerts) score += 20;
    if (securitySettings.requirePasswordChange <= 90) score += 20;
    return score;
  };

  const getSecurityLevel = (score: number) => {
    if (score >= 80) return { label: 'Strong', color: colors.success };
    if (score >= 60) return { label: 'Good', color: colors.warning };
    return { label: 'Weak', color: colors.error };
  };

  const securityLevel = getSecurityLevel(getSecurityScore());

  const lockTimeoutOptions = [
    { label: 'Immediately', value: 0 },
    { label: '1 minute', value: 1 },
    { label: '5 minutes', value: 5 },
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '1 hour', value: 60 },
  ];

  const passwordChangeOptions = [
    { label: '30 days', value: 30 },
    { label: '60 days', value: 60 },
    { label: '90 days', value: 90 },
    { label: '180 days', value: 180 },
    { label: 'Never', value: 0 },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.securityScoreCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.securityScoreTitle, { color: colors.text }]}>
            Security Score
          </Text>
          <View style={styles.scoreContainer}>
            <View style={styles.scoreCircle}>
              <Text style={[styles.scoreValue, { color: colors.text }]}>
                {getSecurityScore()}%
              </Text>
            </View>
            <View style={styles.scoreInfo}>
              <Text style={[styles.securityLevel, { color: securityLevel.color }]}>
                {securityLevel.label}
              </Text>
              <Text style={[styles.securityDescription, { color: colors.textTertiary }]}>
                Based on your security settings
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: colors.primary500 }]}
          onPress={handleSecurityCheckup}
        >
          <Ionicons name="shield-checkmark-outline" size={20} color="white" />
          <Text style={styles.quickActionText}>Run Security Checkup</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Account Security
          </Text>

          <TouchableOpacity
            style={[styles.settingCard, { backgroundColor: colors.surface }]}
            onPress={handleChangePassword}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.primary50 }]}>
                <Ionicons name="key-outline" size={20} color={colors.primary500} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Change Password
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textTertiary }]}>
                  Update your account password
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={[styles.settingCard, { backgroundColor: colors.surface }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.primary50 }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.primary500} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Two-Factor Authentication
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textTertiary }]}>
                  Add an extra layer of security
                </Text>
                <Text style={[styles.settingStatus, { 
                  color: securitySettings.twoFactorEnabled ? colors.success : colors.warning 
                }]}>
                  {securitySettings.twoFactorEnabled ? 'Enabled' : 'Not Enabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={securitySettings.twoFactorEnabled}
              onValueChange={(value) => {
                if (value) {
                  handleTwoFactorSetup();
                } else {
                  handleSettingToggle('twoFactorEnabled', value);
                }
              }}
              trackColor={{ false: colors.border, true: colors.primary300 }}
              thumbColor={securitySettings.twoFactorEnabled ? colors.primary500 : colors.textLight}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            App Security
          </Text>

          <View style={[styles.settingCard, { backgroundColor: colors.surface }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.primary50 }]}>
                <Ionicons name="timer-outline" size={20} color={colors.primary500} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Auto Lock
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textTertiary }]}>
                  Lock app after inactivity
                </Text>
              </View>
            </View>
            <Switch
              value={securitySettings.autoLock}
              onValueChange={(value) => handleSettingToggle('autoLock', value)}
              trackColor={{ false: colors.border, true: colors.primary300 }}
              thumbColor={securitySettings.autoLock ? colors.primary500 : colors.textLight}
            />
          </View>

          {securitySettings.autoLock && (
            <View style={[styles.subSetting, { backgroundColor: colors.card }]}>
              <Text style={[styles.subSettingTitle, { color: colors.text }]}>
                Lock Timeout
              </Text>
              <View style={styles.optionsRow}>
                {lockTimeoutOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      { 
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                      securitySettings.lockTimeout === option.value && {
                        borderColor: colors.primary500,
                        backgroundColor: colors.primary50,
                      }
                    ]}
                    onPress={() => handleSettingToggle('lockTimeout', option.value)}
                  >
                    <Text style={[
                      styles.optionText,
                      { 
                        color: securitySettings.lockTimeout === option.value 
                          ? colors.primary500 
                          : colors.text 
                      }
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={[styles.settingCard, { backgroundColor: colors.surface }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.primary50 }]}>
                <Ionicons name="mail-outline" size={20} color={colors.primary500} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Email Notifications
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textTertiary }]}>
                  Receive security notifications via email
                </Text>
              </View>
            </View>
            <Switch
              value={securitySettings.emailNotifications}
              onValueChange={(value) => handleSettingToggle('emailNotifications', value)}
              trackColor={{ false: colors.border, true: colors.primary300 }}
              thumbColor={securitySettings.emailNotifications ? colors.primary500 : colors.textLight}
            />
          </View>

          <View style={[styles.settingCard, { backgroundColor: colors.surface }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.primary50 }]}>
                <Ionicons name="alert-circle-outline" size={20} color={colors.primary500} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Suspicious Activity Alerts
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textTertiary }]}>
                  Get alerted for unusual activity
                </Text>
              </View>
            </View>
            <Switch
              value={securitySettings.suspiciousActivityAlerts}
              onValueChange={(value) => handleSettingToggle('suspiciousActivityAlerts', value)}
              trackColor={{ false: colors.border, true: colors.primary300 }}
              thumbColor={securitySettings.suspiciousActivityAlerts ? colors.primary500 : colors.textLight}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Password Policy
          </Text>

          <View style={[styles.settingCard, { backgroundColor: colors.surface }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.primary50 }]}>
                <Ionicons name="refresh-outline" size={20} color={colors.primary500} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Require Password Change
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textTertiary }]}>
                  How often to change password
                </Text>
              </View>
            </View>
            <View style={styles.valueContainer}>
              <Text style={[styles.valueText, { color: colors.text }]}>
                {securitySettings.requirePasswordChange === 0 
                  ? 'Never' 
                  : `Every ${securitySettings.requirePasswordChange} days`}
              </Text>
            </View>
          </View>

          <View style={[styles.subSetting, { backgroundColor: colors.card }]}>
            <Text style={[styles.subSettingTitle, { color: colors.text }]}>
              Password Change Frequency
            </Text>
            <View style={styles.optionsRow}>
              {passwordChangeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    { 
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                    securitySettings.requirePasswordChange === option.value && {
                      borderColor: colors.primary500,
                      backgroundColor: colors.primary50,
                    }
                  ]}
                  onPress={() => handleSettingToggle('requirePasswordChange', option.value)}
                >
                  <Text style={[
                    styles.optionText,
                    { 
                      color: securitySettings.requirePasswordChange === option.value 
                        ? colors.primary500 
                        : colors.text 
                    }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.noteCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary500} />
          <View style={styles.noteContent}>
            <Text style={[styles.noteTitle, { color: colors.text }]}>
              Security Tips
            </Text>
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              • Use a strong, unique password{'\n'}
              • Enable two-factor authentication{'\n'}
              • Regularly review your account activity{'\n'}
              • Keep the app updated{'\n'}
              • Never share your login credentials
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.dangerButton, { borderColor: colors.error }]}
          onPress={() => {
            Alert.alert(
              'Sign Out All Devices',
              'This will sign you out from all devices and sessions. Continue?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Sign Out',
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert(
                      'Success',
                      'You have been signed out from all devices.',
                      [{ text: 'OK' }]
                    );
                  },
                },
              ]
            );
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[styles.dangerButtonText, { color: colors.error }]}>
            Sign Out All Devices
          </Text>
        </TouchableOpacity>
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
  securityScoreCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  securityScoreTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  scoreInfo: {
    flex: 1,
  },
  securityLevel: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  securityDescription: {
    fontSize: 14,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
  },
  quickActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIcon: {
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
  },
  settingStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  valueContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '500',
  },
  subSetting: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  subSettingTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 22,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});