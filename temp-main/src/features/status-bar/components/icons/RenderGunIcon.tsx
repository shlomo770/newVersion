import { memo } from 'react';
import { GunStatusE } from '@domain/enums/status.enum';
import { STATUS_BAR_ICONS } from '@/config';
import { gunIconClass } from './iconClassNames';
import styles from './statusIcons.module.css';

export interface RenderGunIconProps {
  status: GunStatusE;
}

function RenderGunIcon({ status = GunStatusE.NO_COMM }: RenderGunIconProps) {
  const colorClass = gunIconClass(status);

  return (
    <div className={styles.iconWrap}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 61.2756 110.618"
        strokeWidth="2"
        className={`${styles.iconSvg} ${colorClass}`}
        aria-hidden
      >
        <g>
          <g transform="translate(3,-3)">
            <path d="M22.68 84.88 A28.7248 25.3119 -90 0 0 -0 110.62 L55.28 110.62 A30.1359 23.236 -91.93 0 0 34.02 84.88 L34.02 8.35 A8.01759 8.01759 -180 0 0 22.68 8.35 L22.68 84.88 Z" />
          </g>
          <g transform="translate(45.5197,-39.9036)">
            <path d="M11.34 106.2 L11.34 75.02 A6.07193 6.07193 -180 0 0 0 75.02 L0 106.2 A5.84531 5.84531 -180 0 0 11.34 106.2 Z" />
          </g>
          <g transform="translate(5.83464,-39.9036)">
            <path d="M11.34 106.2 L11.34 75.02 A6.07193 6.07193 -180 0 0 0 75.02 L0 106.2 A5.84531 5.84531 -180 0 0 11.34 106.2 Z" />
          </g>
        </g>
      </svg>

      {status === GunStatusE.ARM && (
        <div className={styles.iconOverlay}>
          <span className={styles.armLabel}>ARM</span>
        </div>
      )}

      {status === GunStatusE.NO_COMM && (
        <div className={styles.iconOverlay}>
          <img src={STATUS_BAR_ICONS.noComm} className={styles.noCommImg} alt="" />
        </div>
      )}
    </div>
  );
}

export default memo(RenderGunIcon);
