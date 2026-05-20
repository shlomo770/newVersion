import type { MessageRegistry } from '@core/ws/messageRegistry';
import type { InboundHandlerContext } from '@core/ws/types';
import { WsMessageName } from '@domain/enums/ws.enum';
import { setLOS } from '../store/losSlice';
import type { LosRay } from '../store/losSlice';

function asRecord(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  return data as Record<string, unknown>;
}

function readNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseLosRays(raw: unknown): LosRay[] {
  if (!Array.isArray(raw)) return [];
  const rays: LosRay[] = [];
  for (const item of raw) {
    const o = asRecord(item);
    if (!o) continue;
    const angleDeg = readNumber(o.angleDeg);
    const distanceStart = readNumber(o.distanceStart);
    const distanceEnd = readNumber(o.distanceEnd);
    if (angleDeg === null || distanceStart === null || distanceEnd === null) continue;
    rays.push({
      angleDeg,
      distanceStart,
      distanceEnd,
      blocked: Boolean(o.blocked),
    });
  }
  return rays;
}

function parseLosPayload(data: unknown): {
  center: { lat: number; lng: number };
  radiusMeters: number;
  angleStartDeg: number;
  angleEndDeg: number;
  rays: LosRay[];
} | null {
  const d = asRecord(data);
  if (!d) return null;
  const centerRaw = asRecord(d.center);
  if (!centerRaw) return null;
  const lat = readNumber(centerRaw.lat);
  const lng = readNumber(centerRaw.lng);
  const radiusMeters = readNumber(d.radiusMeters);
  const angleStartDeg = readNumber(d.angleStartDeg);
  const angleEndDeg = readNumber(d.angleEndDeg);
  if (lat === null || lng === null || radiusMeters === null || angleStartDeg === null || angleEndDeg === null) {
    return null;
  }
  return {
    center: { lat, lng },
    radiusMeters,
    angleStartDeg,
    angleEndDeg,
    rays: parseLosRays(d.rays),
  };
}

function handleLosResult(data: unknown, { store }: InboundHandlerContext): void {
  const payload = parseLosPayload(data);
  if (!payload) return;
  store.dispatch(
    setLOS({
      center: payload.center,
      radiusMeters: payload.radiusMeters,
      angleStartDeg: payload.angleStartDeg,
      angleEndDeg: payload.angleEndDeg,
      rays: payload.rays,
    }),
  );
}

export function registerMapInboundHandlers(registry: MessageRegistry): void {
  registry.register(WsMessageName.LosResult, handleLosResult);
}
