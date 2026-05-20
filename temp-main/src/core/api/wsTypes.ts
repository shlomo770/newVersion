export interface WireMessageHeader {
  name: string;
  id?: string;
  ts?: number;
}

export interface InboundWireMessage {
  header: WireMessageHeader;
  data: unknown;
}

export interface OutboundWireMessage {
  header: WireMessageHeader;
  data: unknown;
}

export interface QueuedOutboundMessage {
  headerName: string;
  data: unknown;
}

export type ConnectionState = 'idle' | 'connecting' | 'open' | 'closed';

export type InboundMessageSubscriber = (message: InboundWireMessage) => void;

export type ConnectionChangeListener = (connected: boolean) => void;

export type Unsubscribe = () => void;

export interface WebSocketPingConfig {
  headerName: string;
  buildData: () => Record<string, unknown>;
  intervalMs: number;
}

export interface WebSocketClientOptions {
  url: string;
  reconnectBaseMs?: number;
  reconnectMaxMs?: number;
  connectTimeoutMs?: number;
  maxQueueSize?: number;
  autoConnect?: boolean;
  ping?: WebSocketPingConfig;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseInboundWireMessage(raw: unknown): InboundWireMessage | null {
  if (!isRecord(raw)) {
    return null;
  }

  const headerRaw = raw.header;
  if (!isRecord(headerRaw)) {
    return null;
  }

  const name = headerRaw.name;
  if (typeof name !== 'string' || name.length === 0) {
    return null;
  }

  const header: WireMessageHeader = { name };

  if (typeof headerRaw.id === 'string') {
    header.id = headerRaw.id;
  }

  if (typeof headerRaw.ts === 'number' && Number.isFinite(headerRaw.ts)) {
    header.ts = headerRaw.ts;
  }

  return {
    header,
    data: raw.data,
  };
}
