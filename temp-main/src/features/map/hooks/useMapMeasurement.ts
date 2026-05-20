import { useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import {
  calculateCenter,
  calculateDistance,
  calculatePolygonArea,
  formatArea,
  formatDistance,
  type Coordinates,
} from '@shared/lib/geo';
import { attachUnifiedMapClick, detachUnifiedMapClick } from '@/utils/mapEvents';
import type { MapFacade } from '../services/MapFacade';

type UseMapMeasurementParams = {
  mapFacadeRef: MutableRefObject<MapFacade | null>;
  measurementMode: 'measure' | 'measure-area' | null;
  measurePoints: Coordinates[];
  setMeasurePoints: Dispatch<SetStateAction<Coordinates[]>>;
};

interface MapClickEvent {
  lngLat: { lng: number; lat: number };
}

interface MapMoveEvent {
  lngLat: { lng: number; lat: number };
}

export function useMapMeasurement({
  mapFacadeRef,
  measurementMode,
  measurePoints,
  setMeasurePoints,
}: UseMapMeasurementParams) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [finishedMode, setFinishedMode] = useState<'measure' | 'measure-area' | null>(null);
  const [finishedPoints, setFinishedPoints] = useState<Coordinates[]>([]);
  const prevModeRef = useRef<'measure' | 'measure-area' | null>(null);

  const measurementUiState = useMemo(() => {
    if (!measurementMode || isFinished) return null;
    if (measurementMode === 'measure' && measurePoints.length >= 2) {
      const anchor = measurePoints[measurePoints.length - 1];
      return { mode: 'measure' as const, anchor, canFinish: true };
    }
    if (measurementMode === 'measure-area' && measurePoints.length >= 3) {
      const anchor = measurePoints[measurePoints.length - 1];
      return { mode: 'measure-area' as const, anchor, canFinish: true };
    }
    const anchor = measurePoints[0] ?? { lng: 0, lat: 0 };
    return { mode: measurementMode, anchor, canFinish: false };
  }, [measurementMode, measurePoints, isFinished]);

  useEffect(() => {
    const facade = mapFacadeRef.current;
    if (measurementMode && prevModeRef.current !== measurementMode) {
      setMeasurePoints([]);
      setIsFinished(false);
      setFinishedMode(null);
      setFinishedPoints([]);
      facade?.clearMeasurement();
      facade?.clearAreaMeasurement();
      setTooltip(null);
    }
    if (!measurementMode) {
      facade?.clearMeasurementPreview();
      facade?.clearAreaMeasurementPreview();
      if (!isFinished) setTooltip(null);
    }
    prevModeRef.current = measurementMode;
  }, [measurementMode, mapFacadeRef, setMeasurePoints, isFinished]);

  useEffect(() => {
    if (!measurementMode || !mapFacadeRef.current || isFinished) return;
    const map = mapFacadeRef.current.getMap();
    if (!map) return;

    const handleClick = (e: MapClickEvent) => {
      if (measurementMode === 'measure') {
        if (measurePoints.length < 2) {
          setMeasurePoints((prev) => [...prev, { lng: e.lngLat.lng, lat: e.lngLat.lat }]);
        }
        return;
      }
      if (measurementMode === 'measure-area') {
        setMeasurePoints((prev) => [...prev, { lng: e.lngLat.lng, lat: e.lngLat.lat }]);
      }
    };

    const wrappedClickHandler = attachUnifiedMapClick(map, handleClick);
    return () => {
      detachUnifiedMapClick(map, wrappedClickHandler);
    };
  }, [measurementMode, measurePoints, setMeasurePoints, mapFacadeRef, isFinished]);

  useEffect(() => {
    const facade = mapFacadeRef.current;
    if (!facade) return;
    if (measurementMode === 'measure') {
      facade.renderMeasurement(measurePoints);
      facade.clearAreaMeasurement();
      return;
    }
    if (measurementMode === 'measure-area') {
      facade.renderAreaMeasurement(measurePoints);
      facade.clearMeasurement();
    }
  }, [mapFacadeRef, measurePoints, measurementMode]);

  useEffect(() => {
    if (!measurementMode || !mapFacadeRef.current || isFinished) return;
    const map = mapFacadeRef.current.getMap();
    if (!map) return;

    if (measurementMode === 'measure') {
      if (measurePoints.length === 1) {
        const handleMove = (e: MapMoveEvent) => {
          const mid = {
            lng: (measurePoints[0].lng + e.lngLat.lng) / 2,
            lat: (measurePoints[0].lat + e.lngLat.lat) / 2,
          };
          const pixel = map.project([mid.lng, mid.lat]);
          const dist = calculateDistance(measurePoints[0], { lng: e.lngLat.lng, lat: e.lngLat.lat });
          setTooltip({ x: pixel.x, y: pixel.y, text: formatDistance(dist) });
          mapFacadeRef.current?.renderMeasurementPreview(measurePoints[0], {
            lng: e.lngLat.lng,
            lat: e.lngLat.lat,
          });
        };
        map.on('mousemove', handleMove);
        return () => {
          map.off('mousemove', handleMove);
          mapFacadeRef.current?.clearMeasurementPreview();
          setTooltip(null);
        };
      }
      if (measurePoints.length === 2) {
        const mid = {
          lng: (measurePoints[0].lng + measurePoints[1].lng) / 2,
          lat: (measurePoints[0].lat + measurePoints[1].lat) / 2,
        };
        const pixel = map.project([mid.lng, mid.lat]);
        const dist = calculateDistance(measurePoints[0], measurePoints[1]);
        setTooltip({ x: pixel.x, y: pixel.y, text: formatDistance(dist) });
        mapFacadeRef.current?.clearMeasurementPreview();
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
        map.on('mousemove', handleMove);
        return () => {
          map.off('mousemove', handleMove);
          mapFacadeRef.current?.clearAreaMeasurementPreview();
        };
      }
      if (measurePoints.length >= 3) {
        const center = calculateCenter(measurePoints);
        const pixel = map.project([center.lng, center.lat]);
        const area = calculatePolygonArea(measurePoints);
        setTooltip({ x: pixel.x, y: pixel.y, text: formatArea(area) });
        mapFacadeRef.current?.clearAreaMeasurementPreview();
        return;
      }
      setTooltip(null);
      mapFacadeRef.current?.clearAreaMeasurementPreview();
    }
  }, [measurementMode, measurePoints, mapFacadeRef, isFinished]);

  const finishMeasurement = () => {
    if (!measurementMode) return;
    setIsFinished(true);
    setFinishedMode(measurementMode);
    setFinishedPoints(measurePoints);
    mapFacadeRef.current?.clearMeasurementPreview();
    mapFacadeRef.current?.clearAreaMeasurementPreview();
  };

  useEffect(() => {
    if (!isFinished || !mapFacadeRef.current || !finishedMode) return;
    const map = mapFacadeRef.current.getMap();
    if (!map) return;

    const updateTooltip = () => {
      if (finishedMode === 'measure' && finishedPoints.length >= 2) {
        const mid = {
          lng: (finishedPoints[0].lng + finishedPoints[1].lng) / 2,
          lat: (finishedPoints[0].lat + finishedPoints[1].lat) / 2,
        };
        const pixel = map.project([mid.lng, mid.lat]);
        const dist = calculateDistance(finishedPoints[0], finishedPoints[1]);
        setTooltip({ x: pixel.x, y: pixel.y, text: formatDistance(dist) });
      }
      if (finishedMode === 'measure-area' && finishedPoints.length >= 3) {
        const center = calculateCenter(finishedPoints);
        const pixel = map.project([center.lng, center.lat]);
        const area = calculatePolygonArea(finishedPoints);
        setTooltip({ x: pixel.x, y: pixel.y, text: formatArea(area) });
      }
    };

    updateTooltip();
    map.on('move', updateTooltip);
    map.on('zoom', updateTooltip);
    map.on('rotate', updateTooltip);
    return () => {
      map.off('move', updateTooltip);
      map.off('zoom', updateTooltip);
      map.off('rotate', updateTooltip);
    };
  }, [isFinished, finishedMode, finishedPoints, mapFacadeRef]);

  return { tooltip, measurementUiState, finishMeasurement };
}
