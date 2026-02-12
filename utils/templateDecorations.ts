type DecorationResult = {
  headerHtml: string;
  footerHtml: string;
  paddingTop: number;
  paddingBottom: number;
  pageStyle?: string;
};

type TemplateColors = {
  primary: string;
  secondary: string;
  accent: string;
  text?: string;
};

export const buildTemplateDecorations = (
  variant: string,
  colors: TemplateColors
): DecorationResult => {
  const primary = colors.primary;
  const secondary = colors.secondary;
  const accent = colors.accent;

  if (variant === 'classic') {
    return { headerHtml: '', footerHtml: '', paddingTop: 40, paddingBottom: 40 };
  }

  if (variant === 'panel') {
    const headerHeight = 120;
    const footerHeight = 70;
    const headerHtml = `
      <div style="position:absolute; top:0; left:0; width:100%; height:${headerHeight}px; background: linear-gradient(135deg, ${primary} 0%, ${secondary} 100%); z-index:1;"></div>
      <svg viewBox="0 0 100 25" preserveAspectRatio="none" style="position:absolute; top:${headerHeight - 35}px; left:0; width:100%; height:35px; z-index:1;">
        <path d="M0,0 H100 V12 Q70,25 0,18 Z" fill="${accent}" />
      </svg>
    `;
    const footerHtml = `
      <div style="position:absolute; bottom:0; left:0; width:42%; height:${footerHeight}px; background:${primary}; z-index:1;"></div>
    `;
    return { headerHtml, footerHtml, paddingTop: 110, paddingBottom: 70 };
  }

  if (variant === 'stripe') {
    const headerHeight = 95;
    const footerHeight = 60;
    const headerHtml = `
      <div style="position:absolute; top:0; left:0; width:100%; height:${headerHeight}px; background: repeating-linear-gradient(135deg, ${primary} 0, ${primary} 14px, ${secondary} 14px, ${secondary} 28px); z-index:1;"></div>
    `;
    const footerHtml = `
      <div style="position:absolute; bottom:0; right:0; width:70%; height:${footerHeight}px; background: linear-gradient(135deg, ${secondary} 0%, ${primary} 100%); z-index:1;"></div>
      <div style="position:absolute; bottom:0; left:0; width:30%; height:${footerHeight - 12}px; background:${primary}; transform: skewX(-18deg); transform-origin: left bottom; z-index:1;"></div>
    `;
    return { headerHtml, footerHtml, paddingTop: 100, paddingBottom: 65 };
  }

  if (variant === 'angled') {
    const headerHeight = 105;
    const footerHeight = 70;
    const headerHtml = `
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" style="position:absolute; top:0; left:0; width:100%; height:${headerHeight}px; z-index:1;">
        <polygon points="0,0 100,0 68,30 0,30" fill="${primary}" />
        <polygon points="36,0 100,0 100,22 62,22" fill="${secondary}" />
      </svg>
    `;
    const footerHtml = `
      <svg viewBox="0 0 100 24" preserveAspectRatio="none" style="position:absolute; bottom:0; left:0; width:100%; height:${footerHeight}px; z-index:1;">
        <polygon points="0,24 100,24 100,0 48,24" fill="${primary}" />
        <polygon points="0,24 70,0 0,0" fill="${secondary}" opacity="0.9" />
      </svg>
    `;
    return { headerHtml, footerHtml, paddingTop: 95, paddingBottom: 70 };
  }

  if (variant === 'brutal') {
    const headerHtml = `
      <div style="position:absolute; top:-24px; left:-24px; width:120px; height:120px; background:${primary}; z-index:1; transform: rotate(-12deg);"></div>
      <div style="position:absolute; bottom:-40px; right:-40px; width:140px; height:140px; background:${accent}; z-index:1; transform: rotate(20deg);"></div>
    `;
    const footerHtml = '';
    return {
      headerHtml,
      footerHtml,
      paddingTop: 70,
      paddingBottom: 60,
      pageStyle: 'border: 4px solid #000; background: #fff;',
    };
  }

  if (variant === 'holographic') {
    const headerHtml = `
      <div style="position:absolute; top:0; left:0; width:100%; height:22px; background:${primary}; z-index:1;"></div>
      <div style="position:absolute; top:22px; left:0; width:100%; height:14px; background:${secondary}; z-index:1;"></div>
      <div style="position:absolute; top:36px; left:0; width:100%; height:10px; background:${accent}; z-index:1;"></div>
    `;
    return {
      headerHtml,
      footerHtml: '',
      paddingTop: 70,
      paddingBottom: 60,
      pageStyle: `background: linear-gradient(135deg, ${primary} 0%, ${secondary} 45%, ${accent} 100%);`,
    };
  }

  if (variant === 'terminal') {
    const headerHtml = `
      <div style="position:absolute; top:0; left:0; width:100%; height:6px; background:${primary}; z-index:1;"></div>
    `;
    return {
      headerHtml,
      footerHtml: '',
      paddingTop: 60,
      paddingBottom: 50,
      pageStyle: 'background: #0b0f19; border: 1px solid rgba(255,255,255,0.1);',
    };
  }

  const headerHeight = 110;
  const footerHeight = 80;
  const headerHtml = `
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" style="position:absolute; top:0; left:0; width:100%; height:${headerHeight}px; z-index:1;">
      <path d="M0,0 H100 V18 Q70,30 0,22 Z" fill="${primary}" />
      <path d="M0,0 H100 V14 Q70,26 0,20 Z" fill="${secondary}" opacity="0.9" />
    </svg>
  `;
  const footerHtml = `
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" style="position:absolute; bottom:0; left:0; width:100%; height:${footerHeight}px; z-index:1;">
      <path d="M0,30 H100 V12 Q70,2 0,10 Z" fill="${primary}" opacity="0.95" />
      <path d="M0,30 H100 V18 Q70,8 0,14 Z" fill="${secondary}" opacity="0.85" />
    </svg>
  `;
  return { headerHtml, footerHtml, paddingTop: 95, paddingBottom: 70 };
};

export default buildTemplateDecorations;
