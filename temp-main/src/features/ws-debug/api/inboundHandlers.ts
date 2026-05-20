import type { MessageRegistry } from '@core/ws/messageRegistry';
import type { InboundHandlerContext } from '@core/ws/types';
import { WsMessageName } from '@domain/enums/ws.enum';
import { appendInboundWsMessage } from '../store/wsInboundSlice';

function handleTmapsBitStatus(data: unknown, { store }: InboundHandlerContext): void {
  store.dispatch(appendInboundWsMessage({ name: WsMessageName.TmapsBitStatus, payload: data }));
}

export function registerWsDebugInboundHandlers(registry: MessageRegistry): void {
  registry.register(WsMessageName.TmapsBitStatus, handleTmapsBitStatus);
}
