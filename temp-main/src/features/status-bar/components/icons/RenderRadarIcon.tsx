import { memo } from 'react';
import { RadarStatusE } from '@domain/enums/status.enum';
import { radarIconClass } from './iconClassNames';
import styles from './statusIcons.module.css';

export interface RenderRadarIconProps {
  status: RadarStatusE;
}

function RenderRadarIcon({ status = RadarStatusE.NO_COMM }: RenderRadarIconProps) {
  const colorClass = radarIconClass(status);

  return (
    <div className={styles.iconWrap}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="20 0 61 110"
        strokeWidth="2"
        className={`${styles.iconSvg} ${colorClass}`}
        aria-hidden
      >
        <path d="M76.858 21.728L49.293 49.293a1 1 0 1 0 1.414 1.414l8.008-8.008A11.31 11.31 0 0 1 61.38 50c0 6.275-5.105 11.38-11.38 11.38S38.62 56.275 38.62 50 43.725 38.62 50 38.62a1 1 0 0 0 0-2c-7.378 0-13.38 6.002-13.38 13.38S42.622 63.38 50 63.38 63.38 57.378 63.38 50a13.3 13.3 0 0 0-3.249-8.717l7.894-7.894A24.364 24.364 0 0 1 74.518 50c0 13.519-10.999 24.518-24.518 24.518S25.482 63.519 25.482 50 36.481 25.482 50 25.482a1 1 0 0 0 0-2c-14.622 0-26.518 11.896-26.518 26.518S35.378 76.518 50 76.518 76.518 64.622 76.518 50a26.352 26.352 0 0 0-7.079-18.025l8.129-8.129C84.303 30.936 88 40.184 88 50c0 20.953-17.047 38-38 38S12 70.953 12 50s17.047-38 38-38a1 1 0 0 0 0-2c-22.056 0-40 17.944-40 40s17.944 40 40 40 40-17.944 40-40c0-10.685-4.16-20.729-11.716-28.284a1.015 1.015 0 0 0-1.426.012z" />
      </svg>
      {status === RadarStatusE.NO_COMM && (
        <div className={styles.iconOverlay}>
          <img src="./icons/swap_no_link_arrows_512.png" className={styles.noCommImg} alt="" />
        </div>
      )}
    </div>
  );
}

export default memo(RenderRadarIcon);
