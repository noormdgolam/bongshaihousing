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

  // Typography
  font_heading: "'Inter', sans-serif",
  font_body: "'Inter', sans-serif",
  font_size_base: '16px',

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

  // Custom CSS
  custom_css: '',
};

const PRESETS = {
  bongshai_royal: {
    name: 'Bongshai Royal (Default)',
    primary: '#1E40AF',
    primary_dark: '#1E3A8A',
    primary_light: '#3B82F6',
    accent: '#EAB308',
    accent_light: '#FDE047',
    accent_dark: '#CA8A04',
    announcement_bg: '#1E3A8A',
    announcement_color: '#FDE047',
  },
  emerald_eco: {
    name: 'Emerald Eco-Steel',
    primary: '#047857',
    primary_dark: '#064E3B',
    primary_light: '#10B981',
    accent: '#F59E0B',
    accent_light: '#FCD34D',
    accent_dark: '#D97706',
    announcement_bg: '#064E3B',
    announcement_color: '#FCD34D',
  },
  titanium_slate: {
    name: 'Titanium Slate Modern',
    primary: '#1E293B',
    primary_dark: '#0F172A',
    primary_light: '#475569',
    accent: '#06B6D4',
    accent_light: '#67E8F9',
    accent_dark: '#0891B2',
    announcement_bg: '#0F172A',
    announcement_color: '#67E8F9',
  },
  corporate_indigo: {
    name: 'Corporate Indigo',
    primary: '#4338CA',
    primary_dark: '#312E81',
    primary_light: '#6366F1',
    accent: '#F43F5E',
    accent_light: '#FDA4AF',
    accent_dark: '#E11D48',
    announcement_bg: '#312E81',
    announcement_color: '#FDA4AF',
  },
  modern_steel_crimson: {
    name: 'Steel Crimson & Gold',
    primary: '#BE123C',
    primary_dark: '#881337',
    primary_light: '#E11D48',
    accent: '#D97706',
    accent_light: '#FBBF24',
    accent_dark: '#B45309',
    announcement_bg: '#881337',
    announcement_color: '#FBBF24',
  },
};

// In-memory cache for speed
let cachedTheme = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 10000; // 10 seconds

/**
 * Load active theme settings from DB with fallback to JSON and defaults
 */
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

  cachedTheme = settings;
  lastFetchTime = now;
  return settings;
}

/**
 * Save theme settings to DB and update fallback JSON
 */
async function saveThemeSettings(newSettings) {
  const merged = { ...DEFAULT_THEME, ...newSettings };
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
 * Generate CSS variable block for <head> injection
 */
function generateCssVariables(theme) {
  const t = { ...DEFAULT_THEME, ...theme };
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
  `.trim();
}

module.exports = {
  DEFAULT_THEME,
  PRESETS,
  getThemeSettings,
  saveThemeSettings,
  resetThemeSettings,
  generateCssVariables,
};
