import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import ModalHeader from '@/components/ModalHeader';
import { useData } from '@/context/DataContext';
import { useUser } from '@/context/UserContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  TIME_RANGE_OPTIONS,
  TimeRange,
  formatTimeRangeLabel,
  getInvoiceSummary,
  getReceiptSummary,
  createReportHTML,
} from '@/utils/reportUtils';

type Frequency = 'daily' | 'weekly' | 'monthly';

interface ScheduledReport {
  id: string;
  frequency: Frequency;
  range: TimeRange;
  notes: string;
  nextRun: Date;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const computeNextRun = (freq: Frequency, baseTime: Date) => {
  const next = new Date();
  next.setHours(baseTime.getHours(), baseTime.getMinutes(), 0, 0);
  if (next <= new Date()) {
    if (freq === 'daily') {
      next.setDate(next.getDate() + 1);
    } else if (freq === 'weekly') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
  }
  return next;
};

export default function ScheduleReportScreen() {
  const { colors } = useTheme();
  const { invoices, receipts, refreshData } = useData();
  const { user } = useUser();
  const [frequency, setFrequency] = useState<Frequency>('weekly');
  const [selectedRange, setSelectedRange] = useState<TimeRange>('week');
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  const invoiceStats = useMemo(() => getInvoiceSummary(invoices), [invoices]);
  const receiptStats = useMemo(() => getReceiptSummary(receipts), [receipts]);
  const totalRevenue = invoiceStats.total + receiptStats.total;

  const companyName = (
    user?.businessName?.trim() ||
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
    'Ledgerly Inc.'
  );
  const companyContacts = [user?.phoneNumber, user?.email, user?.country].filter(Boolean);
  const companyContactMarkup = companyContacts.length
    ? companyContacts.join('<br>')
    : 'support@ledgerly.com';

  const rangeLabel = formatTimeRangeLabel(selectedRange);

  const handleSchedule = () => {
    const nextRun = computeNextRun(frequency, selectedTime);
    setIsScheduling(true);
    setScheduledReports((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        frequency,
        range: selectedRange,
        notes: notes.trim(),
        nextRun,
      },
    ]);
    setNotes('');
    setIsScheduling(false);
    Alert.alert('Scheduled', `Report scheduled for ${frequency} runs (${rangeLabel}).`);
  };

  const handleExportNow = async () => {
    try {
      setIsExporting(true);
      const html = createReportHTML({
        companyName,
        companyContact: companyContactMarkup,
        selectedRangeId: selectedRange,
        invoiceSummary: invoiceStats,
        receiptSummary: receiptStats,
        totalRevenue,
      });
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Scheduled Report Snapshot',
        });
      } else {
        Alert.alert('Export Ready', `Snapshot ready at ${uri}`);
      }
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to generate the report PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshData();
      Alert.alert('Synced', 'Report data refreshed.');
    } catch {
      Alert.alert('Sync Failed', 'Unable to refresh report data at the moment.');
    }
  };

  const toggleTimePicker = () => {
    setShowTimePicker(true);
  };

  const onTimeChange = (event: any, value?: Date) => {
    if (value) {
      setSelectedTime(value);
    }
    setShowTimePicker(Platform.OS === 'ios');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ModalHeader title="Schedule Report" subtitle="Automate PDF exports" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequency</Text>
          <View style={styles.frequencyRow}>
            {(['daily', 'weekly', 'monthly'] as Frequency[]).map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.frequencyButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                  frequency === option && {
                    backgroundColor: colors.primary500,
                    borderColor: colors.primary500,
                  },
                ]}
                onPress={() => setFrequency(option)}
              >
                <Text
                  style={[
                    styles.frequencyLabel,
                    frequency === option && { color: 'white' },
                  ]}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Time of Day</Text>
          <TouchableOpacity
            style={[styles.timeButton, { borderColor: colors.border, backgroundColor: colors.background }]}
            onPress={toggleTimePicker}
          >
            <Ionicons name="time-outline" size={20} color={colors.text} />
            <Text style={[styles.timeText, { color: colors.text }]}>
              {selectedTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              is24Hour={false}
              display="spinner"
              onChange={onTimeChange}
            />
          )}
        </View>

        <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Report Range</Text>
          <View style={styles.rangeRow}>
            {TIME_RANGE_OPTIONS.map((range) => (
              <TouchableOpacity
                key={range.id}
                style={[
                  styles.rangeOption,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                  selectedRange === range.id && {
                    backgroundColor: colors.primary500,
                    borderColor: colors.primary500,
                  },
                ]}
                onPress={() => setSelectedRange(range.id)}
              >
                <Text
                  style={[
                    styles.rangeOptionText,
                    selectedRange === range.id && { color: 'white' },
                  ]}
                >
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.hintText, { color: colors.textTertiary }]}>
            Current selection: {rangeLabel}
          </Text>
        </View>

        <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes (optional)</Text>
          <TextInput
            style={[styles.notesInput, { borderColor: colors.border, color: colors.text }]}
            placeholder="Add context for this schedule"
            placeholderTextColor={colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={[styles.scheduleButton, { backgroundColor: colors.primary500 }]}
          onPress={handleSchedule}
          disabled={isScheduling}
        >
          {isScheduling ? (
            <ActivityIndicator color="white" />
          ) : (
            <Ionicons name="calendar-check-outline" size={20} color="white" />
          )}
          <Text style={styles.scheduleButtonText}>
            {isScheduling ? 'Scheduling...' : 'Schedule Report'}
          </Text>
        </TouchableOpacity>

        <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Schedules</Text>
          {scheduledReports.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No schedules have been created yet.
            </Text>
          ) : (
            scheduledReports.map((entry) => (
              <View key={entry.id} style={styles.scheduleCard}>
                <View>
                  <Text style={[styles.listTitle, { color: colors.text }]}>
                    {entry.frequency.charAt(0).toUpperCase() + entry.frequency.slice(1)} ·{' '}
                    {formatTimeRangeLabel(entry.range)}
                  </Text>
                  <Text style={[styles.listMeta, { color: colors.textTertiary }]}>
                    Next run {entry.nextRun.toLocaleString()}
                  </Text>
                </View>
                <Text style={[styles.notesChip, { borderColor: colors.border, color: colors.text }]}>
                  {entry.notes || 'No notes'}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.actionsWrap}>
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.border }]}
            onPress={handleRefresh}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.primary500} />
            <Text style={[styles.actionText, { color: colors.primary500 }]}>Refresh Data</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary500, borderColor: colors.primary500 }]}
            onPress={handleExportNow}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Ionicons name="download-outline" size={20} color="white" />
            )}
            <Text style={[styles.actionText, { color: 'white' }]}>
              {isExporting ? 'Exporting...' : 'Export Snapshot'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  section: {
    margin: 20,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  frequencyButton: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  frequencyLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeButton: {
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  rangeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  rangeOption: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rangeOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hintText: {
    marginTop: 8,
    fontSize: 13,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
  },
  scheduleButton: {
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  scheduleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
  },
  scheduleCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  notesChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  actionsWrap: {
    marginHorizontal: 20,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
