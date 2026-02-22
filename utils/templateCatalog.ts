import AsyncStorage from '@react-native-async-storage/async-storage';

const TEMPLATE_PURCHASES_KEY = 'template_purchases';
const PREMIUM_ACCESS_KEY = 'premium_templates_access';

export const basicTemplates = {
  standard: {
    id: 'standard',
    name: 'Standard',
    description: 'Clean, professional design for all businesses',
    colors: {
      primary: [41, 128, 185],
      secondary: [52, 152, 219],
      accent: [236, 240, 241],
      text: [44, 62, 80],
    },
    fonts: {
      title: 'helvetica',
      body: 'helvetica',
      accent: 'helvetica',
    },
    layout: {
      showLogo: false,
      showWatermark: false,
      showHeaderBorder: true,
      showFooter: true,
      hasAnimations: false,
      hasGradientEffects: false,
      hasMultiLanguage: false,
    },
    category: 'basic',
    isPremium: false,
    isDefault: true,
    isFavorite: true,
    price: 0,
    features: ['Professional Layout', 'Basic Customization', 'Email Support'],
    previewColor: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    popularity: 95,
    lastUpdated: '2024-01-15',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and elegant, focuses on content',
    colors: {
      primary: [52, 73, 94],
      secondary: [127, 140, 141],
      accent: [236, 240, 241],
      text: [44, 62, 80],
    },
    fonts: {
      title: 'helvetica',
      body: 'helvetica',
      accent: 'helvetica',
    },
    layout: {
      showLogo: false,
      showWatermark: false,
      showHeaderBorder: false,
      showFooter: false,
      hasAnimations: false,
      hasGradientEffects: false,
      hasMultiLanguage: false,
    },
    category: 'basic',
    isPremium: false,
    isDefault: false,
    isFavorite: false,
    price: 0,
    features: ['Clean Design', 'Focus on Content', 'Fast Loading'],
    previewColor: 'bg-gradient-to-br from-gray-700 to-gray-900',
    popularity: 85,
    lastUpdated: '2024-01-10',
  },
};

