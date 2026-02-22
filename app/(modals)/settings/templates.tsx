import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useData, Template } from '@/context/DataContext';
import ModalHeader from '@/components/ModalHeader';
import TemplatePreviewModal from '@/components/templates/TemplatePreviewModal';

type TemplateScope = 'invoice' | 'receipt';
type TemplateTierTab = 'all' | 'STANDARD' | 'PREMIUM' | 'ELITE' | 'CUSTOM';

const toGradientColor = (value?: number[], fallback?: string) => {
  if (!value || value.length < 3) return fallback || '#0ea5e9';
  return `rgb(${value[0]}, ${value[1]}, ${value[2]})`;
};

export default function TemplatesScreen() {
  const { colors } = useTheme();
  const {
    templates,
    selectedInvoiceTemplate,
    selectedReceiptTemplate,
    setInvoiceTemplate,
    setReceiptTemplate,
    refreshTemplates,
    purchaseTemplate,
  } = useData();

  const [scope, setScope] = useState<TemplateScope>('invoice');
  const [tierTab, setTierTab] = useState<TemplateTierTab>('all');
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  useEffect(() => {
    if (!templates.length) {
      refreshTemplates();
    }
  }, [templates.length, refreshTemplates]);

  const visibleTemplates = useMemo(() => templates, [templates]);

  const selectedTemplateId =
    scope === 'invoice' ? selectedInvoiceTemplate?.id : selectedReceiptTemplate?.id;

  const categoryTabs = useMemo(() => {
    const counts = {
      all: visibleTemplates.length,
      STANDARD: visibleTemplates.filter((t) => (t.category || 'STANDARD') === 'STANDARD').length,
      PREMIUM: visibleTemplates.filter((t) => t.category === 'PREMIUM').length,
      ELITE: visibleTemplates.filter((t) => t.category === 'ELITE').length,
      CUSTOM: visibleTemplates.filter((t) => t.category === 'CUSTOM').length,
    };

    return [
      { id: 'all' as const, label: 'All', count: counts.all },
      { id: 'STANDARD' as const, label: 'Standard', count: counts.STANDARD },
      { id: 'PREMIUM' as const, label: 'Premium', count: counts.PREMIUM },
      { id: 'ELITE' as const, label: 'Elite', count: counts.ELITE },
      { id: 'CUSTOM' as const, label: 'Custom', count: counts.CUSTOM },
    ];
  }, [visibleTemplates]);

  const groupedTemplates = useMemo(() => {
    const filtered = visibleTemplates.filter((template) => {
      if (tierTab === 'all') return true;
      return (template.category || 'STANDARD') === tierTab;
    });

    return [...filtered].sort((a, b) => {
      const categoryOrder = { STANDARD: 0, PREMIUM: 1, ELITE: 2, CUSTOM: 3 } as Record<string, number>;
      const categoryDiff =
        (categoryOrder[a.category || 'STANDARD'] ?? 99) -
        (categoryOrder[b.category || 'STANDARD'] ?? 99);
      if (categoryDiff !== 0) return categoryDiff;
      const premiumScore = (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0);
      if (premiumScore !== 0) return premiumScore;
      return (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0);
    });
  }, [visibleTemplates, tierTab]);

  const handleSelect = async (template: Template) => {
    if (template.isPremium && !template.hasAccess) {
      Alert.alert(
        'Premium Template',
        `${template.name} is a premium template. Unlock it to use.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unlock',
            onPress: () => handlePurchase(template),
          },
        ]
      );
      return;
    }

    try {
      setLoadingTemplateId(template.id);
      if (scope === 'invoice') {
        await setInvoiceTemplate(template.id);
      } else {
        await setReceiptTemplate(template.id);
      }
    } finally {
      setLoadingTemplateId(null);
    }
  };

  const handlePurchase = async (template: Template) => {
    try {
      setLoadingTemplateId(template.id);
      await purchaseTemplate(template.id);
    } catch (error) {
      Alert.alert('Purchase Failed', 'Unable to unlock the template right now.');
    } finally {
      setLoadingTemplateId(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshTemplates();
    setRefreshing(false);
  };

  const renderBadge = (label: string, background: string, color: string) => (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ModalHeader title="Templates" subtitle="Choose styles for invoices and receipts" />

      <View style={styles.scopeToggle}>
        {(['invoice', 'receipt'] as TemplateScope[]).map((item) => {
          const isActive = scope === item;
          return (
            <TouchableOpacity
              key={item}
              style={[
                styles.scopeButton,
                {
                  backgroundColor: isActive ? colors.primary500 : colors.surface,
                  borderColor: isActive ? colors.primary500 : colors.border,
                },
              ]}
              onPress={() => setScope(item)}
            >
              <Text
                style={[
                  styles.scopeButtonText,
                  { color: isActive ? 'white' : colors.text },
                ]}
              >
                {item === 'invoice' ? 'Invoice Templates' : 'Receipt Templates'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tierTabsContent}
        style={styles.tierTabsScroll}
      >
        {categoryTabs.map((tab) => {
          const isActive = tierTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tierTabButton,
                {
                  backgroundColor: isActive ? colors.primary500 : colors.surface,
                  borderColor: isActive ? colors.primary500 : colors.border,
                },
              ]}
              onPress={() => setTierTab(tab.id)}
            >
              <Text style={[styles.tierTabText, { color: isActive ? 'white' : colors.text }]}>
                {tab.label}
              </Text>
              <View
                style={[
                  styles.tierTabCount,
                  { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : colors.card },
                ]}
              >
                <Text style={[styles.tierTabCountText, { color: isActive ? 'white' : colors.textTertiary }]}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary500}
            colors={[colors.primary500]}
          />
        }
      >
        {groupedTemplates.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Ionicons name="color-palette-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No templates found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
              Pull down to refresh and load templates.
            </Text>
          </View>
        ) : (
          groupedTemplates.map((template) => {
            const primary = toGradientColor(template.colors?.primary, colors.primary500);
            const secondary = toGradientColor(template.colors?.secondary, colors.primary400 || colors.primary500);
            const isSelected = selectedTemplateId === template.id;
            const isLocked = template.isPremium && !template.hasAccess;
            const isLoading = loadingTemplateId === template.id;

            return (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isSelected && { borderColor: colors.primary500, borderWidth: 2 },
                ]}
                onPress={() => handleSelect(template)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[primary, secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.preview}
                >
                  <View style={styles.previewHeader}>
                    <Text style={styles.previewTitle}>{template.name}</Text>
                    {template.isPremium && renderBadge('Premium', 'rgba(255,255,255,0.2)', 'white')}
                  </View>
                  <Text style={styles.previewSubtitle}>
                    {template.category || 'STANDARD'}
                  </Text>
                  {template.layout?.showWatermark && (
                    <Text style={styles.previewWatermark}>{template.layout.watermarkText || 'PREMIUM'}</Text>
                  )}
                </LinearGradient>

                <View style={styles.cardBody}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{template.name}</Text>
                  <Text style={[styles.cardDescription, { color: colors.textTertiary }]}>
                    {template.description || 'Classic layout for invoices and receipts.'}
                  </Text>
                  <View style={styles.badgeRow}>
                    {template.isDefault &&
                      renderBadge('Default', colors.primary100, colors.primary500)}
                    {isSelected &&
                      renderBadge('Selected', colors.success + '20', colors.success)}
                    {isLocked &&
                      renderBadge('Locked', colors.error + '20', colors.error)}
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={[styles.previewButton, { borderColor: colors.border }]}
                      onPress={() => setPreviewTemplate(template)}
                    >
                      <Ionicons name="eye-outline" size={18} color={colors.text} />
                      <Text style={[styles.previewButtonText, { color: colors.text }]}>Preview</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor: isLocked ? colors.error + '15' : colors.primary500,
                        },
                      ]}
                      onPress={() => (isLocked ? handlePurchase(template) : handleSelect(template))}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color={isLocked ? colors.error : 'white'} />
                      ) : (
                        <>
                          <Ionicons
                            name={isLocked ? 'lock-closed-outline' : 'checkmark-circle-outline'}
                            size={18}
                            color={isLocked ? colors.error : 'white'}
                          />
                          <Text
                            style={[
                              styles.actionButtonText,
                              { color: isLocked ? colors.error : 'white' },
                            ]}
                          >
                            {isLocked ? `Unlock ($${template.price ?? 0})` : isSelected ? 'Selected' : 'Use Template'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <TemplatePreviewModal
        visible={Boolean(previewTemplate)}
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  scopeToggle: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  tierTabsScroll: {
    marginBottom: 10,
  },
  tierTabsContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  tierTabButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tierTabCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tierTabCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scopeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  scopeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  preview: {
    padding: 16,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  previewSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    letterSpacing: 1.2,
  },
  previewWatermark: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'right',
  },
  cardBody: {
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
