import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useAppSelector } from '@/hooks/useAppSelector';

import { useAppDispatch } from '@/hooks/useAppDispatch';

import { setBrightness, setZoom } from '@features/map/store/mapSlice';

import { toggleTargetPanelVisible } from '@features/map/store/filterSlice';

import { FlyoutMenu } from '@shared/components';

import { he } from '@shared/i18n';

import TargetFilterMenu from './TargetFilterMenu';

import MeasureToolMenu from './MeasureToolMenu';

import BaseMapSelector from '../BaseMapSelector';

import MapControlsBrightnessFlyout from './MapControlsBrightnessFlyout';

import MapControlsMainMenu from './MapControlsMainMenu';

import type { MapFacade } from '@features/map/services/MapFacade';

import { MAP_TOOLBAR_FLYOUT } from '@features/map/config';

import { MAP_TOOL_ICONS } from '@/config';

import subMenuStyles from './mapToolSubMenu.module.css';

import styles from './MapControls.module.css';



/** Zoom level applied by the "Zoom 1:1" reset button. */

const ZOOM_RESET_LEVEL = 10;



interface MapControlsProps {

  mapFacadeRef?: React.MutableRefObject<MapFacade | null>;

}



const MapControls: React.FC<MapControlsProps> = ({ mapFacadeRef }) => {

  const dispatch = useAppDispatch();

  const [isOpen, setIsOpen] = useState(false);

  const [isOpenBrightness, setIsOpenBrightness] = useState(false);

  const [isOpenFilter, setIsOpenFilter] = useState(false);

  const [isOpenMeasure, setIsOpenMeasure] = useState(false);

  const [isOpenBasemap, setIsOpenBasemap] = useState(false);

  const buttonRef = useRef<HTMLDivElement>(null);

  const brightnessButtonRef = useRef<HTMLButtonElement>(null);

  const filterButtonRef = useRef<HTMLButtonElement>(null);

  const measureButtonRef = useRef<HTMLButtonElement>(null);

  const basemapButtonRef = useRef<HTMLButtonElement>(null);

  const brightness = useAppSelector((state) => state.map.brightness);

  const drawingMode = useAppSelector((state) => state.mapInteraction.drawingMode);

  const panelVisible = useAppSelector(

    (state) => state.filter.targetVisibility?.panel ?? true,

  );

  const isMeasuring =

    drawingMode === 'measure' || drawingMode === 'measure-area';



  const closeSubFlyouts = useCallback(() => {

    setIsOpenBrightness(false);

    setIsOpenFilter(false);

    setIsOpenMeasure(false);

    setIsOpenBasemap(false);

  }, []);



  const closeAllFlyouts = useCallback(() => {

    setIsOpen(false);

    closeSubFlyouts();

  }, [closeSubFlyouts]);



  useEffect(() => {

    if (!isOpen) {

      closeSubFlyouts();

    }

  }, [isOpen, closeSubFlyouts]);



  const handleZoomReset = () => {

    dispatch(setZoom(ZOOM_RESET_LEVEL));

    mapFacadeRef?.current?.setZoom(ZOOM_RESET_LEVEL);

    closeAllFlyouts();

  };



  const handleBrightnessChange = (value: number) => {

    dispatch(setBrightness(value));

  };



  const toggleBrightness = () => {
    setIsOpenFilter(false);
    setIsOpenMeasure(false);
    setIsOpenBasemap(false);
    setIsOpenBrightness((open) => !open);
  };



  const toggleFilter = () => {

    setIsOpenBrightness(false);

    setIsOpenMeasure(false);

    setIsOpenBasemap(false);

    setIsOpenFilter((open) => !open);

  };



  const toggleMeasure = () => {

    setIsOpenBrightness(false);

    setIsOpenFilter(false);

    setIsOpenBasemap(false);

    setIsOpenMeasure((open) => !open);

  };



  const toggleBasemap = () => {

    setIsOpenBrightness(false);

    setIsOpenFilter(false);

    setIsOpenMeasure(false);

    setIsOpenBasemap((open) => !open);

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

        anchorRef={brightnessButtonRef}

        isOpen={isOpenBrightness}

        onClose={() => setIsOpenBrightness(false)}

        brightness={brightness}

        onBrightnessChange={handleBrightnessChange}

      />



      <FlyoutMenu

        anchorRef={filterButtonRef}

        isOpen={isOpenFilter}

        placement="bottom"

        align="center"

        onClose={() => setIsOpenFilter(false)}

        className={subMenuStyles.compactFlyout}

      >

        <TargetFilterMenu />

      </FlyoutMenu>



      <FlyoutMenu

        anchorRef={measureButtonRef}

        isOpen={isOpenMeasure}

        placement="bottom"

        align="center"

        onClose={() => setIsOpenMeasure(false)}

        className={subMenuStyles.compactFlyout}

      >

        <MeasureToolMenu onClose={() => setIsOpenMeasure(false)} />

      </FlyoutMenu>



      <FlyoutMenu

        anchorRef={basemapButtonRef}

        isOpen={isOpenBasemap}

        placement="bottom"

        align="center"

        onClose={() => setIsOpenBasemap(false)}

        className={subMenuStyles.compactFlyout}

      >

        <BaseMapSelector onClose={() => setIsOpenBasemap(false)} />

      </FlyoutMenu>



      <FlyoutMenu

        anchorRef={buttonRef}

        isOpen={isOpen}

        placement="bottom"

        align={MAP_TOOLBAR_FLYOUT.align}

        onClose={() => {

          if (isOpenBrightness || isOpenBasemap || isOpenFilter || isOpenMeasure) return;

          setIsOpen(false);

        }}

      >

        <MapControlsMainMenu

          isOpenBrightness={isOpenBrightness}

          isOpenFilter={isOpenFilter}

          isOpenMeasure={isOpenMeasure}

          isOpenBasemap={isOpenBasemap}

          isMeasuring={isMeasuring}

          panelVisible={panelVisible}

          brightnessButtonRef={brightnessButtonRef}

          filterButtonRef={filterButtonRef}

          measureButtonRef={measureButtonRef}

          basemapButtonRef={basemapButtonRef}

          onZoomReset={handleZoomReset}

          onBrightnessToggle={toggleBrightness}

          onMeasureToggle={toggleMeasure}

          onFilterToggle={toggleFilter}

          onToggleTargetsPanel={() => dispatch(toggleTargetPanelVisible())}

          onBasemapToggle={toggleBasemap}

        />

      </FlyoutMenu>

    </>

  );

};



export default MapControls;