export const premiumTemplates = {
  luxury: {
    id: 'luxury',
    name: 'Luxury',
    description: 'Elegant design for high-end businesses with gold accents and premium effects',
    colors: {
      primary: [184, 134, 11],
      secondary: [160, 124, 44],
      accent: [244, 244, 244],
      text: [33, 33, 33],
    },
    fonts: {
      title: 'times-bold',
      body: 'helvetica',
      accent: 'helvetica-oblique',
    },
    layout: {
      showLogo: true,
      showWatermark: true,
      watermarkText: 'PREMIUM',
      showHeaderBorder: true,
      showFooter: true,
      hasAnimations: true,
      hasGradientEffects: true,
      hasMultiLanguage: false,
      hasBackgroundPattern: true,
    },
    category: 'premium',
    isPremium: true,
    isDefault: false,
    isFavorite: false,
    price: 9.99,
    features: [
      'Gold Accents & Effects',
      'Custom Watermark',
      'Premium Support',
      'Priority Updates',
      'Animated Elements',
      'Background Patterns',
    ],
    previewColor: 'bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600',
    popularity: 92,
    lastUpdated: '2024-02-01',
    tags: ['luxury', 'elegant', 'premium'],
  },
  corporatePro: {
    id: 'corporatePro',
    name: 'Corporate Pro',
    description: 'Advanced corporate template with multiple language support and professional features',
    colors: {
      primary: [13, 71, 161],
      secondary: [21, 101, 192],
      accent: [250, 250, 250],
      text: [38, 50, 56],
    },
    fonts: {
      title: 'helvetica-bold',
      body: 'helvetica',
      accent: 'helvetica-light',
    },
    layout: {
      showLogo: true,
      showWatermark: true,
      watermarkText: 'PROFESSIONAL',
      showHeaderBorder: true,
      showFooter: true,
      hasAnimations: true,
      hasGradientEffects: true,
      hasMultiLanguage: true,
      hasDataTables: true,
    },
    category: 'premium',
    isPremium: true,
    isDefault: false,
    isFavorite: true,
    price: 14.99,
    features: [
      'Multi-language Support',
      'Advanced Tax Calculations',
      'Currency Converter',
      'Advanced Analytics',
      'Data Tables',
      'Professional Watermark',
    ],
    previewColor: 'bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800',
    popularity: 88,
    lastUpdated: '2024-02-05',
    tags: ['corporate', 'professional', 'multi-language'],
  },
  creativeStudio: {
    id: 'creativeStudio',
    name: 'Creative Studio',
    description: 'Modern design with animations, interactive elements and creative layouts',
    colors: {
      primary: [233, 30, 99],
      secondary: [216, 27, 96],
      accent: [255, 255, 255],
      text: [33, 33, 33],
    },
    fonts: {
      title: 'helvetica-bold',
      body: 'courier',
      accent: 'helvetica',
    },
    layout: {
      showLogo: true,
      showWatermark: true,
      watermarkText: 'CREATIVE',
      showHeaderBorder: false,
      showFooter: true,
      hasAnimations: true,
      hasGradientEffects: true,
      hasMultiLanguage: false,
      hasInteractiveElements: true,
    },
    category: 'premium',
    isPremium: true,
    isDefault: false,
    isFavorite: false,
    price: 12.99,
    features: [
      'Animated Elements',
      'Interactive PDF',
      '3D Preview',
      'Color Customizer',
      'Creative Layouts',
      'Visual Effects',
    ],
    previewColor: 'bg-gradient-to-br from-pink-600 via-rose-500 to-pink-700',
    popularity: 95,
    lastUpdated: '2024-01-28',
    tags: ['creative', 'modern', 'animated'],
  },
  techModern: {
    id: 'techModern',
    name: 'Tech Modern',
    description: 'Futuristic design for tech companies with gradient effects and dark mode',
    colors: {
      primary: [0, 188, 212],
      secondary: [0, 151, 167],
      accent: [245, 248, 250],
      text: [38, 50, 56],
    },
    fonts: {
      title: 'helvetica-bold',
      body: 'roboto',
      accent: 'helvetica-light',
    },
    layout: {
      showLogo: true,
      showWatermark: true,
      watermarkText: 'TECH',
      showHeaderBorder: true,
      showFooter: true,
      hasAnimations: true,
      hasGradientEffects: true,
      hasMultiLanguage: false,
      hasDarkMode: true,
    },
    category: 'premium',
    isPremium: true,
    isDefault: false,
    isFavorite: false,
    price: 11.99,
    features: [
      'Gradient Effects',
      'Dark Mode',
      'Code Syntax Highlighting',
      'API Integration',
      'Tech Icons',
      'Modern Layout',
    ],
    previewColor: 'bg-gradient-to-br from-cyan-500 via-teal-500 to-green-500',
    popularity: 90,
    lastUpdated: '2024-02-03',
    tags: ['tech', 'modern', 'gradient'],
  },
  elegant: {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated design with subtle animations and premium typography',
    colors: {
      primary: [121, 85, 72],
      secondary: [141, 110, 99],
      accent: [250, 250, 249],
      text: [66, 66, 66],
    },
    fonts: {
      title: 'garamond',
      body: 'georgia',
      accent: 'helvetica-light',
    },
    layout: {
      showLogo: true,
      showWatermark: true,
      watermarkText: 'ELEGANT',
      showHeaderBorder: true,
      showFooter: true,
      hasAnimations: true,
      hasGradientEffects: false,
      hasMultiLanguage: false,
      hasPremiumTypography: true,
    },
    category: 'premium',
    isPremium: true,
    isDefault: false,
    isFavorite: true,
    price: 10.99,
    features: [
      'Premium Typography',
      'Subtle Animations',
      'Elegant Borders',
      'Custom Icons',
      'Refined Layout',
      'Print Optimized',
    ],
    previewColor: 'bg-gradient-to-br from-amber-800 via-amber-700 to-amber-900',
    popularity: 87,
    lastUpdated: '2024-01-25',
    tags: ['elegant', 'sophisticated', 'print'],
  },
  startup: {
    id: 'startup',
    name: 'Startup',
    description: 'Vibrant design for startups with modern elements and growth-focused features',
    colors: {
      primary: [76, 175, 80],
      secondary: [56, 142, 60],
      accent: [232, 245, 233],
      text: [33, 33, 33],
    },
    fonts: {
      title: 'helvetica-bold',
      body: 'helvetica',
      accent: 'helvetica-light',
    },
    layout: {
      showLogo: true,
      showWatermark: true,
      watermarkText: 'STARTUP',
      showHeaderBorder: false,
      showFooter: true,
      hasAnimations: true,
      hasGradientEffects: true,
      hasMultiLanguage: false,
      hasGrowthMetrics: true,
    },
    category: 'premium',
    isPremium: true,
    isDefault: false,
    isFavorite: false,
    price: 13.99,
    features: [
      'Growth Metrics',
      'Progress Indicators',
      'Milestone Tracking',
      'Team Collaboration',
      'Vibrant Colors',
      'Modern Elements',
    ],
    previewColor: 'bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600',
    popularity: 84,
    lastUpdated: '2024-02-02',
    tags: ['startup', 'modern', 'growth'],
  },
  consultant: {
    id: 'consultant',
    name: 'Consultant',
    description: 'Polished, client-ready template for consultants and agencies',
    colors: {
      primary: [45, 108, 223],
      secondary: [63, 123, 236],
      accent: [236, 244, 255],
      text: [38, 50, 56],
    },
    fonts: {
      title: 'helvetica-bold',
      body: 'helvetica',
      accent: 'helvetica-light',
    },
    layout: {
      showLogo: true,
      showWatermark: true,
      watermarkText: 'CONSULTANT',
      showHeaderBorder: true,
      showFooter: true,
      hasAnimations: true,
      hasGradientEffects: true,
      hasMultiLanguage: false,
      hasDataTables: true,
    },
    category: 'premium',
    isPremium: true,
    isDefault: false,
    isFavorite: false,
    price: 9.99,
    features: [
      'Client-ready Layout',
      'Professional Accent Colors',
      'Detailed Line Items',
      'Priority Support',
      'Custom Watermark',
    ],
    previewColor: 'bg-gradient-to-br from-blue-600 via-indigo-500 to-blue-700',
    popularity: 86,
    lastUpdated: '2024-02-06',
    tags: ['consulting', 'agency', 'professional'],
  },
  retail: {
    id: 'retail',
    name: 'Retail',
    description: 'Bright retail template with item-forward layout for stores',
    colors: {
      primary: [244, 81, 30],
      secondary: [255, 152, 0],
      accent: [255, 248, 225],
      text: [55, 71, 79],
    },
    fonts: {
      title: 'helvetica-bold',
      body: 'helvetica',
      accent: 'helvetica-light',
    },
    layout: {
      showLogo: true,
      showWatermark: true,
      watermarkText: 'RETAIL',
      showHeaderBorder: true,
      showFooter: true,
      hasAnimations: true,
      hasGradientEffects: true,
      hasMultiLanguage: false,
    },
    category: 'premium',
    isPremium: true,
    isDefault: false,
    isFavorite: false,
    price: 8.99,
    features: [
      'Itemized Layout',
      'Retail-ready Styling',
      'Bold Highlights',
      'Priority Support',
    ],
    previewColor: 'bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600',
    popularity: 83,
    lastUpdated: '2024-02-06',
    tags: ['retail', 'store', 'point-of-sale'],
  },
  professionalClassic: {
    id: 'professionalClassic',
    name: 'Professional Classic',
    description: 'Traditional US-style invoice with Bill-To & Ship-To addresses. Trusted and clean.',
    colors: {
      primary: [44, 62, 80],
      secondary: [52, 73, 94],
      accent: [245, 247, 250],
      text: [33, 37, 41],
      border: [206, 212, 218],
    },
    fonts: {
      title: 'helvetica-bold',
      body: 'helvetica',
      accent: 'helvetica-light',
    },
    layout: {
      showLogo: true,
      showWatermark: false,
      showHeaderBorder: true,
      showFooter: true,
      hasDualAddress: true,
      headerStyle: 'letterhead',
    },
    category: 'premium',
    isPremium: true,
    isDefault: false,
    isFavorite: false,
    price: 7.99,
    features: [
      'Bill-To & Ship-To columns',
      'PO number field',
      '15-day payment terms',
      'Classic letterhead style',
    ],
    previewColor: 'bg-gradient-to-br from-slate-700 to-slate-800',
    popularity: 92,
    lastUpdated: '2026-02-11',
    tags: ['classic', 'us-style', 'trusted', 'repair'],
  },
  modernCorporate: {
    id: 'modernCorporate',
    name: 'Modern Corporate',
    description: 'Bold branded header with tagline, colored table head, perfect for agencies.',
    colors: {
      primary: [0, 70, 140],
      secondary: [0, 110, 200],
      accent: [240, 248, 255],
      text: [38, 50, 56],
      border: [200, 215, 230],
    },
    fonts: {
      title: 'helvetica-bold',
      body: 'helvetica',
      accent: 'helvetica-oblique',
    },
    layout: {
      showLogo: true,
      showWatermark: true,
      watermarkText: 'CORPORATE',
      showHeaderBorder: false,
      headerStyle: 'brand-bar',
      showFooter: true,
    },
    category: 'premium',
    isPremium: true,
    isDefault: false,
    isFavorite: false,
    price: 9.99,
    features: [
      'Tagline placement',
      'Colored table header',
      'Thank-you note',
      'Professional watermark',
    ],
    previewColor: 'bg-gradient-to-br from-blue-800 to-blue-600',
    popularity: 90,
    lastUpdated: '2026-02-11',
    tags: ['corporate', 'branded', 'bold', 'agency'],
  },
  cleanBilling: {
    id: 'cleanBilling',
    name: 'Clean Billing',
    description: 'Airy, minimal design with subtle borders and soft gray background - from bo4.jpg.',
    colors: {
      primary: [100, 116, 139],
      secondary: [148, 163, 184],
      accent: [248, 250, 252],
      text: [30, 41, 59],
      border: [203, 213, 225],
    },
    fonts: {
      title: 'helvetica-light',
      body: 'helvetica',
      accent: 'helvetica-light',
    },
    layout: {
      showLogo: false,
      showWatermark: false,
      showHeaderBorder: true,
      showFooter: true,
      headerStyle: 'thin-line',
    },
    category: 'premium',
    isPremium: true,
    isDefault: false,
    isFavorite: false,
    price: 6.99,
    features: [
      'Subtle borders',
      'Soft background',
      'Minimalist typography',
      'Focus on line items',
    ],
    previewColor: 'bg-gradient-to-br from-slate-400 to-slate-500',
    popularity: 85,
    lastUpdated: '2026-02-11',
    tags: ['minimal', 'airy', 'billing'],
  },
  retailReceipt: {
    id: 'retailReceipt',
    name: 'Retail Receipt',
    description: 'Friendly, item-heavy layout - perfect for stores, inspired by bo2.jpg.',
    colors: {
      primary: [13, 148, 136],
      secondary: [20, 184, 166],
      accent: [240, 253, 250],
      text: [31, 41, 55],
      border: [153, 246, 228],
    },
    fonts: {
      title: 'helvetica-bold',
      body: 'helvetica',
      accent: 'helvetica',
    },
    layout: {
      showLogo: true,
      showWatermark: false,
      showHeaderBorder: false,
      showFooter: true,
      headerStyle: 'simple',
    },
    category: 'premium',
    isPremium: true,
    isDefault: false,
    isFavorite: false,
    price: 8.99,
    features: [
      'Item-focused table',
      'SKU / product codes',
      'Bright accents',
      'Thank you message',
    ],
    previewColor: 'bg-gradient-to-br from-teal-600 to-cyan-600',
    popularity: 88,
    lastUpdated: '2026-02-11',
    tags: ['retail', 'store', 'product'],
  },
  simpleElegant: {
    id: 'simpleElegant',
    name: 'Simple Elegant',
    description: 'Understated, formal - centered title, thin rules, inspired by bo3.jpg.',
    colors: {
      primary: [55, 65, 81],
      secondary: [75, 85, 99],
      accent: [249, 250, 251],
      text: [17, 24, 39],
      border: [229, 231, 235],
    },
    fonts: {
      title: 'times-bold',
      body: 'times',
      accent: 'times-italic',
    },
    layout: {
      showLogo: false,
      showWatermark: false,
      showHeaderBorder: true,
      showFooter: false,
      headerStyle: 'centered',
    },
    category: 'premium',
    isPremium: true,
    isDefault: false,
    isFavorite: false,
    price: 7.49,
    features: [
      'Centered title',
      'Thin horizontal rules',
      'Formal serif font',
      'Minimalist',
    ],
    previewColor: 'bg-gradient-to-br from-gray-600 to-gray-700',
    popularity: 82,
    lastUpdated: '2026-02-11',
    tags: ['elegant', 'formal', 'serif'],
  },
  urbanEdge: {
    id: 'urbanEdge',
    name: 'Urban Edge',
    description: 'Contemporary, asymmetric color blocks with a signature field - bo6.avif style.',
    colors: {
      primary: [202, 138, 4],
      secondary: [217, 119, 6],
      accent: [255, 251, 235],
      text: [28, 25, 23],
      border: [245, 158, 11],
    },
    fonts: {
      title: 'helvetica-bold',
      body: 'helvetica',
      accent: 'helvetica-bold',
    },
    layout: {
      showLogo: true,
      showWatermark: true,
      watermarkText: 'URBAN',
      showHeaderBorder: true,
      showFooter: true,
      hasSignature: true,
      headerStyle: 'asymmetric',
    },
    category: 'premium',
    isPremium: true,
    isDefault: false,
    isFavorite: false,
    price: 10.99,
    features: [
      'Asymmetric color blocks',
      'Signature line',
      'Bold typography',
      'Urban aesthetic',
    ],
    previewColor: 'bg-gradient-to-br from-amber-600 to-orange-600',
    popularity: 95,
    lastUpdated: '2026-02-11',
    tags: ['urban', 'edge', 'asymmetric', 'signature'],
  },
  creativeFlow: {
    id: 'creativeFlow',
    name: 'Creative Flow',
    description: 'Artistic, fluid design with wave separator and decorative footer - bo.avif.',
    colors: {
      primary: [147, 51, 234],
      secondary: [168, 85, 247],
      accent: [250, 245, 255],
      text: [31, 41, 55],
      border: [216, 180, 254],
    },
    fonts: {
      title: 'helvetica-bold',
      body: 'helvetica',
      accent: 'helvetica-light',
    },
    layout: {
      showLogo: true,
      showWatermark: true,
      watermarkText: 'CREATIVE',
      showHeaderBorder: false,
      showFooter: true,
      hasWave: true,
      headerStyle: 'flow',
    },
    category: 'premium',
    isPremium: true,
    isDefault: false,
    isFavorite: false,
    price: 11.99,
    features: [
      'Wave separator',
      'Decorative footer',
      'Artistic layout',
      'Creative watermark',
    ],
    previewColor: 'bg-gradient-to-br from-purple-600 to-fuchsia-600',
    popularity: 94,
    lastUpdated: '2026-02-11',
    tags: ['creative', 'flow', 'artistic', 'wave'],
  },
  glassmorphic: {
    id: 'glassmorphic',
    name: 'Glassmorphic',
    description: 'Translucent layers, blurred backgrounds, and subtle neon accents. Modern and ethereal.',
    colors: {
      primary: [88, 101, 242],
      secondary: [121, 134, 255],
      accent: [255, 255, 255],
      text: [15, 23, 42],
      border: [203, 213, 225],
    },
    fonts: {
      title: 'helvetica-bold',
      body: 'helvetica',
      accent: 'helvetica-light',
    },
    layout: {
      showLogo: true,
      showWatermark: true,
      watermarkText: 'GLASS',
      showHeaderBorder: false,
      showFooter: true,
      hasBackdropBlur: true,
      hasNeonGlow: true,
      headerStyle: 'floating',
    },
    category: 'premium',
    isPremium: true,
    isDefault: false,
    isFavorite: false,
    price: 19.99,
    features: [
      'Glass-morphism effect',
      'Neon accent glow',
      'Floating card layout',
      'Adaptive to light/dark',
    ],
    previewColor: 'bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400',
    popularity: 97,
    lastUpdated: '2026-02-12',
    tags: ['glass', 'translucent', 'neon', 'modern'],
  },
  neoBrutalist: {
    id: 'neoBrutalist',
    name: 'Neo-Brutalist',
    description: 'Bold, unapologetic, asymmetric. Sharp corners, oversized type, raw grid.',
    colors: {
      primary: [255, 89, 94],
      secondary: [54, 79, 107],
      accent: [252, 196, 54],
      text: [10, 10, 10],
      border: [0, 0, 0],
    },
    fonts: {
      title: 'helvetica-bold',
      body: 'courier',
      accent: 'helvetica-black',
    },
    layout: {
      showLogo: true,
      showWatermark: false,
      showHeaderBorder: false,
      showFooter: true,
      hasAsymmetricGrid: true,
      hasOversizedText: true,
      headerStyle: 'brutal',
    },
    category: 'premium',
    isPremium: true,
    isDefault: false,
    isFavorite: false,
    price: 16.99,
    features: [
      'Asymmetric layout',
      'Oversized typography',
      'Raw, unpolished grid',
      'High-contrast palette',
    ],
    previewColor: 'bg-gradient-to-br from-red-600 to-amber-500',
    popularity: 91,
    lastUpdated: '2026-02-12',
    tags: ['brutalist', 'asymmetric', 'bold', 'raw'],
  },
  holographic: {
    id: 'holographic',
    name: 'Holographic',
    description: 'Iridescent gradients, metallic foil effect, shifting colors - luxury redefined.',
    colors: {
      primary: [168, 85, 247],
      secondary: [236, 72, 153],
      accent: [251, 146, 60],
      text: [255, 255, 255],
      border: [255, 255, 255],
    },
    fonts: {
      title: 'helvetica-bold',
      body: 'helvetica',
      accent: 'helvetica-light',
    },
    layout: {
      showLogo: true,
      showWatermark: true,
      watermarkText: 'HOLO',
      showHeaderBorder: false,
      showFooter: true,
      hasIridescentGradient: true,
      hasMetallicEdge: true,
      headerStyle: 'prism',
    },
    category: 'premium',
    isPremium: true,
    isDefault: false,
    isFavorite: false,
    price: 18.99,
    features: [
      'Iridescent gradient',
      'Metallic foil accents',
      'Light-reflecting illusion',
      'Dark background',
    ],
    previewColor: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500',
    popularity: 99,
    lastUpdated: '2026-02-12',
    tags: ['holographic', 'iridescent', 'luxury', 'metallic'],
  },
  minimalistDark: {
    id: 'minimalistDark',
    name: 'Minimalist Dark',
    description: 'Sleek, monospace, subtle glow. Perfect for tech startups and dev agencies.',
    colors: {
      primary: [0, 122, 255],
      secondary: [88, 86, 214],
      accent: [44, 44, 46],
      text: [255, 255, 255],
      border: [72, 72, 74],
    },
    fonts: {
      title: 'courier-bold',
      body: 'courier',
      accent: 'helvetica-light',
    },
    layout: {
      showLogo: true,
      showWatermark: true,
      watermarkText: 'DARK',
      showHeaderBorder: true,
      showFooter: true,
      hasDarkMode: true,
      hasGlowEffect: true,
      headerStyle: 'terminal',
    },
    category: 'premium',
    isPremium: true,
    isDefault: false,
    isFavorite: false,
    price: 14.99,
    features: [
      'True dark mode',
      'Monospace typography',
      'Subtle glow accents',
      'Terminal-inspired',
    ],
    previewColor: 'bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900',
    popularity: 94,
    lastUpdated: '2026-02-12',
    tags: ['dark', 'minimal', 'monospace', 'tech'],
  },
  organicEco: {
    id: 'organicEco',
    name: 'Organic Eco',
    description: 'Soft curves, natural tones, fluid shapes, leaf motifs - sustainable and calm.',
    colors: {
      primary: [34, 197, 94],
      secondary: [74, 222, 128],
      accent: [254, 249, 195],
      text: [20, 83, 45],
      border: [187, 247, 208],
    },
    fonts: {
      title: 'georgia',
      body: 'georgia',
      accent: 'helvetica-light',
    },
    layout: {
      showLogo: true,
      showWatermark: true,
      watermarkText: 'ECO',
      showHeaderBorder: false,
      showFooter: true,
      hasWaveBorder: true,
      hasBotanicalIcon: true,
      headerStyle: 'rounded',
    },
    category: 'premium',
    isPremium: true,
    isDefault: false,
    isFavorite: false,
    price: 15.99,
    features: [
      'Organic curves',
      'Botanical accents',
      'Soft color palette',
      'Fluid layout',
    ],
    previewColor: 'bg-gradient-to-br from-green-400 to-emerald-600',
    popularity: 89,
    lastUpdated: '2026-02-12',
    tags: ['organic', 'eco', 'curves', 'natural'],
  },
};

