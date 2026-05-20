import { useCallback, useEffect, useRef } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { GeoJSONSource } from 'maplibre-gl';
import { useAppSelector } from '@/hooks/useAppSelector';
import { EMPTY_FEATURE_COLLECTION, featureCollection, pointFeature } from '../shared/geoJson';
import { safeRemoveLayer, safeRemoveSource, useMapStyleReady } from '../shared/useMapStyleReady';

const SRC_POS = 'my-position';
const LYR_HALO = 'my-position-halo-layer';
const LYR_POS = 'my-position-jeep-layer';
const UPDATE_MS = 25;

interface MyPositionLayerProps {
  map: MaplibreMap;
}

function loadImageOnce(map: MaplibreMap, name: string, url: string): Promise<void> {
  return new Promise((resolve) => {
    if (map.hasImage(name)) {
      resolve();
      return;
    }
    map.loadImage(url, (err, img) => {
      if (!err && img && !map.hasImage(name)) {
        try {
          map.addImage(name, img);
        } catch {
          /* duplicate race */
        }
      }
      resolve();
    });
  });
}

export default function MyPositionLayer({ map }: MyPositionLayerProps) {
  const my = useAppSelector((state) => state.myPosition);
  const myRef = useRef(my);
  myRef.current = my;
  const lastPushTime = useRef(0);
  const initialized = useRef(false);

  const pushData = useCallback(() => {
    if (!initialized.current) return;
    const source = map.getSource(SRC_POS) as GeoJSONSource | undefined;
    if (!source) return;

    const now = Date.now();
    if (now - lastPushTime.current < UPDATE_MS) return;
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

  useMapStyleReady(
    map,
    () => {
      let cancelled = false;

      const install = async () => {
        if (cancelled || !map.isStyleLoaded()) return;

        if (!map.getSource(SRC_POS)) {
          map.addSource(SRC_POS, { type: 'geojson', data: EMPTY_FEATURE_COLLECTION });
        }

        await loadImageOnce(map, 'jeep', '/icons/123.png');

        if (!map.getLayer(LYR_HALO)) {
          map.addLayer({
            id: LYR_HALO,
            type: 'circle',
            source: SRC_POS,
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                6,
                22,
                10,
                34,
                14,
                48,
                18,
                62,
              ],
              'circle-color': '#38bdf8',
              'circle-opacity': 0.2,
              'circle-blur': 0.9,
              'circle-pitch-alignment': 'map',
            },
          });
        }

        if (map.hasImage('jeep') && !map.getLayer(LYR_POS)) {
          map.addLayer({
            id: LYR_POS,
            type: 'symbol',
            source: SRC_POS,
            layout: {
              'icon-image': 'jeep',
              'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.2, 10, 0.3, 15, 0.4],
              'icon-rotate': ['coalesce', ['get', 'heading'], 0],
              'icon-rotation-alignment': 'map',
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
            },
          });
        } else if (!map.getLayer(LYR_POS)) {
          map.addLayer({
            id: LYR_POS,
            type: 'circle',
            source: SRC_POS,
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 6, 10, 10, 15, 14],
              'circle-color': '#22c55e',
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 2,
            },
          });
        }

        try {
          if (map.getLayer(LYR_HALO) && map.getLayer(LYR_POS)) {
            map.moveLayer(LYR_HALO);
            map.moveLayer(LYR_POS);
          }
        } catch {
          /* ignore reorder */
        }

        initialized.current = true;
        pushData();
      };

      void install();

      return () => {
        cancelled = true;
        initialized.current = false;
        safeRemoveLayer(map, LYR_POS);
        safeRemoveLayer(map, LYR_HALO);
        safeRemoveSource(map, SRC_POS);
      };
    },
    [pushData],
  );

  useEffect(() => {
    pushData();
  }, [pushData, my.coordinates.lat, my.coordinates.lng, my.heading]);

  return null;
}
