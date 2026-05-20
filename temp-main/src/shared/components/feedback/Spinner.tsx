import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: number;
  stroke?: number;
  /** Arc stroke color. Defaults to status warning token. */
  color?: string;
  /** Track ring color. Defaults to primary text token. */
  trackColor?: string;
  className?: string;
}

export function Spinner({
  size = 28,
  stroke = 3,
  color = 'var(--color-status-warning)',
  trackColor = 'var(--color-text-primary)',
  className = '',
}: SpinnerProps) {
  const radius = size / 2 - stroke;
  const circumference = 2 * Math.PI * radius;
  const rootClass = className ? `${styles.root} ${className}` : styles.root;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={rootClass}
      role="status"
      aria-label="Loading"
    >
      <circle
        className={styles.track}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={stroke}
      />
      <circle
        className={styles.arc}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${circumference * 0.25} ${circumference}`}
        strokeDashoffset={0}
      />
    </svg>
  );
}

/** @deprecated Prefer `Spinner`; kept for legacy import name. */
export function SpinnerMustard(props: SpinnerProps) {
  return <Spinner {...props} />;
}
