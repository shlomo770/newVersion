import { useEffect, useRef } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { GeoJSONSource } from 'maplibre-gl';
import { useAppSelector } from '@/hooks/useAppSelector';
import type { LosState } from '@features/map/store/losSlice';
import {
  EMPTY_FEATURE_COLLECTION,
  featureCollection,
  lineStringFeature,
  polygonFeature,
  type LngLatTuple,
} from '../shared/geoJson';
import { safeRemoveLayer, safeRemoveSource, useMapStyleReady } from '../shared/useMapStyleReady';
import { createSectorPolygonCoords, losHasRenderableData, rayToLineCoords } from './losGeo';

const SECTOR_SOURCE_ID = 'los-sector-source';
const SECTOR_FILL_LAYER_ID = 'los-sector-fill-layer';
const SECTOR_OUTLINE_LAYER_ID = 'los-sector-outline-layer';
const RAY_SOURCE_PREFIX = 'los-ray-source-';
const RAY_LAYER_PREFIX = 'los-ray-layer-';

interface LosSectorLayerProps {
  map: MaplibreMap;
}

function buildSectorRing(los: LosState): LngLatTuple[] {
  const coords = createSectorPolygonCoords(los);
  return coords.map((c) => [c.lng, c.lat] as LngLatTuple);
}

function syncLosLayers(map: MaplibreMap, los: LosState, fillColor: string): void {
  if (!map.isStyleLoaded()) return;

  const active = losHasRenderableData(los);
  if (!active || !los.center) {
    const sectorSource = map.getSource(SECTOR_SOURCE_ID) as GeoJSONSource | undefined;
    if (sectorSource) {
      sectorSource.setData(EMPTY_FEATURE_COLLECTION);
    }
    const style = map.getStyle();
    const layers = style?.layers ?? [];
    for (const layer of layers) {
      if (layer.id.startsWith(RAY_LAYER_PREFIX)) {
        safeRemoveLayer(map, layer.id);
      }
    }
    const sources = style?.sources ? Object.keys(style.sources) : [];
    for (const sourceId of sources) {
      if (sourceId.startsWith(RAY_SOURCE_PREFIX)) {
        safeRemoveSource(map, sourceId);
      }
    }
    return;
  }

  const ring = buildSectorRing(los);
  const sectorData =
    ring.length >= 4
      ? featureCollection([polygonFeature(ring)])
      : EMPTY_FEATURE_COLLECTION;

  if (!map.getSource(SECTOR_SOURCE_ID)) {
    map.addSource(SECTOR_SOURCE_ID, { type: 'geojson', data: sectorData });
  } else {
    (map.getSource(SECTOR_SOURCE_ID) as GeoJSONSource).setData(sectorData);
  }

  if (!map.getLayer(SECTOR_FILL_LAYER_ID)) {
    map.addLayer({
      id: SECTOR_FILL_LAYER_ID,
      type: 'fill',
      source: SECTOR_SOURCE_ID,
      paint: {
        'fill-color': fillColor,
        'fill-opacity': 0.15,
      },
    });
  } else {
    map.setPaintProperty(SECTOR_FILL_LAYER_ID, 'fill-color', fillColor);
  }

  if (!map.getLayer(SECTOR_OUTLINE_LAYER_ID)) {
    map.addLayer({
      id: SECTOR_OUTLINE_LAYER_ID,
      type: 'line',
      source: SECTOR_SOURCE_ID,
      paint: {
        'line-color': fillColor,
        'line-width': 3,
      },
    });
  } else {
    map.setPaintProperty(SECTOR_OUTLINE_LAYER_ID, 'line-color', fillColor);
  }

  const blockedRays = los.rays.filter((r) => r.blocked);
  const style = map.getStyle();
  const existingRayLayers = (style?.layers ?? [])
    .map((l) => l.id)
    .filter((id) => id.startsWith(RAY_LAYER_PREFIX));

  for (let i = blockedRays.length; i < existingRayLayers.length; i++) {
    const layerId = `${RAY_LAYER_PREFIX}${i}`;
    const sourceId = `${RAY_SOURCE_PREFIX}${i}`;
    safeRemoveLayer(map, layerId);
    safeRemoveSource(map, sourceId);
  }

  blockedRays.forEach((ray, index) => {
    const sourceId = `${RAY_SOURCE_PREFIX}${index}`;
    const layerId = `${RAY_LAYER_PREFIX}${index}`;
    const lineCoords = rayToLineCoords(los.center!, ray, los.radiusMeters);
    const lineData = featureCollection([lineStringFeature(lineCoords, { id: `ray-${index}` })]);

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, { type: 'geojson', data: lineData });
    } else {
      (map.getSource(sourceId) as GeoJSONSource).setData(lineData);
    }

    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#ef4444',
          'line-width': 3,
          'line-opacity': 1,
        },
      });
    }
  });
}

export default function LosSectorLayer({ map }: LosSectorLayerProps) {
  const los = useAppSelector((state) => state.los);
  const losSectorColor = useAppSelector((state) => state.settings.losSectorColor);
  const installedRef = useRef(false);

  useMapStyleReady(
    map,
    () => {
      installedRef.current = true;
      syncLosLayers(map, los, losSectorColor);
      return () => {
        installedRef.current = false;
        safeRemoveLayer(map, SECTOR_OUTLINE_LAYER_ID);
        safeRemoveLayer(map, SECTOR_FILL_LAYER_ID);
        safeRemoveSource(map, SECTOR_SOURCE_ID);
        const style = map.getStyle();
        for (const layer of style?.layers ?? []) {
          if (layer.id.startsWith(RAY_LAYER_PREFIX)) {
            safeRemoveLayer(map, layer.id);
          }
        }
        for (const sourceId of Object.keys(style?.sources ?? {})) {
          if (sourceId.startsWith(RAY_SOURCE_PREFIX)) {
            safeRemoveSource(map, sourceId);
          }
        }
      };
    },
    [losSectorColor],
  );

  useEffect(() => {
    if (!installedRef.current) return;
    syncLosLayers(map, los, losSectorColor);
  }, [map, los, losSectorColor]);

  return null;
}
