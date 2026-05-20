import type { MessageRegistry } from '@core/ws/messageRegistry';
import type { InboundHandlerContext } from '@core/ws/types';
import { WsMessageName } from '@domain/enums/ws.enum';
import { setCategorySnapshot } from '../store/faultsSlice';
import { mapPayloadToSnapshot } from './faultsPayload';

const RADAR_DEVICE = 'RADAR';

function parseJsonUnknown(ev: unknown): unknown {
  if (typeof ev === 'string') {
    try {
      return JSON.parse(ev) as unknown;
    } catch (error) {
      console.error('RADAR_BIT_STATUS parse error:', error);
      return null;
    }
  }
  return ev;
}

async function handleRadarBitStatus(data: unknown, { store }: InboundHandlerContext): Promise<void> {
  const parsed = parseJsonUnknown(data);
  if (parsed == null) return;
  const snap = mapPayloadToSnapshot(RADAR_DEVICE, parsed);
  store.dispatch(
    setCategorySnapshot({
      category: 'RADAR',
      faults: snap.items,
    }),
  );
}

export function registerFaultsInboundHandlers(registry: MessageRegistry): void {
  registry.register(WsMessageName.RadarBitStatus, handleRadarBitStatus);
}
