/**
 * Manga App - Dark Minimalist Theme
 * Paleta de colores oscura y moderna con acentos sutiles
 */

import { Platform } from 'react-native';

// Paleta de colores principal
const accent = '#8B5CF6'; // Violeta suave
const accentLight = '#A78BFA';
const accentDark = '#7C3AED';

export const Colors = {
  // Tema oscuro como principal
  dark: {
    // Backgrounds
    background: '#0A0A0A', // Negro profundo
    backgroundSecondary: '#141414', // Gris muy oscuro
    backgroundTertiary: '#1F1F1F', // Gris oscuro
    card: '#141414',
    cardHighlight: '#1A1A1A',
    
    // Textos
    text: '#FFFFFF', // Blanco puro
    textSecondary: '#A3A3A3', // Gris medio
    textTertiary: '#737373', // Gris claro
    textMuted: '#525252', // Gris muy claro
    
    // Acentos
    primary: accent,
    primaryLight: accentLight,
    primaryDark: accentDark,
    
    // Estados
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // Bordes y divisores
    border: '#262626',
    borderLight: '#1F1F1F',
    divider: '#1A1A1A',
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.8)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',
    
    // Iconos y tabs
    icon: '#A3A3A3',
    iconActive: accent,
    tabIconDefault: '#737373',
    tabIconSelected: accent,
    
    // Inputs
    input: '#1F1F1F',
    inputBorder: '#262626',
    inputFocus: accent,
    
    // Skeleton/Loading
    skeleton: '#1F1F1F',
    skeletonHighlight: '#262626',
  },
  
  // Tema claro (opcional, mantenido para futura implementación)
  light: {
    background: '#FFFFFF',
    backgroundSecondary: '#F5F5F5',
    backgroundTertiary: '#E5E5E5',
    card: '#FFFFFF',
    cardHighlight: '#F9FAFB',
    
    text: '#000000',
    textSecondary: '#525252',
    textTertiary: '#737373',
    textMuted: '#A3A3A3',
    
    primary: accent,
    primaryLight: accentLight,
    primaryDark: accentDark,
    
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    border: '#E5E5E5',
    borderLight: '#F5F5F5',
    divider: '#F0F0F0',
    
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
    
    icon: '#525252',
    iconActive: accent,
    tabIconDefault: '#737373',
    tabIconSelected: accent,
    
    input: '#F5F5F5',
    inputBorder: '#E5E5E5',
    inputFocus: accent,
    
    skeleton: '#E5E5E5',
    skeletonHighlight: '#F5F5F5',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Tamaños de tipografía
export const FontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

// Espaciado
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Radio de bordes
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

// Sombras (para cards y elementos elevados)
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
};

// Tema principal (dark por defecto)
export const Theme = Colors.dark;
