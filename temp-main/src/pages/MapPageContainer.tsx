import {
  FC,
  memo,
  useState,
  useCallback,
  useEffect,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import { MapContainer as MapViewport, useMapContextMenu, type MapContainerProps as MapViewportProps } from '@features/map';
import { useTargetCommands } from '@features/targets';
import { ConfirmPromptInsLocation } from '@features/confirm';
import { ToastHost } from '@features/faults';

export interface MapPageContainerProps extends Omit<MapViewportProps, 'layerOverlay' | 'topChrome' | 'openSider' | 'setClickedCoords'> {
  onHamburgerClick: () => void;
  onAbortTarget: (targetId: string) => void;
  handleTargetInfo: (targetId: string, identity: boolean) => void;
  setIsMeasuring: Dispatch<SetStateAction<boolean>>;
  onRegisterMapSiderToggle?: (toggle: () => void) => void;
}

const MapPageContainer: FC<MapPageContainerProps> = memo((props) => {
  const { allocateTarget } = useTargetCommands();
  const [openSider, setOpenSider] = useState(false);
  const [readyMap, setReadyMap] = useState<MaplibreMap | null>(null);

  const toggleMapSider = useCallback(() => {
    setOpenSider((v) => !v);
  }, []);

  useEffect(() => {
    props.onRegisterMapSiderToggle?.(toggleMapSider);
  }, [props.onRegisterMapSiderToggle, toggleMapSider]);

  const handleAbortAction = useCallback(
    (targetId: string) => {
      props.onAbortTarget(targetId);
    },
    [props.onAbortTarget],
  );

  const { contextMenuHost } = useMapContextMenu(readyMap, {
    onAllocateTarget: allocateTarget,
    onSetTargetIdentity: props.handleTargetInfo,
    mapServiceRef: props.mapServiceRef,
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
        openSider={openSider}
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
