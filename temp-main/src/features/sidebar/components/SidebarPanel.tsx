import type { ReactNode } from 'react';
import { GiRadarSweep } from 'react-icons/gi';
import { IoWarningOutline } from 'react-icons/io5';
import { FiNavigation, FiTerminal } from 'react-icons/fi';
import type { PanelType } from '@/types';
import styles from './SidebarPanel.module.css';

export interface SidebarPanelProps {
  activePanel: PanelType;
  onPanelSelect: (panelType: PanelType) => void;
}

interface SidebarItem {
  key: PanelType;
  icon: ReactNode;
  label: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { key: 'radar', icon: <GiRadarSweep size={24} />, label: 'Radar' },
  { key: 'failures', icon: <IoWarningOutline size={24} />, label: 'Failures' },
  { key: 'location', icon: <FiNavigation size={24} />, label: 'Location' },
  { key: 'serverMessages', icon: <FiTerminal size={24} />, label: 'BIT' },
];

export default function SidebarPanel({ activePanel, onPanelSelect }: SidebarPanelProps) {
  return (
    <div className={styles.rail}>
      {SIDEBAR_ITEMS.map((item) => {
        const isActive = activePanel === item.key;
        return (
          <button
            key={String(item.key)}
            type="button"
            onClick={() => onPanelSelect(item.key)}
            className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
          >
            <div className={styles.iconWrap}>{item.icon}</div>
            <span className={styles.label}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
