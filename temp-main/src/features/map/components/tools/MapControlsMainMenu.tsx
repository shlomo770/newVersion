import type { FC, RefObject } from 'react';
import {
  TbZoomPan,
  TbMapStar,
  TbAdjustmentsHorizontal,
  TbLayoutSidebarRightCollapse,
} from 'react-icons/tb';
import { he } from '@shared/i18n';
import { MAP_TOOL_ICONS } from '@/config';
import styles from './MapControls.module.css';

const TOOLBAR_ICON_SIZE_PX = 25;

interface MapControlsMainMenuProps {
  isOpenBrightness: boolean;
  isOpenFilter: boolean;
  isOpenMeasure: boolean;
  isOpenBasemap: boolean;
  isMeasuring: boolean;
  panelVisible: boolean;
  brightnessButtonRef: RefObject<HTMLButtonElement>;
  filterButtonRef: RefObject<HTMLButtonElement>;
  measureButtonRef: RefObject<HTMLButtonElement>;
  basemapButtonRef: RefObject<HTMLButtonElement>;
  onZoomReset: () => void;
  onBrightnessToggle: () => void;
  onMeasureToggle: () => void;
  onFilterToggle: () => void;
  onToggleTargetsPanel: () => void;
  onBasemapToggle: () => void;
}

const MapControlsMainMenu: FC<MapControlsMainMenuProps> = ({
  isOpenBrightness,
  isOpenFilter,
  isOpenMeasure,
  isOpenBasemap,
  isMeasuring,
  panelVisible,
  brightnessButtonRef,
  filterButtonRef,
  measureButtonRef,
  basemapButtonRef,
  onZoomReset,
  onBrightnessToggle,
  onMeasureToggle,
  onFilterToggle,
  onToggleTargetsPanel,
  onBasemapToggle,
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
        ref={brightnessButtonRef}
        type="button"
        className={`${styles.menuItem} ${isOpenBrightness ? styles.menuItemActive : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onBrightnessToggle();
        }}
        title={he.mapTools.brightness}
        aria-haspopup="dialog"
        aria-expanded={isOpenBrightness}
      >
        <img src={MAP_TOOL_ICONS.brightness} alt="" className={styles.menuItemIcon} />
        <span className={styles.menuItemLabel}>{he.mapTools.brightness}</span>
      </button>

      <button
        ref={measureButtonRef}
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
        ref={filterButtonRef}
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

      <button
        ref={basemapButtonRef}
        type="button"
        className={`${styles.menuItem} ${isOpenBasemap ? styles.menuItemActive : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onBasemapToggle();
        }}
        title={he.mapTools.basemap}
        aria-haspopup="menu"
        aria-expanded={isOpenBasemap}
      >
        <TbMapStar size={TOOLBAR_ICON_SIZE_PX} className={styles.menuItemIconWhite} />
        <span className={styles.menuItemLabel}>{he.mapTools.basemap}</span>
      </button>
    </div>
  </div>
);

export default MapControlsMainMenu;
