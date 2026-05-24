/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--theme-color-primary)',
          hover: 'var(--theme-color-primary-hover)',
          muted: 'var(--theme-color-primary-muted)',
        },
        accent: {
          DEFAULT: 'var(--theme-color-accent)',
          muted: 'var(--theme-color-accent-muted)',
        },
        panel: {
          DEFAULT: 'var(--theme-color-bg-panel)',
          header: 'var(--theme-color-bg-panel-header)',
          translucent: 'var(--theme-color-bg-panel-translucent)',
        },
        surface: {
          app: 'var(--theme-color-bg-app)',
          input: 'var(--theme-color-bg-input)',
          card: 'var(--theme-color-bg-card)',
        },
        border: {
          DEFAULT: 'var(--theme-color-border)',
          subtle: 'var(--theme-color-border-subtle)',
          focus: 'var(--theme-color-border-focus)',
        },
        text: {
          primary: 'var(--theme-color-text-primary)',
          secondary: 'var(--theme-color-text-secondary)',
          muted: 'var(--theme-color-text-muted)',
          accent: 'var(--theme-color-text-accent)',
        },
        danger: {
          DEFAULT: 'var(--theme-color-danger)',
          hover: 'var(--theme-color-danger-hover)',
        },
        success: {
          DEFAULT: 'var(--theme-color-success)',
          hover: 'var(--theme-color-success-hover)',
        },
      },
      borderRadius: {
        sm: 'var(--theme-radius-sm)',
        md: 'var(--theme-radius-md)',
        lg: 'var(--theme-radius-lg)',
        xl: 'var(--theme-radius-xl)',
      },
      boxShadow: {
        panel: 'var(--theme-shadow-panel)',
        modal: 'var(--theme-shadow-modal)',
        floating: 'var(--theme-shadow-floating)',
      },
      zIndex: {
        sidebar: 'var(--z-sidebar-rail)',
        entityPanel: 'var(--z-entity-panel)',
        statusBar: 'var(--z-status-bar)',
        modal: 'var(--z-modal-backdrop)',
      },
    },
  },
  plugins: [],
};
