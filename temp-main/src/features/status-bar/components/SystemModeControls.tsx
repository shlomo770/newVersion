import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { MdMotionPhotosAuto } from 'react-icons/md';
import { RiHand } from 'react-icons/ri';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useWebSocket } from '@/hooks/useWebSocket';
import { WsMessageName } from '@domain/enums/ws.enum';
import { SystemModeE, GunStatusE } from '@domain/enums/status.enum';
import FlyoutMenu from '@shared/components/overlay/FlyoutMenu';
import { RenderGunIcon, RenderDroneIcon } from './icons';
import { selectGunStatus, selectSystemMode } from '../selectors/statusBarSelectors';
import styles from './StatusBar.module.css';

function SystemModeControls() {
  const { sendMessage } = useWebSocket();
  const gunStatus = useAppSelector(selectGunStatus);
  const systemMode = useAppSelector(selectSystemMode);
  const [mode, setMode] = useState<SystemModeE>(systemMode);
  const [modeFlyoutOpen, setModeFlyoutOpen] = useState(false);
  const [gunFlyoutOpen, setGunFlyoutOpen] = useState(false);
  const modeButtonRef = useRef<HTMLButtonElement>(null);
  const gunButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMode(systemMode);
  }, [systemMode]);

  const getModeIcon = useCallback(() => {
    const iconSize = 30;
    if (mode === SystemModeE.MANUAL) {
      return <RiHand size={iconSize} color="var(--color-white)" />;
    }
    if (mode === SystemModeE.AUTO) {
      return <MdMotionPhotosAuto size={35} color="var(--color-white)" />;
    }
    if (mode === SystemModeE.SEMI_AUTO) {
      return (
        <div className={styles.serverWrap}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={styles.semiAutoSvg} aria-hidden>
            <text x="50%" y="55%" textAnchor="middle" className={styles.semiAutoText}>
              1/2
            </text>
          </svg>
        </div>
      );
    }
    return <RiHand size={iconSize} color="var(--color-white)" />;
  }, [mode]);

  return (
    <>
      <div className={styles.sectionModes}>
        <div className={styles.modeColumn}>
          <button
            ref={modeButtonRef}
            type="button"
            className={styles.modeButton}
            onClick={() => setModeFlyoutOpen((v) => !v)}
            aria-expanded={modeFlyoutOpen}
          >
            {getModeIcon()}
          </button>
          {systemMode === SystemModeE.SEMI_AUTO && <span className={styles.modeSubLabel}>1/2</span>}
        </div>
        <span className={styles.divider} aria-hidden />
        <button
          ref={gunButtonRef}
          type="button"
          title="Gun Status"
          className={styles.systemColumn}
          onClick={() => setGunFlyoutOpen((v) => !v)}
        >
          <RenderGunIcon status={gunStatus} />
          <span className={styles.systemLabel}>{GunStatusE[gunStatus]}</span>
        </button>
        <div title="Drone Status" className={styles.systemColumnFlush}>
          <RenderDroneIcon />
          <span className={styles.systemLabel}>TBD</span>
        </div>
      </div>

      <FlyoutMenu anchorRef={modeButtonRef} isOpen={modeFlyoutOpen} placement="bottom" onClose={() => setModeFlyoutOpen(false)}>
        <div className={styles.flyoutRow}>
          <button
            type="button"
            className={styles.flyoutAction}
            onClick={() => {
              setMode(SystemModeE.AUTO);
              sendMessage(WsMessageName.SystemMode, { system_mode: SystemModeE.AUTO });
              setModeFlyoutOpen(false);
            }}
          >
            <MdMotionPhotosAuto size={20} color="var(--color-white)" />
            <span>Auto</span>
          </button>
          <button
            type="button"
            className={styles.flyoutAction}
            onClick={() => {
              setMode(SystemModeE.SEMI_AUTO);
              sendMessage(WsMessageName.SystemMode, { system_mode: SystemModeE.SEMI_AUTO });
              setModeFlyoutOpen(false);
            }}
          >
            <span className={styles.flyoutSemiLabel}>1/2</span>
            <span>Semi-Auto</span>
          </button>
          <button
            type="button"
            className={styles.flyoutAction}
            onClick={() => {
              setMode(SystemModeE.MANUAL);
              sendMessage(WsMessageName.SystemMode, { system_mode: SystemModeE.MANUAL });
              setModeFlyoutOpen(false);
            }}
          >
            <RiHand size={20} color="var(--color-white)" />
            <span>Manual</span>
          </button>
        </div>
      </FlyoutMenu>

      <FlyoutMenu anchorRef={gunButtonRef} isOpen={gunFlyoutOpen} placement="bottom" onClose={() => setGunFlyoutOpen(false)}>
        <div className={styles.flyoutStatusText}>{GunStatusE[gunStatus] ?? GunStatusE[0]}</div>
      </FlyoutMenu>
    </>
  );
}

export default memo(SystemModeControls);
