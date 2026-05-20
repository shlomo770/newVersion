import { memo } from 'react';
import { FaBars } from 'react-icons/fa';
import styles from './StatusBar.module.css';

export interface StatusBarMenuButtonProps {
  onMenuClick: () => void;
}

function StatusBarMenuButton({ onMenuClick }: StatusBarMenuButtonProps) {
  return (
    <div className={styles.sectionStart}>
      <button type="button" className={styles.menuButton} onClick={onMenuClick} aria-label="תפריט">
        <FaBars size={30} />
      </button>
    </div>
  );
}

export default memo(StatusBarMenuButton);
