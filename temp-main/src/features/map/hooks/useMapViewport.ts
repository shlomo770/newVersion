import { useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { mapTypes } from '@domain/models/map';
import { MapFacade } from '../services/MapFacade';
import type { MapDrawingUiState } from '../services/mapDrawingTypes';
import { useMapDrawing } from './useMapDrawing';
import { useMapEntities } from './useMapEntities';
import { selectDisplayedEntitiesOnMap } from '@features/entities';

type UseMapViewportParams = {
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  externalFacadeRef?: MutableRefObject<MapFacade | null>;
  mapServiceRef?: MutableRefObject<import('@/services/map/MapService').MapService | null>;
};

export function useMapViewport({
  mapContainerRef,
  externalFacadeRef,
  mapServiceRef,
}: UseMapViewportParams) {
  const internalFacadeRef = useRef<MapFacade | null>(null);
  const mapFacadeRef = externalFacadeRef ?? internalFacadeRef;

  const mapState = useAppSelector((state) => state.map);
  const settings = useAppSelector((state) => state.settings);
  const drawingMode = useAppSelector((state) => state.entities.drawingMode);
  const entitiesForMap = useAppSelector(selectDisplayedEntitiesOnMap);

  const selectedMapTypeObj = useMemo(
    () => mapTypes.find((mt) => mt.id === mapState.selectedMapType) || mapTypes[0],
    [mapState.selectedMapType],
  );

  const [drawUiState, setDrawUiState] = useState<MapDrawingUiState | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const { handleEntityDrawn } = useMapDrawing({ mapFacadeRef });
  const { handleEntityUpdated, handleEntityDeleted } = useMapEntities({
    mapFacadeRef,
    entitiesById: entitiesForMap,
  });

  useEffect(() => {
    if (!mapContainerRef.current || mapFacadeRef.current) return;

    const facade = new MapFacade();
    mapFacadeRef.current = facade;
    facade.initialize(
      mapContainerRef.current,
      handleEntityDrawn,
      handleEntityUpdated,
      handleEntityDeleted,
      mapState.selectedMapType,
      mapState.center,
      mapState.zoom,
    );
    facade.setDrawingUiListener(setDrawUiState);
    if (mapServiceRef) {
      mapServiceRef.current = facade.underlying;
    }

    const map = facade.getMap();
    if (map?.isStyleLoaded()) {
      setMapReady(true);
    } else if (map) {
      const onStyle = () => {
        setMapReady(true);
        map.off('styledata', onStyle);
      };
      map.on('styledata', onStyle);
    }

    return () => {
      facade.destroy();
      mapFacadeRef.current = null;
      if (mapServiceRef) {
        mapServiceRef.current = null;
      }
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    mapFacadeRef.current?.setDrawingCallbacks(
      handleEntityDrawn,
      handleEntityUpdated,
      handleEntityDeleted,
    );
  }, [handleEntityDrawn, handleEntityUpdated, handleEntityDeleted, mapFacadeRef]);

  useEffect(() => {
    mapFacadeRef.current?.setDrawingMode(drawingMode);
  }, [drawingMode, mapFacadeRef]);

  useEffect(() => {
    const facade = mapFacadeRef.current;
    if (!facade) return;
    const currentMapType = facade.getCurrentMapType();
    if (currentMapType !== selectedMapTypeObj.id) {
      facade.setMapType(selectedMapTypeObj.id);
    }
  }, [selectedMapTypeObj.id, mapFacadeRef]);

  useEffect(() => {
    mapFacadeRef.current?.updateEntityColors();
  }, [settings, mapFacadeRef]);

  const mapInstance = useMemo(() => {
    if (!mapReady || !mapFacadeRef.current) return null;
    return mapFacadeRef.current.getMap();
  }, [mapReady, mapFacadeRef]);

  return {
    mapFacadeRef,
    mapFacade: mapFacadeRef.current,
    mapInstance,
    mapReady,
    drawUiState,
    brightness: mapState.brightness,
    drawingMode,
    mapState,
  };
}
