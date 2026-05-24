export { WebSocketClient } from './wsClient';
export type {
  ConnectionChangeListener,
  ConnectionState,
  InboundMessageSubscriber,
  InboundWireMessage,
  OutboundWireMessage,
  QueuedOutboundMessage,
  Unsubscribe,
  WebSocketClientOptions,
  WebSocketPingConfig,
  WireMessageHeader,
} from './wsTypes';
export { isRecord, parseInboundWireMessage } from './wsTypes';
export { useWebSocket } from './hooks/useWebSocket';
export type { UseWebSocketResult } from './hooks/useWebSocket';

export { RestClient } from './restClient';
export {
  RestError,
  type QueryParams,
  type QueryPrimitive,
  type RestClientOptions,
  type RestErrorKind,
  type RestMethod,
  type RestRequestOptions,
  type RestResponse,
} from './restTypes';
export { getRestClient, resetRestClient } from './restClientSingleton';
