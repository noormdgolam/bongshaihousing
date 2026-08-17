const fs = require('fs');
const path = require('path');

let db;
try {
  db = require('./db');
} catch (e) {
  db = null;
}

const FALLBACK_FILE = path.join(__dirname, '..', 'theme-settings.json');

const DEFAULT_THEME = {
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
  hotline_phone: '+880 1711-200241',

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
 * 24 Curated Presets: 12 Distinct Light Palettes & 12 Distinct Dark Palettes
 */
const PRESETS = {
  // ─── 12 LIGHT THEMES ────────────────────────────────────────────────────────
  bongshai_royal: {
    name: 'Bongshai Royal (Default)',
    mode: 'light',
    is_dark: false,
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
    font_heading: "'Inter', sans-serif",
    font_body: "'Inter', sans-serif",
  },
  sunrise_terracotta: {
    name: 'Sunrise Terracotta',
    mode: 'light',
    is_dark: false,
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
  },
  emerald_eco: {
    name: 'Emerald Eco-Steel',
    mode: 'light',
    is_dark: false,
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
  },
  nordic_frost: {
    name: 'Nordic Frost & Steel',
    mode: 'light',
    is_dark: false,
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
  },
  sahara_dune: {
    name: 'Sahara Sandstone & Bronze',
    mode: 'light',
    is_dark: false,
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
  },
  tokyo_blossom: {
    name: 'Tokyo Blossom & Slate',
    mode: 'light',
    is_dark: false,
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
  },
  modern_steel_crimson: {
    name: 'Steel Forge Crimson',
    mode: 'light',
    is_dark: false,
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
    font_heading: "'Inter', sans-serif",
    font_body: "'Inter', sans-serif",
  },
  coastal_pacific: {
    name: 'Coastal Pacific Coral',
    mode: 'light',
    is_dark: false,
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
  },
  olive_provence: {
    name: 'Olive Tuscan Brass',
    mode: 'light',
    is_dark: false,
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
  },
  corporate_indigo: {
    name: 'Corporate Indigo',
    mode: 'light',
    is_dark: false,
    primary: '#4338CA',
    primary_dark: '#312E81',
    primary_light: '#6366F1',
    accent: '#E11D48',
    accent_light: '#FB7185',
    accent_dark: '#BE123C',
    bg_color: '#FFFFFF',
    surface_color: '#EEF2FF',
    text_color: '#1E1B4B',
    text_muted: '#4B5563',
    announcement_bg: '#312E81',
    announcement_color: '#FECDD3',
    font_heading: "'Inter', sans-serif",
    font_body: "'Inter', sans-serif",
  },
  monochrome_studio: {
    name: 'Monochrome Studio Onyx',
    mode: 'light',
    is_dark: false,
    primary: '#18181B',
    primary_dark: '#09090B',
    primary_light: '#3F3F46',
    accent: '#71717A',
    accent_light: '#A1A1AA',
    accent_dark: '#52525B',
    bg_color: '#FFFFFF',
    surface_color: '#F4F4F5',
    text_color: '#18181B',
    text_muted: '#71717A',
    announcement_bg: '#09090B',
    announcement_color: '#F4F4F5',
    font_heading: "'Inter', sans-serif",
    font_body: "'Inter', sans-serif",
  },
  sunset_amber: {
    name: 'Sunset Golden Amber',
    mode: 'light',
    is_dark: false,
    primary: '#B45309',
    primary_dark: '#78350F',
    primary_light: '#D97706',
    accent: '#059669',
    accent_light: '#34D399',
    accent_dark: '#047857',
    bg_color: '#FFFDF8',
    surface_color: '#FFFBEB',
    text_color: '#292524',
    text_muted: '#57534E',
    announcement_bg: '#78350F',
    announcement_color: '#D1FAE5',
    font_heading: "'Outfit', sans-serif",
    font_body: "'Inter', sans-serif",
  },

  // ─── 12 DARK THEMES ─────────────────────────────────────────────────────────
  slate_midnight: {
    name: 'Slate Midnight (Dark)',
    mode: 'dark',
    is_dark: true,
    primary: '#38BDF8',
    primary_dark: '#0284C7',
    primary_light: '#7DD3FC',
    accent: '#38BDF8',
    accent_light: '#BAE6FD',
    accent_dark: '#0369A1',
    bg_color: '#0B0F19',
    surface_color: '#131C2E',
    text_color: '#F1F5F9',
    text_muted: '#94A3B8',
    announcement_bg: '#070A10',
    announcement_color: '#38BDF8',
    font_heading: "'Inter', sans-serif",
    font_body: "'Inter', sans-serif",
  },
  cyber_steel: {
    name: 'Cyber Steel (Dark)',
    mode: 'dark',
    is_dark: true,
    primary: '#A855F7',
    primary_dark: '#7E22CE',
    primary_light: '#C084FC',
    accent: '#FACC15',
    accent_light: '#FEF08A',
    accent_dark: '#CA8A04',
    bg_color: '#090614',
    surface_color: '#140D2B',
    text_color: '#FAF5FF',
    text_muted: '#A8A29E',
    announcement_bg: '#1E1035',
    announcement_color: '#FACC15',
    font_heading: "'Outfit', sans-serif",
    font_body: "'Inter', sans-serif",
  },
  obsidian_gold: {
    name: 'Obsidian Gold (Dark)',
    mode: 'dark',
    is_dark: true,
    primary: '#EAB308',
    primary_dark: '#CA8A04',
    primary_light: '#FDE047',
    accent: '#F59E0B',
    accent_light: '#FCD34D',
    accent_dark: '#D97706',
    bg_color: '#0A0A0B',
    surface_color: '#141416',
    text_color: '#F4F4F5',
    text_muted: '#A1A1AA',
    announcement_bg: '#18181B',
    announcement_color: '#FDE047',
    font_heading: "'Outfit', sans-serif",
    font_body: "'Inter', sans-serif",
  },
  matrix_emerald: {
    name: 'Matrix Emerald (Dark)',
    mode: 'dark',
    is_dark: true,
    primary: '#10B981',
    primary_dark: '#059669',
    primary_light: '#34D399',
    accent: '#F59E0B',
    accent_light: '#FCD34D',
    accent_dark: '#D97706',
    bg_color: '#051610',
    surface_color: '#0C271D',
    text_color: '#ECFDF5',
    text_muted: '#6EE7B7',
    announcement_bg: '#020D09',
    announcement_color: '#34D399',
    font_heading: "'Plus Jakarta Sans', sans-serif",
    font_body: "'Inter', sans-serif",
  },
  crimson_forge: {
    name: 'Crimson Forge (Dark)',
    mode: 'dark',
    is_dark: true,
    primary: '#F43F5E',
    primary_dark: '#E11D48',
    primary_light: '#FB7185',
    accent: '#F97316',
    accent_light: '#FDBA74',
    accent_dark: '#C2410C',
    bg_color: '#110E12',
    surface_color: '#1C151D',
    text_color: '#FFF1F2',
    text_muted: '#FDA4AF',
    announcement_bg: '#280F16',
    announcement_color: '#FDBA74',
    font_heading: "'Inter', sans-serif",
    font_body: "'Inter', sans-serif",
  },
  deep_abyss: {
    name: 'Deep Abyss Sapphire (Dark)',
    mode: 'dark',
    is_dark: true,
    primary: '#06B6D4',
    primary_dark: '#0891B2',
    primary_light: '#67E8F9',
    accent: '#3B82F6',
    accent_light: '#93C5FD',
    accent_dark: '#1D4ED8',
    bg_color: '#040D1A',
    surface_color: '#091B33',
    text_color: '#F0F9FF',
    text_muted: '#7DD3FC',
    announcement_bg: '#020812',
    announcement_color: '#67E8F9',
    font_heading: "'Plus Jakarta Sans', sans-serif",
    font_body: "'Inter', sans-serif",
  },
  carbon_graphite: {
    name: 'Carbon Laser (Dark)',
    mode: 'dark',
    is_dark: true,
    primary: '#22C55E',
    primary_dark: '#16A34A',
    primary_light: '#4ADE80',
    accent: '#06B6D4',
    accent_light: '#67E8F9',
    accent_dark: '#0891B2',
    bg_color: '#121214',
    surface_color: '#1B1B1F',
    text_color: '#F2F2F5',
    text_muted: '#A0A0AB',
    announcement_bg: '#09090B',
    announcement_color: '#4ADE80',
    font_heading: "'Inter', sans-serif",
    font_body: "'Inter', sans-serif",
  },
  nebula_purple: {
    name: 'Nebula Cosmic (Dark)',
    mode: 'dark',
    is_dark: true,
    primary: '#C084FC',
    primary_dark: '#9333EA',
    primary_light: '#E9D5FF',
    accent: '#F472B6',
    accent_light: '#FBCFE8',
    accent_dark: '#DB2777',
    bg_color: '#0C0717',
    surface_color: '#170E2C',
    text_color: '#FAF5FF',
    text_muted: '#D8B4FE',
    announcement_bg: '#1E0B38',
    announcement_color: '#FBCFE8',
    font_heading: "'Outfit', sans-serif",
    font_body: "'Inter', sans-serif",
  },
  aurora_teal: {
    name: 'Aurora Borealis (Dark)',
    mode: 'dark',
    is_dark: true,
    primary: '#14B8A6',
    primary_dark: '#0F766E',
    primary_light: '#5EEAD4',
    accent: '#84CC16',
    accent_light: '#BEF264',
    accent_dark: '#65A30D',
    bg_color: '#041416',
    surface_color: '#092427',
    text_color: '#F0FDFA',
    text_muted: '#99F6E4',
    announcement_bg: '#020B0C',
    announcement_color: '#5EEAD4',
    font_heading: "'Plus Jakarta Sans', sans-serif",
    font_body: "'Inter', sans-serif",
  },
  desert_night: {
    name: 'Desert Nocturne (Dark)',
    mode: 'dark',
    is_dark: true,
    primary: '#FB923C',
    primary_dark: '#EA580C',
    primary_light: '#FDBA74',
    accent: '#FBBF24',
    accent_light: '#FDE68A',
    accent_dark: '#D97706',
    bg_color: '#14100E',
    surface_color: '#201A16',
    text_color: '#FFF7ED',
    text_muted: '#D6D3D1',
    announcement_bg: '#2C1810',
    announcement_color: '#FDBA74',
    font_heading: "'Outfit', sans-serif",
    font_body: "'Inter', sans-serif",
  },
  solar_eclipse: {
    name: 'Solar Eclipse (Dark)',
    mode: 'dark',
    is_dark: true,
    primary: '#F59E0B',
    primary_dark: '#D97706',
    primary_light: '#FCD34D',
    accent: '#EF4444',
    accent_light: '#FCA5A5',
    accent_dark: '#DC2626',
    bg_color: '#050505',
    surface_color: '#121212',
    text_color: '#FFFFFF',
    text_muted: '#A3A3A3',
    announcement_bg: '#171717',
    announcement_color: '#FCD34D',
    font_heading: "'Plus Jakarta Sans', sans-serif",
    font_body: "'Inter', sans-serif",
  },
  cyber_teal: {
    name: 'Quantum Gunmetal (Dark)',
    mode: 'dark',
    is_dark: true,
    primary: '#2DD4BF',
    primary_dark: '#0D9488',
    primary_light: '#5EEAD4',
    accent: '#818CF8',
    accent_light: '#C7D2FE',
    accent_dark: '#4F46E5',
    bg_color: '#080E14',
    surface_color: '#101B26',
    text_color: '#F0FDFA',
    text_muted: '#94A3B8',
    announcement_bg: '#05080C',
    announcement_color: '#2DD4BF',
    font_heading: "'Inter', sans-serif",
    font_body: "'Inter', sans-serif",
  },
};

/**
 * Check if a theme is dark based on flags or background luminance
 */
function isThemeDark(theme) {
  if (theme.is_dark !== undefined) return Boolean(theme.is_dark);
  if (theme.mode === 'dark') return true;
  const bg = (theme.bg_color || '#ffffff').toLowerCase();
  const hex = bg.replace('#', '');
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance < 128;
  }
  return false;
}

