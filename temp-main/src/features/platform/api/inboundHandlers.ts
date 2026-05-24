import type { MessageRegistry } from '@core/ws/messageRegistry';
import type { InboundHandlerContext } from '@core/ws/types';
import { WsMessageName } from '@domain/enums/ws.enum';
import { CaliModeE } from '@domain/enums/general.enum';
import { GunStatusE, InsStatusE, RadarStatusE } from '@domain/enums/status.enum';
import {
  mapRadarWireStateToStatus,
  normalizeInboundRadarParamsWire,
} from '@domain/mappers/radarWire.mapper';
import { receiveRadarParamsFromServer, setRadarNonCoverage, setStatus } from '../store/radarSlice';
import { setGunStatus } from '../store/gunSlice';
import { setInsStatus } from '../store/insSlice';
import { setMyPosition, updateGunAzimut, updateMyCali } from '../store/myPositionSlice';

interface LatLngWire {
  lat: number;
  lng: number;
}

interface ManualPosWire extends LatLngWire {
  heading?: number;
  alt?: number;
}

interface PositionPayload {
  gps_pos?: LatLngWire;
  tmaps_pos?: LatLngWire;
  manual_pos?: ManualPosWire;
  use_gps?: boolean;
  use_manual?: boolean;
  zone?: number;
  fig_of_merit?: number;
  heading?: number;
  pitch?: number;
  roll?: number;
  distance_travelled?: number;
}

function asRecord(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  return data as Record<string, unknown>;
}

