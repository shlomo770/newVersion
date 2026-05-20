/**
 * @deprecated Inbound handlers are registered via `@app/ws/registerInboundHandlers`
 * and dispatched through `@core/ws/messageRegistry`. This module remains for
 * backward-compatible imports only.
 */
export type { InboundHandlerContext as MessageHandlerContext } from '@core/ws/types';
export type { InboundMessageHandler as MessageHandler } from '@core/ws/types';

export { globalMessageRegistry } from '@core/ws/messageRegistry';
export { registerInboundHandlers } from '@app/ws/registerInboundHandlers';