// In-memory cache for speed
let cachedTheme = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 10000; // 10 seconds

/**
 * Load active theme settings from DB with fallback to JSON and defaults
 */
// custom_css renders unescaped inside a <style> tag on every public page
// (layout.njk) - a value containing "</style><script>...</script>" would
// close the style context and execute site-wide. Stripping any style/script
// tag substrings removes the only way to break out of that context, without
// needing to fully parse/validate the CSS itself.
function sanitizeCustomCss(css) {
  if (!css) return '';
  return String(css).replace(/<\/?\s*(style|script)\b[^>]*>?/gi, '');
}

async function getThemeSettings() {
  const now = Date.now();
  if (cachedTheme && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedTheme;
  }

  let settings = { ...DEFAULT_THEME };

  // Try loading from database
  if (db) {
    try {
      const hasTable = await db.schema.hasTable('theme_settings');
      if (hasTable) {
        const row = await db('theme_settings').where({ key: 'active_theme' }).first();
        if (row && row.data) {
          const parsed = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
          settings = { ...DEFAULT_THEME, ...parsed };
          settings.custom_css = sanitizeCustomCss(settings.custom_css);
          cachedTheme = settings;
          lastFetchTime = now;
          return settings;
        }
      }
    } catch (e) {
      console.error('Failed to load theme from DB:', e.message);
    }
  }

  // Fallback to local JSON file
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const json = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf8'));
      settings = { ...DEFAULT_THEME, ...json };
    }
  } catch (e) {
    console.error('Failed to load fallback theme JSON:', e.message);
  }

  settings.custom_css = sanitizeCustomCss(settings.custom_css);
  cachedTheme = settings;
  lastFetchTime = now;
  return settings;
}

