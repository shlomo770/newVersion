import { memo, useRef, useState } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { InsStatusE, RadarStatusE } from '@domain/enums/status.enum';
import FlyoutMenu from '@shared/components/overlay/FlyoutMenu';
import { RenderRadarIcon, RenderAntennaIcon, RenderInsIcon, RenderIffIcon } from './icons';
import { selectInsStatus, selectRadarStatus } from '../selectors/statusBarSelectors';
import styles from './StatusBar.module.css';

function TelemetryIcons() {
  const radarStatus = useAppSelector(selectRadarStatus);
  const insStatus = useAppSelector(selectInsStatus);
  const radarButtonRef = useRef<HTMLButtonElement>(null);
  const [radarFlyoutOpen, setRadarFlyoutOpen] = useState(false);

  return (
    <>
      <div className={styles.sectionSystems}>
        <span className={styles.divider} aria-hidden />
        <div title="Antenna Status" className={styles.systemColumn}>
          <RenderAntennaIcon />
        </div>
        <button
          ref={radarButtonRef}
          type="button"
          title="Radar Status"
          className={styles.systemColumn}
          onClick={() => setRadarFlyoutOpen((v) => !v)}
        >
          <RenderRadarIcon status={radarStatus} />
          <span className={styles.systemLabel}>{RadarStatusE[radarStatus]}</span>
        </button>
        <div title="Tmaps Status" className={styles.systemColumn}>
          <RenderInsIcon status={insStatus} />
          <span className={styles.systemLabel}>{InsStatusE[insStatus]}</span>
        </div>
        <div title="IFF Status" className={styles.systemColumnFlush}>
          <RenderIffIcon />
        </div>
      </div>

      <FlyoutMenu anchorRef={radarButtonRef} isOpen={radarFlyoutOpen} placement="bottom" onClose={() => setRadarFlyoutOpen(false)}>
        <div className={styles.flyoutStatusText}>{RadarStatusE[radarStatus] ?? RadarStatusE[0]}</div>
      </FlyoutMenu>
    </>
  );
}

export default memo(TelemetryIcons);
