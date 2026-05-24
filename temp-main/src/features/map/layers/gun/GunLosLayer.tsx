import { useEffect, useRef } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { GeoJSONSource } from 'maplibre-gl';
import destination from '@turf/destination';
import { point } from '@turf/helpers';
import { useAppSelector } from '@/hooks/useAppSelector';
import { GUN_LOS_IDS, GUN_LOS_VISUALS } from '@features/map/config';
import {
  EMPTY_FEATURE_COLLECTION,
  featureCollection,
  lineStringFeature,
  pointFeature,
  type LngLatTuple,
} from '../shared/geoJson';
import { safeRemoveLayer, safeRemoveSource, useMapStyleReady } from '../shared/useMapStyleReady';

/** Number of meters per kilometer — `destination()` expects km. */
const METERS_PER_KM = 1000;

const normalizeAngle = (angle: number): number => ((angle % 360) + 360) % 360;

interface GunLosLayerProps {
  map: MaplibreMap;
}

function buildGunLosCollection(
  position: { lng: number; lat: number },
  gunAzimut: number | undefined,
): GeoJSON.FeatureCollection {
  const hasDirection = Number.isFinite(gunAzimut);
  const hasPosition = Number.isFinite(position.lat) && Number.isFinite(position.lng);
  if (!hasDirection || !hasPosition) {
    return EMPTY_FEATURE_COLLECTION;
  }

  const finalAzimuth = normalizeAngle(Number(gunAzimut));
  const endCoordinates = destination(
    point([position.lng, position.lat]),
    GUN_LOS_VISUALS.lengthMeters / METERS_PER_KM,
    finalAzimuth,
  ).geometry.coordinates as LngLatTuple;

  return featureCollection([
    lineStringFeature(
      [
        [position.lng, position.lat],
        endCoordinates,
      ],
      { kind: 'line' },
    ),
    pointFeature(endCoordinates[0], endCoordinates[1], {
      kind: 'head',
      rot: normalizeAngle(finalAzimuth + GUN_LOS_VISUALS.headRotationOffsetDeg),
    }),
  ]);
}

export default function GunLosLayer({ map }: GunLosLayerProps) {
  const coordinates = useAppSelector((state) => state.myPosition.coordinates);
  const gunAzimut = useAppSelector((state) => state.myPosition.gunAzimut);
  const pendingDataRef = useRef<GeoJSON.FeatureCollection>(EMPTY_FEATURE_COLLECTION);

  const applyData = () => {
    if (!map.isStyleLoaded()) return false;
    const source = map.getSource(GUN_LOS_IDS.source) as GeoJSONSource | undefined;
    if (!source) return false;
    source.setData(pendingDataRef.current);
    return true;
  };

  useMapStyleReady(
    map,
    () => {
      if (!map.getSource(GUN_LOS_IDS.source)) {
        map.addSource(GUN_LOS_IDS.source, {
          type: 'geojson',
          data: pendingDataRef.current,
        });
      }

      if (!map.getLayer(GUN_LOS_IDS.lineLayer)) {
        map.addLayer({
          id: GUN_LOS_IDS.lineLayer,
          type: 'line',
          source: GUN_LOS_IDS.source,
          filter: ['==', ['get', 'kind'], 'line'],
          paint: {
            'line-color': GUN_LOS_VISUALS.line.color,
            'line-width': GUN_LOS_VISUALS.line.widthByZoom,
            'line-opacity': GUN_LOS_VISUALS.line.opacity,
          },
        });
      }

      if (!map.getLayer(GUN_LOS_IDS.headLayer)) {
        map.addLayer({
          id: GUN_LOS_IDS.headLayer,
          type: 'symbol',
          source: GUN_LOS_IDS.source,
          filter: ['==', ['get', 'kind'], 'head'],
          layout: {
            'text-field': GUN_LOS_VISUALS.head.field,
            'text-size': GUN_LOS_VISUALS.head.sizeByZoom,
            'text-font': [...GUN_LOS_VISUALS.head.font],
            'text-rotate': ['get', 'rot'],
            'text-rotation-alignment': 'map',
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: {
            'text-color': GUN_LOS_VISUALS.head.color,
            'text-halo-width': GUN_LOS_VISUALS.head.haloWidth,
          },
        });
      }

      applyData();

      return () => {
        safeRemoveLayer(map, GUN_LOS_IDS.headLayer);
        safeRemoveLayer(map, GUN_LOS_IDS.lineLayer);
        safeRemoveSource(map, GUN_LOS_IDS.source);
      };
    },
    [],
  );

  useEffect(() => {
    pendingDataRef.current = buildGunLosCollection(coordinates, gunAzimut);
    if (!applyData()) {
      const onIdle = () => {
        applyData();
      };
      map.once('idle', onIdle);
      return () => {
        map.off('idle', onIdle);
      };
    }
    return undefined;
  }, [map, coordinates.lat, coordinates.lng, gunAzimut]);

  return null;
}
