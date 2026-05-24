import { he } from '@shared/i18n';
import type { FC, ReactNode } from 'react';
import { IoClose } from 'react-icons/io5';
import { RadarForm, LocationForm } from '@features/platform';
import { FaultsList } from '@features/faults';
import type { PanelType } from '@/types';
import { cn } from '@shared/ui';
import styles from './SidebarForm.module.css';

export interface SidebarFormProps {
  type: PanelType;
  onClose: () => void;
}

const SidebarForm: FC<SidebarFormProps> = ({ type, onClose }) => {
  const getFormComponent = (): ReactNode => {
    switch (type) {
      case 'radar':
        return <RadarForm />;
      case 'failures':
        return <FaultsList />;
      case 'location':
        return <LocationForm />;
      default:
        return <div className={styles.unknownPanel}>{he.errors.unknownPanel}</div>;
    }
  };

  return (
    <div className={cn('jbk-sidebar-panel', styles.shell)}>
      <button type="button" onClick={onClose} className={styles.closeButton} aria-label="Close panel">
        <IoClose size={24} />
      </button>
      <div className={styles.scrollBody}>{getFormComponent()}</div>
    </div>
  );
};

export default SidebarForm;
