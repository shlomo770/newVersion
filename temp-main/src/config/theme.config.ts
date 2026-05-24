/**
 * JBK — global design system configuration.
 * Change values here to adjust the visual language of the entire application.
 * Applied at runtime via `applyTheme()` → CSS custom properties on `:root`.
 */

export type ThemeMode = 'dark' | 'light';

export interface ThemeConfig {
  mode: ThemeMode;
  colors: {
    primary: string;
    primaryHover: string;
    primaryMuted: string;
    accent: string;
    accentMuted: string;
    danger: string;
    dangerHover: string;
    success: string;
    successHover: string;
    warning: string;
    info: string;

    background: {
      app: string;
      panel: string;
      panelHeader: string;
      panelTranslucent: string;
      input: string;
      overlay: string;
      splash: string;
      rail: string;
      card: string;
      cardHover: string;
      elevated: string;
    };

    text: {
      primary: string;
      secondary: string;
      muted: string;
      inverse: string;
      accent: string;
      danger: string;
      label: string;
    };

    border: {
      default: string;
      subtle: string;
      strong: string;
      focus: string;
      active: string;
    };

    status: {
      ok: string;
      warning: string;
      fail: string;
      connected: string;
      disconnected: string;
    };

    map: {
      hud: string;
      hudMuted: string;
      contextMenu: string;
      hostile: string;
      friendly: string;
    };

    semantic: {
      white: string;
      black: string;
      yellow: string;
      orange: string;
      gray: string;
      green: string;
      red: string;
      blue: string;
      indigo: string;
    };
  };

  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };

  spacing: {
    panelPadding: string;
    panelPaddingSm: string;
    panelGap: string;
    formGap: string;
    sectionGap: string;
  };

  shadow: {
    sm: string;
    md: string;
    lg: string;
    panel: string;
    modal: string;
    floating: string;
  };

  fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    statusBar: string;
    mapHud: string;
  };

  fontFamily: {
    sans: string;
    mono: string;
  };

  zIndex: {
    mapBase: number;
    mapHud: number;
    mapContextMenu: number;
    mapMeasureBadge: number;
    sidebarRail: number;
    sidebarPanel: number;
    targetPanel: number;
    entityPanel: number;
    floatingChrome: number;
    compass: number;
    modalBackdrop: number;
    confirmDialog: number;
    statusBar: number;
    toast: number;
    flyoutMenu: number;
    mapTopChrome: number;
  };

  layout: {
    statusBarHeight: string;
    sidebarRailWidth: string;
    sidebarPanelWidth: string;
    entityPanelWidth: string;
  };

  motion: {
    fast: string;
    normal: string;
    slow: string;
    ease: string;
  };

  components: {
    button: {
      heightSm: string;
      heightMd: string;
      heightLg: string;
    };
    input: {
      height: string;
      heightSm: string;
    };
    modal: {
      scrimOpacity: number;
      blur: string;
    };
  };
}

/** Default dark tactical theme — single source of truth for the design system. */
export const theme: ThemeConfig = {
  mode: 'dark',

  colors: {
    primary: '#2f67ff',
    primaryHover: '#3d73ff',
    primaryMuted: 'rgba(47, 103, 255, 0.14)',
    accent: '#38bdf8',
    accentMuted: 'rgba(56, 189, 248, 0.12)',
    danger: '#f84747',
    dangerHover: '#ff5a5a',
    success: '#43e55f',
    successHover: '#5aed72',
    warning: '#fbbf24',
    info: '#38bdf8',

    background: {
      app: '#070a10',
      panel: '#1f2937',
      panelHeader: '#1a2332',
      panelTranslucent: 'rgba(31, 41, 55, 0.84)',
      input: '#0f172a',
      overlay: 'rgba(0, 0, 0, 0.6)',
      splash: '#070a10',
      rail: 'rgba(15, 23, 42, 0.92)',
      card: 'rgba(255, 255, 255, 0.03)',
      cardHover: 'rgba(255, 255, 255, 0.06)',
      elevated: '#18181b',
    },

    text: {
      primary: '#e5e7eb',
      secondary: '#cbd5e1',
      muted: '#94a3b8',
      inverse: '#ffffff',
      accent: '#98a5db',
      danger: '#fca5a5',
      label: '#bae6fd',
    },

    border: {
      default: '#334155',
      subtle: 'rgba(255, 255, 255, 0.08)',
      strong: 'rgba(255, 255, 255, 0.15)',
      focus: '#fbbf24',
      active: 'rgba(56, 189, 248, 0.5)',
    },

    status: {
      ok: '#ffffff',
      warning: '#facc15',
      fail: '#dc2626',
      connected: '#ffffff',
      disconnected: '#dc2626',
    },

    map: {
      hud: '#98a5db',
      hudMuted: '#64748b',
      contextMenu: 'rgba(31, 41, 55, 0.84)',
      hostile: 'rgba(239, 68, 68, 0.7)',
      friendly: 'rgba(34, 197, 94, 0.7)',
    },

    semantic: {
      white: '#ffffff',
      black: '#000000',
      yellow: '#fbdf1d',
      orange: '#fb781d',
      gray: '#767070',
      green: '#43e55f',
      red: '#f84747',
      blue: '#5c59da',
      indigo: '#6366f1',
    },
  },

  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },

  spacing: {
    panelPadding: '1rem',
    panelPaddingSm: '0.75rem',
    panelGap: '0.75rem',
    formGap: '0.5rem',
    sectionGap: '1rem',
  },

  shadow: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.25)',
    md: '0 4px 12px rgba(0, 0, 0, 0.25)',
    lg: '0 10px 25px rgba(0, 0, 0, 0.35)',
    panel: '4px 0 12px rgba(0, 0, 0, 0.2)',
    modal: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    floating: '0 10px 25px rgba(0, 0, 0, 0.35)',
  },

  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    statusBar: '13px',
    mapHud: '12px',
  },

  fontFamily: {
    sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    mono: "ui-monospace, 'Cascadia Code', 'Segoe UI Mono', monospace",
  },

  zIndex: {
    mapBase: 0,
    mapHud: 100,
    mapContextMenu: 999,
    mapMeasureBadge: 1000,
    sidebarRail: 50,
    sidebarPanel: 40,
    targetPanel: 60,
    entityPanel: 1000,
    floatingChrome: 10000,
    compass: 9999,
    modalBackdrop: 3000,
    confirmDialog: 1000,
    statusBar: 99999,
    toast: 99999,
    flyoutMenu: 999999,
    mapTopChrome: 9999999,
  },

  layout: {
    statusBarHeight: '60px',
    sidebarRailWidth: '4rem',
    sidebarPanelWidth: '350px',
    entityPanelWidth: '350px',
  },

  motion: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  components: {
    button: {
      heightSm: '1.75rem',
      heightMd: '2.25rem',
      heightLg: '2.75rem',
    },
    input: {
      height: '2.5rem',
      heightSm: '2rem',
    },
    modal: {
      scrimOpacity: 0.6,
      blur: '4px',
    },
  },
};

export default theme;
