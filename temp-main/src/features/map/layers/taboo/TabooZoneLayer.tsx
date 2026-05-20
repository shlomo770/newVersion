import { useEffect, useMemo } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { GeoJSONSource } from 'maplibre-gl';
import type { Position } from 'geojson';
import { useAppSelector } from '@/hooks/useAppSelector';
import { buildRadarSectors } from '@shared/lib/geo';
import { safeRemoveLayer, safeRemoveSource, useMapStyleReady } from '../shared/useMapStyleReady';

const TABOO_SOURCE_ID = 'taboo-zone-sector';
const TABOO_FILL_LAYER_ID = 'taboo-zone-sector-fill';
const TABOO_LINE_LAYER_ID = 'taboo-zone-sector-line';

interface TabooZoneLayerProps {
  map: MaplibreMap;
  stepDeg?: number;
}

export default function TabooZoneLayer({ map, stepDeg = 1 }: TabooZoneLayerProps) {
  const tabooZoneState = useAppSelector((state) => state.tabooZone);
  const myCoordinates = useAppSelector((state) => state.myPosition.coordinates);

  const center = useMemo<Position>(
    () => [myCoordinates.lng, myCoordinates.lat],
    [myCoordinates.lng, myCoordinates.lat],
  );

  const featureCollection = useMemo(
    () => buildRadarSectors(center, tabooZoneState.radiusMeters, tabooZoneState.angles, stepDeg),
    [center, tabooZoneState.radiusMeters, tabooZoneState.angles, stepDeg],
  );

  const syncTaboo = () => {
    if (!map.isStyleLoaded()) return;
    const source = map.getSource(TABOO_SOURCE_ID) as GeoJSONSource | undefined;
    if (!source) {
      map.addSource(TABOO_SOURCE_ID, { type: 'geojson', data: featureCollection });
    } else {
      source.setData(featureCollection);
    }

    if (!map.getLayer(TABOO_FILL_LAYER_ID)) {
      map.addLayer({
        id: TABOO_FILL_LAYER_ID,
        type: 'fill',
        source: TABOO_SOURCE_ID,
        paint: {
          'fill-color': '#FFB300',
          'fill-opacity': 0.35,
        },
      });
    }

    if (!map.getLayer(TABOO_LINE_LAYER_ID)) {
      map.addLayer({
        id: TABOO_LINE_LAYER_ID,
        type: 'line',
        source: TABOO_SOURCE_ID,
        paint: {
          'line-color': '#FFB300',
          'line-width': 2,
        },
      });
    }
  };

  useMapStyleReady(
    map,
    () => {
      syncTaboo();
      return () => {
        safeRemoveLayer(map, TABOO_LINE_LAYER_ID);
        safeRemoveLayer(map, TABOO_FILL_LAYER_ID);
        safeRemoveSource(map, TABOO_SOURCE_ID);
      };
    },
    [],
  );

  useEffect(() => {
    syncTaboo();
  }, [map, featureCollection]);

  return null;
}
