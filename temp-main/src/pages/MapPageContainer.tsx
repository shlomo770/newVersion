import {

  FC,

  memo,

  useState,

  useCallback,

  type Dispatch,

  type SetStateAction,

} from 'react';

import type { Map as MaplibreMap } from 'maplibre-gl';

import type { PanelType } from '@/types';

import { MapContainer as MapViewport, useMapContextMenu, type MapContainerProps as MapViewportProps } from '@features/map';

import { useTargetCommands } from '@features/targets';

import { ConfirmPromptInsLocation } from '@features/confirm';

import { ToastHost } from '@features/faults';

import { shouldKeepSidebarOpenOnMapClick } from '@features/sidebar';



export interface MapPageContainerProps extends Omit<MapViewportProps, 'layerOverlay' | 'topChrome' | 'openSider' | 'setClickedCoords'> {

  onHamburgerClick: () => void;

  onAbortTarget: (targetId: string) => void;

  handleTargetInfo: (targetId: string, identity: boolean) => void;

  setIsMeasuring: Dispatch<SetStateAction<boolean>>;

  isSidebarOpen: boolean;

  activeSidebarPanel: PanelType;

  onCloseSidebar: () => void;

}



const MapPageContainer: FC<MapPageContainerProps> = memo((props) => {

  const { allocateTarget } = useTargetCommands();

  const [readyMap, setReadyMap] = useState<MaplibreMap | null>(null);



  const handleAbortAction = useCallback(

    (targetId: string) => {

      props.onAbortTarget(targetId);

    },

    [props.onAbortTarget],

  );



  const handleMapClick = useCallback(() => {

    if (!props.isSidebarOpen) return;

    if (shouldKeepSidebarOpenOnMapClick(props.activeSidebarPanel)) return;

    props.onCloseSidebar();

  }, [props.isSidebarOpen, props.activeSidebarPanel, props.onCloseSidebar]);



  const { contextMenuHost } = useMapContextMenu(readyMap, {

    onAllocateTarget: allocateTarget,

    onSetTargetIdentity: props.handleTargetInfo,

    mapServiceRef: props.mapServiceRef,

    onMapClick: handleMapClick,

  });



  return (

    <>

      {contextMenuHost}



      <MapViewport

        onMapReady={setReadyMap}

        isMeasuring={props.isMeasuring}

        measurementMode={props.measurementMode}

        measurePoints={props.measurePoints}

        setMeasurePoints={props.setMeasurePoints}

        focusEntityRef={props.focusEntityRef}

        mapServiceRef={props.mapServiceRef}

        mapFacadeRef={props.mapFacadeRef}

        onAbortTarget={handleAbortAction}

        openSider={props.isSidebarOpen}

        topChrome={

          <>

            <ConfirmPromptInsLocation />

            <ToastHost />

          </>

        }

      />

    </>

  );

});



MapPageContainer.displayName = 'MapPageContainer';



export default MapPageContainer;