export const industryTemplates = {
  medical: {
    id: 'medical',
    name: 'Medical',
    description: 'Professional template for healthcare and medical services',
    colors: {
      primary: [3, 155, 229],
      secondary: [2, 136, 209],
      accent: [232, 244, 253],
      text: [33, 33, 33],
    },
    fonts: {
      title: 'helvetica',
      body: 'helvetica',
      accent: 'helvetica-light',
    },
    layout: {
      showLogo: true,
      showWatermark: false,
      showHeaderBorder: true,
      showFooter: true,
      hasAnimations: false,
      hasGradientEffects: false,
      hasMultiLanguage: false,
    },
    category: 'industry',
    isPremium: true,
    isDefault: false,
    isFavorite: false,
    price: 7.99,
    features: ['Medical Icons', 'HIPAA Compliant', 'Patient Focused'],
    previewColor: 'bg-gradient-to-br from-blue-400 to-cyan-400',
    popularity: 78,
    lastUpdated: '2024-01-20',
  },
  legal: {
    id: 'legal',
    name: 'Legal',
    description: 'Formal template for law firms and legal services',
    colors: {
      primary: [56, 142, 60],
      secondary: [67, 160, 71],
      accent: [241, 248, 233],
      text: [33, 33, 33],
    },
    fonts: {
      title: 'times',
      body: 'times',
      accent: 'times-italic',
    },
    layout: {
      showLogo: true,
      showWatermark: false,
      showHeaderBorder: true,
      showFooter: true,
      hasAnimations: false,
      hasGradientEffects: false,
      hasMultiLanguage: false,
    },
    category: 'industry',
    isPremium: true,
    isDefault: false,
    isFavorite: false,
    price: 7.99,
    features: ['Formal Layout', 'Legal Terminology', 'Document Numbering'],
    previewColor: 'bg-gradient-to-br from-emerald-400 to-green-400',
    popularity: 75,
    lastUpdated: '2024-01-18',
  },
};