function readLatLng(raw: unknown): LatLngWire | null {
  const o = asRecord(raw);
  if (!o) return null;
  const lat = Number(o.lat);
  const lng = Number(o.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function parsePositionPayload(data: unknown): PositionPayload | null {
  const d = asRecord(data);
  if (!d) return null;

  // Legacy mock server: { valid: { lat, lng }, heading }
  const legacyValid = readLatLng(d.valid);
  if (legacyValid) {
    const heading = Number.isFinite(Number(d.heading)) ? Number(d.heading) : undefined;
    return {
      tmaps_pos: legacyValid,
      heading,
      use_manual: false,
      use_gps: false,
    };
  }

  const gps_pos = readLatLng(d.gps_pos) ?? undefined;
  const tmaps_pos = readLatLng(d.tmaps_pos) ?? undefined;
  const manualRaw = asRecord(d.manual_pos);
  let manual_pos: ManualPosWire | undefined;
  if (manualRaw) {
    const base = readLatLng(manualRaw);
    if (base) {
      manual_pos = {
        ...base,
        heading: Number.isFinite(Number(manualRaw.heading)) ? Number(manualRaw.heading) : undefined,
        alt: Number.isFinite(Number(manualRaw.alt)) ? Number(manualRaw.alt) : undefined,
      };
    }
  }
  if (!gps_pos && !tmaps_pos && !manual_pos) return null;
  return {
    gps_pos,
    tmaps_pos,
    manual_pos,
    use_gps: Boolean(d.use_gps),
    use_manual: Boolean(d.use_manual),
    zone: Number.isFinite(Number(d.zone)) ? Number(d.zone) : undefined,
    fig_of_merit: Number.isFinite(Number(d.fig_of_merit)) ? Number(d.fig_of_merit) : undefined,
    heading: Number.isFinite(Number(d.heading)) ? Number(d.heading) : undefined,
    pitch: Number.isFinite(Number(d.pitch)) ? Number(d.pitch) : undefined,
    roll: Number.isFinite(Number(d.roll)) ? Number(d.roll) : undefined,
    distance_travelled: Number.isFinite(Number(d.distance_travelled))
      ? Number(d.distance_travelled)
      : undefined,
  };
}

function handlePosition(data: unknown, { store }: InboundHandlerContext): void {
  const payload = parsePositionPayload(data);
  if (!payload) return;
  const cord = payload.use_manual && payload.manual_pos ? payload.manual_pos : payload.tmaps_pos;
  if (!cord) return;
  const headingData =
    payload.use_manual && payload.manual_pos?.heading !== undefined
      ? payload.manual_pos.heading
      : payload.heading;
  const current = store.getState().myPosition;
  store.dispatch(
    setMyPosition({
      coordinates: { lat: cord.lat, lng: cord.lng },
      heading: headingData ?? current.heading,
      gps_pos: payload.gps_pos ?? current.gps_pos,
      tmaps_pos: payload.tmaps_pos ?? current.tmaps_pos,
      manual_pos: payload.manual_pos ?? current.manual_pos,
      use_gps: payload.use_gps ?? current.use_gps,
      use_manual: payload.use_manual ?? current.use_manual,
      zone: payload.zone ?? current.zone,
      fig_of_merit: payload.fig_of_merit ?? current.fig_of_merit,
      pitch: payload.pitch ?? current.pitch,
      roll: payload.roll ?? current.roll,
      distance_travelled: payload.distance_travelled ?? current.distance_travelled,
    }),
  );
}

function handleOdoCaliFinished(_data: unknown, { store }: InboundHandlerContext): void {
  store.dispatch(updateMyCali(CaliModeE.YES));
}

function handleGunParams(data: unknown, { store }: InboundHandlerContext): void {
  const d = asRecord(data);
  if (!d) return;
  const sightAzimuth = Number(d.sight_azimuth);
  if (!Number.isFinite(sightAzimuth)) return;
  store.dispatch(
    updateGunAzimut({
      sight_azimuth: sightAzimuth,
    }),
  );
}

function handleRadarStatus(data: unknown, { store }: InboundHandlerContext): void {
  if (Object.keys(normalizeInboundRadarParamsWire(data)).length > 0) {
    store.dispatch(receiveRadarParamsFromServer(data));
  }
  const d = asRecord(data);
  const st = mapRadarWireStateToStatus(d?.state);
  if (st !== undefined) store.dispatch(setStatus(st));
}

function handleRadarParams(data: unknown, { store }: InboundHandlerContext): void {
  store.dispatch(receiveRadarParamsFromServer(data));
}

function readEnumValue<T extends Record<string, string | number>>(
  enumObj: T,
  raw: unknown,
): T[keyof T] | undefined {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw as T[keyof T];
  }
  if (typeof raw === 'string' && raw in enumObj) {
    return enumObj[raw as keyof T];
  }
  return undefined;
}

function handleSystemStatus(data: unknown, { store }: InboundHandlerContext): void {
  const d = asRecord(data);
  if (!d) return;
  const gunStatus = readEnumValue(GunStatusE, d.gun_status);
  const insStatus = readEnumValue(InsStatusE, d.tmaps_status);
  const radarStatus = readEnumValue(RadarStatusE, d.radar_status);
  if (gunStatus !== undefined) store.dispatch(setGunStatus(gunStatus));
  if (insStatus !== undefined) store.dispatch(setInsStatus(insStatus));
  if (radarStatus !== undefined) store.dispatch(setStatus(radarStatus));
  const coverage = d.radar_non_coverage;
  const range = d.radar_range;
  if (coverage !== undefined || range !== undefined) {
    store.dispatch(
      setRadarNonCoverage({
        coverage: coverage as string[] | undefined,
        range: typeof range === 'number' ? range : Number(range),
      }),
    );
  }
}

function handleGunBitStatus(data: unknown, { store }: InboundHandlerContext): void {
  const d = asRecord(data);
  if (!d) return;
  const status = readEnumValue(GunStatusE, d.status);
  if (status === undefined) return;
  store.dispatch(setGunStatus(status));
}

export function registerPlatformInboundHandlers(registry: MessageRegistry): void {
  registry.registerMany({
    [WsMessageName.Position]: handlePosition,
    [WsMessageName.PositionWire]: handlePosition,
    [WsMessageName.OdoCaliFinished]: handleOdoCaliFinished,
    [WsMessageName.Gun_Params]: handleGunParams,
    [WsMessageName.RadarStatus]: handleRadarStatus,
    [WsMessageName.RadarParams]: handleRadarParams,
    [WsMessageName.RadarParamsUpdate]: handleRadarParams,
    [WsMessageName.SystemStatus]: handleSystemStatus,
    [WsMessageName.GunBitStatus]: handleGunBitStatus,
  });
}
