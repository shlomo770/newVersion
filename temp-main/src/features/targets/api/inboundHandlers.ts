import type { MessageRegistry } from '@core/ws/messageRegistry';
import type { InboundHandlerContext } from '@core/ws/types';
import { isValidLatLng } from '@domain/utils/latLng';
import { WsMessageName } from '@domain/enums/ws.enum';
import { TargetState, TargetStateString, TargetType } from '@/enums/target.enum';
import {
  updateTarget,
  setTargetRecommendation,
  setTargetLineLayer,
  setTargetIconLayer,
  markTargetAsDestroyed,
  removeTarget,
} from '../store/targetsSlice';
import { targetsInboundRuntime } from './targetsRuntime';
import {
  TARGETS_UPDATE_THROTTLE_MS,
  TARGETS_CLEANUP_MS,
  TARGETS_RECONCILE_GRACE,
  TARGETS_INBOUND_CLEANUP_INTERVAL_MS,
} from '../config/targetRuntime.config';
import {
  perTargetAssignmentLineId,
  perTargetLockIconId,
} from '@features/map/config';

function asRecord(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  return data as Record<string, unknown>;
}

function readTargetId(record: Record<string, unknown>): string | null {
  const id = record.targetId ?? record.id ?? record.tgt_id;
  if (typeof id === 'string' && id.trim()) return id.trim();
  if (typeof id === 'number' && Number.isFinite(id)) return String(id);
  return null;
}

function parseTargetWireEntry(raw: unknown): Record<string, unknown> | null {
  return asRecord(raw);
}

function mapPlatformToTargetType(platform: unknown): string {
  if (typeof platform === 'number' && Number.isFinite(platform)) {
    const name = TargetType[platform as TargetType];
    if (typeof name === 'string') return name;
  }
  return String(platform ?? 'droneMedium');
}

function mapStateToTargetStatus(state: unknown): string {
  if (typeof state === 'number' && Number.isFinite(state)) {
    const name = TargetState[state as TargetState];
    if (typeof name === 'string') return name;
  }
  if (typeof state === 'string' && (Object.values(TargetStateString) as string[]).includes(state)) {
    return state;
  }
  return TargetStateString.active;
}

function ensureTargetsCleanupLoop(store: InboundHandlerContext['store']): void {
  if (targetsInboundRuntime.cleanupStarted) return;
  targetsInboundRuntime.cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const id of Object.keys(targetsInboundRuntime.lastUpdate)) {
      if (now - targetsInboundRuntime.lastUpdate[id] > TARGETS_CLEANUP_MS) {
        delete targetsInboundRuntime.lastUpdate[id];
        delete targetsInboundRuntime.seenAt[id];
        store.dispatch(removeTarget(id));
      }
    }
    const st = store.getState() as { targets?: { allIds: string[] } };
    const allIds = st.targets?.allIds ?? [];
    const hasTargets = allIds.length > 0 || Object.keys(targetsInboundRuntime.lastUpdate).length > 0;
    if (!hasTargets && targetsInboundRuntime.cleanupInterval) {
      clearInterval(targetsInboundRuntime.cleanupInterval);
      targetsInboundRuntime.cleanupInterval = null;
      targetsInboundRuntime.cleanupStarted = false;
    }
  }, TARGETS_INBOUND_CLEANUP_INTERVAL_MS);
  targetsInboundRuntime.cleanupStarted = true;
}