export const allTemplates = {
  ...basicTemplates,
  ...premiumTemplates,
  ...industryTemplates,
};

export const getBuiltInTemplates = () => Object.values(allTemplates);

export const getTemplateById = (templateId: string) => {
  return (allTemplates as Record<string, any>)[templateId] || basicTemplates.standard;
};

const normalizeCategory = (category?: string) => {
  const value = String(category || '').trim().toUpperCase();
  if (value === 'BASIC') return 'STANDARD';
  if (value === 'INDUSTRY') return 'STANDARD';
  if (value === 'PREMIUM' || value === 'ELITE' || value === 'STANDARD' || value === 'CUSTOM') return value;
  return 'STANDARD';
};

const normalizeTemplateShape = (template: any) => {
  const category = normalizeCategory(template?.category);
  return {
    ...template,
    category,
    isPremium: typeof template?.isPremium === 'boolean' ? template.isPremium : category !== 'STANDARD',
  };
};

const loadLocalAccess = async () => {
  const [premiumAccessRaw, purchasesRaw] = await AsyncStorage.multiGet([
    PREMIUM_ACCESS_KEY,
    TEMPLATE_PURCHASES_KEY,
  ]);
  const premiumAccess = premiumAccessRaw[1] ? JSON.parse(premiumAccessRaw[1]) : {};
  const purchases = purchasesRaw[1] ? JSON.parse(purchasesRaw[1]) : [];
  const accessible = new Set<string>(premiumAccess?.templates || []);
  purchases.forEach((purchase: any) => {
    if (purchase?.templateId && purchase?.status === 'completed') {
      accessible.add(purchase.templateId);
    }
  });
  return accessible;
};

