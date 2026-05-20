import type { FC } from 'react';
import styles from './ToggleSwitch.module.css';

export type ToggleSwitchSize = 'sm' | 'md' | 'lg';

export interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  size?: ToggleSwitchSize;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

const sizeOuter: Record<ToggleSwitchSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

const sizeThumb: Record<ToggleSwitchSize, string> = {
  sm: styles.thumbSm,
  md: styles.thumbMd,
  lg: styles.thumbLg,
};

const sizeThumbChecked: Record<ToggleSwitchSize, string> = {
  sm: styles.thumbCheckedSm,
  md: styles.thumbCheckedMd,
  lg: styles.thumbCheckedLg,
};

const sizeShadow: Record<ToggleSwitchSize, string> = {
  sm: styles.shadowSm,
  md: styles.shadowMd,
  lg: styles.shadowLg,
};

export const ToggleSwitch: FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  size = 'md',
  disabled = false,
  ariaLabel,
  className = '',
}) => {
  const switchClass = [
    styles.switch,
    sizeOuter[size],
    checked ? styles.checked : styles.unchecked,
    !checked && disabled ? styles.uncheckedDisabled : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const thumbClass = [
    styles.thumb,
    sizeThumb[size],
    sizeShadow[size],
    checked ? sizeThumbChecked[size] : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-checked={checked}
      role="switch"
      className={switchClass}
    >
      <span className={thumbClass} />
    </button>
  );
};

export default ToggleSwitch;
