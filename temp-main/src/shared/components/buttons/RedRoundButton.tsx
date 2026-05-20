import { useId, useState } from 'react';
import styles from './RedRoundButton.module.css';

export interface RedRoundButtonProps {
  size?: number;
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
  /** Gloss highlight strength 0–1. Default 0.55. */
  gloss?: number;
}

export function RedRoundButton({
  size = 80,
  label = 'ביטול',
  onClick,
  disabled = false,
  gloss = 0.55,
}: RedRoundButtonProps) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const uid = useId().replace(/:/g, '');

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.48;

  const base0 = active ? '#ff4a4a' : hover ? '#ff5959' : '#ff6262';
  const base1 = active ? '#c91c1c' : hover ? '#d11f1f' : '#db2121';
  const base2 = active ? '#7e0d0d' : hover ? '#8a0f0f' : '#951010';

  const shadow = disabled
    ? 'drop-shadow(0 1px 2px rgba(0,0,0,.25))'
    : active
      ? 'drop-shadow(0 1px 1px rgba(0,0,0,.55))'
      : hover
        ? 'drop-shadow(0 6px 14px rgba(0,0,0,.45))'
        : 'drop-shadow(0 4px 10px rgba(0,0,0,.40))';

  const glossOpacity = Math.max(0, Math.min(1, gloss)) * (disabled ? 0.5 : 1);
  const insetGradId = `insetGrad-${uid}`;
  const insetShadowId = `insetShadow-${uid}`;
  const glossGradId = `glossGrad-${uid}`;
  const circleMaskId = `circleMask-${uid}`;

  return (
    <button
      type="button"
      className={styles.button}
      style={{ width: size, height: size, filter: shadow, transform: active ? 'scale(0.97)' : 'scale(1)' }}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setActive(false);
      }}
      onMouseDown={() => !disabled && setActive(true)}
      onMouseUp={() => setActive(false)}
      onKeyDown={(event) => {
        if (!disabled && (event.key === ' ' || event.key === 'Enter')) setActive(true);
      }}
      onKeyUp={() => setActive(false)}
      disabled={disabled}
      aria-label={label}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-hidden>
        <defs>
          <radialGradient id={insetGradId} cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor={base2} />
            <stop offset="60%" stopColor={base1} />
            <stop offset="100%" stopColor={base0} />
          </radialGradient>
          <filter id={insetShadowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="b" />
            <feOffset dx="1" dy="1" />
            <feComposite in2="b" operator="arithmetic" k2="-1" k3="1" result="inset" />
            <feMerge>
              <feMergeNode in="inset" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={glossGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <mask id={circleMaskId}>
            <rect x="0" y="0" width={size} height={size} fill="black" />
            <circle cx={cx} cy={cy} r={r} fill="white" />
          </mask>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill={`url(#${insetGradId})`} filter={`url(#${insetShadowId})`} />
        <g mask={`url(#${circleMaskId})`} opacity={glossOpacity}>
          <ellipse
            cx={cx - size * 0.06}
            cy={cy - size * 0.2}
            rx={r * 0.78}
            ry={r * 0.42}
            fill={`url(#${glossGradId})`}
          />
        </g>
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size * 0.28}
          fontFamily="var(--font-family-sans)"
          fontWeight={800}
          className={disabled ? styles.labelDisabled : styles.labelEnabled}
        >
          {label}
        </text>
      </svg>
    </button>
  );
}
