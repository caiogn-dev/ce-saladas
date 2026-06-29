// ce-saladas/src/themes/storeThemeStructure.ts
/**
 * Store Theme Structure
 *
 * Defines ONLY structural properties (borderRadius, spacing, shadows, layout).
 * Colors come from the Store API: store.primary_color, store.secondary_color, store.accent_color
 * This separation allows colors to be per-store customizable without changing template structure.
 */

export interface ThemeStructure {
  id: string;
  name: string;
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

/**
 * 4 structural templates - structure only, no colors.
 * Each store picks one template from the API (store.template field).
 * Colors are then injected separately from store.primary_color, store.secondary_color, store.accent_color.
 */
export const THEME_STRUCTURES: Record<string, ThemeStructure> = {
  modern: {
    id: 'modern',
    name: 'Modern',
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
  compact: {
    id: 'compact',
    name: 'Compact',
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
  luxury: {
    id: 'luxury',
    name: 'Luxury',
    styles: {
      borderRadius: { sm: '0.75rem', md: '1rem', lg: '1.25rem', xl: '1.5rem' },
      shadow: {
        sm: '0 4px 12px rgba(0, 0, 0, 0.12)',
        md: '0 8px 20px rgba(0, 0, 0, 0.16)',
        lg: '0 16px 32px rgba(0, 0, 0, 0.2)',
      },
      spacing: { xs: '0.5rem', sm: '0.75rem', md: '1.25rem', lg: '1.75rem', xl: '2.25rem' },
    },
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    styles: {
      borderRadius: { sm: '0rem', md: '0rem', lg: '0.25rem', xl: '0.5rem' },
      shadow: {
        sm: '0 1px 0 0 rgba(0, 0, 0, 0.1)',
        md: '0 2px 0 0 rgba(0, 0, 0, 0.15)',
        lg: '0 4px 0 0 rgba(0, 0, 0, 0.2)',
      },
      spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
    },
  },
};

/**
 * Get template structure by ID.
 * Defaults to 'modern' if template not found.
 */
export const getThemeStructure = (templateId: string): ThemeStructure => {
  return THEME_STRUCTURES[templateId] || THEME_STRUCTURES.modern;
};