export const hasTemplateAccessLocal = async (templateId: string) => {
  const template = (allTemplates as Record<string, any>)[templateId];
  if (!template) return false;
  if (!template.isPremium) return true;
  const accessible = await loadLocalAccess();
  return accessible.has(templateId);
};

export const purchaseTemplateLocal = async (templateId: string, paymentMethod = 'manual') => {
  const template = (allTemplates as Record<string, any>)[templateId];
  if (!template) {
    throw new Error('Template not found');
  }

  const purchaseData = {
    templateId,
    templateName: template.name,
    price: template.price || 0,
    paymentMethod,
    purchasedAt: new Date().toISOString(),
    transactionId: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    status: 'completed',
  };

  const existingPurchasesRaw = await AsyncStorage.getItem(TEMPLATE_PURCHASES_KEY);
  const existingPurchases = existingPurchasesRaw ? JSON.parse(existingPurchasesRaw) : [];
  existingPurchases.push(purchaseData);
  await AsyncStorage.setItem(TEMPLATE_PURCHASES_KEY, JSON.stringify(existingPurchases));

  const premiumAccessRaw = await AsyncStorage.getItem(PREMIUM_ACCESS_KEY);
  const premiumAccess = premiumAccessRaw ? JSON.parse(premiumAccessRaw) : {};
  const accessibleTemplates = premiumAccess.templates || [];
  if (!accessibleTemplates.includes(templateId)) {
    accessibleTemplates.push(templateId);
  }
  premiumAccess.templates = accessibleTemplates;
  premiumAccess.lastUpdated = new Date().toISOString();
  await AsyncStorage.setItem(PREMIUM_ACCESS_KEY, JSON.stringify(premiumAccess));

  return purchaseData;
};

