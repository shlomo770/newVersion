import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setBrightness, setZoom } from '@features/map/store/mapSlice';
import { toggleTargetPanelVisible } from '@features/map/store/filterSlice';
import { FlyoutMenu } from '@shared/components';
import { he } from '@shared/i18n';
import TargetFilterMenu from './TargetFilterMenu';
import MeasureToolMenu from './MeasureToolMenu';
import MapControlsBrightnessFlyout from './MapControlsBrightnessFlyout';
import MapControlsMainMenu from './MapControlsMainMenu';
import type { MapFacade } from '@features/map/services/MapFacade';
import { MAP_TOOLBAR_FLYOUT } from '@features/map/config';
import { MAP_TOOL_ICONS } from '@/config';
import styles from './MapControls.module.css';

/** Zoom level applied by the "Zoom 1:1" reset button. */
const ZOOM_RESET_LEVEL = 10;

interface MapControlsProps {
  mapFacadeRef?: React.MutableRefObject<MapFacade | null>;
}

/**
 * MapControls — floating round launcher button at top-left of the map
 * that opens the main map tools flyout.
 *
 * Architecture:
 *  - Main flyout: one-shot actions (zoom 1:1, brightness, ruler, basemap
 *    selector) PLUS two stateful buttons that the user must be able to
 *    identify separately:
 *      • "Filter" button  → opens a sub-flyout (`TargetFilterMenu`) that
 *        controls visibility of target *map elements* (trails, labels).
 *      • "Panel" button   → toggles the right-side target cards panel.
 *        This is a separate concern (UI panel vs map elements) so it is
 *        deliberately NOT inside the filter sub-flyout.
 *  - Brightness slider sub-flyout — same pattern as the filter.
 *
 * Tunable flyout offsets live in `@features/map/config/mapTools.config.ts`;
 * brightness slider range in `@features/map/config/mapDefaults.config.ts`;
 * toolbar icon paths in `@/config/appIcons.config.ts`.
 */
const MapControls: React.FC<MapControlsProps> = ({ mapFacadeRef }) => {
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenBrightness, setIsOpenBrightness] = useState(false);
  const [isOpenFilter, setIsOpenFilter] = useState(false);
  const [isOpenMeasure, setIsOpenMeasure] = useState(false);
  const [isMapSelectorOpen, setIsMapSelectorOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const brightness = useAppSelector((state) => state.map.brightness);
  const drawingMode = useAppSelector((state) => state.mapInteraction.drawingMode);
  // Defensive against an older slice shape that may still be in the running
  // Redux store across HMR — `targetVisibility` could be undefined.
  const panelVisible = useAppSelector(
    (state) => state.filter.targetVisibility?.panel ?? true,
  );
  const isMeasuring =
    drawingMode === 'measure' || drawingMode === 'measure-area';

  // Closing the main flyout MUST always close every sub-flyout — otherwise
  // a stale sub-popup can float on the map alone.
  const closeAllFlyouts = useCallback(() => {
    setIsOpen(false);
    setIsOpenBrightness(false);
    setIsOpenFilter(false);
    setIsOpenMeasure(false);
    setIsMapSelectorOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsOpenBrightness(false);
      setIsOpenFilter(false);
      setIsOpenMeasure(false);
      setIsMapSelectorOpen(false);
    }
  }, [isOpen]);

  const handleZoomReset = () => {
    dispatch(setZoom(ZOOM_RESET_LEVEL));
    mapFacadeRef?.current?.setZoom(ZOOM_RESET_LEVEL);
    closeAllFlyouts();
  };

  const handleBrightnessChange = (value: number) => {
    dispatch(setBrightness(value));
  };

  return (
    <>
      <div
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={styles.launcher}
        title={he.mapTools.launcherTitle}
        role="button"
        tabIndex={0}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') setIsOpen(!isOpen);
        }}
      >
        <img src={MAP_TOOL_ICONS.launcher} alt="" className={styles.launcherIcon} />
      </div>

      <MapControlsBrightnessFlyout
        anchorRef={buttonRef}
        isOpen={isOpenBrightness}
        onClose={() => setIsOpenBrightness(false)}
        brightness={brightness}
        onBrightnessChange={handleBrightnessChange}
      />

      <FlyoutMenu
        anchorRef={buttonRef}
        isOpen={isOpenFilter}
        placement="bottom"
        align={MAP_TOOLBAR_FLYOUT.align}
        onClose={() => setIsOpenFilter(false)}
      >
        <TargetFilterMenu />
      </FlyoutMenu>

      <FlyoutMenu
        anchorRef={buttonRef}
        isOpen={isOpenMeasure}
        placement="bottom"
        align={MAP_TOOLBAR_FLYOUT.align}
        onClose={() => setIsOpenMeasure(false)}
      >
        <MeasureToolMenu onClose={() => setIsOpenMeasure(false)} />
      </FlyoutMenu>

      <FlyoutMenu
        anchorRef={buttonRef}
        isOpen={isOpen}
        placement="bottom"
        align={MAP_TOOLBAR_FLYOUT.align}
        onClose={() => {
          if (isOpenBrightness || isMapSelectorOpen || isOpenFilter || isOpenMeasure) return;
          setIsOpen(false);
        }}
      >
        <MapControlsMainMenu
          isOpenFilter={isOpenFilter}
          isOpenMeasure={isOpenMeasure}
          isMeasuring={isMeasuring}
          panelVisible={panelVisible}
          isMapSelectorOpen={isMapSelectorOpen}
          onZoomReset={handleZoomReset}
          onBrightnessToggle={() => setIsOpenBrightness((open) => !open)}
          onMeasureToggle={() => setIsOpenMeasure((open) => !open)}
          onFilterToggle={() => setIsOpenFilter((open) => !open)}
          onToggleTargetsPanel={() => dispatch(toggleTargetPanelVisible())}
          onMapTypeToggle={() => setIsMapSelectorOpen((open) => !open)}
          onMapSelectorClose={() => setIsMapSelectorOpen(false)}
        />
      </FlyoutMenu>
    </>
  );
};

export default MapControls;
