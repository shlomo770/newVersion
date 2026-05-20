import { useEffect, useRef } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { GeoJSONSource } from 'maplibre-gl';
import destination from '@turf/destination';
import { point } from '@turf/helpers';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  EMPTY_FEATURE_COLLECTION,
  featureCollection,
  lineStringFeature,
  pointFeature,
  type LngLatTuple,
} from '../shared/geoJson';
import { safeRemoveLayer, safeRemoveSource, useMapStyleReady } from '../shared/useMapStyleReady';

const GUN_LOS_SOURCE_ID = 'gun-los-source';
const GUN_LOS_LINE_LAYER_ID = 'gun-los-line-layer';
const GUN_LOS_HEAD_LAYER_ID = 'gun-los-head-layer';

const GUN_LOS_HEAD_ROTATION_OFFSET_DEG = -90;
const GUN_LOS_LENGTH_METERS = 1500;

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
    GUN_LOS_LENGTH_METERS / 1000,
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
      rot: normalizeAngle(finalAzimuth + GUN_LOS_HEAD_ROTATION_OFFSET_DEG),
    }),
  ]);
}

export default function GunLosLayer({ map }: GunLosLayerProps) {
  const coordinates = useAppSelector((state) => state.myPosition.coordinates);
  const gunAzimut = useAppSelector((state) => state.myPosition.gunAzimut);
  const pendingDataRef = useRef<GeoJSON.FeatureCollection>(EMPTY_FEATURE_COLLECTION);

  const applyData = () => {
    if (!map.isStyleLoaded()) return false;
    const source = map.getSource(GUN_LOS_SOURCE_ID) as GeoJSONSource | undefined;
    if (!source) return false;
    source.setData(pendingDataRef.current);
    return true;
  };

  useMapStyleReady(
    map,
    () => {
      if (!map.getSource(GUN_LOS_SOURCE_ID)) {
        map.addSource(GUN_LOS_SOURCE_ID, {
          type: 'geojson',
          data: pendingDataRef.current,
        });
      }

      if (!map.getLayer(GUN_LOS_LINE_LAYER_ID)) {
        map.addLayer({
          id: GUN_LOS_LINE_LAYER_ID,
          type: 'line',
          source: GUN_LOS_SOURCE_ID,
          filter: ['==', ['get', 'kind'], 'line'],
          paint: {
            'line-color': '#38bdf8',
            'line-width': ['interpolate', ['linear'], ['zoom'], 5, 1.2, 10, 1.7, 14, 2.2],
            'line-opacity': 1,
          },
        });
      }

      if (!map.getLayer(GUN_LOS_HEAD_LAYER_ID)) {
        map.addLayer({
          id: GUN_LOS_HEAD_LAYER_ID,
          type: 'symbol',
          source: GUN_LOS_SOURCE_ID,
          filter: ['==', ['get', 'kind'], 'head'],
          layout: {
            'text-field': '>',
            'text-size': ['interpolate', ['linear'], ['zoom'], 5, 14, 10, 18, 14, 22],
            'text-font': ['Open Sans Semibold'],
            'text-rotate': ['get', 'rot'],
            'text-rotation-alignment': 'map',
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: {
            'text-color': '#000000',
            'text-halo-width': 2,
          },
        });
      }

      applyData();

      return () => {
        safeRemoveLayer(map, GUN_LOS_HEAD_LAYER_ID);
        safeRemoveLayer(map, GUN_LOS_LINE_LAYER_ID);
        safeRemoveSource(map, GUN_LOS_SOURCE_ID);
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