export const mergeTemplates = async (apiTemplates: any[]) => {
  const fallback = getBuiltInTemplates();
  const fallbackById = new Map<string, any>();
  const map = new Map<string, any>();

  fallback.forEach((template: any) => {
    const normalized = normalizeTemplateShape(template);
    fallbackById.set(normalized.id, normalized);
  });

  const hasApiTemplates = Array.isArray(apiTemplates) && apiTemplates.length > 0;
  if (!hasApiTemplates) {
    fallbackById.forEach((value, key) => {
      map.set(key, value);
    });
  }

  (apiTemplates || []).forEach((template) => {
    if (template?.id || template?._id || template?.templateId) {
      const id = template.id || template._id || template.templateId;
      const localTemplate = fallbackById.get(id);
      const mergedTemplate = localTemplate
        ? { ...localTemplate, ...template }
        : template;
      if (mergedTemplate && !mergedTemplate.id) {
        mergedTemplate.id = id;
      }
      const normalized = normalizeTemplateShape(mergedTemplate);
      if (typeof template?.hasAccess === 'boolean') {
        normalized.hasAccess = template.hasAccess;
      }
      map.set(id, normalized);
    }
  });

  const accessible = await loadLocalAccess();
  return Array.from(map.values()).map((template) => {
    const normalized = normalizeTemplateShape(template);
    const isPremium = Boolean(normalized?.isPremium);
    const apiAccess = typeof template?.hasAccess === 'boolean' ? template.hasAccess : undefined;
    const localAccess = accessible.has(normalized?.id);
    const hasAccess = !isPremium || (apiAccess !== undefined ? apiAccess : localAccess);
    return {
      ...normalized,
      hasAccess,
    };
  });
};
