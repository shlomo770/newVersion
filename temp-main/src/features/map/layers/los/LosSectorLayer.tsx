import { useEffect, useRef } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { GeoJSONSource } from 'maplibre-gl';
import { useAppSelector } from '@/hooks/useAppSelector';
import type { LosState } from '@features/map/store/losSlice';
import {
  LOS_IDS,
  LOS_VISUALS,
  losRayLayerId,
  losRaySourceId,
} from '@features/map/config';
import {
  EMPTY_FEATURE_COLLECTION,
  featureCollection,
  lineStringFeature,
  polygonFeature,
  type LngLatTuple,
} from '../shared/geoJson';
import { safeRemoveLayer, safeRemoveSource, useMapStyleReady } from '../shared/useMapStyleReady';
import { createSectorPolygonCoords, losHasRenderableData, rayToLineCoords } from './losGeo';

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
    const sectorSource = map.getSource(LOS_IDS.sectorSource) as GeoJSONSource | undefined;
    if (sectorSource) {
      sectorSource.setData(EMPTY_FEATURE_COLLECTION);
    }
    const style = map.getStyle();
    const layers = style?.layers ?? [];
    for (const layer of layers) {
      if (layer.id.startsWith(LOS_IDS.rayLayerPrefix)) {
        safeRemoveLayer(map, layer.id);
      }
    }
    const sources = style?.sources ? Object.keys(style.sources) : [];
    for (const sourceId of sources) {
      if (sourceId.startsWith(LOS_IDS.raySourcePrefix)) {
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

  if (!map.getSource(LOS_IDS.sectorSource)) {
    map.addSource(LOS_IDS.sectorSource, { type: 'geojson', data: sectorData });
  } else {
    (map.getSource(LOS_IDS.sectorSource) as GeoJSONSource).setData(sectorData);
  }

  if (!map.getLayer(LOS_IDS.sectorFillLayer)) {
    map.addLayer({
      id: LOS_IDS.sectorFillLayer,
      type: 'fill',
      source: LOS_IDS.sectorSource,
      paint: {
        'fill-color': fillColor,
        'fill-opacity': LOS_VISUALS.fillOpacity,
      },
    });
  } else {
    map.setPaintProperty(LOS_IDS.sectorFillLayer, 'fill-color', fillColor);
  }

  if (!map.getLayer(LOS_IDS.sectorOutlineLayer)) {
    map.addLayer({
      id: LOS_IDS.sectorOutlineLayer,
      type: 'line',
      source: LOS_IDS.sectorSource,
      paint: {
        'line-color': fillColor,
        'line-width': LOS_VISUALS.outlineWidth,
      },
    });
  } else {
    map.setPaintProperty(LOS_IDS.sectorOutlineLayer, 'line-color', fillColor);
  }

  const blockedRays = los.rays.filter((r) => r.blocked);
  const style = map.getStyle();
  const existingRayLayers = (style?.layers ?? [])
    .map((l) => l.id)
    .filter((id) => id.startsWith(LOS_IDS.rayLayerPrefix));

  for (let i = blockedRays.length; i < existingRayLayers.length; i++) {
    safeRemoveLayer(map, losRayLayerId(i));
    safeRemoveSource(map, losRaySourceId(i));
  }

  blockedRays.forEach((ray, index) => {
    const sourceId = losRaySourceId(index);
    const layerId = losRayLayerId(index);
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
          'line-color': LOS_VISUALS.blockedRayColor,
          'line-width': LOS_VISUALS.blockedRayWidth,
          'line-opacity': LOS_VISUALS.blockedRayOpacity,
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
        safeRemoveLayer(map, LOS_IDS.sectorOutlineLayer);
        safeRemoveLayer(map, LOS_IDS.sectorFillLayer);
        safeRemoveSource(map, LOS_IDS.sectorSource);
        const style = map.getStyle();
        for (const layer of style?.layers ?? []) {
          if (layer.id.startsWith(LOS_IDS.rayLayerPrefix)) {
            safeRemoveLayer(map, layer.id);
          }
        }
        for (const sourceId of Object.keys(style?.sources ?? {})) {
          if (sourceId.startsWith(LOS_IDS.raySourcePrefix)) {
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
