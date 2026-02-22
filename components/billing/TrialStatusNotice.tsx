import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type TrialStatusNoticeProps = {
  trialEndsAt?: string | null;
};

const formatTrialDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function TrialStatusNotice({ trialEndsAt }: TrialStatusNoticeProps) {
  const { colors, isDark } = useTheme();
  const formattedDate = formatTrialDate(trialEndsAt);

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: isDark ? 'rgba(251, 191, 36, 0.35)' : '#FCD34D',
          backgroundColor: isDark ? 'rgba(251, 191, 36, 0.10)' : '#FFFBEB',
        },
      ]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="time-outline" size={18} color={colors.warning} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.warning }]}>Free trial active</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {formattedDate
            ? `Trial ends on ${formattedDate}. Upgrade before then to avoid interruption.`
            : 'Upgrade before your trial ends to avoid interruption.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconWrap: {
    paddingTop: 1,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  message: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
});
