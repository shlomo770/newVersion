import { useEffect, useMemo } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { GeoJSONSource } from 'maplibre-gl';
import type { Position } from 'geojson';
import { useAppSelector } from '@/hooks/useAppSelector';
import { buildRadarSectors } from '@shared/lib/geo';
import {
  RADAR_COVERAGE_IDS,
  RADAR_COVERAGE_VISUALS,
  radarFillLayerId,
  radarLineLayerId,
  radarSourceId,
} from '@features/map/config';
import { safeRemoveLayer, safeRemoveSource, useMapStyleReady } from '../shared/useMapStyleReady';

interface RadarCoverageLayerProps {
  map: MaplibreMap;
  idPrefix?: string;
  stepDeg?: number;
  fillColor?: string;
  fillOpacity?: number;
  lineColor?: string;
  lineWidth?: number;
  overlayPrefixHints?: ReadonlyArray<string>;
}

export default function RadarCoverageLayer({
  map,
  idPrefix = RADAR_COVERAGE_IDS.defaultPrefix,
  stepDeg = RADAR_COVERAGE_VISUALS.stepDeg,
  fillColor = RADAR_COVERAGE_VISUALS.fill.color,
  fillOpacity = RADAR_COVERAGE_VISUALS.fill.opacity,
  lineColor = RADAR_COVERAGE_VISUALS.line.color,
  lineWidth = RADAR_COVERAGE_VISUALS.line.width,
  overlayPrefixHints = RADAR_COVERAGE_IDS.overlayPrefixHints,
}: RadarCoverageLayerProps) {
  const radarRange = useAppSelector((state) => state.radar.radarRange);
  const radarNonCoverage = useAppSelector((state) => state.radar.radarNonCoverage);
  const myCoordinates = useAppSelector((state) => state.myPosition.coordinates);

  const ids = useMemo(
    () => ({
      src: radarSourceId(idPrefix),
      fill: radarFillLayerId(idPrefix),
      line: radarLineLayerId(idPrefix),
    }),
    [idPrefix],
  );

  const center = useMemo<Position>(
    () => [myCoordinates.lng, myCoordinates.lat],
    [myCoordinates.lng, myCoordinates.lat],
  );

  const featureCollection = useMemo(
    () => buildRadarSectors(center, radarRange, radarNonCoverage, stepDeg),
    [center, radarRange, radarNonCoverage, stepDeg],
  );

  const syncRadar = () => {
    if (!map.isStyleLoaded()) return;
    const source = map.getSource(ids.src) as GeoJSONSource | undefined;
    if (!source) {
      map.addSource(ids.src, { type: 'geojson', data: featureCollection });
    } else {
      source.setData(featureCollection);
    }

    if (!map.getLayer(ids.fill)) {
      map.addLayer({
        id: ids.fill,
        type: 'fill',
        source: ids.src,
        paint: {
          'fill-color': fillColor,
          'fill-opacity': fillOpacity,
        },
      });
    } else {
      map.setPaintProperty(ids.fill, 'fill-color', fillColor);
      map.setPaintProperty(ids.fill, 'fill-opacity', fillOpacity);
    }

    if (!map.getLayer(ids.line)) {
      map.addLayer(
        {
          id: ids.line,
          type: 'line',
          source: ids.src,
          paint: {
            'line-color': lineColor,
            'line-width': lineWidth,
          },
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
        },
        ids.fill,
      );
    } else {
      map.setPaintProperty(ids.line, 'line-color', lineColor);
      map.setPaintProperty(ids.line, 'line-width', lineWidth);
    }

    const layers = map.getStyle()?.layers ?? [];
    let before: string | undefined;
    for (const lyr of layers) {
      if (lyr.id === ids.fill || lyr.id === ids.line) continue;
      if (overlayPrefixHints.some((prefix) => lyr.id.startsWith(prefix))) {
        before = lyr.id;
        break;
      }
    }
    if (before) {
      try {
        map.moveLayer(ids.fill, before);
      } catch {
        /* ignore */
      }
      try {
        map.moveLayer(ids.line, before);
      } catch {
        /* ignore */
      }
    }
  };

  useMapStyleReady(
    map,
    () => {
      syncRadar();
      return () => {
        safeRemoveLayer(map, ids.line);
        safeRemoveLayer(map, ids.fill);
        safeRemoveSource(map, ids.src);
      };
    },
    [ids.src, ids.fill, ids.line, fillColor, fillOpacity, lineColor, lineWidth],
  );

  useEffect(() => {
    syncRadar();
  }, [map, featureCollection, ids, fillColor, fillOpacity, lineColor, lineWidth, overlayPrefixHints]);

  return null;
}
