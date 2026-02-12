import { Template } from '@/context/DataContext';

export const TEMPLATE_STYLE_VARIANTS: Record<string, string> = {
  luxury: 'wave',
  corporatePro: 'panel',
  creativeStudio: 'stripe',
  techModern: 'angled',
  elegant: 'wave',
  startup: 'stripe',
  consultant: 'panel',
  retail: 'angled',
  medical: 'wave',
  legal: 'panel',
  professionalClassic: 'panel',
  modernCorporate: 'stripe',
  cleanBilling: 'classic',
  retailReceipt: 'angled',
  simpleElegant: 'wave',
  urbanEdge: 'panel',
  creativeFlow: 'wave',
  glassmorphic: 'panel',
  neoBrutalist: 'brutal',
  holographic: 'holographic',
  minimalistDark: 'terminal',
  organicEco: 'wave',
};

export const resolveTemplateStyleVariant = (
  templateId?: string | null,
  template?: Template | null
) => {
  const resolvedId = templateId || template?.id || template?.templateStyle;
  if (resolvedId && TEMPLATE_STYLE_VARIANTS[resolvedId]) {
    return TEMPLATE_STYLE_VARIANTS[resolvedId];
  }
  if (template?.isPremium) {
    return 'wave';
  }
  return 'classic';
};

export default resolveTemplateStyleVariant;
