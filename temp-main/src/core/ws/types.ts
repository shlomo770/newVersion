import type { Store } from 'redux';

/**
 * Opaque dispatch context passed to every inbound handler.
 * Core defines the shape; the app supplies a Redux store instance at runtime.
 */
export interface InboundHandlerContext {
  readonly store: Store;
}

/**
 * Handler for a single inbound WebSocket message topic (opcode / header name).
 * Payload is always treated as unknown until the handler validates it.
 */
export type InboundMessageHandler = (
  data: unknown,
  context: InboundHandlerContext,
) => void | Promise<void>;

export type InboundHandlerMap = Readonly<Record<string, InboundMessageHandler>>;
