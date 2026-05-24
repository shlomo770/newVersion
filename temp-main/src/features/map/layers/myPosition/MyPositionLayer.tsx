import { useCallback, useEffect, useRef } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { GeoJSONSource } from 'maplibre-gl';
import { useAppSelector } from '@/hooks/useAppSelector';
import { safeLoadMapImage } from '@features/map/utils/mapErrorHandler';
import { MY_POSITION_IDS, MY_POSITION_VISUALS } from '@features/map/config';
import { PLATFORM_ICONS } from '@/config';
import { EMPTY_FEATURE_COLLECTION, featureCollection, pointFeature } from '../shared/geoJson';
import { safeRemoveLayer, safeRemoveSource, useMapStyleReady } from '../shared/useMapStyleReady';

interface MyPositionLayerProps {
  map: MaplibreMap;
}

export default function MyPositionLayer({ map }: MyPositionLayerProps) {
  const my = useAppSelector((state) => state.myPosition);
  const myRef = useRef(my);
  myRef.current = my;
  const lastPushTime = useRef(0);
  const pushDataRef = useRef<() => void>(() => undefined);

  const pushData = useCallback(() => {
    const source = map.getSource(MY_POSITION_IDS.source) as GeoJSONSource | undefined;
    if (!source) return;

    const now = Date.now();
    if (now - lastPushTime.current < MY_POSITION_VISUALS.updateThrottleMs) return;
    lastPushTime.current = now;

    const pos = myRef.current;
    const lat = Number(pos?.coordinates?.lat);
    const lng = Number(pos?.coordinates?.lng);
    const heading = Number(pos?.heading ?? 0);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      source.setData(EMPTY_FEATURE_COLLECTION);
      return;
    }

    source.setData(
      featureCollection([
        pointFeature(lng, lat, {
          heading: Number.isFinite(heading) ? heading : 0,
        }),
      ]),
    );
  }, [map]);

  pushDataRef.current = pushData;

  useMapStyleReady(
    map,
    () => {
      let cancelled = false;

      const install = async () => {
        if (cancelled || !map.isStyleLoaded()) return;

        if (!map.getSource(MY_POSITION_IDS.source)) {
          map.addSource(MY_POSITION_IDS.source, {
            type: 'geojson',
            data: EMPTY_FEATURE_COLLECTION,
          });
        }

        await safeLoadMapImage(map, PLATFORM_ICONS.jeepMapImage, MY_POSITION_IDS.jeepImage);

        if (cancelled) return;

        if (!map.getLayer(MY_POSITION_IDS.haloLayer)) {
          map.addLayer({
            id: MY_POSITION_IDS.haloLayer,
            type: 'circle',
            source: MY_POSITION_IDS.source,
            paint: {
              'circle-radius': MY_POSITION_VISUALS.haloRadiusByZoom,
              'circle-color': MY_POSITION_VISUALS.halo.color,
              'circle-opacity': MY_POSITION_VISUALS.halo.opacity,
              'circle-blur': MY_POSITION_VISUALS.halo.blur,
              'circle-pitch-alignment': 'map',
            },
          });
        }

        const haveJeepImage = map.hasImage(MY_POSITION_IDS.jeepImage);
        if (haveJeepImage && !map.getLayer(MY_POSITION_IDS.jeepLayer)) {
          map.addLayer({
            id: MY_POSITION_IDS.jeepLayer,
            type: 'symbol',
            source: MY_POSITION_IDS.source,
            layout: {
              'icon-image': MY_POSITION_IDS.jeepImage,
              'icon-size': MY_POSITION_VISUALS.jeepIconSizeByZoom,
              'icon-rotate': ['coalesce', ['get', 'heading'], 0],
              'icon-rotation-alignment': 'map',
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
            },
          });
        } else if (!map.getLayer(MY_POSITION_IDS.jeepLayer)) {
          map.addLayer({
            id: MY_POSITION_IDS.jeepLayer,
            type: 'circle',
            source: MY_POSITION_IDS.source,
            paint: {
              'circle-radius': MY_POSITION_VISUALS.fallback.radiusByZoom,
              'circle-color': MY_POSITION_VISUALS.fallback.color,
              'circle-stroke-color': MY_POSITION_VISUALS.fallback.strokeColor,
              'circle-stroke-width': MY_POSITION_VISUALS.fallback.strokeWidth,
            },
          });
        }

        pushDataRef.current();
      };

      void install();

      return () => {
        cancelled = true;
        safeRemoveLayer(map, MY_POSITION_IDS.jeepLayer);
        safeRemoveLayer(map, MY_POSITION_IDS.haloLayer);
        safeRemoveSource(map, MY_POSITION_IDS.source);
      };
    },
    [map],
  );

  useEffect(() => {
    pushData();
  }, [pushData, my.coordinates.lat, my.coordinates.lng, my.heading]);

  return null;
}
