import {
  FC,
  memo,
  useRef,
  useState,
  useMemo,
  useEffect,
  type Dispatch,
  type MutableRefObject,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import { EntitiesManager } from '@features/entities';
import type { TacticalEntity } from '@domain/models/entity';
import { MapService } from '@/services/map/MapService';
import { MapFacade } from '../services/MapFacade';
import {
  useMapViewport,
  useMapMeasurement,
  useMapBearing,
  useOverlayScreenPosition,
  useMapCoordinateClick,
} from '../hooks';
import MapControls from '../components/tools/MapControls';
import CompassNeedle from '../components/tools/CompassNeedle';
import MapDimmerAuto from '../components/tools/MapDimmerAuto';
import VideoWinButton from '../components/tools/VideoWinButton';
import VideoPlayer from '../components/tools/VideoWindow';
import EntitiesButton from '@features/entities/ui/EntitiesButton';
import MapOverlayAnchors from './MapOverlayAnchors';
import { useMapLayers } from '../hooks/useMapLayers';
import styles from './MapContainer.module.css';

export interface MapContainerProps {
  isMeasuring: boolean;
  measurementMode: 'measure' | 'measure-area' | null;
  measurePoints: { lng: number; lat: number }[];
  setMeasurePoints: Dispatch<SetStateAction<{ lng: number; lat: number }[]>>;
  focusEntityRef?: MutableRefObject<((entity: TacticalEntity) => void) | undefined>;
  /** @deprecated Click coordinates are stored in Redux (`myPosition.clickCord`). */
  setClickedCoords?: Dispatch<SetStateAction<{ lat: number; lng: number } | null>>;
  /** Legacy session ref — synced to facade.underlying MapService. */
  mapServiceRef?: MutableRefObject<MapService | null>;
  /** Optional facade ref for advanced callers. */
  mapFacadeRef?: MutableRefObject<MapFacade | null>;
  /** Override default tactical layers (targets, LOS, taboo, radar). */
  layerOverlay?: ReactNode | ((map: MaplibreMap) => ReactNode);
  /** Required for built-in tactical layer stack when layerOverlay is omitted. */
  onAbortTarget?: (targetId: string) => void;
  /** Status bar and other top chrome rendered by the page shell. */
  topChrome?: ReactNode;
  openSider?: boolean;
  onMapReady?: (map: MaplibreMap) => void;
}

const MapContainer: FC<MapContainerProps> = memo((props) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const internalFacadeRef = useRef<MapFacade | null>(null);
  const mapFacadeRef = props.mapFacadeRef ?? internalFacadeRef;

  const {
    mapFacade,
    mapInstance,
    mapReady,
    drawUiState,
    brightness,
    drawingMode,
  } = useMapViewport({
    mapContainerRef,
    externalFacadeRef: mapFacadeRef,
    mapServiceRef: props.mapServiceRef,
  });

  const { tooltip, measurementUiState, finishMeasurement } = useMapMeasurement({
    mapFacadeRef,
    measurementMode: props.measurementMode,
    measurePoints: props.measurePoints,
    setMeasurePoints: props.setMeasurePoints,
  });

  const drawUiPos = useOverlayScreenPosition(mapFacade, drawUiState?.anchor);
  const measureUiPos = useOverlayScreenPosition(mapFacade, measurementUiState?.anchor);
  const bearing = useMapBearing(mapFacade, mapReady);

  useMapCoordinateClick({
    mapFacade,
    drawingMode,
    isMeasuring: props.isMeasuring,
  });

  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [entitiesOpen, setEntitiesOpen] = useState(false);
  const openSider = props.openSider ?? false;

  useEffect(() => {
    if (openSider && entitiesOpen) setEntitiesOpen(false);
  }, [openSider, entitiesOpen]);

  useEffect(() => {
    if (!props.focusEntityRef) return;
    props.focusEntityRef.current = (entity: TacticalEntity) => {
      mapFacadeRef.current?.focusOnEntity(entity);
    };
    return () => {
      if (props.focusEntityRef) props.focusEntityRef.current = undefined;
    };
  }, [props.focusEntityRef, mapFacadeRef]);

  const handleFinishMeasure = () => {
    finishMeasurement();
  };

  const mapObject = useMemo(() => mapInstance, [mapInstance]);

  const defaultTacticalLayers = useMapLayers(
    mapObject,
    props.onAbortTarget ? { onAbortTarget: props.onAbortTarget } : { onAbortTarget: () => {} },
  );

  const resolvedLayerOverlay =
    props.layerOverlay !== undefined
      ? props.layerOverlay
      : props.onAbortTarget
        ? defaultTacticalLayers
        : null;

  useEffect(() => {
    if (mapObject && props.onMapReady) {
      props.onMapReady(mapObject);
    }
  }, [mapObject, props.onMapReady]);

  return (
    <div className={styles.root}>
      <div ref={mapContainerRef} className={styles.canvas} data-map-canvas="true" />

      <MapOverlayAnchors
        drawUiPos={drawUiPos}
        drawCanFinish={Boolean(drawUiState?.canFinish)}
        onFinishDraw={() => mapFacadeRef.current?.finishEdit()}
        measureUiPos={measureUiPos}
        measureCanFinish={
          Boolean(
            measurementUiState &&
              measurementUiState.mode === 'measure-area' &&
              measurementUiState.canFinish,
          )
        }
        onFinishMeasure={handleFinishMeasure}
        tooltip={tooltip}
      />

      {mapObject && resolvedLayerOverlay ? (
        <div className={styles.layerSlot} data-layer-slot="tactical">
          {typeof resolvedLayerOverlay === 'function'
            ? resolvedLayerOverlay(mapObject)
            : resolvedLayerOverlay}
        </div>
      ) : null}

      {mapObject && mapFacade ? (
        <>
          <MapDimmerAuto map={mapObject} opacity={brightness} />
          <CompassNeedle bearing={bearing} />
        </>
      ) : null}

      {mapObject && !openSider ? (
        <EntitiesManager
          map={mapObject}
          mapServiceRef={props.mapServiceRef}
          isSidebarOpen={entitiesOpen}
          onSidebarOpenChange={setEntitiesOpen}
          hideOwnButton
        />
      ) : null}

      {!openSider ? (
        <div className={styles.mapActionDock} role="toolbar" aria-label="Map actions">
          <EntitiesButton onToggleSidebar={() => setEntitiesOpen((open) => !open)} />
          <MapControls mapFacadeRef={mapFacadeRef} />
          <VideoWinButton onOpen={() => setIsVideoOpen((v) => !v)} />
        </div>
      ) : null}

      <VideoPlayer isOpen={isVideoOpen} />

      {props.topChrome}

      <span
        hidden
        data-map-ready={mapReady ? 'true' : 'false'}
        data-map-bearing={bearing}
      />
    </div>
  );
});

MapContainer.displayName = 'MapContainer';

export default MapContainer;
