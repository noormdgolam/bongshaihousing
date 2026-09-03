const fs = require('fs');
const path = require('path');

let db;
try {
  db = require('./db');
} catch (e) {
  db = null;
}

const FALLBACK_FILE = path.join(__dirname, '..', 'theme-settings.json');

/**
 * 6 ThemeForest-Tier Structural Archetypes for Construction & Real Estate
 */
const ARCHETYPES = {
  'catalog-first': {
    name: 'Catalog-First Direct Response',
    tagline: 'Price-shopping & model exploration above the fold',
    icon: '📦',
    badge: 'High Conversion',
    description: 'Places the steel model catalog and floor area filters directly under the hero for high-intent visitors looking for immediate floor plans and pricing.',
  },
  'trust-first': {
    name: 'Trust-First Corporate Assurance',
    tagline: 'Certifications, client testimonials & case studies lead',
    icon: '🛡️',
    badge: 'Enterprise EPC',
    description: 'Prioritizes BNBC 2020 seismic certifications, ISO standards, and verified client testimonials to reassure high-consideration corporate and industrial investors.',
  },
  'story-process': {
    name: 'Story & Craft Process Timeline',
    tagline: '4-stage engineering walkthrough for premium villas',
    icon: '🔨',
    badge: 'Luxury Villas',
    description: 'Presents the "45-60 Days Turnkey Build" engineering timeline immediately after the hero to showcase structural superiority and architectural craft.',
  },
  'broken-grid': {
    name: 'Broken-Grid Editorial Asymmetry',
    tagline: 'Overlapping photography & floating spec cards',
    icon: '✨',
    badge: 'Modernist Style',
    description: 'ThemeForest-inspired asymmetric layout with floating glass badges, overlapping project photography, and non-uniform masonry catalog blocks.',
  },
  'stats-minimal': {
    name: 'Heavy Metallurgy Stats-Led',
    tagline: 'High-density statistics ticker & technical specs',
    icon: '📊',
    badge: 'Industrial PEB',
    description: 'Text-forward industrial powerhouse layout featuring live metrics (nationwide, 100+ projects) and dense engineering comparison tables.',
  },
  'mobile-priority': {
    name: 'Mobile-Priority Touch Architecture',
    tagline: 'App-style horizontal pill navigation & tap-to-call CTAs',
    icon: '📱',
    badge: 'Fast Mobile',
    description: 'Designed for smartphone visitors with horizontal category pills, swipe-ready model cards, and an accessible one-tap WhatsApp callout.',
  },
};

const DEFAULT_THEME = {
  // Structural Archetype
  archetype: 'catalog-first', // 'catalog-first' | 'trust-first' | 'story-process' | 'broken-grid' | 'stats-minimal' | 'mobile-priority'

  // Brand Colors
  primary: '#1E40AF',
  primary_dark: '#1E3A8A',
  primary_light: '#3B82F6',
  accent: '#EAB308',
  accent_light: '#FDE047',
  accent_dark: '#CA8A04',
  
  // Surface & Background Colors
  bg_color: '#ffffff',
  surface_color: '#f8fafc',
  text_color: '#0f172a',
  text_muted: '#64748b',
  is_dark: false,

  // Typography
  font_heading: "'Inter', sans-serif",
  font_body: "'Inter', sans-serif",
  font_size_base: '16px',

  // Layout & Spacing
  container_width: '1280px',
  section_spacing: 'normal', // 'compact', 'normal', 'spacious', 'luxury'
  shadow_preset: 'modern', // 'flat', 'subtle', 'modern', 'elevation', 'glow'
  glassmorphism_blur: '16px',
  card_lift: '6px',
  button_style: 'gradient', // 'gradient', 'solid', 'outline'

  // Header & Navbar
  navbar_sticky: true,
  navbar_blur: true,
  navbar_height: '80px',

  // Border Radius
  radius_sm: '4px',
  radius_md: '8px',
  radius_lg: '12px',
  radius_xl: '16px',

  // Header & Announcement Banner
  show_announcement: true,
  announcement_text: '⚡ দ্রুততম সময়ে ৪৫-৬০ দিনে ভূমিকম্প সহনশীল প্রি-ইঞ্জিনিয়ার্ড স্টিল বাড়ি নির্মাণ — ফ্রি পরামর্শ নিন!',
  announcement_bg: '#1E3A8A',
  announcement_color: '#FDE047',
  announcement_link: 'contact.html',
  hotline_phone: '+880 1781-636613',

  // Floating Widgets
  ai_widget_primary: '#1E40AF',
  whatsapp_color: '#25D366',
  ai_widget_position: 'right', // 'right' or 'left'

  // Motion & Animation
  transition_speed: '0.25s',

  // Custom Code
  custom_css: '',
  custom_js: '',
};

