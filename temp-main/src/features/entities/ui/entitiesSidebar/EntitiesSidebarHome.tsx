import { FC } from 'react';
import { ENTITIES_SIDEBAR_ICONS } from '@/config';
import { he } from '@shared/i18n';
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
  <div className={styles.homeSection}>
    <p className={styles.homeEyebrow}>{he.entities.sidebar.navigation}</p>
    <div className={styles.navList}>
      <button type="button" onClick={onOpenMissions} className={styles.navCard}>
        <span className={styles.navCardIconWrap}>
          <img src={ENTITIES_SIDEBAR_ICONS.missions} alt="" className={styles.navCardIcon} />
        </span>
        <span className={styles.navCardTitle}>{he.entities.sidebar.homeMissions}</span>
      </button>
      <button type="button" onClick={onOpenAreas} className={styles.navCard}>
        <span className={styles.navCardIconWrap}>
          <img src={ENTITIES_SIDEBAR_ICONS.areas} alt="" className={styles.navCardIcon} />
        </span>
        <span className={styles.navCardTitle}>{he.entities.sidebar.homeAreas}</span>
      </button>
      <button type="button" onClick={onOpenPoints} className={styles.navCard}>
        <span className={styles.navCardIconWrap}>
          <img src={ENTITIES_SIDEBAR_ICONS.points} alt="" className={styles.navCardIcon} />
        </span>
        <span className={styles.navCardTitle}>{he.entities.sidebar.homePoints}</span>
      </button>    </div>
  </div>
);

export default EntitiesSidebarHome;
