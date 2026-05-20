import { memo } from 'react';
import type { MutableRefObject } from 'react';
import type { MapService } from '@/services/map/MapService';
import { useStatusBarElevation } from '../hooks/useStatusBarElevation';
import StatusBarMenuButton from './StatusBarMenuButton';
import CoordinateDisplay from './CoordinateDisplay';
import ElevationDisplay from './ElevationDisplay';
import MissionSelector from './MissionSelector';
import SystemModeControls from './SystemModeControls';
import TelemetryIcons from './TelemetryIcons';
import ConnectionClock from './ConnectionClock';
import styles from './StatusBar.module.css';

export interface StatusBarProps {
  /** Toggles settings sidebar and map entity chrome. */
  onMenuClick: () => void;
  mapServiceRef: MutableRefObject<MapService | null>;
}

function StatusBar({ onMenuClick, mapServiceRef }: StatusBarProps) {
  useStatusBarElevation();

  return (
    <div className={styles.bar} data-status-bar-root="true">
      <StatusBarMenuButton onMenuClick={onMenuClick} />
      <div className={styles.sectionCoords}>
        <CoordinateDisplay mapServiceRef={mapServiceRef} />
        <ElevationDisplay />
      </div>
      <div className={styles.sectionMission}>
        <MissionSelector />
      </div>
      <SystemModeControls />
      <TelemetryIcons />
      <ConnectionClock />
    </div>
  );
}

export default memo(StatusBar);
