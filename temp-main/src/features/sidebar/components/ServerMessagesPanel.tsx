import { useMemo } from 'react';
import { FiTrash2, FiTerminal, FiCopy } from 'react-icons/fi';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { clearInboundWsMessages } from '@features/ws-debug';
import styles from './ServerMessagesPanel.module.css';

export default function ServerMessagesPanel() {
  const dispatch = useAppDispatch();
  const entries = useAppSelector((s) => s.wsInbound.entries);

  const rawJson = useMemo(() => {
    try {
      return JSON.stringify(entries, null, 2);
    } catch {
      return String(entries);
    }
  }, [entries]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawJson);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div dir="rtl" lang="he" className={styles.panel}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <FiTerminal className={styles.headerIcon} size={20} />
          <h3 className={styles.title}>BIT_STATUS</h3>
        </div>
      </header>

      <div className={styles.toolbar}>
        <button
          type="button"
          onClick={() => dispatch(clearInboundWsMessages())}
          disabled={entries.length === 0}
          className={styles.clearButton}
        >
          <FiTrash2 size={14} />
          נקה הכל
        </button>
      </div>

      <div className={styles.logWrap}>
        <pre className={styles.logPre}>{rawJson}</pre>
        <button type="button" title="העתק" className={styles.copyButton} onClick={handleCopy}>
          <FiCopy size={12} />
        </button>
      </div>
    </div>
  );
}
