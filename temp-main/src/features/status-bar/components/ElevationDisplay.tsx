import { memo } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { selectStatusBarElevationLabel } from '../selectors/statusBarSelectors';
import styles from './StatusBar.module.css';

function ElevationDisplay() {
  const elevationLabel = useAppSelector(selectStatusBarElevationLabel);
  return <div className={styles.elevationText}>{elevationLabel}</div>;
}

export default memo(ElevationDisplay);
