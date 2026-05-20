import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { GeoJSONSource } from 'maplibre-gl';
import { useAppSelector } from '@/hooks/useAppSelector';
import type { Target } from '@features/targets';
import {
  EMPTY_FEATURE_COLLECTION,
  featureCollection,
  lineStringFeature,
  pointFeature,
  type LngLatTuple,
} from '../shared/geoJson';
import { isTargetVisibleByFilter } from '../shared/targetVisibility';
import { useMapStyleReady } from '../shared/useMapStyleReady';

interface TargetsLayerProps {
  map: MaplibreMap;
  onAbort: (targetId: string) => void;
}

interface TargetFeatureProperties {
  id: string;
  heading: number;
  iconName: string;
  label: string;
  isRecommended: boolean;
  isAssigned: boolean;
  isLocked: boolean;
  isAllocated: boolean;
  isDestroyed: boolean;
}

interface AssignFeatureProperties {
  id: string;
  isAssigned: boolean;
  isLocked: boolean;
  isAllocated: boolean;
  isDestroyed: boolean;
}

const TARGET_ICON_NAMES = [
  'airplaneLarge_friendly',
  'airplaneLarge_hostile',
  'airplaneMedium_friendly',
  'airplaneMedium_hostile',
  'droneLarge_friendly',
  'droneLarge_hostile',
  'droneMedium_friendly',
  'droneMedium_hostile',
  'helicopter_friendly',
  'helicopter_hostile',
  'unknown_friendly',
  'unknown_hostile',
] as const;

function buildTargetFeature(target: Target): GeoJSON.Feature<GeoJSON.Point, TargetFeatureProperties> | null {
  if (!target.coordinates) return null;
  const base = target.type || 'unknown';
  const iconName = `${base}_${target.friend ? 'friendly' : 'hostile'}`;
  const heading = target.heading ?? 0;
  const rangeStr = target.range != null ? String(target.range).slice(0, 4) : '';
  const altStr = target.coordinates.alt != null ? String(target.coordinates.alt).slice(0, 4) : '';
  const secondLine = [rangeStr, altStr].filter(Boolean).join(' | ');
  const label = secondLine ? `${target.id}\n${secondLine}` : target.id;
  return pointFeature(target.coordinates.lng, target.coordinates.lat, {
    id: target.id,
    heading,
    iconName,
    label,
    isRecommended: Boolean(target.isRecommended),
    isAssigned: Boolean(target.isAssigned),
    isLocked: Boolean(target.isLocked),
    isAllocated: target.status === 'allocated',
    isDestroyed: target.status === 'destroyed',
  });
}

function isAbortableTarget(target: Target): boolean {
  return Boolean(
    target.coordinates &&
      (target.isAssigned ||
        target.status === 'allocated' ||
        target.status === 'designated' ||
        target.status === 'track' ||
        target.status === 'arm'),
  );
}

