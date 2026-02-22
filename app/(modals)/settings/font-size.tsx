import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import {
  DEFAULT_APP_PREFERENCES,
  saveLocalPreferences,
  syncPreferencesFromBackend,
  updatePreferences,
} from '@/services/preferencesService';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function FontSizeScreen() {
  const { colors } = useTheme();
  const [fontSize, setFontSize] = useState(DEFAULT_APP_PREFERENCES.fontSize);
  const [scaleFactor, setScaleFactor] = useState(DEFAULT_APP_PREFERENCES.fontScaleFactor);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const prefs = await syncPreferencesFromBackend();
        setFontSize(clamp(Number(prefs.fontSize || 16), 12, 24));
        setScaleFactor(clamp(Number(prefs.fontScaleFactor || 1), 0.5, 2));
      } catch (error) {
        console.error('Failed to load font preferences:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const effectivePreviewTitle = useMemo(() => Math.round(fontSize * scaleFactor), [fontSize, scaleFactor]);
  const effectivePreviewBody = useMemo(() => Math.round(fontSize * scaleFactor * 0.9), [fontSize, scaleFactor]);

  const persistFontPrefs = async (nextSize: number, nextScale: number) => {
    const normalizedSize = clamp(Math.round(nextSize), 12, 24);
    const normalizedScale = clamp(Math.round(nextScale * 4) / 4, 0.5, 2);

    setFontSize(normalizedSize);
    setScaleFactor(normalizedScale);
    setSaving(true);
    try {
      await saveLocalPreferences({
        fontSize: normalizedSize,
        fontScaleFactor: normalizedScale,
      });
      await updatePreferences({
        fontSize: normalizedSize,
        fontScaleFactor: normalizedScale,
      });
    } catch (error) {
      console.error('Failed to sync font preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const fontLabel =
    fontSize <= 14 ? 'Small' : fontSize <= 16 ? 'Medium' : fontSize <= 18 ? 'Large' : 'Extra Large';
  const scaleLabel =
    scaleFactor <= 0.75 ? 'Compact' : scaleFactor <= 1 ? 'Default' : scaleFactor <= 1.25 ? 'Comfortable' : 'Large';

  const presets = [
    { label: 'Small', size: 14, scale: 1 },
    { label: 'Medium', size: 16, scale: 1 },
    { label: 'Large', size: 18, scale: 1 },
    { label: 'XL', size: 20, scale: 1.25 },
  ];

  if (loading) {
    return (
      <View style={[styles.centerState, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary500} />
        <Text style={[styles.centerStateText, { color: colors.textTertiary }]}>Loading font settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.summaryCard, { backgroundColor: colors.primary50, borderColor: colors.primary100 }]}>
        <View style={styles.summaryHeader}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Typography Preferences</Text>
          {saving && <ActivityIndicator size="small" color={colors.primary500} />}
        </View>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          Base size: {fontSize}px ({fontLabel})
        </Text>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          Scale: {scaleFactor.toFixed(2)}x ({scaleLabel})
        </Text>
        <Text style={[styles.summaryHint, { color: colors.textTertiary }]}>
          Saved locally and synced to backend settings.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Font Size</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textTertiary }]}>
          Controls the base text size used by pages that support app font preferences.
        </Text>

        <Text style={[styles.valueText, { color: colors.primary500 }]}>{fontSize}px</Text>
        <Slider
          style={styles.slider}
          minimumValue={12}
          maximumValue={24}
          step={1}
          value={fontSize}
          onValueChange={(value) => setFontSize(Math.round(value))}
          onSlidingComplete={(value) => persistFontPrefs(value, scaleFactor)}
          minimumTrackTintColor={colors.primary500}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary500}
        />
        <View style={styles.sliderLabels}>
          <Text style={[styles.sliderLabel, { color: colors.textTertiary }]}>12</Text>
          <Text style={[styles.sliderLabel, { color: colors.textTertiary }]}>24</Text>
        </View>

        <View style={styles.presetGrid}>
          {presets.map((preset) => {
            const active = fontSize === preset.size && Math.abs(scaleFactor - preset.scale) < 0.01;
            return (
              <TouchableOpacity
                key={preset.label}
                style={[
                  styles.presetButton,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  active && { borderColor: colors.primary500, backgroundColor: colors.primary50 },
                ]}
                onPress={() => persistFontPrefs(preset.size, preset.scale)}
                disabled={saving}
              >
                <Text style={[styles.presetText, { color: active ? colors.primary500 : colors.text }]}>
                  {preset.label}
                </Text>
                {active && <Ionicons name="checkmark-circle" size={18} color={colors.primary500} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Text Scale</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textTertiary }]}>
          Fine-tunes text scaling for readability.
        </Text>

        <Text style={[styles.valueText, { color: colors.primary500 }]}>{scaleFactor.toFixed(2)}x</Text>
        <Slider
          style={styles.slider}
          minimumValue={0.5}
          maximumValue={2}
          step={0.25}
          value={scaleFactor}
          onValueChange={(value) => setScaleFactor(Math.round(value * 4) / 4)}
          onSlidingComplete={(value) => persistFontPrefs(fontSize, value)}
          minimumTrackTintColor={colors.primary500}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary500}
        />
        <View style={styles.sliderLabels}>
          <Text style={[styles.sliderLabel, { color: colors.textTertiary }]}>0.5x</Text>
          <Text style={[styles.sliderLabel, { color: colors.textTertiary }]}>2.0x</Text>
        </View>
      </View>

      <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.previewHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Preview</Text>
          <TouchableOpacity
            style={[styles.resetButton, { borderColor: colors.border }]}
            onPress={() => persistFontPrefs(DEFAULT_APP_PREFERENCES.fontSize, DEFAULT_APP_PREFERENCES.fontScaleFactor)}
            disabled={saving}
          >
            <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.resetButtonText, { color: colors.textSecondary }]}>Reset</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.previewInner, { backgroundColor: colors.card }]}>
          <Text style={[styles.previewTitle, { color: colors.text, fontSize: effectivePreviewTitle }]}>
            Invoice Summary
          </Text>
          <Text style={[styles.previewBody, { color: colors.textSecondary, fontSize: effectivePreviewBody }]}>
            This preview updates instantly as you change font size and scale. Your preferences are synced for this account.
          </Text>
          <Text style={[styles.previewCaption, { color: colors.textTertiary, fontSize: Math.max(11, effectivePreviewBody - 2) }]}>
            Total Paid: $1,234.56
          </Text>
        </View>
      </View>

      <View style={[styles.noteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="information-circle-outline" size={20} color={colors.primary500} />
        <Text style={[styles.noteText, { color: colors.textSecondary }]}>
          Some older screens still use fixed sizes. This page now stores and syncs font preferences correctly, and supported screens can read them.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 16,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 20,
  },
  centerStateText: {
    fontSize: 14,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryText: {
    fontSize: 13,
  },
  summaryHint: {
    fontSize: 12,
    marginTop: 6,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
    marginBottom: 12,
  },
  valueText: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 12,
  },
  presetGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetButton: {
    minWidth: '47%',
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  presetText: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  resetButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewInner: {
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  previewTitle: {
    fontWeight: '700',
  },
  previewBody: {
    lineHeight: 22,
  },
  previewCaption: {
    fontWeight: '600',
  },
  noteCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
