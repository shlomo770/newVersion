import { memo, useMemo } from 'react';
import { useWsConnection } from '@/hooks/useWsConnection';
import { useAppSelector } from '@/hooks/useAppSelector';
import { SelectedModeE } from '@domain/enums/general.enum';
import { selectSelectedMode } from '../selectors/statusBarSelectors';
import { he } from '@shared/i18n';
import styles from './StatusBar.module.css';

function selectedModeLabelHe(mode: SelectedModeE | null): string {
  if (mode == null) return '—';
  if (mode === SelectedModeE.Mission) return he.statusBar.modes.mission;
  if (mode === SelectedModeE.Training) return he.statusBar.modes.training;
  if (mode === SelectedModeE.Planning) return he.statusBar.modes.planning;
  if (mode === SelectedModeE.Maintenance) return he.statusBar.modes.maintenance;
  return String(mode);
}

function ConnectionClock() {
  const isWebSocketConnected = useWsConnection();
  const selectedMode = useAppSelector(selectSelectedMode);
  const date = useMemo(() => new Date(), []);
  const formattedDate = useMemo(() => date.toLocaleDateString('he-IL'), [date]);
  const formattedTime = useMemo(
    () => date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    [date],
  );

  const serverFill = isWebSocketConnected
    ? 'var(--color-status-connected)'
    : 'var(--color-status-disconnected)';

  const serverTitle = isWebSocketConnected
    ? he.statusBar.serverConnected
    : he.statusBar.serverDisconnected;

  return (
    <div className={styles.sectionEnd}>
      <span className={styles.divider} aria-hidden />
      <div className={styles.modeLabel}>
        {he.statusBar.modePrefix} {selectedModeLabelHe(selectedMode)}
      </div>
      <div
        title={serverTitle}
        className={styles.systemColumnFlush}
      >
        <div className={styles.serverWrap}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={styles.serverIcon} aria-hidden>
            <path
              fill={serverFill}
              d="M23.25 12.75v-1.5h-10.5V9h2.625a1.126 1.126 0 0 0 1.125-1.125v-6a1.126 1.126 0 0 0-1.125-1.125h-6.75a1.126 1.126 0 0 0-1.125 1.125v6a1.126 1.126 0 0 0 1.125 1.125h2.625v2.25H.75v1.5H4.5V15H1.94a1.126 1.126 0 0 0-1.125 1.125v6a1.126 1.126 0 0 0 1.125 1.125h6.685a1.126 1.126 0 0 0 1.125-1.125v-6a1.126 1.126 0 0 0-1.125-1.125H6v-2.25h12V15h-2.625a1.126 1.126 0 0 0-1.125 1.125v6a1.126 1.126 0 0 0 1.125 1.125h6.75a1.126 1.126 0 0 0 1.125-1.125v-6a1.126 1.126 0 0 0-1.125-1.125H19.5v-2.25zM9 2.25h6V7.5H9zm-.75 19.5H2.315V16.5H8.25zm13.5 0h-6V16.5h6z"
            />
          </svg>
        </div>
      </div>
      <div className={styles.clockBlock}>
        <div className={styles.clockDate}>{formattedDate}</div>
        <div className={styles.clockTime}>{formattedTime}</div>
      </div>
    </div>
  );
}

export default memo(ConnectionClock);
