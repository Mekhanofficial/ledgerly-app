import { Template } from '@/context/DataContext';

export interface TemplateTheme {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  muted: string;
  border: string;
  headerBackground: string;
  headerText: string;
  watermarkText: string;
  showWatermark: boolean;
  showHeaderBorder: boolean;
  showFooter: boolean;
  hasBackgroundPattern: boolean;
  bodyFont: string;
  titleFont: string;
}

const DEFAULTS = {
  primary: '#4F46E5',
  secondary: '#6366F1',
  accent: '#F9FAFB',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
};

const FONT_MAP: Record<string, string> = {
  helvetica: 'Helvetica, Arial, sans-serif',
  'helvetica-bold': 'Helvetica, Arial, sans-serif',
  'helvetica-light': 'Helvetica, Arial, sans-serif',
  'helvetica-oblique': 'Helvetica, Arial, sans-serif',
  'helvetica-black': 'Helvetica, Arial, sans-serif',
  times: 'Times New Roman, serif',
  'times-bold': 'Times New Roman, serif',
  'times-italic': 'Times New Roman, serif',
  garamond: 'Garamond, serif',
  georgia: 'Georgia, serif',
  courier: 'Courier New, monospace',
  'courier-bold': 'Courier New, monospace',
  roboto: 'Roboto, Helvetica, Arial, sans-serif',
};

const toCssColor = (value?: number[], fallback?: string) => {
  if (!value || value.length < 3) return fallback;
  return `rgb(${value[0]}, ${value[1]}, ${value[2]})`;
};

const resolveFont = (value?: string, fallback = FONT_MAP.helvetica) => {
  if (!value) return fallback;
  const key = value.toLowerCase();
  return FONT_MAP[key] || fallback;
};

export const resolveTemplateTheme = (template?: Template | null): TemplateTheme => {
  const primary = toCssColor(template?.colors?.primary, DEFAULTS.primary) || DEFAULTS.primary;
  const secondary = toCssColor(template?.colors?.secondary, DEFAULTS.secondary) || DEFAULTS.secondary;
  const accent = toCssColor(template?.colors?.accent, DEFAULTS.accent) || DEFAULTS.accent;
  const text = toCssColor(template?.colors?.text, DEFAULTS.text) || DEFAULTS.text;
  const border = toCssColor(template?.colors?.border, DEFAULTS.border) || DEFAULTS.border;

  const hasGradient = Boolean(template?.layout?.hasGradientEffects);
  const hasDarkMode = Boolean(template?.layout?.hasDarkMode);
  const headerBackground = hasGradient
    ? `linear-gradient(135deg, ${primary}, ${secondary})`
    : primary;

  return {
    primary,
    secondary,
    accent,
    text,
    muted: hasDarkMode ? '#9CA3AF' : DEFAULTS.muted,
    border,
    headerBackground,
    headerText: '#FFFFFF',
    watermarkText: template?.layout?.watermarkText || template?.name?.toUpperCase() || 'LEDGERLY',
    showWatermark: Boolean(template?.layout?.showWatermark),
    showHeaderBorder: template?.layout?.showHeaderBorder !== false,
    showFooter: template?.layout?.showFooter !== false,
    hasBackgroundPattern: Boolean(template?.layout?.hasBackgroundPattern),
    bodyFont: resolveFont(template?.fonts?.body, FONT_MAP.helvetica),
    titleFont: resolveFont(template?.fonts?.title, FONT_MAP.helvetica),
  };
};

export const buildTemplateVariables = (theme: TemplateTheme) => `
  :root {
    --primary: ${theme.primary};
    --secondary: ${theme.secondary};
    --accent: ${theme.accent};
    --text: ${theme.text};
    --muted: ${theme.muted};
    --border: ${theme.border};
    --header-bg: ${theme.headerBackground};
    --header-text: ${theme.headerText};
  }
`;
