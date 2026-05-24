import { useEffect, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { FaExclamationTriangle } from 'react-icons/fa';
import { useAppSelector } from '@/hooks/useAppSelector';
import { ErrorSeverityE } from '@/enums/general.enum';import {
  selectPopupQueue,
  dismissPopup,
  popNextPopup,
  getBadge,
  selectMasterCautionOn,
  acknowledgeAll,
} from '../store/faultsSlice';
import { AppButton, AppIconButton } from '@shared/ui';
import styles from './ToastHost.module.css';

const DISMISS_TTL_MS = 60_000;
const TOAST_TTL_MS = 8_000;

export default function ToastHost() {
  const dispatch = useDispatch();
  const queue = useAppSelector(selectPopupQueue);
  const first = queue.length > 0 ? queue[0] : null;
  const masterOn = useAppSelector(selectMasterCautionOn);  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIdRef = useRef<string | null>(null);

  const isMasterToast = useMemo(() => {
    if (!first) return false;
    return first.severity === ErrorSeverityE.SEVERE;
  }, [first]);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!first) {
      activeIdRef.current = null;
      return undefined;
    }

    if (activeIdRef.current === first.id) return undefined;
    activeIdRef.current = first.id;

    timerRef.current = setTimeout(() => {
      dispatch(popNextPopup());
      activeIdRef.current = null;
      timerRef.current = null;
    }, TOAST_TTL_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [first?.id, dispatch]);

  const closeNow = () => {
    if (!first) return;
    dispatch(dismissPopup({ id: first.id, ttlMs: DISMISS_TTL_MS }));
    dispatch(popNextPopup());
    activeIdRef.current = null;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  if (!first && !masterOn) return null;

  const badge = first ? getBadge(first) : null;

  return (
    <div className={styles.host}>
      {masterOn && (
        <div className={styles.masterRow}>
          <AppButton
            variant="danger"
            size="sm"
            className={styles.masterButton}
            onClick={() => dispatch(acknowledgeAll())}
          >
            MASTER CAUTION
          </AppButton>
        </div>
      )}

      {first && (
        <div className={styles.toast}>
          <div className={styles.toastBody}>
            <FaExclamationTriangle
              size={22}
              className={isMasterToast ? styles.iconSevere : styles.iconWarning}
            />
            <div className={styles.toastContent}>
              <div className={styles.toastMeta}>
                {badge?.label} | {first.category} | #{first.code}
              </div>
              <div className={styles.toastMessage}>{first.description}</div>
            </div>
            <AppIconButton label="Dismiss" size="sm" className={styles.closeButton} onClick={closeNow}>
              X
            </AppIconButton>
          </div>
        </div>
      )}
    </div>
  );
}