/**
 * 24 Curated Presets: 6 Structural Archetypes × 24 ThemeForest-Tier Palettes
 */
const PRESETS = {
  // ─── 12 LIGHT THEMES ────────────────────────────────────────────────────────
  bongshai_royal: {
    name: 'Bongshai Royal',
    mode: 'light',
    is_dark: false,
    archetype: 'trust-first',
    category: 'commercial',
    description: 'Executive corporate EPC flagship theme with trust certification badges, verified client reviews, and royal navy accents.',
    primary: '#1E40AF',
    primary_dark: '#1E3A8A',
    primary_light: '#3B82F6',
    accent: '#EAB308',
    accent_light: '#FDE047',
    accent_dark: '#CA8A04',
    bg_color: '#FFFFFF',
    surface_color: '#F8FAFC',
    text_color: '#0F172A',
    text_muted: '#64748B',
    announcement_bg: '#1E3A8A',
    announcement_color: '#FDE047',
    font_heading: "'Outfit', sans-serif",
    font_body: "'Inter', sans-serif",
    button_style: 'gradient',
  },
  sunrise_terracotta: {
    name: 'Sunrise Terracotta',
    mode: 'light',
    is_dark: false,
    archetype: 'story-process',
    category: 'residential',
    description: 'Warm Tuscan Mediterranean villa theme leading with the 4-step craft construction timeline and earthy terracotta styling.',
    primary: '#C2410C',
    primary_dark: '#9A3412',
    primary_light: '#EA580C',
    accent: '#D97706',
    accent_light: '#FBBF24',
    accent_dark: '#B45309',
    bg_color: '#FFFBF5',
    surface_color: '#FDF4E7',
    text_color: '#431407',
    text_muted: '#78350F',
    announcement_bg: '#9A3412',
    announcement_color: '#FEF3C7',
    font_heading: "'Outfit', sans-serif",
    font_body: "'Inter', sans-serif",
    button_style: 'gradient',
  },
  emerald_eco: {
    name: 'Emerald Eco-Steel',
    mode: 'light',
    is_dark: false,
    archetype: 'broken-grid',
    category: 'residential',
    description: 'Modernist resort and bio-architecture theme with overlapping photo frames, floating badges, and organic emerald accents.',
    primary: '#047857',
    primary_dark: '#064E3B',
    primary_light: '#10B981',
    accent: '#D97706',
    accent_light: '#FCD34D',
    accent_dark: '#B45309',
    bg_color: '#FBFDFB',
    surface_color: '#F0FDF4',
    text_color: '#064E3B',
    text_muted: '#374151',
    announcement_bg: '#064E3B',
    announcement_color: '#A7F3D0',
    font_heading: "'Plus Jakarta Sans', sans-serif",
    font_body: "'Inter', sans-serif",
    button_style: 'gradient',
  },
  nordic_frost: {
    name: 'Nordic Frost & Steel',
    mode: 'light',
    is_dark: false,
    archetype: 'stats-minimal',
    category: 'commercial',
    description: 'Scandinavian minimalist layout with high-density data metrics, sharp clean borders, and crisp glacier-cyan tones.',
    primary: '#0284C7',
    primary_dark: '#0369A1',
    primary_light: '#38BDF8',
    accent: '#0D9488',
    accent_light: '#5EEAD4',
    accent_dark: '#0F766E',
    bg_color: '#F8FAFC',
    surface_color: '#F0F9FF',
    text_color: '#0F172A',
    text_muted: '#475569',
    announcement_bg: '#0369A1',
    announcement_color: '#E0F2FE',
    font_heading: "'Inter', sans-serif",
    font_body: "'Inter', sans-serif",
    button_style: 'solid',
  },
  sahara_dune: {
    name: 'Sahara Sandstone & Bronze',
    mode: 'light',
    is_dark: false,
    archetype: 'catalog-first',
    category: 'residential',
    description: 'Direct-response villa catalog theme placing duplex models and square-footage calculators directly above the fold.',
    primary: '#78350F',
    primary_dark: '#451A03',
    primary_light: '#B45309',
    accent: '#D97706',
    accent_light: '#FDE68A',
    accent_dark: '#92400E',
    bg_color: '#FFFDF7',
    surface_color: '#FEF3C7',
    text_color: '#292524',
    text_muted: '#57534E',
    announcement_bg: '#451A03',
    announcement_color: '#FDE68A',
    font_heading: "'Outfit', sans-serif",
    font_body: "'Inter', sans-serif",
    button_style: 'gradient',
  },
  tokyo_blossom: {
    name: 'Tokyo Blossom & Slate',
    mode: 'light',
    is_dark: false,
    archetype: 'broken-grid',
    category: 'residential',
    description: 'Editorial Japanese architectural showcase featuring asymmetric broken-grid project spotlights and sakura pink details.',
    primary: '#DB2777',
    primary_dark: '#9D174D',
    primary_light: '#F472B6',
    accent: '#4F46E5',
    accent_light: '#A5B4FC',
    accent_dark: '#3730A3',
    bg_color: '#FAFAFA',
    surface_color: '#FDF2F8',
    text_color: '#18181B',
    text_muted: '#52525B',
    announcement_bg: '#831843',
    announcement_color: '#FCE7F3',
    font_heading: "'Plus Jakarta Sans', sans-serif",
    font_body: "'Inter', sans-serif",
    button_style: 'gradient',
  },
  modern_steel_crimson: {
    name: 'Steel Forge Crimson',
    mode: 'light',
    is_dark: false,
    archetype: 'stats-minimal',
    category: 'industrial',
    description: 'Heavy metallurgy industrial theme featuring live construction metrics, BNBC 2020 load data, and molten forge red accents.',
    primary: '#BE123C',
    primary_dark: '#881337',
    primary_light: '#E11D48',
    accent: '#D97706',
    accent_light: '#FBBF24',
    accent_dark: '#B45309',
    bg_color: '#FFFFFF',
    surface_color: '#FFF1F2',
    text_color: '#1E1E24',
    text_muted: '#6B7280',
    announcement_bg: '#881337',
    announcement_color: '#FDE68A',
    font_heading: "'Montserrat', sans-serif",
    font_body: "'Roboto', sans-serif",
    button_style: 'solid',
  },
  coastal_pacific: {
    name: 'Coastal Pacific Coral',
    mode: 'light',
    is_dark: false,
    archetype: 'catalog-first',
    category: 'residential',
    description: 'Waterfront container homes and simplex cottages layout prioritizing quick floor plan comparisons and ocean cyan vibes.',
    primary: '#0E7490',
    primary_dark: '#155E75',
    primary_light: '#06B6D4',
    accent: '#F97316',
    accent_light: '#FDBA74',
    accent_dark: '#C2410C',
    bg_color: '#F8FCFD',
    surface_color: '#ECFEFF',
    text_color: '#082F49',
    text_muted: '#334155',
    announcement_bg: '#155E75',
    announcement_color: '#FFEDD5',
    font_heading: "'Plus Jakarta Sans', sans-serif",
    font_body: "'Inter', sans-serif",
    button_style: 'gradient',
  },
  olive_provence: {
    name: 'Olive Tuscan Brass',
    mode: 'light',
    is_dark: false,
    archetype: 'story-process',
    category: 'residential',
    description: 'Artisanal steel villa craft theme detailing turn-key fabrication steps with rich olive and antique brass styling.',
    primary: '#4D7C0F',
    primary_dark: '#365314',
    primary_light: '#65A30D',
    accent: '#CA8A04',
    accent_light: '#FACC15',
    accent_dark: '#A16207',
    bg_color: '#FCFDF7',
    surface_color: '#F7FEE7',
    text_color: '#1A2E05',
    text_muted: '#4B5563',
    announcement_bg: '#365314',
    announcement_color: '#FEF08A',
    font_heading: "'Outfit', sans-serif",
    font_body: "'Inter', sans-serif",
    button_style: 'gradient',
  },
  corporate_indigo: {
    name: 'Corporate Indigo & Rose',
    mode: 'light',
    is_dark: false,
    archetype: 'trust-first',
    category: 'commercial',
    description: 'High-consideration commercial EPC theme with prominent ISO certifications, client logos, and fintech-grade indigo elegance.',
    primary: '#4338CA',
    primary_dark: '#312E81',
    primary_light: '#6366F1',
    accent: '#F43F5E',
    accent_light: '#FDA4AF',
    accent_dark: '#BE123C',
    bg_color: '#FFFFFF',
    surface_color: '#EEF2FF',
    text_color: '#1E1B4B',
    text_muted: '#475569',
    announcement_bg: '#312E81',
    announcement_color: '#FFE4E6',
    font_heading: "'Montserrat', sans-serif",
    font_body: "'Inter', sans-serif",
    button_style: 'gradient',
  },
  monochrome_studio: {
    name: 'Monochrome Studio Editorial',
    mode: 'light',
    is_dark: false,
    archetype: 'broken-grid',
    category: 'commercial',
    description: 'Ultra-modern high-contrast black and white architectural portfolio featuring stark typography and staggered project frames.',
    primary: '#18181B',
    primary_dark: '#09090B',
    primary_light: '#3F3F46',
    accent: '#0284C7',
    accent_light: '#38BDF8',
    accent_dark: '#0369A1',
    bg_color: '#FFFFFF',
    surface_color: '#F4F4F5',
    text_color: '#09090B',
    text_muted: '#52525B',
    announcement_bg: '#09090B',
    announcement_color: '#38BDF8',
    font_heading: "'Inter', sans-serif",
    font_body: "'Inter', sans-serif",
    button_style: 'solid',
  },
  sunset_amber: {
    name: 'Sunset Golden Amber',
    mode: 'light',
    is_dark: false,
    archetype: 'mobile-priority',
    category: 'residential',
    description: 'App-like touch architecture with horizontal swipeable pills, large touch targets, and warm golden sunset hues.',
    primary: '#D97706',
    primary_dark: '#B45309',
    primary_light: '#F59E0B',
    accent: '#4F46E5',
    accent_light: '#818CF8',
    accent_dark: '#3730A3',
    bg_color: '#FFFDF9',
    surface_color: '#FEF3C7',
    text_color: '#451A03',
    text_muted: '#78350F',
    announcement_bg: '#78350F',
    announcement_color: '#FEF3C7',
    font_heading: "'Poppins', sans-serif",
    font_body: "'Inter', sans-serif",
    button_style: 'gradient',
  },

  // ─── 12 DARK THEMES ─────────────────────────────────────────────────────────
  slate_midnight: {
    name: 'Slate Midnight',
    mode: 'dark',
    is_dark: true,
    archetype: 'stats-minimal',
    category: 'hightech',
    description: 'High-tech titanium slate and neon cyan layout featuring dense engineering specs and industrial data counters.',
    primary: '#38BDF8',
    primary_dark: '#0284C7',
    primary_light: '#7DD3FC',
    accent: '#F59E0B',
    accent_light: '#FCD34D',
    accent_dark: '#D97706',
    bg_color: '#0B0F19',
    surface_color: '#131C2E',
    text_color: '#F1F5F9',
    text_muted: '#94A3B8',
    announcement_bg: '#0F172A',
    announcement_color: '#38BDF8',
    font_heading: "'Plus Jakarta Sans', sans-serif",
    font_body: "'Inter', sans-serif",
    button_style: 'gradient',
  },
  cyber_steel: {
    name: 'Cyber Steel & Neon',
    mode: 'dark',
    is_dark: true,
    archetype: 'broken-grid',
    category: 'hightech',
    description: 'Neo-Tokyo cyber architecture with asymmetric glass panels, neon yellow accents, and deep violet surfaces.',
    primary: '#8B5CF6',
    primary_dark: '#6D28D9',
    primary_light: '#A78BFA',
    accent: '#FACC15',
    accent_light: '#FEF08A',
    accent_dark: '#EAB308',
    bg_color: '#090514',
    surface_color: '#160D2E',
    text_color: '#F5F3FF',
    text_muted: '#A78BFA',
    announcement_bg: '#1E1035',
    announcement_color: '#FACC15',
    font_heading: "'Plus Jakarta Sans', sans-serif",
    font_body: "'Inter', sans-serif",
    button_style: 'gradient',
  },
  obsidian_gold: {
    name: 'Obsidian Gold Luxury',
    mode: 'dark',
    is_dark: true,
    archetype: 'trust-first',
    category: 'commercial',
    description: 'Penthouse luxury villa theme pairing pitch-black obsidian backgrounds with champagne gold accents and editorial typography.',
    primary: '#EAB308',
    primary_dark: '#CA8A04',
    primary_light: '#FDE047',
    accent: '#38BDF8',
    accent_light: '#7DD3FC',
    accent_dark: '#0284C7',
    bg_color: '#080808',
    surface_color: '#141414',
    text_color: '#FAFAFA',
    text_muted: '#A1A1AA',
    announcement_bg: '#141414',
    announcement_color: '#FDE047',
    font_heading: "'Playfair Display', serif",
    font_body: "'Inter', sans-serif",
    button_style: 'gradient',
  },
  matrix_emerald: {
    name: 'Matrix Emerald High-Tech',
    mode: 'dark',
    is_dark: true,
    archetype: 'stats-minimal',
    category: 'hightech',
    description: 'Cyberpunk engineering dashboard theme with terminal green accents, live project data tickers, and deep matte black casing.',
    primary: '#10B981',
    primary_dark: '#059669',
    primary_light: '#34D399',
    accent: '#06B6D4',
    accent_light: '#67E8F9',
    accent_dark: '#0891B2',
    bg_color: '#020C07',
    surface_color: '#061D12',
    text_color: '#ECFDF5',
    text_muted: '#6EE7B7',
    announcement_bg: '#061D12',
    announcement_color: '#34D399',
    font_heading: "'Plus Jakarta Sans', sans-serif",
    font_body: "'Inter', sans-serif",
    button_style: 'gradient',
  },
  crimson_forge_dark: {
    name: 'Crimson Forge Nocturne',
    mode: 'dark',
    is_dark: true,
    archetype: 'catalog-first',
    category: 'industrial',
    description: 'Heavy metallurgy industrial catalog placing factory PEB sheds and structural steel specifications directly above the fold.',
    primary: '#F43F5E',
    primary_dark: '#E11D48',
    primary_light: '#FB7185',
    accent: '#F97316',
    accent_light: '#FDBA74',
    accent_dark: '#EA580C',
    bg_color: '#0D080A',
    surface_color: '#1C1014',
    text_color: '#FFF1F2',
    text_muted: '#FDA4AF',
    announcement_bg: '#1C1014',
    announcement_color: '#FDA4AF',
    font_heading: "'Montserrat', sans-serif",
    font_body: "'Roboto', sans-serif",
    button_style: 'solid',
  },
  deep_abyss: {
    name: 'Deep Abyss Sapphire',
    mode: 'dark',
    is_dark: true,
    archetype: 'trust-first',
    category: 'commercial',
    description: 'Oceanic deep navy corporate EPC layout showcasing client satisfaction metrics, earthquake testing labs, and sapphire accents.',
    primary: '#38BDF8',
    primary_dark: '#0284C7',
    primary_light: '#7DD3FC',
    accent: '#2DD4BF',
    accent_light: '#5EEAD4',
    accent_dark: '#0F766E',
    bg_color: '#030B17',
    surface_color: '#08172E',
    text_color: '#F0F9FF',
    text_muted: '#7DD3FC',
    announcement_bg: '#08172E',
    announcement_color: '#38BDF8',
    font_heading: "'Outfit', sans-serif",
    font_body: "'Inter', sans-serif",
    button_style: 'gradient',
  },
  carbon_graphite: {
    name: 'Carbon Graphite Laser',
    mode: 'dark',
    is_dark: true,
    archetype: 'stats-minimal',
    category: 'industrial',
    description: 'Matte carbon fiber industrial powerhouse layout with lime laser accents, dense technical comparison grids, and sharp edges.',
    primary: '#84CC16',
    primary_dark: '#65A30D',
    primary_light: '#A3E635',
    accent: '#06B6D4',
    accent_light: '#22D3EE',
    accent_dark: '#0891B2',
    bg_color: '#0A0C0E',
    surface_color: '#14181C',
    text_color: '#F4F7F6',
    text_muted: '#9CA3AF',
    announcement_bg: '#14181C',
    announcement_color: '#A3E635',
    font_heading: "'Inter', sans-serif",
    font_body: "'Roboto', sans-serif",
    button_style: 'solid',
  },
  nebula_cosmic: {
    name: 'Nebula Cosmic Violet',
    mode: 'dark',
    is_dark: true,
    archetype: 'broken-grid',
    category: 'hightech',
    description: 'Futuristic architectural showcase featuring asymmetric floating cards, glassmorphism blur, and neon violet/pink accents.',
    primary: '#C084FC',
    primary_dark: '#9333EA',
    primary_light: '#E9D5FF',
    accent: '#F472B6',
    accent_light: '#FBCFE8',
    accent_dark: '#DB2777',
    bg_color: '#0A0612',
    surface_color: '#150E24',
    text_color: '#FAF5FF',
    text_muted: '#D8B4FE',
    announcement_bg: '#150E24',
    announcement_color: '#E9D5FF',
    font_heading: "'Plus Jakarta Sans', sans-serif",
    font_body: "'Inter', sans-serif",
    button_style: 'gradient',
  },
  aurora_glow: {
    name: 'Aurora Borealis Glow',
    mode: 'dark',
    is_dark: true,
    archetype: 'story-process',
    category: 'commercial',
    description: 'Nordic luxury eco-resort theme presenting the 4-step green steel manufacturing process against an ethereal aurora background.',
    primary: '#2DD4BF',
    primary_dark: '#0F766E',
    primary_light: '#5EEAD4',
    accent: '#A78BFA',
    accent_light: '#C4B5FD',
    accent_dark: '#7C3AED',
    bg_color: '#020E10',
    surface_color: '#061D21',
    text_color: '#F0FDFA',
    text_muted: '#99F6E4',
    announcement_bg: '#061D21',
    announcement_color: '#5EEAD4',
    font_heading: "'Outfit', sans-serif",
    font_body: "'Inter', sans-serif",
    button_style: 'gradient',
  },
  desert_night: {
    name: 'Desert Nocturne Copper',
    mode: 'dark',
    is_dark: true,
    archetype: 'catalog-first',
    category: 'residential',
    description: 'Nocturnal luxury duplex catalog theme with immediate square-footage selectors and glowing copper/bronze detailing.',
    primary: '#FB923C',
    primary_dark: '#EA580C',
    primary_light: '#FDBA74',
    accent: '#38BDF8',
    accent_light: '#7DD3FC',
    accent_dark: '#0284C7',
    bg_color: '#0F0906',
    surface_color: '#1F130B',
    text_color: '#FFF7ED',
    text_muted: '#FED7AA',
    announcement_bg: '#1F130B',
    announcement_color: '#FDBA74',
    font_heading: "'Outfit', sans-serif",
    font_body: "'Inter', sans-serif",
    button_style: 'gradient',
  },
  solar_eclipse: {
    name: 'Solar Eclipse Amber',
    mode: 'dark',
    is_dark: true,
    archetype: 'broken-grid',
    category: 'commercial',
    description: 'High-contrast monochrome dark theme with sunburst amber highlights, overlapping photo cards, and sharp architectural framing.',
    primary: '#F59E0B',
    primary_dark: '#D97706',
    primary_light: '#FCD34D',
    accent: '#E2E8F0',
    accent_light: '#F8FAFC',
    accent_dark: '#94A3B8',
    bg_color: '#0A0A0A',
    surface_color: '#171717',
    text_color: '#F5F5F5',
    text_muted: '#A3A3A3',
    announcement_bg: '#171717',
    announcement_color: '#FCD34D',
    font_heading: "'Inter', sans-serif",
    font_body: "'Inter', sans-serif",
    button_style: 'solid',
  },
  quantum_gunmetal: {
    name: 'Quantum Gunmetal Teal',
    mode: 'dark',
    is_dark: true,
    archetype: 'mobile-priority',
    category: 'hightech',
    description: 'App-inspired mobile layout with fast horizontal category tabs, large tactile buttons, and dark quantum gunmetal teal styling.',
    primary: '#14B8A6',
    primary_dark: '#0D9488',
    primary_light: '#2DD4BF',
    accent: '#6366F1',
    accent_light: '#818CF8',
    accent_dark: '#4F46E5',
    bg_color: '#060E12',
    surface_color: '#0E1C22',
    text_color: '#F0FDFA',
    text_muted: '#99F6E4',
    announcement_bg: '#0E1C22',
    announcement_color: '#2DD4BF',
    font_heading: "'Plus Jakarta Sans', sans-serif",
    font_body: "'Inter', sans-serif",
    button_style: 'gradient',
  },
};

