// app/(modals)/settings/date-format.tsx
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

interface DateFormat {
  id: string;
  format: string;
  example: string;
  description: string;
  locale: string;
}

export default function DateFormatScreen() {
  const { colors } = useTheme();
  const [selectedFormat, setSelectedFormat] = useState('MM/DD/YYYY');
  const [formats, setFormats] = useState<DateFormat[]>([
    { id: '1', format: 'MM/DD/YYYY', example: '12/25/2023', description: 'Month/Day/Year', locale: 'en-US' },
    { id: '2', format: 'DD/MM/YYYY', example: '25/12/2023', description: 'Day/Month/Year', locale: 'en-GB' },
    { id: '3', format: 'YYYY-MM-DD', example: '2023-12-25', description: 'Year-Month-Day (ISO)', locale: 'en-CA' },
    { id: '4', format: 'MMMM DD, YYYY', example: 'December 25, 2023', description: 'Long Date', locale: 'en-US' },
    { id: '5', format: 'DD MMMM YYYY', example: '25 December 2023', description: 'Day Month Year', locale: 'en-GB' },
    { id: '6', format: 'MMM DD, YYYY', example: 'Dec 25, 2023', description: 'Short Month', locale: 'en-US' },
  ]);

  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');
  const [weekStart, setWeekStart] = useState<'sunday' | 'monday'>('sunday');

  useEffect(() => {
    loadDateFormatSettings();
  }, []);

  const loadDateFormatSettings = async () => {
    try {
      const savedFormat = await AsyncStorage.getItem('dateFormat');
      const savedTimeFormat = await AsyncStorage.getItem('timeFormat');
      const savedWeekStart = await AsyncStorage.getItem('weekStart');
      
      if (savedFormat) setSelectedFormat(savedFormat);
      if (savedTimeFormat) setTimeFormat(savedTimeFormat as '12h' | '24h');
      if (savedWeekStart) setWeekStart(savedWeekStart as 'sunday' | 'monday');
    } catch (error) {
      console.error('Error loading date format settings:', error);
    }
  };

  const saveDateFormatSettings = async (format: string, timeFormat: string, weekStart: string) => {
    try {
      await AsyncStorage.setItem('dateFormat', format);
      await AsyncStorage.setItem('timeFormat', timeFormat);
      await AsyncStorage.setItem('weekStart', weekStart);
      
      Alert.alert(
        'Settings Saved',
        'Date and time format preferences have been updated.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving date format settings:', error);
    }
  };

  const handleFormatSelect = (format: string) => {
    setSelectedFormat(format);
    saveDateFormatSettings(format, timeFormat, weekStart);
  };

  const handleTimeFormatSelect = (format: '12h' | '24h') => {
    setTimeFormat(format);
    saveDateFormatSettings(selectedFormat, format, weekStart);
  };

  const handleWeekStartSelect = (day: 'sunday' | 'monday') => {
    setWeekStart(day);
    saveDateFormatSettings(selectedFormat, timeFormat, day);
  };

  const getCurrentDateExample = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getCurrentTimeExample = () => {
    const now = new Date();
    if (timeFormat === '12h') {
      return now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else {
      return now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.previewCard, { backgroundColor: colors.primary50, borderColor: colors.primary100 }]}>
          <Text style={[styles.previewTitle, { color: colors.text }]}>Preview</Text>
          <View style={styles.previewContent}>
            <Text style={[styles.datePreview, { color: colors.text, fontSize: 24 }]}>
              {getCurrentDateExample()}
            </Text>
            <Text style={[styles.timePreview, { color: colors.textTertiary, fontSize: 20 }]}>
              {getCurrentTimeExample()}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Date Format
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textTertiary }]}>
            Choose how dates are displayed throughout the app
          </Text>

          <View style={styles.formatsGrid}>
            {formats.map((format) => (
              <TouchableOpacity
                key={format.id}
                style={[
                  styles.formatCard,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  selectedFormat === format.format && {
                    borderColor: colors.primary500,
                    backgroundColor: colors.primary50,
                  }
                ]}
                onPress={() => handleFormatSelect(format.format)}
              >
                <Text style={[styles.formatExample, { color: colors.text }]}>
                  {format.example}
                </Text>
                <Text style={[styles.formatDescription, { color: colors.textTertiary }]}>
                  {format.description}
                </Text>
                <Text style={[styles.formatCode, { color: colors.textSecondary }]}>
                  {format.format}
                </Text>
                {selectedFormat === format.format && (
                  <View style={[styles.selectedIndicator, { backgroundColor: colors.primary500 }]}>
                    <Ionicons name="checkmark" size={16} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Time Format
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textTertiary }]}>
            Choose between 12-hour and 24-hour time format
          </Text>

          <View style={styles.timeFormats}>
            <TouchableOpacity
              style={[
                styles.timeFormatCard,
                { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                timeFormat === '12h' && {
                  borderColor: colors.primary500,
                  backgroundColor: colors.primary50,
                }
              ]}
              onPress={() => handleTimeFormatSelect('12h')}
            >
              <Text style={[styles.timeFormatTitle, { color: colors.text }]}>
                12-Hour Format
              </Text>
              <Text style={[styles.timeFormatExample, { color: colors.textTertiary }]}>
                02:30 PM
              </Text>
              {timeFormat === '12h' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary500} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.timeFormatCard,
                { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                timeFormat === '24h' && {
                  borderColor: colors.primary500,
                  backgroundColor: colors.primary50,
                }
              ]}
              onPress={() => handleTimeFormatSelect('24h')}
            >
              <Text style={[styles.timeFormatTitle, { color: colors.text }]}>
                24-Hour Format
              </Text>
              <Text style={[styles.timeFormatExample, { color: colors.textTertiary }]}>
                14:30
              </Text>
              {timeFormat === '24h' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary500} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Week Start
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textTertiary }]}>
            Choose which day the week starts on in calendars
          </Text>

          <View style={styles.weekStartOptions}>
            <TouchableOpacity
              style={[
                styles.weekStartCard,
                { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                weekStart === 'sunday' && {
                  borderColor: colors.primary500,
                  backgroundColor: colors.primary50,
                }
              ]}
              onPress={() => handleWeekStartSelect('sunday')}
            >
              <Ionicons 
                name="sunny-outline" 
                size={24} 
                color={weekStart === 'sunday' ? colors.primary500 : colors.textSecondary} 
              />
              <Text style={[styles.weekStartText, { color: colors.text }]}>
                Sunday
              </Text>
              {weekStart === 'sunday' && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary500} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.weekStartCard,
                { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                weekStart === 'monday' && {
                  borderColor: colors.primary500,
                  backgroundColor: colors.primary50,
                }
              ]}
              onPress={() => handleWeekStartSelect('monday')}
            >
              <Ionicons 
                name="calendar-outline" 
                size={24} 
                color={weekStart === 'monday' ? colors.primary500 : colors.textSecondary} 
              />
              <Text style={[styles.weekStartText, { color: colors.text }]}>
                Monday
              </Text>
              {weekStart === 'monday' && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary500} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.noteCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary500} />
          <View style={styles.noteContent}>
            <Text style={[styles.noteTitle, { color: colors.text }]}>
              Regional Settings
            </Text>
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              These settings affect how dates and times are displayed throughout the app. 
              They don't change the actual data, only how it's presented.
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
  previewCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewContent: {
    alignItems: 'center',
  },
  datePreview: {
    fontWeight: '700',
    marginBottom: 8,
  },
  timePreview: {
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 20,
  },
  formatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  formatCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
  },
  formatExample: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  formatDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  formatCode: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeFormats: {
    flexDirection: 'row',
    gap: 12,
  },
  timeFormatCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeFormatTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  timeFormatExample: {
    fontSize: 14,
    marginBottom: 12,
  },
  weekStartOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  weekStartCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  weekStartText: {
    fontSize: 16,
    fontWeight: '600',
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
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
});