const TargetsLayer: React.FC<TargetsLayerProps> = ({ map, onAbort }) => {
  const targets = useAppSelector((state) => state.targets);
  const targetFilters = useAppSelector((state) => state.filter.targets);
  const myPosition = useAppSelector((state) => state.myPosition);
  const initializedRef = useRef(false);

  const IDS = useMemo(
    () => ({
      srcTargets: 'targets',
      srcTrails: 'targets-trails',
      srcAssign: 'target-arrows',
      srcTips: 'arrow-tips',
      lyrTargets: 'targets-layer',
      lyrTargetLabels: 'targets-labels-layer',
      lyrTrails: 'targets-trails-layer',
      lyrRingRed: 'targets-red-ring-layer',
      lyrRingRec: 'targets-recommended-ring',
      lyrAssigned: 'target-arrows-layer',
      lyrAllocated: 'target-arrows-layer-allocated',
      lyrLocked: 'target-arrows-locked',
      lyrDestroyed: 'targets-destroyed-layer',
    }),
    [],
  );

  const visibleTargets = useMemo(() => {
    return targets.allIds
      .map((id) => targets.byId[id])
      .filter((t): t is Target => Boolean(t))
      .filter((t) => isTargetVisibleByFilter(t, targetFilters));
  }, [targets.allIds, targets.byId, targetFilters]);

  const loadPngIcons = useCallback(async () => {
    const loadOne = (name: string) =>
      new Promise<void>((resolve) => {
        map.loadImage(`/icons/targets/${name}.png`, (err, img) => {
          if (!err && img && !map.hasImage(name)) {
            map.addImage(name, img);
          }
          resolve();
        });
      });
    await Promise.all(TARGET_ICON_NAMES.map(loadOne));
  }, [map]);

  useEffect(() => {
    const layerId = IDS.lyrRingRec;
    let visible = true;
    const interval = window.setInterval(() => {
      try {
        if (!map.getLayer(layerId)) return;
        map.setPaintProperty(layerId, 'circle-stroke-opacity', visible ? 0.9 : 0.2);
        visible = !visible;
      } catch {
        /* layer not ready */
      }
    }, 600);
    return () => window.clearInterval(interval);
  }, [map, IDS.lyrRingRec]);

  const pushData = useCallback(() => {
    if (!initializedRef.current) return;

    const srcTargets = map.getSource(IDS.srcTargets) as GeoJSONSource | undefined;
    const srcTrails = map.getSource(IDS.srcTrails) as GeoJSONSource | undefined;
    const srcAssign = map.getSource(IDS.srcAssign) as GeoJSONSource | undefined;
    const srcTips = map.getSource(IDS.srcTips) as GeoJSONSource | undefined;
    if (!srcTargets || !srcTrails || !srcAssign || !srcTips) return;

    const targetFeatures = visibleTargets
      .map(buildTargetFeature)
      .filter((f): f is GeoJSON.Feature<GeoJSON.Point, TargetFeatureProperties> => Boolean(f));

    srcTargets.setData(featureCollection(targetFeatures));

    const trailFeatures = visibleTargets
      .filter((t) => t.trail && t.trail.length >= 2)
      .map((t) => {
        const coordinates: LngLatTuple[] = t.trail!.map((p) => [p.lng, p.lat]);
        return lineStringFeature(coordinates, { id: t.id });
      });

    srcTrails.setData(featureCollection(trailFeatures));

    if (!myPosition?.coordinates) {
      srcAssign.setData(EMPTY_FEATURE_COLLECTION);
      srcTips.setData(EMPTY_FEATURE_COLLECTION);
      return;
    }

    const jeep = myPosition.coordinates;
    const assignFeatures: GeoJSON.Feature<GeoJSON.LineString, AssignFeatureProperties>[] = [];
    const tipFeatures: GeoJSON.Feature<GeoJSON.LineString, { id: string }>[] = [];
    const tipLen = 0.002;
    const tipAng = (25 * Math.PI) / 180;

    for (const t of visibleTargets) {
      if (!t.coordinates) continue;
      if (
        t.isAssigned ||
        t.isLocked ||
        t.status === 'allocated' ||
        t.status === 'destroyed'
      ) {
        const target = t.coordinates;
        assignFeatures.push(
          lineStringFeature(
            [
              [jeep.lng, jeep.lat],
              [target.lng, target.lat],
            ],
            {
              id: t.id,
              isAssigned: Boolean(t.isAssigned),
              isLocked: Boolean(t.isLocked),
              isAllocated: t.status === 'allocated',
              isDestroyed: t.status === 'destroyed',
            },
          ),
        );

        const dir = Math.atan2(jeep.lat - target.lat, jeep.lng - target.lng);
        const left = {
          lng: target.lng + tipLen * Math.cos(dir + tipAng),
          lat: target.lat + tipLen * Math.sin(dir + tipAng),
        };
        const right = {
          lng: target.lng + tipLen * Math.cos(dir - tipAng),
          lat: target.lat + tipLen * Math.sin(dir - tipAng),
        };
        tipFeatures.push(
          lineStringFeature(
            [
              [target.lng, target.lat],
              [left.lng, left.lat],
            ],
            { id: `${t.id}_left` },
          ),
        );
        tipFeatures.push(
          lineStringFeature(
            [
              [target.lng, target.lat],
              [right.lng, right.lat],
            ],
            { id: `${t.id}_right` },
          ),
        );
      }
    }

    srcAssign.setData(featureCollection(assignFeatures));
    srcTips.setData(featureCollection(tipFeatures));
  }, [IDS, map, myPosition, visibleTargets]);

  useMapStyleReady(
    map,
    () => {
      const install = async () => {
        if (initializedRef.current) return;
        await loadPngIcons();

        if (!map.getSource(IDS.srcTargets)) {
          map.addSource(IDS.srcTargets, { type: 'geojson', data: EMPTY_FEATURE_COLLECTION });
        }
        if (!map.getSource(IDS.srcTrails)) {
          map.addSource(IDS.srcTrails, { type: 'geojson', data: EMPTY_FEATURE_COLLECTION });
        }
        if (!map.getSource(IDS.srcAssign)) {
          map.addSource(IDS.srcAssign, { type: 'geojson', data: EMPTY_FEATURE_COLLECTION });
        }
        if (!map.getSource(IDS.srcTips)) {
          map.addSource(IDS.srcTips, { type: 'geojson', data: EMPTY_FEATURE_COLLECTION });
        }

        if (!map.getLayer(IDS.lyrTrails)) {
          map.addLayer({
            id: IDS.lyrTrails,
            type: 'line',
            source: IDS.srcTrails,
            paint: {
              'line-color': '#000000',
              'line-width': 2,
              'line-opacity': 0.9,
              'line-dasharray': [1, 1],
            },
          });
        }

        if (!map.getLayer(IDS.lyrTargets)) {
          map.addLayer({
            id: IDS.lyrTargets,
            type: 'symbol',
            source: IDS.srcTargets,
            layout: {
              'icon-image': ['get', 'iconName'],
              'icon-size': 0.04,
              'icon-allow-overlap': true,
              'icon-rotation-alignment': 'map',
              'icon-rotate': ['get', 'heading'],
            },
          });
        }

        if (!map.getLayer(IDS.lyrRingRed)) {
          map.addLayer({
            id: IDS.lyrRingRed,
            type: 'circle',
            source: IDS.srcTargets,
            filter: ['any', ['==', ['get', 'isAssigned'], true], ['==', ['get', 'isLocked'], true]],
            paint: {
              'circle-stroke-color': '#dd4141',
              'circle-stroke-width': 2,
              'circle-stroke-opacity': 0.9,
              'circle-radius': 15,
              'circle-color': 'rgba(0,0,0,0)',
            },
          });
        }

        if (!map.getLayer(IDS.lyrRingRec)) {
          map.addLayer({
            id: IDS.lyrRingRec,
            type: 'circle',
            source: IDS.srcTargets,
            filter: [
              'all',
              ['==', ['get', 'isRecommended'], true],
              ['==', ['get', 'isAssigned'], false],
              ['==', ['get', 'isLocked'], false],
            ],
            paint: {
              'circle-stroke-color': '#fff400',
              'circle-stroke-width': 2,
              'circle-stroke-opacity': 0.9,
              'circle-radius': 15,
              'circle-color': 'rgba(0,0,0,0)',
            },
          });
        }

        if (!map.getLayer(IDS.lyrAssigned)) {
          map.addLayer({
            id: IDS.lyrAssigned,
            type: 'line',
            source: IDS.srcAssign,
            filter: ['==', ['get', 'isLocked'], true],
            paint: {
              'line-color': '#ff2b2b',
              'line-width': 1.5,
              'line-dasharray': [1, 0],
            },
          }, IDS.lyrTargets);
        }

        if (!map.getLayer(IDS.lyrAllocated)) {
          map.addLayer({
            id: IDS.lyrAllocated,
            type: 'line',
            source: IDS.srcAssign,
            filter: ['==', ['get', 'isAllocated'], true],
            paint: {
              'line-color': '#58e1db',
              'line-width': 1.5,
              'line-dasharray': [4, 4],
            },
          }, IDS.lyrTargets);
        }

        if (!map.getLayer(IDS.lyrLocked)) {
          map.addLayer({
            id: IDS.lyrLocked,
            type: 'line',
            source: IDS.srcAssign,
            filter: ['all', ['==', ['get', 'isAssigned'], true], ['!=', ['get', 'isLocked'], true]],
            paint: {
              'line-color': '#ff2b2b',
              'line-width': 1.5,
              'line-dasharray': [4, 4],
            },
          }, IDS.lyrTargets);
        }

        if (!map.hasImage('x-icon')) {
          map.loadImage('/icons/x.png', (err, img) => {
            if (!err && img && !map.hasImage('x-icon')) {
              map.addImage('x-icon', img);
              if (!map.getLayer(IDS.lyrDestroyed)) {
                map.addLayer({
                  id: IDS.lyrDestroyed,
                  type: 'symbol',
                  source: IDS.srcTargets,
                  filter: ['==', ['get', 'isDestroyed'], true],
                  layout: {
                    'icon-image': 'x-icon',
                    'icon-size': 0.15,
                    'icon-allow-overlap': true,
                  },
                });
              }
            }
          });
        } else if (!map.getLayer(IDS.lyrDestroyed)) {
          map.addLayer({
            id: IDS.lyrDestroyed,
            type: 'symbol',
            source: IDS.srcTargets,
            filter: ['==', ['get', 'isDestroyed'], true],
            layout: {
              'icon-image': 'x-icon',
              'icon-size': 0.15,
              'icon-allow-overlap': true,
            },
          });
        }

        if (!map.getLayer(IDS.lyrTargetLabels)) {
          map.addLayer({
            id: IDS.lyrTargetLabels,
            type: 'symbol',
            source: IDS.srcTargets,
            filter: ['!', ['==', ['get', 'isDestroyed'], true]],
            layout: {
              'text-field': ['get', 'label'],
              'text-font': ['Open Sans Semibold'],
              'text-size': 12,
              'text-offset': [0, 2],
              'text-anchor': 'top',
              'text-allow-overlap': true,
              'text-ignore-placement': false,
            },
            paint: {
              'text-color': '#000000',
              'text-halo-width': 1,
            },
          });
        }

        initializedRef.current = true;
        pushData();
      };

      void install();
      return () => {
        initializedRef.current = false;
      };
    },
    [IDS, loadPngIcons, pushData],
  );

  useEffect(() => {
    pushData();
  }, [pushData]);

  const [buttons, setButtons] = useState<Record<string, { x: number; y: number }>>({});

  const updateButtonPos = useCallback(() => {
    const result: Record<string, { x: number; y: number }> = {};
    for (const t of visibleTargets) {
      if (isAbortableTarget(t) && t.coordinates) {
        const p = map.project([t.coordinates.lng, t.coordinates.lat]);
        result[t.id] = { x: p.x - 22.5, y: p.y + 30 };
      }
    }
    setButtons(result);
  }, [map, visibleTargets]);

  useEffect(() => {
    updateButtonPos();
    map.on('move', updateButtonPos);
    map.on('zoom', updateButtonPos);
    return () => {
      map.off('move', updateButtonPos);
      map.off('zoom', updateButtonPos);
    };
  }, [map, updateButtonPos]);

  const abortableTargets = visibleTargets.filter(isAbortableTarget);

  return (
    <>
      {abortableTargets.map((t) => {
        const pos = buttons[t.id];
        if (!pos) return null;
        return (
          <div
            key={t.id}
            className="fixed pointer-events-auto"
            style={{ left: pos.x, top: pos.y + 25 }}
          >
            <div
              onClick={() => onAbort(t.id)}
              className="text-sm text-white h-6 rounded-md w-12 bg-red-600 text-center mt-1 cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onAbort(t.id);
              }}
            >
              ביטול
            </div>
          </div>
        );
      })}
    </>
  );
};

export default TargetsLayer;
