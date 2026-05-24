import { FC } from 'react';
import { ENTITIES_SIDEBAR_ICONS } from '@/config';
import styles from './EntitiesSidebar.shared.module.css';

export type EntitiesSidebarHomeProps = {
  onOpenMissions: () => void;
  onOpenAreas: () => void;
  onOpenPoints: () => void;
};

const EntitiesSidebarHome: FC<EntitiesSidebarHomeProps> = ({
  onOpenMissions,
  onOpenAreas,
  onOpenPoints,
}) => (
  <div className={styles.navList}>
    <button type="button" onClick={onOpenMissions} className={styles.navCard}>
      <img src={ENTITIES_SIDEBAR_ICONS.missions} alt="" className={styles.navCardIcon} />
      <div>
        <div className={styles.navCardTitle}>Missions</div>
        <div className={styles.navCardHint}>שמירה</div>
      </div>
    </button>
    <button type="button" onClick={onOpenAreas} className={styles.navCard}>
      <img src={ENTITIES_SIDEBAR_ICONS.areas} alt="" className={styles.navCardIcon} />
      <div>
        <div className={styles.navCardTitle}>Areas</div>
        <div className={styles.navCardHint}>אזורים וישויות</div>
      </div>
    </button>
    <button type="button" onClick={onOpenPoints} className={styles.navCard}>
      <img src={ENTITIES_SIDEBAR_ICONS.points} alt="" className={styles.navCardIcon} />
      <div>
        <div className={styles.navCardTitle}>Points</div>
        <div className={styles.navCardHint}>נקודות (markers)</div>
      </div>
    </button>
  </div>
);

export default EntitiesSidebarHome;
