import { memo } from 'react';
import styles from './statusIcons.module.css';

function RenderIffIcon() {
  return (
    <div className={styles.iconWrap}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={styles.iconSvgLarge} aria-hidden>
        <text x="50%" y="55%" textAnchor="middle" className={styles.iffText}>
          IFF
        </text>
      </svg>
    </div>
  );
}

export default memo(RenderIffIcon);
