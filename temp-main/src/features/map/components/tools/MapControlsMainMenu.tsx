import type { FC } from 'react';
import {
  TbZoomPan,
  TbMapStar,
  TbAdjustmentsHorizontal,
  TbLayoutSidebarRightCollapse,
} from 'react-icons/tb';
import { he } from '@shared/i18n';
import { MAP_TOOL_ICONS } from '@/config';
import BaseMapSelector from '../BaseMapSelector';
import styles from './MapControls.module.css';

/** Common Tabler icon size used inside the toolbar flyout. */
const TOOLBAR_ICON_SIZE_PX = 25;

interface MapControlsMainMenuProps {
  isOpenFilter: boolean;
  isOpenMeasure: boolean;
  isMeasuring: boolean;
  panelVisible: boolean;
  isMapSelectorOpen: boolean;
  onZoomReset: () => void;
  onBrightnessToggle: () => void;
  onMeasureToggle: () => void;
  onFilterToggle: () => void;
  onToggleTargetsPanel: () => void;
  onMapTypeToggle: () => void;
  onMapSelectorClose: () => void;
}

const MapControlsMainMenu: FC<MapControlsMainMenuProps> = ({
  isOpenFilter,
  isOpenMeasure,
  isMeasuring,
  panelVisible,
  isMapSelectorOpen,
  onZoomReset,
  onBrightnessToggle,
  onMeasureToggle,
  onFilterToggle,
  onToggleTargetsPanel,
  onMapTypeToggle,
  onMapSelectorClose,
}) => (
  <div className={styles.menuPanel} onClick={(e) => e.stopPropagation()}>
    <div className={styles.menuRow}>
      <button
        type="button"
        className={styles.menuItem}
        onClick={(e) => {
          e.stopPropagation();
          onZoomReset();
        }}
        title={he.mapTools.zoomReset}
      >
        <TbZoomPan size={TOOLBAR_ICON_SIZE_PX} className={styles.menuItemIconWhite} />
        <span className={styles.menuItemLabel}>{he.mapTools.zoomReset}</span>
      </button>

      <button
        type="button"
        className={styles.menuItem}
        onClick={(e) => {
          e.stopPropagation();
          onBrightnessToggle();
        }}
        title={he.mapTools.brightness}
      >
        <img src={MAP_TOOL_ICONS.brightness} alt="" className={styles.menuItemIcon} />
        <span className={styles.menuItemLabel}>{he.mapTools.brightness}</span>
      </button>

      <button
        type="button"
        className={`${styles.menuItem} ${isMeasuring || isOpenMeasure ? styles.menuItemActive : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onMeasureToggle();
        }}
        title={he.mapTools.measureMenuTitle}
        aria-haspopup="menu"
        aria-expanded={isOpenMeasure}
      >
        <img src={MAP_TOOL_ICONS.ruler} alt="" className={styles.menuItemIcon} />
        <span className={styles.menuItemLabel}>{he.mapTools.measure}</span>
        {isMeasuring ? <div className={styles.activeDot} /> : null}
      </button>

      <button
        type="button"
        className={`${styles.menuItem} ${isOpenFilter ? styles.menuItemActive : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onFilterToggle();
        }}
        title={he.mapTools.targetFilterMenuTitle}
        aria-haspopup="menu"
        aria-expanded={isOpenFilter}
      >
        <TbAdjustmentsHorizontal
          size={TOOLBAR_ICON_SIZE_PX}
          className={styles.menuItemIconWhite}
        />
        <span className={styles.menuItemLabel}>{he.mapTools.filter}</span>
      </button>

      <button
        type="button"
        className={`${styles.menuItem} ${panelVisible ? styles.menuItemActive : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleTargetsPanel();
        }}
        title={he.mapTools.panel}
        aria-pressed={panelVisible}
      >
        <TbLayoutSidebarRightCollapse
          size={TOOLBAR_ICON_SIZE_PX}
          className={styles.menuItemIconWhite}
        />
        <span className={styles.menuItemLabel}>{he.mapTools.panel}</span>
        {panelVisible ? <div className={styles.activeDot} /> : null}
      </button>

      <div className={`${styles.menuItem} ${styles.mapSelectorWrap}`}>
        <button
          type="button"
          className={styles.menuItem}
          onClick={(e) => {
            e.stopPropagation();
            onMapTypeToggle();
          }}
          title={he.mapTools.basemap}
        >
          <TbMapStar size={TOOLBAR_ICON_SIZE_PX} className={styles.menuItemIconWhite} />
          <span className={styles.menuItemLabel}>{he.mapTools.basemap}</span>
        </button>
        {isMapSelectorOpen ? (
          <div className={styles.mapSelectorDropdown}>
            <BaseMapSelector isOpen={isMapSelectorOpen} onToggle={onMapSelectorClose} />
          </div>
        ) : null}
      </div>
    </div>
  </div>
);

export default MapControlsMainMenu;
