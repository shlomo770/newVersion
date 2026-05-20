import { RadarStateE, RadarStatusE } from '../enums/status.enum';
import type { RadarValues } from '../models/radar';
import { WsMessageName } from '../enums/ws.enum';
import type { OutboundMessageMap } from '@/services/webSocket/wsTypes';
import { isPlainObject, readFiniteNumber } from '../utils/record';

export const RADAR_PARAM_KEYS = [
  'mode',
  'missionCategory',
  'freqIndex',
  'min_elevation',
  'blanking_sectors',
] as const satisfies readonly (keyof RadarValues)[];

export type RadarParamKey = (typeof RADAR_PARAM_KEYS)[number];

export type RadarParamsPatch = Pick<
  RadarValues,
  'mode' | 'missionCategory' | 'freqIndex' | 'min_elevation' | 'blanking_sectors'
>;

export function normalizeInboundRadarParamsWire(data: unknown): Partial<RadarParamsPatch> {
  if (!isPlainObject(data)) {
    return {};
  }

  const output: Partial<RadarParamsPatch> = {};

  const radarMode = data.radar_mode ?? data.radarMode;
  const parsedMode = readFiniteNumber(radarMode);
  if (
    parsedMode !== undefined &&
    parsedMode >= RadarStateE.OFF &&
    parsedMode <= RadarStateE.OPERATE
  ) {
    output.mode = parsedMode as RadarStateE;
  }

  const missionCategory = data.mission_category ?? data.missionCategory;
  const parsedMissionCategory = readFiniteNumber(missionCategory);
  if (parsedMissionCategory !== undefined) {
    output.missionCategory = parsedMissionCategory;
  }

  const freqIndex = data.freq_index ?? data.freqIndex;
  const parsedFreqIndex = readFiniteNumber(freqIndex);
  if (parsedFreqIndex !== undefined) {
    output.freqIndex = parsedFreqIndex;
  }

  const minElevation = data.min_elevation ?? data.minElevation;
  const parsedMinElevation = readFiniteNumber(minElevation);
  if (parsedMinElevation !== undefined) {
    output.min_elevation = parsedMinElevation;
  }

  const blankingSectors = data.blanking_sectors ?? data.blankingSectors;
  const parsedBlankingSectors = readFiniteNumber(blankingSectors);
  if (parsedBlankingSectors !== undefined) {
    output.blanking_sectors = parsedBlankingSectors;
  }

  return output;
}

export function mapRadarWireStateToStatus(state: unknown): RadarStatusE | undefined {
  if (
    typeof state === 'number' &&
    Number.isInteger(state) &&
    state >= RadarStatusE.NO_COMM &&
    state <= RadarStatusE.OK
  ) {
    return state as RadarStatusE;
  }

  if (typeof state === 'string' && state in RadarStatusE) {
    const key = state as keyof typeof RadarStatusE;
    const numeric = RadarStatusE[key];
    if (typeof numeric === 'number') {
      return numeric;
    }
  }

  return undefined;
}

export function buildSetRadarParamsPayload(
  formValues: RadarValues,
): OutboundMessageMap[WsMessageName.SetRadarParams] {
  return {
    radar_mode: formValues.mode,
    mission_category: formValues.missionCategory,
    freq_index: formValues.freqIndex,
    min_elevation: formValues.min_elevation,
    blanking_sectors: formValues.blanking_sectors,
  };
}
