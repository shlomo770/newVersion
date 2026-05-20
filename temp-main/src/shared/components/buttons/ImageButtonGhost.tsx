import { useState, type CSSProperties, type KeyboardEvent } from 'react';
import styles from './ImageButtonGhost.module.css';

export interface ImageButtonGhostProps {
  src: string;
  size?: number;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  hoverScale?: number;
  activeScale?: number;
  shadow?: boolean;
  className?: string;
}

export function ImageButtonGhost({
  src,
  size = 96,
  onClick,
  disabled = false,
  ariaLabel,
  hoverScale = 1.03,
  activeScale = 0.97,
  shadow = true,
  className = '',
}: ImageButtonGhostProps) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const dropShadow = shadow
    ? disabled
      ? 'drop-shadow(0 1px 2px rgba(0,0,0,.25))'
      : hover
        ? 'drop-shadow(0 6px 14px rgba(0,0,0,.45))'
        : 'drop-shadow(0 4px 10px rgba(0,0,0,.40))'
    : 'none';

  const scale = active ? activeScale : hover ? hoverScale : 1;

  const buttonStyle: CSSProperties = {
    transform: `scale(${scale})`,
    filter: dropShadow,
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!disabled && (event.key === ' ' || event.key === 'Enter')) {
      setActive(true);
    }
  };

  const rootClass = className ? `${styles.button} ${className}` : styles.button;
  const imageClass = disabled ? `${styles.image} ${styles.imageDisabled}` : `${styles.image} ${styles.imageEnabled}`;

  return (
    <button
      type="button"
      className={rootClass}
      style={buttonStyle}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setActive(false);
      }}
      onMouseDown={() => !disabled && setActive(true)}
      onMouseUp={() => setActive(false)}
      onKeyDown={handleKeyDown}
      onKeyUp={() => setActive(false)}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      <img
        src={src}
        alt={ariaLabel ?? 'button-icon'}
        width={size}
        height={size}
        className={imageClass}
      />
    </button>
  );
}