/**
 * Determine if a theme has a dark background
 */
function isThemeDark(theme) {
  if (theme.is_dark !== undefined) return Boolean(theme.is_dark);
  if (theme.mode === 'dark') return true;
  if (!theme.bg_color) return false;
  
  const hex = theme.bg_color.replace('#', '');
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    return lum < 128;
  }
  return false;
}

/**
 * Get active theme settings from database or fallback file
 */
async function getThemeSettings() {
  if (db) {
    try {
      const hasTable = await db.schema.hasTable('theme_settings');
      if (hasTable) {
        const rows = await db('theme_settings').select('setting_key', 'setting_value');
        if (rows && rows.length > 0) {
          const settings = {};
          for (const r of rows) {
            try {
              settings[r.setting_key] = JSON.parse(r.setting_value);
            } catch (e) {
              settings[r.setting_key] = r.setting_value;
            }
          }
          return { ...DEFAULT_THEME, ...settings };
        }
      }
    } catch (err) {
      console.error('Failed to load theme settings from DB, falling back to file:', err.message);
    }
  }

  if (fs.existsSync(FALLBACK_FILE)) {
    try {
      const fileData = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf8'));
      return { ...DEFAULT_THEME, ...fileData };
    } catch (e) {
      console.error('Failed to parse theme-settings.json fallback:', e.message);
    }
  }

  return { ...DEFAULT_THEME };
}