function handleTargetsData(data: unknown, { store }: InboundHandlerContext): void {
  ensureTargetsCleanupLoop(store);

  const arr = Array.isArray(data) ? data : [data];
  targetsInboundRuntime.stamp += 1;
  const stamp = targetsInboundRuntime.stamp;
  const now = Date.now();

  for (const entry of arr) {
    const td = parseTargetWireEntry(entry);
    if (!td) continue;

    const id = readTargetId(td);
    const coordinates = td.coordinates;
    const heading = td.heading;
    const range = td.range;
    const isRecommended = td.is_recommended_by_tera;
    const speed = td.speed;
    const state = td.state;
    const platform = td.platform;
    const identity = td.identity;
    const riskLevel = td.risk_level;

    if (!id || !isValidLatLng(coordinates)) continue;

    const last = targetsInboundRuntime.lastUpdate[id] ?? 0;
    if (now - last >= TARGETS_UPDATE_THROTTLE_MS) {
      const lat = Number((coordinates as { lat: unknown }).lat);
      const lng = Number((coordinates as { lng: unknown }).lng);
      const payload = {
        id,
        coordinates: { lat, lng },
        heading: Number.isFinite(Number(heading)) ? Number(heading) : 0,
        range: typeof range === 'number' ? range : Number(range) || 0,
        speed: Number.isFinite(Number(speed)) ? Number(speed) : 0,
        type: mapPlatformToTargetType(platform),
        status: mapStateToTargetStatus(state),
        friend: Boolean(identity),
        isRecommended: Boolean(isRecommended),
        risk_level: typeof riskLevel === 'number' ? riskLevel : undefined,
      };
      store.dispatch(updateTarget(payload));
      targetsInboundRuntime.lastUpdate[id] = now;
    }
    targetsInboundRuntime.seenAt[id] = stamp;
  }

  const st = store.getState() as { targets?: { allIds: string[] } };
  const allIds = st.targets?.allIds ?? [];
  for (const id of allIds) {
    const seen = targetsInboundRuntime.seenAt[id] ?? 0;
    if (seen < stamp - TARGETS_RECONCILE_GRACE) {
      delete targetsInboundRuntime.lastUpdate[id];
      delete targetsInboundRuntime.seenAt[id];
      store.dispatch(removeTarget(id));
    }
  }
}

function handleRecommendAssignment(data: unknown, { store }: InboundHandlerContext): void {
  if (Array.isArray(data)) {
    for (const id of data) {
      if (typeof id === 'string') {
        store.dispatch(setTargetRecommendation({ id, isRecommended: true }));
      }
    }
    return;
  }
  const d = asRecord(data);
  if (!d) return;
  const single = readTargetId(d);
  if (single) {
    store.dispatch(setTargetRecommendation({ id: single, isRecommended: true }));
    return;
  }
  const list = d.targetId;
  if (Array.isArray(list)) {
    for (const tid of list) {
      if (typeof tid === 'string') {
        store.dispatch(setTargetRecommendation({ id: tid, isRecommended: true }));
      }
    }
  }
}

function handleTargetAssigned(data: unknown, { store }: InboundHandlerContext): void {
  const d = asRecord(data);
  if (!d) return;
  const targetId = readTargetId(d);
  if (!targetId) return;
  store.dispatch(setTargetLineLayer({ id: targetId, lineLayerId: perTargetAssignmentLineId(targetId) }));
}

function handleTargetLock(data: unknown, { store }: InboundHandlerContext): void {
  const d = asRecord(data);
  if (!d) return;
  const targetId = readTargetId(d);
  if (!targetId) return;
  store.dispatch(setTargetIconLayer({ id: targetId, iconLayerId: perTargetLockIconId(targetId) }));
}

function handleTargetDestroyed(data: unknown, { store }: InboundHandlerContext): void {
  const d = asRecord(data);
  if (!d) return;
  const targetId = readTargetId(d);
  if (!targetId) return;
  store.dispatch(markTargetAsDestroyed(targetId));
}

export function registerTargetsInboundHandlers(registry: MessageRegistry): void {
  registry.registerMany({
    [WsMessageName.TargetsData]: handleTargetsData,
    [WsMessageName.RecommendAssignment]: handleRecommendAssignment,
    [WsMessageName.TargetAssigned]: handleTargetAssigned,
    [WsMessageName.TargetLock]: handleTargetLock,
    [WsMessageName.TargetDestroyed]: handleTargetDestroyed,
  });
}
