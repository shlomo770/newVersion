import type { Store } from 'redux';
import { metersPerDegree } from '@/utils/geometry';
import { normalizeCoordinates, toLocalEntityCategory } from './outboundBuilders';
import { normalizeRawEntityToStore } from './entityInboundNormalize';
import {
  addEntity,
  clearEntities,
  setMissionsFromServer,
  setMissionList,
} from '../store/entitiesSlice';
import { setTabooZoneSector } from '@features/taboo-zone';
import { EntityCategoryEnum } from '@domain/enums/entity.enum';
import type { RootState } from '@app/store';
import { parseMissionFromServer } from './missionWire';

/** מזהה מבנה GET_DB לפי מפרט (ללא מערך entities כללי) */
export function isTypedGetDbPayload(d: Record<string, unknown>): boolean {
  if (Array.isArray(d.entities) || Array.isArray(d.Entities)) return false;
  return 'polygons' in d || 'polylines' in d || 'ellipses' in d;
}

function readList(d: Record<string, unknown>, key: string): unknown[] {
  const v = d[key];
  return Array.isArray(v) ? v : [];
}

function applyAltToCoords(coords: { lat: number; lng: number; alt?: number }[], altTop: unknown) {
  const alt = Number(altTop);
  if (!Number.isFinite(alt)) return coords;
  return coords.map((c) => ({ ...c, alt }));
}

function parseCategory(raw: unknown): EntityCategoryEnum {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return toLocalEntityCategory(raw as EntityCategoryEnum);
  }
  const s = String(raw ?? '').trim().toUpperCase();
  if (s === 'FIZ') return EntityCategoryEnum.FIZ;
  if (s === 'WCO_FREE') return EntityCategoryEnum.WCO_FREE;
  if (s === 'WCO_HOLD') return EntityCategoryEnum.WCO_HOLD;
  return EntityCategoryEnum.FREE;
}

function ellipseParamsToCoordinates(
  lat: number,
  lng: number,
  radius1Meters: number,
): { lat: number; lng: number }[] {
  const { mPerDegLng } = metersPerDegree(lat);
  const dLng = mPerDegLng > 0 ? radius1Meters / mPerDegLng : 0;
  return [
    { lat, lng },
    { lat, lng: lng + dLng },
  ];
}

/**
 * GET_DB לפי מפרט: polygons / polylines / ellipses / missions / taboozone
 * — ללא שדה entities כללי. מחליף מצב ישויות (clearEntities ואז טעינה מחדש).
 */
export function ingestGetDbTypedPayload(store: Store, d: Record<string, unknown>): void {
  store.dispatch(clearEntities());

  for (const raw of readList(d, 'polygons')) {
    if (!raw || typeof raw !== 'object') continue;
    const o = raw as Record<string, unknown>;
    const coords = normalizeCoordinates(o.coordinates);
    if (coords.length < 3) continue;
    const withAlt = applyAltToCoords(coords, o.alt);
    const entity = normalizeRawEntityToStore({
      id: o.id,
      type: 'polygon',
      name: o.name ?? o.id,
      category: parseCategory(o.category),
      color: o.color,
      transparency: o.transparency,
      visible: o.visible,
      coordinates: withAlt,
    });
    if (entity) store.dispatch(addEntity(entity));
  }

  for (const raw of readList(d, 'polylines')) {
    if (!raw || typeof raw !== 'object') continue;
    const o = raw as Record<string, unknown>;
    const coords = normalizeCoordinates(o.coordinates);
    if (coords.length < 2) continue;
    const withAlt = applyAltToCoords(coords, o.alt);
    const entity = normalizeRawEntityToStore({
      id: o.id,
      type: 'line',
      name: o.name ?? o.id,
      category: parseCategory(o.category),
      color: o.color,
      transparency: o.transparency,
      visible: o.visible,
      coordinates: withAlt,
    });
    if (entity) store.dispatch(addEntity(entity));
  }

  for (const raw of readList(d, 'ellipses')) {
    if (!raw || typeof raw !== 'object') continue;
    const o = raw as Record<string, unknown>;
    const params = o.params;
    if (!params || typeof params !== 'object') continue;
    const p = params as Record<string, unknown>;
    const lat = Number(p.lat);
    const lng = Number(p.lng);
    const radius1 = Number(p.radius1 ?? p.radius_1);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radius1) || radius1 <= 0) {
      continue;
    }
    const ring = ellipseParamsToCoordinates(lat, lng, radius1);
    const alt = Number(o.alt);
    const coords = Number.isFinite(alt)
      ? ring.map((c) => ({ ...c, alt }))
      : ring;
    const entity = normalizeRawEntityToStore({
      id: o.id,
      type: 'ellipse',
      name: o.name ?? o.id,
      category: parseCategory(o.category),
      color: o.color,
      transparency: o.transparency,
      visible: o.visible,
      coordinates: coords,
      properties: {
        ...(typeof o.properties === 'object' && o.properties ? o.properties : {}),
        serverEllipse: {
          radius1,
          radius2: Number(p.radius2 ?? p.radius_2),
        },
      },
    });
    if (entity) store.dispatch(addEntity(entity));
  }

  const st = store.getState() as RootState;
  const byId = st.entities.byId;
  const parsedMissions = [];
  for (const raw of readList(d, 'missions')) {
    const mission = parseMissionFromServer(raw, byId);
    if (mission) parsedMissions.push(mission);
  }
  if (parsedMissions.length) {
    store.dispatch(setMissionsFromServer(parsedMissions));
    const names = parsedMissions.map((m) => m.name).sort((a, b) => a.localeCompare(b, 'he'));
    store.dispatch(setMissionList(names));
  }

  const tz = d.taboozone;
  if (tz && typeof tz === 'object') {
    const tzo = tz as Record<string, unknown>;
    const start = Number(tzo.start);
    const end = Number(tzo.end);
    if (Number.isFinite(start) && Number.isFinite(end)) {
      const prevR = st.tabooZone?.radiusMeters;
      const radiusMeters =
        typeof prevR === 'number' && Number.isFinite(prevR) && prevR > 0 ? prevR : 5000;
      store.dispatch(
        setTabooZoneSector({
          radiusMeters,
          minAngle: start,
          maxAngle: end,
        }),
      );
    }
  }
}
