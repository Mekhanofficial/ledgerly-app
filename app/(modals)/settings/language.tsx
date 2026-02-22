import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import {
  saveLocalPreferences,
  syncPreferencesFromBackend,
  updatePreferences,
} from '@/services/preferencesService';

type PlanTier = 'starter' | 'professional' | 'enterprise';

type Language = {
  code: string;
  name: string;
  nativeName: string;
  region: string;
  badge: string;
  minPlan: PlanTier;
};

const LANGUAGES: Language[] = [
  { code: 'en-US', name: 'English', nativeName: 'English', region: 'United States', badge: 'US', minPlan: 'starter' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Espanol', region: 'Spain', badge: 'ES', minPlan: 'professional' },
  { code: 'fr-FR', name: 'French', nativeName: 'Francais', region: 'France', badge: 'FR', minPlan: 'professional' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch', region: 'Germany', badge: 'DE', minPlan: 'professional' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Portugues (BR)', region: 'Brazil', badge: 'BR', minPlan: 'professional' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: 'Simplified Chinese', region: 'China', badge: 'CN', minPlan: 'enterprise' },
  { code: 'ja-JP', name: 'Japanese', nativeName: 'Japanese', region: 'Japan', badge: 'JP', minPlan: 'enterprise' },
  { code: 'ko-KR', name: 'Korean', nativeName: 'Korean', region: 'South Korea', badge: 'KR', minPlan: 'enterprise' },
  { code: 'ar-SA', name: 'Arabic', nativeName: 'Arabic', region: 'Saudi Arabia', badge: 'SA', minPlan: 'enterprise' },
  { code: 'ru-RU', name: 'Russian', nativeName: 'Russian', region: 'Russia', badge: 'RU', minPlan: 'enterprise' },
];

const PLAN_ORDER: PlanTier[] = ['starter', 'professional', 'enterprise'];

const normalizePlan = (value?: string, status?: string): PlanTier => {
  const statusKey = String(status || '').toLowerCase();
  if (statusKey === 'expired') return 'starter';
  const planKey = String(value || 'starter').trim().toLowerCase();
  if (planKey === 'enterprise') return 'enterprise';
  if (planKey === 'professional') return 'professional';
  return 'starter';
};

const canAccessLanguage = (userPlan: PlanTier, language: Language) =>
  PLAN_ORDER.indexOf(userPlan) >= PLAN_ORDER.indexOf(language.minPlan);

const labelForPlan = (plan: PlanTier) => plan.charAt(0).toUpperCase() + plan.slice(1);

export default function LanguageScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [loading, setLoading] = useState(true);
  const [savingLanguage, setSavingLanguage] = useState<string | null>(null);

  const planTier = useMemo(
    () =>
      normalizePlan(
        user?.business?.subscription?.plan,
        user?.business?.subscription?.status
      ),
    [user?.business?.subscription?.plan, user?.business?.subscription?.status]
  );

  const activeLanguage = useMemo(
    () => LANGUAGES.find((language) => language.code === selectedLanguage) || LANGUAGES[0],
    [selectedLanguage]
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const prefs = await syncPreferencesFromBackend();
        setSelectedLanguage(prefs.language || 'en-US');
      } catch (error) {
        console.error('Failed to load language settings:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const saveLanguage = async (languageCode: string) => {
    try {
      setSavingLanguage(languageCode);
      setSelectedLanguage(languageCode);
      await saveLocalPreferences({ language: languageCode });
      await updatePreferences({ language: languageCode });
      Alert.alert('Language Updated', `${languageCode} has been saved and synced to your backend settings.`);
    } catch (error: any) {
      console.error('Failed to save language:', error);
      Alert.alert(
        'Saved Locally',
        error?.message
          ? `Language saved on this device, but backend sync failed: ${error.message}`
          : 'Language saved on this device, but backend sync failed.'
      );
    } finally {
      setSavingLanguage(null);
    }
  };

  const requestLanguageChange = (language: Language) => {
    const allowed = canAccessLanguage(planTier, language);

    if (!allowed) {
      const requiredPlanLabel = labelForPlan(language.minPlan);
      Alert.alert(
        'Upgrade Required',
        `${language.name} is available on ${requiredPlanLabel} plan${language.minPlan === 'enterprise' ? ' (Enterprise unlocks all languages)' : ' and above'}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'View Plans',
            onPress: () => router.push('/(modals)/settings/billing-plan'),
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Change Language',
      `Set app language to ${language.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Change', onPress: () => saveLanguage(language.code) },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerState, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary500} />
        <Text style={[styles.centerStateText, { color: colors.textTertiary }]}>
          Loading language settings...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.heroCard, { backgroundColor: colors.primary50, borderColor: colors.primary100 }]}>
        <View style={styles.heroHeader}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Current Language</Text>
          <View style={[styles.planChip, { backgroundColor: colors.primary500 }]}>
            <Text style={styles.planChipText}>{labelForPlan(planTier)}</Text>
          </View>
        </View>

        <View style={styles.heroRow}>
          <View style={[styles.badgeCircle, { backgroundColor: colors.primary500 }]}>
            <Text style={styles.badgeCircleText}>{activeLanguage.badge}</Text>
          </View>
          <View style={styles.heroDetails}>
            <Text style={[styles.heroLanguageName, { color: colors.text }]}>{activeLanguage.name}</Text>
            <Text style={[styles.heroLanguageNative, { color: colors.textTertiary }]}>
              {activeLanguage.nativeName}
            </Text>
            <Text style={[styles.heroLanguageRegion, { color: colors.textSecondary }]}>
              {activeLanguage.region}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary500} />
        <View style={styles.infoBody}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>Language Access by Plan</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Starter: English only. Professional: core business languages. Enterprise: all available languages.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Languages</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>
          Language preference syncs with backend settings.
        </Text>

        {LANGUAGES.map((language) => {
          const selected = selectedLanguage === language.code;
          const locked = !canAccessLanguage(planTier, language);
          const saving = savingLanguage === language.code;

          return (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                selected && { borderColor: colors.primary500, backgroundColor: colors.primary50 },
                locked && { opacity: 0.8 },
              ]}
              onPress={() => requestLanguageChange(language)}
              disabled={Boolean(savingLanguage)}
            >
              <View style={styles.languageLeft}>
                <View
                  style={[
                    styles.languageBadge,
                    { backgroundColor: locked ? colors.border : selected ? colors.primary500 : colors.primary100 },
                  ]}
                >
                  <Text style={[styles.languageBadgeText, { color: locked ? colors.textTertiary : selected ? 'white' : colors.primary500 }]}>
                    {language.badge}
                  </Text>
                </View>
                <View style={styles.languageTextWrap}>
                  <Text style={[styles.languageName, { color: colors.text }]}>{language.name}</Text>
                  <Text style={[styles.languageNative, { color: colors.textTertiary }]}>{language.nativeName}</Text>
                  <View style={styles.metaRow}>
                    <Text style={[styles.languageRegion, { color: colors.textSecondary }]}>{language.region}</Text>
                    <Text style={[styles.dot, { color: colors.textTertiary }]}>•</Text>
                    <Text style={[styles.requiredPlanText, { color: locked ? colors.warning : colors.textTertiary }]}>
                      {language.minPlan === 'starter' ? 'Included' : `${labelForPlan(language.minPlan)}+`}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.languageRight}>
                {saving ? (
                  <ActivityIndicator size="small" color={colors.primary500} />
                ) : selected ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary500} />
                ) : locked ? (
                  <Ionicons name="lock-closed" size={18} color={colors.warning} />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
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
  heroCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  planChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  planChipText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  badgeCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCircleText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
  },
  heroDetails: {
    flex: 1,
    gap: 2,
  },
  heroLanguageName: {
    fontSize: 18,
    fontWeight: '700',
  },
  heroLanguageNative: {
    fontSize: 13,
  },
  heroLanguageRegion: {
    fontSize: 12,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoBody: {
    flex: 1,
    gap: 2,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    lineHeight: 17,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 4,
  },
  languageCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  languageBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  languageTextWrap: {
    flex: 1,
  },
  languageName: {
    fontSize: 15,
    fontWeight: '600',
  },
  languageNative: {
    fontSize: 12,
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  languageRegion: {
    fontSize: 11,
  },
  dot: {
    fontSize: 11,
  },
  requiredPlanText: {
    fontSize: 11,
    fontWeight: '600',
  },
  languageRight: {
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