/**
 * Save theme settings to database and fallback file
 */
async function saveThemeSettings(newSettings) {
  const merged = { ...DEFAULT_THEME, ...newSettings };
  merged.is_dark = isThemeDark(merged);

  if (db) {
    try {
      const hasTable = await db.schema.hasTable('theme_settings');
      if (hasTable) {
        for (const [key, val] of Object.entries(merged)) {
          const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
          const existing = await db('theme_settings').where({ setting_key: key }).first();
          if (existing) {
            await db('theme_settings').where({ setting_key: key }).update({ setting_value: valStr, updated_at: db.fn.now() });
          } else {
            await db('theme_settings').insert({ setting_key: key, setting_value: valStr });
          }
        }
      }
    } catch (err) {
      console.error('Failed to save theme settings to DB:', err.message);
    }
  }

  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(merged, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write theme fallback file:', err.message);
  }

  return merged;
}

/**
 * Reset theme settings to default
 */
async function resetThemeSettings() {
  return await saveThemeSettings(DEFAULT_THEME);
}

/**
 * Generate CSS variable block and adaptive rules for <head> injection
 */
function generateCssVariables(theme) {
  const t = { ...DEFAULT_THEME, ...theme };
  const isDark = isThemeDark(t);

  const bgColor = t.bg_color || (isDark ? '#0B0F19' : '#ffffff');
  const surfaceColor = t.surface_color || (isDark ? '#131C2E' : '#f8fafc');
  const textColor = t.text_color || (isDark ? '#F1F5F9' : '#0f172a');
  const textMuted = t.text_muted || (isDark ? '#94A3B8' : '#64748b');

  let sectionPad = '6rem';
  if (t.section_spacing === 'compact') sectionPad = '3.5rem';
  else if (t.section_spacing === 'spacious') sectionPad = '8rem';
  else if (t.section_spacing === 'luxury') sectionPad = '10rem';

  return `
    --primary: ${t.primary};
    --primary-dark: ${t.primary_dark};
    --primary-light: ${t.primary_light};
    --accent: ${t.accent};
    --accent-light: ${t.accent_light};
    --accent-dark: ${t.accent_dark};
    --font-heading: ${t.font_heading};
    --font-body: ${t.font_body};
    --radius-sm: ${t.radius_sm};
    --radius-md: ${t.radius_md};
    --radius-lg: ${t.radius_lg};
    --radius-xl: ${t.radius_xl};
    --container-max: ${t.container_width || '1280px'};
    --nav-height: ${t.navbar_height || '80px'};
    --space-24: ${sectionPad};
    --transition-base: all ${t.transition_speed || '0.25s'} ease;

    /* Theme Tokens */
    --bg-color: ${bgColor};
    --surface-color: ${surfaceColor};
    --text-color: ${textColor};
    --text-muted: ${textMuted};

    /* Light/Dark Adaptive Foundation */
    --white: ${bgColor};
    --off-white: ${surfaceColor};
    --dark: ${textColor};
    --grey-900: ${isDark ? textColor : '#0f172a'};
    --grey-800: ${isDark ? '#E2E8F0' : '#1e293b'};
    --grey-700: ${isDark ? '#CBD5E1' : '#334155'};
    --grey-600: ${textMuted};
    --grey-500: ${textMuted};
    --grey-400: ${isDark ? '#64748B' : '#94a3b8'};
    --grey-300: ${isDark ? '#475569' : '#cbd5e1'};
    --grey-200: ${isDark ? 'rgba(255,255,255,0.14)' : '#cbd5e1'};
    --grey-100: ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'};
    --grey-50: ${isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'};
  `.trim();
}

module.exports = {
  ARCHETYPES,
  DEFAULT_THEME,
  PRESETS,
  getThemeSettings,
  saveThemeSettings,
  resetThemeSettings,
  generateCssVariables,
  isThemeDark,
};
