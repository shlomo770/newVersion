/**
 * JBK — form design system configuration.
 *
 * All form layout, typography, and control sizing is defined here.
 * Applied at runtime via `applyTheme()` → CSS custom properties.
 * Visual styling lives in `src/app/styles/forms.css` (single stylesheet).
 */

import { theme } from './theme.config';

export interface FormConfig {
  /** Vertical gap between fields in a form stack. */
  stackGap: string;
  /** Gap between label and control inside a field. */
  fieldGap: string;
  /** Gap between action buttons. */
  actionsGap: string;
  label: {
    fontSize: string;
    fontWeight: number;
  };
  control: {
    fontSize: string;
    fontSizeCompact: string;
    minHeight: string;
    minHeightCompact: string;
    paddingX: string;
    paddingY: string;
    paddingXCompact: string;
    paddingYCompact: string;
    radius: string;
    focusRingWidth: string;
  };
  button: {
    fontSizeSm: string;
    fontSizeMd: string;
    fontSizeLg: string;
  };
  section: {
    padding: string;
    radius: string;
    gap: string;
  };
}

/** Default form standards — derived from global theme tokens. */
export const form: FormConfig = {
  stackGap: theme.spacing.formGap,
  fieldGap: '0.25rem',
  actionsGap: theme.spacing.formGap,
  label: {
    fontSize: theme.fontSize.xs,
    fontWeight: 500,
  },
  control: {
    fontSize: theme.fontSize.sm,
    fontSizeCompact: theme.fontSize.xs,
    minHeight: theme.components.input.heightSm,
    minHeightCompact: '1.75rem',
    paddingX: '0.75rem',
    paddingY: '0.5rem',
    paddingXCompact: '0.5rem',
    paddingYCompact: '0.25rem',
    radius: theme.radius.md,
    focusRingWidth: '1px',
  },
  button: {
    fontSizeSm: theme.fontSize.xs,
    fontSizeMd: theme.fontSize.sm,
    fontSizeLg: theme.fontSize.md,
  },
  section: {
    padding: theme.spacing.panelPaddingSm,
    radius: theme.radius.lg,
    gap: theme.spacing.panelGap,
  },
};

export default form;
