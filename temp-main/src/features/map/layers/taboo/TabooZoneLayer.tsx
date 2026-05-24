import { useEffect, useMemo } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { GeoJSONSource } from 'maplibre-gl';
import type { Position } from 'geojson';
import { useAppSelector } from '@/hooks/useAppSelector';
import { buildRadarSectors } from '@shared/lib/geo';
import { TABOO_ZONE_IDS, TABOO_ZONE_VISUALS } from '@features/map/config';
import { safeRemoveLayer, safeRemoveSource, useMapStyleReady } from '../shared/useMapStyleReady';

interface TabooZoneLayerProps {
  map: MaplibreMap;
  /** Override the sweep step (deg) used to tessellate the sector. */
  stepDeg?: number;
}

export default function TabooZoneLayer({
  map,
  stepDeg = TABOO_ZONE_VISUALS.stepDeg,
}: TabooZoneLayerProps) {
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
    const source = map.getSource(TABOO_ZONE_IDS.source) as GeoJSONSource | undefined;
    if (!source) {
      map.addSource(TABOO_ZONE_IDS.source, { type: 'geojson', data: featureCollection });
    } else {
      source.setData(featureCollection);
    }

    if (!map.getLayer(TABOO_ZONE_IDS.fillLayer)) {
      map.addLayer({
        id: TABOO_ZONE_IDS.fillLayer,
        type: 'fill',
        source: TABOO_ZONE_IDS.source,
        paint: {
          'fill-color': TABOO_ZONE_VISUALS.fill.color,
          'fill-opacity': TABOO_ZONE_VISUALS.fill.opacity,
        },
      });
    }

    if (!map.getLayer(TABOO_ZONE_IDS.lineLayer)) {
      map.addLayer({
        id: TABOO_ZONE_IDS.lineLayer,
        type: 'line',
        source: TABOO_ZONE_IDS.source,
        paint: {
          'line-color': TABOO_ZONE_VISUALS.line.color,
          'line-width': TABOO_ZONE_VISUALS.line.width,
        },
      });
    }
  };

  useMapStyleReady(
    map,
    () => {
      syncTaboo();
      return () => {
        safeRemoveLayer(map, TABOO_ZONE_IDS.lineLayer);
        safeRemoveLayer(map, TABOO_ZONE_IDS.fillLayer);
        safeRemoveSource(map, TABOO_ZONE_IDS.source);
      };
    },
    [],
  );

  useEffect(() => {
    syncTaboo();
  }, [map, featureCollection]);

  return null;
}
