import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Template } from '@/context/DataContext';
import { resolveTemplateTheme } from '@/utils/templateStyles';
import { resolveTemplateStyleVariant } from '@/utils/templateStyleVariants';

type PreviewSize = 'compact' | 'full';

interface TemplatePreviewProps {
  template: Template;
  size?: PreviewSize;
}

const getMonoFont = () =>
  Platform.OS === 'ios' ? 'Courier' : 'monospace';

export default function TemplatePreview({ template, size = 'compact' }: TemplatePreviewProps) {
  const theme = resolveTemplateTheme(template);
  const variant = resolveTemplateStyleVariant(template.id, template);
  const isCompact = size === 'compact';
  const headerHeight = isCompact ? 44 : 90;
  const padding = isCompact ? 10 : 18;
  const titleSize = isCompact ? 12 : 18;
  const labelSize = isCompact ? 8 : 11;
  const valueSize = isCompact ? 9 : 12;
  const tableText = isCompact ? 8 : 11;
  const tableRowGap = isCompact ? 6 : 10;
  const totalSize = isCompact ? 12 : 18;

  const isTerminal = variant === 'terminal';
  const isBrutal = variant === 'brutal';
  const isHolo = variant === 'holographic';

  const backgroundColor = isTerminal ? '#0b0f19' : theme.accent;
  const borderColor = isBrutal ? '#000' : theme.border || theme.primary;
  const textColor = theme.text;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor,
          borderWidth: isBrutal ? 3 : 1,
        },
      ]}
    >
      {isHolo && (
        <LinearGradient
          colors={[theme.primary, theme.secondary, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      {isBrutal && (
        <>
          <View style={[styles.block, { backgroundColor: theme.primary }]} />
          <View style={[styles.blockAccent, { backgroundColor: theme.accent }]} />
        </>
      )}
      {!isTerminal && !isHolo && (
        <LinearGradient
          colors={[theme.primary, theme.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { height: headerHeight }]}
        />
      )}

      <View style={[styles.content, { padding }]}>
        <View style={styles.topRow}>
          <View>
            <Text
              style={[
                styles.label,
                { color: isTerminal ? theme.primary : theme.secondary, fontSize: labelSize },
              ]}
            >
              INVOICE
            </Text>
            <Text
              style={[
                styles.title,
                {
                  color: isTerminal || isHolo ? textColor : theme.primary,
                  fontSize: titleSize,
                  fontFamily: isTerminal ? getMonoFont() : undefined,
                },
              ]}
            >
              {template.name}
            </Text>
            <Text style={[styles.meta, { color: textColor, fontSize: valueSize }]}>
              Ledgerly Studio
            </Text>
          </View>
          <View style={styles.rightAlign}>
            <Text style={[styles.meta, { color: textColor, fontSize: labelSize }]}>INV-2026-004</Text>
            <Text style={[styles.meta, { color: textColor, fontSize: valueSize }]}>Feb 15, 2026</Text>
          </View>
        </View>

        <View style={[styles.infoRow, { marginTop: tableRowGap }]}>
          <View>
            <Text style={[styles.sectionLabel, { color: theme.primary, fontSize: labelSize }]}>Bill To</Text>
            <Text style={[styles.meta, { color: textColor, fontSize: valueSize }]}>Alex Morgan</Text>
          </View>
          <View style={styles.rightAlign}>
            <Text style={[styles.sectionLabel, { color: theme.primary, fontSize: labelSize }]}>From</Text>
            <Text style={[styles.meta, { color: textColor, fontSize: valueSize }]}>Ledgerly Inc.</Text>
          </View>
        </View>

        <View style={[styles.table, { borderColor }]}>
          <View style={[styles.tableHeader, { backgroundColor: theme.primary }]}>
            <Text style={[styles.tableHeaderText, { fontSize: tableText }]}>Item</Text>
            <Text style={[styles.tableHeaderText, { fontSize: tableText }]}>Qty</Text>
            <Text style={[styles.tableHeaderText, { fontSize: tableText }]}>Total</Text>
          </View>
          {[
            { item: 'Design Retainer', qty: '1', total: '$850' },
            { item: 'Consulting', qty: '1', total: '$650' },
          ].map((row) => (
            <View
              key={row.item}
              style={[
                styles.tableRow,
                { borderTopColor: borderColor },
              ]}
            >
              <Text style={[styles.tableText, { color: textColor, fontSize: tableText }]}>{row.item}</Text>
              <Text style={[styles.tableText, { color: textColor, fontSize: tableText }]}>{row.qty}</Text>
              <Text style={[styles.tableText, { color: textColor, fontSize: tableText }]}>{row.total}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={[styles.sectionLabel, { color: theme.secondary, fontSize: labelSize }]}>Total</Text>
          <Text style={[styles.totalText, { color: theme.primary, fontSize: totalSize }]}>$2,538</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  content: {
    position: 'relative',
    zIndex: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  rightAlign: {
    alignItems: 'flex-end',
  },
  label: {
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontWeight: '700',
    marginTop: 2,
  },
  meta: {
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  table: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tableHeaderText: {
    color: 'white',
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
  },
  tableText: {
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalText: {
    fontWeight: '800',
  },
  block: {
    position: 'absolute',
    top: -18,
    left: -18,
    width: 80,
    height: 80,
    transform: [{ rotate: '-12deg' }],
  },
  blockAccent: {
    position: 'absolute',
    bottom: -24,
    right: -24,
    width: 90,
    height: 90,
    transform: [{ rotate: '18deg' }],
  },
});
