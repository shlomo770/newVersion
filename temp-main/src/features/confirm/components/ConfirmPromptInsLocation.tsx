import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useWebSocket } from '@/hooks/useWebSocket';
import { WsMessageName } from '@domain/enums/ws.enum';
import { AppButton } from '@shared/ui';
import { he } from '@shared/i18n';
import { closePrompt } from '../store/confirmSlice';
import styles from './ConfirmPromptInsLocation.module.css';

export function ConfirmPromptInsLocation() {
  const { sendMessage } = useWebSocket();
  const prompt = useAppSelector((s) => s.confirm.prompt);
  const dispatch = useAppDispatch();
  const backdropRef = useRef<HTMLDivElement | null>(null);

  const confirmLocation = (confirmed: boolean) => {
    sendMessage(WsMessageName.ConfirmPosition, { confirmed });
    dispatch(closePrompt());
  };

  if (!prompt) return null;

  const { title = he.confirm.defaultTitle, message, confirmText = he.confirm.confirm, cancelText = he.confirm.cancel } = prompt;

  const modal = (
    <div ref={backdropRef} className={styles.backdrop}>
      <div role="dialog" aria-modal="true" className={styles.dialog}>
        <div className={styles.body}>
          <div className={styles.headerRow}>
            <div className={styles.iconBox}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 8v5m0 4h.01M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
              </svg>
            </div>
            <div className={styles.content}>
              <h3 className={styles.title}>{title}</h3>
              <p className={styles.message}>{message}</p>
            </div>
          </div>
          <div className={styles.actions}>
            <AppButton size="sm" onClick={() => confirmLocation(true)}>
              {confirmText}
            </AppButton>
            <AppButton size="sm" variant="ghost" onClick={() => confirmLocation(false)}>
              {cancelText}
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default ConfirmPromptInsLocation;
