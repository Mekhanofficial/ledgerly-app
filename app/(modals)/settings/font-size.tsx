// app/(modals)/settings/font-size.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';

export default function FontSizeScreen() {
  const { colors } = useTheme();
  const [fontSize, setFontSize] = useState(16);
  const [scaleFactor, setScaleFactor] = useState(1.0);

  useEffect(() => {
    loadFontSettings();
  }, []);

  const loadFontSettings = async () => {
    try {
      const savedSize = await AsyncStorage.getItem('fontSize');
      const savedScale = await AsyncStorage.getItem('fontScaleFactor');
      
      if (savedSize) setFontSize(parseInt(savedSize));
      if (savedScale) setScaleFactor(parseFloat(savedScale));
    } catch (error) {
      console.error('Error loading font settings:', error);
    }
  };

  const saveFontSettings = async (size: number, scale: number) => {
    try {
      await AsyncStorage.setItem('fontSize', size.toString());
      await AsyncStorage.setItem('fontScaleFactor', scale.toString());
    } catch (error) {
      console.error('Error saving font settings:', error);
    }
  };

  const handleFontSizeChange = (value: number) => {
    setFontSize(value);
    saveFontSettings(value, scaleFactor);
  };

  const handleScaleChange = (value: number) => {
    const rounded = Math.round(value * 4) / 4; // Round to nearest 0.25
    setScaleFactor(rounded);
    saveFontSettings(fontSize, rounded);
  };

  const getFontSizeLabel = (size: number) => {
    if (size <= 14) return 'Small';
    if (size <= 16) return 'Medium';
    if (size <= 18) return 'Large';
    return 'Extra Large';
  };

  const getScaleLabel = (scale: number) => {
    if (scale <= 0.75) return 'Small';
    if (scale <= 1.0) return 'Default';
    if (scale <= 1.25) return 'Large';
    return 'Extra Large';
  };

  const presetSizes = [
    { label: 'Small', size: 14 },
    { label: 'Medium', size: 16 },
    { label: 'Large', size: 18 },
    { label: 'Extra Large', size: 20 },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Font Size
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textTertiary }]}>
            Adjust the base font size for the app
          </Text>

          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderValue, { color: colors.primary500 }]}>
              {fontSize}px
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={12}
              maximumValue={24}
              step={1}
              value={fontSize}
              onValueChange={handleFontSizeChange}
              minimumTrackTintColor={colors.primary500}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary500}
            />
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabel, { color: colors.textTertiary }]}>12px</Text>
              <Text style={[styles.sliderLabel, { color: colors.textTertiary }]}>24px</Text>
            </View>
          </View>

          <View style={styles.presetContainer}>
            {presetSizes.map((preset) => (
              <TouchableOpacity
                key={preset.label}
                style={[
                  styles.presetButton,
                  { 
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                  fontSize === preset.size && {
                    borderColor: colors.primary500,
                    backgroundColor: colors.primary50,
                  }
                ]}
                onPress={() => handleFontSizeChange(preset.size)}
              >
                <Text
                  style={[
                    styles.presetLabel,
                    { 
                      color: fontSize === preset.size ? colors.primary500 : colors.text,
                      fontSize: preset.size * 0.9,
                    }
                  ]}
                >
                  {preset.label}
                </Text>
                {fontSize === preset.size && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary500} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Text Scale
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textTertiary }]}>
            Adjust how much text scales relative to system settings
          </Text>

          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderValue, { color: colors.primary500 }]}>
              {scaleFactor.toFixed(2)}x
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={2.0}
              step={0.25}
              value={scaleFactor}
              onValueChange={handleScaleChange}
              minimumTrackTintColor={colors.primary500}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary500}
            />
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabel, { color: colors.textTertiary }]}>0.5x</Text>
              <Text style={[styles.sliderLabel, { color: colors.textTertiary }]}>2.0x</Text>
            </View>
          </View>

          <View style={styles.previewContainer}>
            <Text style={[styles.previewTitle, { color: colors.text }]}>Preview</Text>
            <View style={[styles.previewCard, { backgroundColor: colors.card }]}>
              <Text style={[
                styles.previewText,
                { 
                  color: colors.text,
                  fontSize: fontSize * scaleFactor,
                }
              ]}>
                This is how your text will appear with the current settings.
              </Text>
              <Text style={[
                styles.previewText,
                { 
                  color: colors.textSecondary,
                  fontSize: fontSize * scaleFactor * 0.875,
                }
              ]}>
                This is smaller text for descriptions and details.
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.noteCard, { backgroundColor: colors.primary50, borderColor: colors.primary100 }]}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary500} />
          <Text style={[styles.noteText, { color: colors.text }]}>
            Changes to font size may require restarting the app to take full effect on all screens.
          </Text>
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
  section: {
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 24,
  },
  sliderContainer: {
    marginBottom: 24,
  },
  sliderValue: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  presetLabel: {
    fontWeight: '600',
  },
  previewContainer: {
    marginTop: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewCard: {
    padding: 20,
    borderRadius: 12,
    gap: 12,
  },
  previewText: {
    lineHeight: 24,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginTop: 24,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});