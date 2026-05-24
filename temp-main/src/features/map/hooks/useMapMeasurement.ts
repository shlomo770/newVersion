import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import {
  calculateCenter,
  calculateDistance,
  calculatePolygonArea,
  formatArea,
  formatDistance,
  type Coordinates,
} from '@shared/lib/geo';
import { attachUnifiedMapClick, detachUnifiedMapClick, attachUnifiedMapMove, detachUnifiedMapMove } from '@/utils/mapEvents';
import type { MapFacade } from '../services/MapFacade';

type MeasurementMode = 'measure' | 'measure-area' | null;

type UseMapMeasurementParams = {
  mapFacadeRef: MutableRefObject<MapFacade | null>;
  measurementMode: MeasurementMode;
  measurePoints: Coordinates[];
  setMeasurePoints: Dispatch<SetStateAction<Coordinates[]>>;
};

interface MapClickEvent {
  lngLat: { lng: number; lat: number };
}

interface MapMoveEvent {
  lngLat: { lng: number; lat: number };
}

function clearMeasurementLayers(facade: MapFacade | null): void {
  facade?.clearMeasurement();
  facade?.clearAreaMeasurement();
  facade?.clearMeasurementPreview();
  facade?.clearAreaMeasurementPreview();
}

export function useMapMeasurement({
  mapFacadeRef,
  measurementMode,
  measurePoints,
  setMeasurePoints,
}: UseMapMeasurementParams) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const prevModeRef = useRef<MeasurementMode>(null);

  const resetSession = useCallback(() => {
    clearMeasurementLayers(mapFacadeRef.current);
    setMeasurePoints([]);
    setTooltip(null);
    setIsLocked(false);
  }, [mapFacadeRef, setMeasurePoints]);

  const measurementUiState = useMemo(() => {
    if (!measurementMode || isLocked) return null;
    if (measurementMode === 'measure' && measurePoints.length >= 2) {
      const anchor = measurePoints[measurePoints.length - 1];
      return { mode: 'measure' as const, anchor, canFinish: false };
    }
    if (measurementMode === 'measure-area' && measurePoints.length >= 3) {
      const anchor = measurePoints[measurePoints.length - 1];
      return { mode: 'measure-area' as const, anchor, canFinish: true };
    }
    const anchor = measurePoints[measurePoints.length - 1] ?? measurePoints[0] ?? { lng: 0, lat: 0 };
    return { mode: measurementMode, anchor, canFinish: false };
  }, [measurementMode, measurePoints, isLocked]);

  useEffect(() => {
    if (!measurementMode) {
      resetSession();
      prevModeRef.current = null;
      return;
    }

    if (prevModeRef.current !== measurementMode) {
      resetSession();
    }

    prevModeRef.current = measurementMode;
  }, [measurementMode, resetSession]);

  useEffect(() => {
    if (measurementMode === 'measure' && measurePoints.length >= 2) {
      setIsLocked(true);
    }
  }, [measurementMode, measurePoints.length]);

  useEffect(() => {
    if (!measurementMode || !mapFacadeRef.current) return;

    if (measurementMode === 'measure') {
      mapFacadeRef.current.renderMeasurement(measurePoints);
      mapFacadeRef.current.clearAreaMeasurement();
      return;
    }

    mapFacadeRef.current.renderAreaMeasurement(measurePoints);
    mapFacadeRef.current.clearMeasurement();
  }, [mapFacadeRef, measurePoints, measurementMode]);

  useEffect(() => {
    if (!measurementMode || !mapFacadeRef.current || isLocked) return;
    const map = mapFacadeRef.current.getMap();
    if (!map) return;

    const handleClick = (e: MapClickEvent) => {
      const point = { lng: e.lngLat.lng, lat: e.lngLat.lat };
      if (measurementMode === 'measure') {
        if (measurePoints.length < 2) {
          setMeasurePoints((prev) => [...prev, point]);
        }
        return;
      }
      setMeasurePoints((prev) => [...prev, point]);
    };

    const wrappedClickHandler = attachUnifiedMapClick(map, handleClick);
    return () => {
      detachUnifiedMapClick(map, wrappedClickHandler);
    };
  }, [measurementMode, measurePoints, setMeasurePoints, mapFacadeRef, isLocked]);

  useEffect(() => {
    if (!measurementMode || !mapFacadeRef.current) return;
    const map = mapFacadeRef.current.getMap();
    if (!map) return;

    const updateTooltipFromPoints = (points: Coordinates[]) => {
      if (measurementMode === 'measure' && points.length >= 2) {
        const mid = {
          lng: (points[0].lng + points[1].lng) / 2,
          lat: (points[0].lat + points[1].lat) / 2,
        };
        const pixel = map.project([mid.lng, mid.lat]);
        const dist = calculateDistance(points[0], points[1]);
        setTooltip({ x: pixel.x, y: pixel.y, text: formatDistance(dist) });
        return;
      }

      if (measurementMode === 'measure-area' && points.length >= 3) {
        const center = calculateCenter(points);
        const pixel = map.project([center.lng, center.lat]);
        const area = calculatePolygonArea(points);
        setTooltip({ x: pixel.x, y: pixel.y, text: formatArea(area) });
      }
    };

    if (isLocked) {
      updateTooltipFromPoints(measurePoints);
      const handleMapChange = () => updateTooltipFromPoints(measurePoints);
      map.on('move', handleMapChange);
      map.on('zoom', handleMapChange);
      map.on('rotate', handleMapChange);
      return () => {
        map.off('move', handleMapChange);
        map.off('zoom', handleMapChange);
        map.off('rotate', handleMapChange);
      };
    }

    if (measurementMode === 'measure') {
      if (measurePoints.length === 1) {
        const handleMove = (e: MapMoveEvent) => {
          const mid = {
            lng: (measurePoints[0].lng + e.lngLat.lng) / 2,
            lat: (measurePoints[0].lat + e.lngLat.lat) / 2,
          };
          const pixel = map.project([mid.lng, mid.lat]);
          const dist = calculateDistance(measurePoints[0], {
            lng: e.lngLat.lng,
            lat: e.lngLat.lat,
          });
          setTooltip({ x: pixel.x, y: pixel.y, text: formatDistance(dist) });
          mapFacadeRef.current?.renderMeasurementPreview(measurePoints[0], {
            lng: e.lngLat.lng,
            lat: e.lngLat.lat,
          });
        };
        const moveHandler = attachUnifiedMapMove(map, handleMove);
        return () => {
          detachUnifiedMapMove(map, moveHandler);
          mapFacadeRef.current?.clearMeasurementPreview();
          setTooltip(null);
        };
      }

      if (measurePoints.length === 0) {
        setTooltip(null);
        mapFacadeRef.current?.clearMeasurementPreview();
      }
      return;
    }

    if (measurementMode === 'measure-area') {
      if (measurePoints.length >= 2) {
        const handleMove = (e: MapMoveEvent) => {
          const previewPoints = [...measurePoints, { lng: e.lngLat.lng, lat: e.lngLat.lat }];
          const area = calculatePolygonArea(previewPoints);
          const center = calculateCenter(previewPoints);
          const pixel = map.project([center.lng, center.lat]);
          if (previewPoints.length >= 3) {
            setTooltip({ x: pixel.x, y: pixel.y, text: formatArea(area) });
          }
          mapFacadeRef.current?.renderAreaMeasurementPreview(measurePoints, {
            lng: e.lngLat.lng,
            lat: e.lngLat.lat,
          });
        };
        const moveHandler = attachUnifiedMapMove(map, handleMove);
        return () => {
          detachUnifiedMapMove(map, moveHandler);
          mapFacadeRef.current?.clearAreaMeasurementPreview();
        };
      }

      setTooltip(null);
      mapFacadeRef.current?.clearAreaMeasurementPreview();
    }
  }, [measurementMode, measurePoints, mapFacadeRef, isLocked]);

  const finishMeasurement = useCallback(() => {
    if (!measurementMode || measurementMode !== 'measure-area') return;
    if (measurePoints.length < 3) return;
    mapFacadeRef.current?.clearAreaMeasurementPreview();
    mapFacadeRef.current?.clearMeasurementPreview();
    setIsLocked(true);
  }, [measurementMode, measurePoints.length, mapFacadeRef]);

  return { tooltip, measurementUiState, finishMeasurement };
}
