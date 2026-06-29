// ce-saladas/src/themes/templatePalettes.ts

export interface TemplatePalette {
  id: string;
  name: string;
  colors: {
    primary: string;
    primaryRgb: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryRgb: string;
    secondaryLight: string;
    secondaryDark: string;
    accent: string;
    accentRgb: string;
    success: string;
    successRgb: string;
    warning: string;
    warningRgb: string;
    error: string;
    errorRgb: string;
    info: string;
    infoRgb: string;
    background: string;
    surface: string;
    border: string;
    text: string;
    textLight: string;
    disabled: string;
  };
  styles: {
    borderRadius: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    shadow: {
      sm: string;
      md: string;
      lg: string;
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
  };
}

export const TEMPLATE_PALETTES: Record<string, TemplatePalette> = {
  fresh: {
    id: 'fresh',
    name: 'Fresh',
    colors: {
      primary: '#10b981',
      primaryRgb: '16, 185, 129',
      primaryLight: '#6ee7b7',
      primaryDark: '#047857',
      secondary: '#f59e0b',
      secondaryRgb: '245, 158, 11',
      secondaryLight: '#fcd34d',
      secondaryDark: '#d97706',
      accent: '#0ea5e9',
      accentRgb: '14, 165, 233',
      success: '#10b981',
      successRgb: '16, 185, 129',
      warning: '#f59e0b',
      warningRgb: '245, 158, 11',
      error: '#ef4444',
      errorRgb: '239, 68, 68',
      info: '#0ea5e9',
      infoRgb: '14, 165, 233',
      background: '#f9fafb',
      surface: '#ffffff',
      border: '#e5e7eb',
      text: '#1f2937',
      textLight: '#6b7280',
      disabled: '#d1d5db',
    },
    styles: {
      borderRadius: { sm: '0.375rem', md: '0.5rem', lg: '0.75rem', xl: '1rem' },
      shadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
    },
  },
  bold: {
    id: 'bold',
    name: 'Bold',
    colors: {
      primary: '#dc2626',
      primaryRgb: '220, 38, 38',
      primaryLight: '#fca5a5',
      primaryDark: '#7f1d1d',
      secondary: '#1e40af',
      secondaryRgb: '30, 64, 175',
      secondaryLight: '#3b82f6',
      secondaryDark: '#1e3a8a',
      accent: '#ec4899',
      accentRgb: '236, 72, 153',
      success: '#16a34a',
      successRgb: '22, 163, 74',
      warning: '#ea580c',
      warningRgb: '234, 88, 12',
      error: '#dc2626',
      errorRgb: '220, 38, 38',
      info: '#1e40af',
      infoRgb: '30, 64, 175',
      background: '#0f172a',
      surface: '#1e293b',
      border: '#334155',
      text: '#f1f5f9',
      textLight: '#cbd5e1',
      disabled: '#64748b',
    },
    styles: {
      borderRadius: { sm: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem' },
      shadow: {
        sm: '0 2px 4px 0 rgba(0, 0, 0, 0.3)',
        md: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
        lg: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
      },
      spacing: { xs: '0.5rem', sm: '0.75rem', md: '1.25rem', lg: '1.75rem', xl: '2.5rem' },
    },
  },
  classic: {
    id: 'classic',
    name: 'Classic',
    colors: {
      primary: '#2d6a4f',
      primaryRgb: '45, 106, 79',
      primaryLight: '#40916c',
      primaryDark: '#1b4332',
      secondary: '#d4a574',
      secondaryRgb: '212, 165, 116',
      secondaryLight: '#e8c4a0',
      secondaryDark: '#a0826d',
      accent: '#52796f',
      accentRgb: '82, 121, 111',
      success: '#2d6a4f',
      successRgb: '45, 106, 79',
      warning: '#d4a574',
      warningRgb: '212, 165, 116',
      error: '#a4161a',
      errorRgb: '164, 22, 26',
      info: '#52796f',
      infoRgb: '82, 121, 111',
      background: '#f5f3f0',
      surface: '#ffffff',
      border: '#d4c5b9',
      text: '#2d2d2d',
      textLight: '#666666',
      disabled: '#ccc9c3',
    },
    styles: {
      borderRadius: { sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.5rem' },
      shadow: {
        sm: '0 2px 4px rgba(45, 106, 79, 0.1)',
        md: '0 6px 12px rgba(45, 106, 79, 0.15)',
        lg: '0 12px 24px rgba(45, 106, 79, 0.2)',
      },
      spacing: { xs: '0.375rem', sm: '0.625rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
    },
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    colors: {
      primary: '#000000',
      primaryRgb: '0, 0, 0',
      primaryLight: '#2d2d2d',
      primaryDark: '#000000',
      secondary: '#ffffff',
      secondaryRgb: '255, 255, 255',
      secondaryLight: '#ffffff',
      secondaryDark: '#f5f5f5',
      accent: '#666666',
      accentRgb: '102, 102, 102',
      success: '#22c55e',
      successRgb: '34, 197, 94',
      warning: '#eab308',
      warningRgb: '234, 179, 8',
      error: '#ef4444',
      errorRgb: '239, 68, 68',
      info: '#0284c7',
      infoRgb: '2, 132, 199',
      background: '#ffffff',
      surface: '#f9f9f9',
      border: '#e0e0e0',
      text: '#000000',
      textLight: '#808080',
      disabled: '#cccccc',
    },
    styles: {
      borderRadius: { sm: '0rem', md: '0rem', lg: '0.25rem', xl: '0.5rem' },
      shadow: {
        sm: '0 1px 0 0 #e0e0e0',
        md: '0 2px 0 0 #d0d0d0',
        lg: '0 4px 0 0 #c0c0c0',
      },
      spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
    },
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    colors: {
      primary: '#3b82f6',
      primaryRgb: '59, 130, 246',
      primaryLight: '#60a5fa',
      primaryDark: '#1e40af',
      secondary: '#f97316',
      secondaryRgb: '249, 115, 22',
      secondaryLight: '#fb923c',
      secondaryDark: '#c2410c',
      accent: '#ec4899',
      accentRgb: '236, 72, 153',
      success: '#10b981',
      successRgb: '16, 185, 129',
      warning: '#f59e0b',
      warningRgb: '245, 158, 11',
      error: '#ef4444',
      errorRgb: '239, 68, 68',
      info: '#3b82f6',
      infoRgb: '59, 130, 246',
      background: '#0f172a',
      surface: '#1e293b',
      border: '#334155',
      text: '#f1f5f9',
      textLight: '#cbd5e1',
      disabled: '#64748b',
    },
    styles: {
      borderRadius: { sm: '0.375rem', md: '0.5rem', lg: '0.75rem', xl: '1rem' },
      shadow: {
        sm: '0 2px 8px rgba(0, 0, 0, 0.4)',
        md: '0 6px 16px rgba(0, 0, 0, 0.5)',
        lg: '0 12px 24px rgba(0, 0, 0, 0.6)',
      },
      spacing: { xs: '0.375rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    colors: {
      primary: '#7c3aed',
      primaryRgb: '124, 58, 237',
      primaryLight: '#a78bfa',
      primaryDark: '#5b21b6',
      secondary: '#fbbf24',
      secondaryRgb: '251, 191, 36',
      secondaryLight: '#fcd34d',
      secondaryDark: '#ca8a04',
      accent: '#06b6d4',
      accentRgb: '6, 182, 212',
      success: '#10b981',
      successRgb: '16, 185, 129',
      warning: '#f59e0b',
      warningRgb: '245, 158, 11',
      error: '#ef4444',
      errorRgb: '239, 68, 68',
      info: '#7c3aed',
      infoRgb: '124, 58, 237',
      background: '#faf5ff',
      surface: '#ffffff',
      border: '#e9d5ff',
      text: '#4c1d95',
      textLight: '#9333ea',
      disabled: '#d8b4fe',
    },
    styles: {
      borderRadius: { sm: '0.75rem', md: '1rem', lg: '1.25rem', xl: '1.5rem' },
      shadow: {
        sm: '0 4px 12px rgba(124, 58, 237, 0.12)',
        md: '0 8px 20px rgba(124, 58, 237, 0.16)',
        lg: '0 16px 32px rgba(124, 58, 237, 0.2)',
      },
      spacing: { xs: '0.5rem', sm: '0.75rem', md: '1.25rem', lg: '1.75rem', xl: '2.25rem' },
    },
  },
};

export const getTemplatePalette = (templateId: string): TemplatePalette => {
  return TEMPLATE_PALETTES[templateId] || TEMPLATE_PALETTES.fresh;
};