/**
 * Save theme settings to DB and update fallback JSON
 */
async function saveThemeSettings(newSettings) {
  const merged = { ...DEFAULT_THEME, ...newSettings };
  merged.is_dark = isThemeDark(merged);
  const jsonStr = JSON.stringify(merged, null, 2);

  // Write to local fallback JSON
  try {
    fs.writeFileSync(FALLBACK_FILE, jsonStr, 'utf8');
  } catch (e) {
    console.error('Failed to write theme fallback JSON:', e.message);
  }

  // Write to DB
  if (db) {
    try {
      const hasTable = await db.schema.hasTable('theme_settings');
      if (hasTable) {
        const existing = await db('theme_settings').where({ key: 'active_theme' }).first();
        if (existing) {
          await db('theme_settings').where({ key: 'active_theme' }).update({
            data: jsonStr,
            updated_at: db.fn.now(),
          });
        } else {
          await db('theme_settings').insert({
            key: 'active_theme',
            data: jsonStr,
          });
        }
      }
    } catch (e) {
      console.error('Failed to save theme to DB:', e.message);
    }
  }

  cachedTheme = merged;
  lastFetchTime = Date.now();
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
  DEFAULT_THEME,
  PRESETS,
  getThemeSettings,
  saveThemeSettings,
  resetThemeSettings,
  generateCssVariables,
  isThemeDark,
};
