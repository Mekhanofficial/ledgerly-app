// app/(modals)/settings/language.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export default function LanguageScreen() {
  const { colors } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [languages, setLanguages] = useState<Language[]>([
    { code: 'en-US', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'es-ES', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr-FR', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de-DE', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
    { code: 'ja-JP', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'ko-KR', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português', flag: '🇧🇷' },
    { code: 'ru-RU', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  ]);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem('selectedLanguage');
      if (saved) {
        setSelectedLanguage(saved);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const saveLanguage = async (languageCode: string) => {
    try {
      await AsyncStorage.setItem('selectedLanguage', languageCode);
      setSelectedLanguage(languageCode);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const handleLanguageSelect = (languageCode: string) => {
    Alert.alert(
      'Change Language',
      'Changing the language will restart the app. Do you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: () => {
            saveLanguage(languageCode);
            Alert.alert(
              'Language Changed',
              'The app will restart to apply the new language.',
              [{ text: 'OK', onPress: () => {} }]
            );
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.currentLanguage, { backgroundColor: colors.primary50, borderColor: colors.primary100 }]}>
          <View style={styles.currentLanguageHeader}>
            <Text style={[styles.currentLanguageTitle, { color: colors.text }]}>
              Current Language
            </Text>
            <View style={[styles.currentLanguageBadge, { backgroundColor: colors.primary500 }]}>
              <Text style={styles.currentLanguageBadgeText}>Active</Text>
            </View>
          </View>
          
          <View style={styles.currentLanguageContent}>
            <Text style={[styles.currentLanguageFlag, { fontSize: 32 }]}>
              {languages.find(l => l.code === selectedLanguage)?.flag}
            </Text>
            <View>
              <Text style={[styles.currentLanguageName, { color: colors.text }]}>
                {languages.find(l => l.code === selectedLanguage)?.name}
              </Text>
              <Text style={[styles.currentLanguageNative, { color: colors.textTertiary }]}>
                {languages.find(l => l.code === selectedLanguage)?.nativeName}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.languagesList}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Available Languages
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textTertiary }]}>
            Select your preferred language for the app interface
          </Text>

          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageCard,
                { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                selectedLanguage === language.code && {
                  borderColor: colors.primary500,
                  backgroundColor: colors.primary50,
                }
              ]}
              onPress={() => handleLanguageSelect(language.code)}
            >
              <View style={styles.languageLeft}>
                <Text style={[styles.languageFlag, { fontSize: 24 }]}>
                  {language.flag}
                </Text>
                <View>
                  <Text style={[styles.languageName, { color: colors.text }]}>
                    {language.name}
                  </Text>
                  <Text style={[styles.languageNative, { color: colors.textTertiary }]}>
                    {language.nativeName}
                  </Text>
                </View>
              </View>
              
              {selectedLanguage === language.code ? (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary500} />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.noteCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary500} />
          <View style={styles.noteContent}>
            <Text style={[styles.noteTitle, { color: colors.text }]}>
              Language Support
            </Text>
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Some features may not be fully translated in all languages. 
              English will be used as fallback for untranslated content.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.helpButton, { borderColor: colors.border }]}
          onPress={() => Alert.alert('Help', 'Contact support for language-related issues')}
        >
          <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.helpButtonText, { color: colors.textSecondary }]}>
            Need help with language selection?
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
  currentLanguage: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  currentLanguageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentLanguageTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  currentLanguageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  currentLanguageBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  currentLanguageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  currentLanguageFlag: {
    width: 48,
    height: 48,
    borderRadius: 24,
    textAlign: 'center',
    lineHeight: 48,
  },
  currentLanguageName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  currentLanguageNative: {
    fontSize: 16,
  },
  languagesList: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 20,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  languageFlag: {
    width: 40,
    height: 40,
    borderRadius: 20,
    textAlign: 'center',
    lineHeight: 40,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  languageNative: {
    fontSize: 14,
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
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});