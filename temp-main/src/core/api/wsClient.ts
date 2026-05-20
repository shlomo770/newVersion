import {
  ConnectionChangeListener,
  ConnectionState,
  InboundMessageSubscriber,
  InboundWireMessage,
  OutboundWireMessage,
  QueuedOutboundMessage,
  Unsubscribe,
  WebSocketClientOptions,
  parseInboundWireMessage,
} from './wsTypes';

const DEFAULT_RECONNECT_BASE_MS = 1000;
const DEFAULT_RECONNECT_MAX_MS = 15000;
const DEFAULT_CONNECT_TIMEOUT_MS = 5000;
const DEFAULT_MAX_QUEUE_SIZE = 500;

export class WebSocketClient {
  private readonly url: string;
  private readonly reconnectBaseMs: number;
  private readonly reconnectMaxMs: number;
  private readonly connectTimeoutMs: number;
  private readonly maxQueueSize: number;
  private readonly pingConfig: WebSocketClientOptions['ping'];

  private socket: WebSocket | null = null;
  private connectionState: ConnectionState = 'idle';
  private isDestroyed = false;
  private shouldReconnect = true;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private pingIntervalTimer: ReturnType<typeof setInterval> | null = null;

  private readonly inboundSubscribers = new Set<InboundMessageSubscriber>();
  private readonly connectionListeners = new Set<ConnectionChangeListener>();
  private readonly outboundQueue: QueuedOutboundMessage[] = [];

  constructor(options: WebSocketClientOptions) {
    this.url = options.url;
    this.reconnectBaseMs = options.reconnectBaseMs ?? DEFAULT_RECONNECT_BASE_MS;
    this.reconnectMaxMs = options.reconnectMaxMs ?? DEFAULT_RECONNECT_MAX_MS;
    this.connectTimeoutMs = options.connectTimeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS;
    this.maxQueueSize = options.maxQueueSize ?? DEFAULT_MAX_QUEUE_SIZE;
    this.pingConfig = options.ping;

    if (options.autoConnect !== false) {
      this.connect();
    }
  }

  public getUrl(): string {
    return this.url;
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  public getReadyState(): number {
    return this.socket?.readyState ?? WebSocket.CLOSED;
  }

  public connect(): void {
    if (this.isDestroyed) {
      return;
    }

    if (this.connectionState === 'connecting') {
      return;
    }

    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.clearConnectTimeout();
    this.connectionState = 'connecting';

    try {
      const socket = new WebSocket(this.url);
      this.socket = socket;

      this.connectTimeoutTimer = setTimeout(() => {
        if (socket.readyState === WebSocket.CONNECTING) {
          socket.close();
          this.connectionState = 'closed';
          this.scheduleReconnect();
          this.emitConnection(false);
        }
      }, this.connectTimeoutMs);

      socket.onopen = () => {
        this.clearConnectTimeout();
        this.connectionState = 'open';
        this.reconnectAttempt = 0;
        this.clearReconnectTimer();
        this.flushOutboundQueue();
        this.sendPing();
        this.startPingInterval();
        this.emitConnection(true);
      };

      socket.onmessage = (event: MessageEvent<string>) => {
        this.handleRawMessage(event.data);
      };

      socket.onclose = () => {
        this.clearConnectTimeout();
        this.stopPingInterval();
        this.connectionState = 'closed';
        this.socket = null;

        if (!this.isDestroyed && this.shouldReconnect) {
          this.scheduleReconnect();
        }

        this.emitConnection(false);
      };

      socket.onerror = () => {
        this.clearConnectTimeout();
        this.connectionState = 'closed';
        this.emitConnection(false);
      };
    } catch (error) {
      console.error('WebSocketClient: failed to create socket', error);
      this.connectionState = 'closed';
      this.scheduleReconnect();
      this.emitConnection(false);
    }
  }

  public subscribe(handler: InboundMessageSubscriber): Unsubscribe {
    this.inboundSubscribers.add(handler);
    return () => {
      this.inboundSubscribers.delete(handler);
    };
  }

  public onConnectionChange(listener: ConnectionChangeListener): Unsubscribe {
    this.connectionListeners.add(listener);
    listener(this.isConnected());
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  public send(headerName: string, data: unknown): void {
    if (this.isDestroyed) {
      return;
    }

    if (this.isConnected()) {
      this.transmit(headerName, data);
      return;
    }

    if (this.outboundQueue.length >= this.maxQueueSize) {
      this.outboundQueue.shift();
    }

    this.outboundQueue.push({ headerName, data });

    if (this.connectionState === 'idle' || this.connectionState === 'closed') {
      this.connect();
    }
  }

  public sendWireMessage(message: OutboundWireMessage): void {
    this.send(message.header.name, message.data);
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.shouldReconnect = false;

    this.clearReconnectTimer();
    this.clearConnectTimeout();
    this.stopPingInterval();

    this.inboundSubscribers.clear();
    this.connectionListeners.clear();
    this.outboundQueue.length = 0;

    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.close();
      this.socket = null;
    }

    this.connectionState = 'closed';
    this.emitConnection(false);
  }

  private handleRawMessage(rawData: string): void {
    let parsed: unknown;

    try {
      parsed = JSON.parse(rawData) as unknown;
    } catch (error) {
      console.error('WebSocketClient: JSON parse error', error);
      return;
    }

    const message = parseInboundWireMessage(parsed);
    if (!message) {
      return;
    }

    this.broadcastInbound(message);
  }

  private broadcastInbound(message: InboundWireMessage): void {
    for (const subscriber of this.inboundSubscribers) {
      try {
        subscriber(message);
      } catch (error) {
        console.error('WebSocketClient: inbound subscriber error', error);
      }
    }
  }

  private transmit(headerName: string, data: unknown): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const payload: OutboundWireMessage = {
      header: { name: headerName },
      data,
    };

    this.socket.send(JSON.stringify(payload));
  }

  private flushOutboundQueue(): void {
    while (this.outboundQueue.length > 0 && this.isConnected()) {
      const queued = this.outboundQueue.shift();
      if (!queued) {
        continue;
      }
      this.transmit(queued.headerName, queued.data);
    }
  }

  private sendPing(): void {
    if (!this.pingConfig || !this.isConnected()) {
      return;
    }

    this.transmit(this.pingConfig.headerName, this.pingConfig.buildData());
  }

  private startPingInterval(): void {
    this.stopPingInterval();

    if (!this.pingConfig) {
      return;
    }

    this.pingIntervalTimer = setInterval(() => {
      if (this.isConnected()) {
        this.sendPing();
        return;
      }
      this.stopPingInterval();
    }, this.pingConfig.intervalMs);
  }

  private stopPingInterval(): void {
    if (this.pingIntervalTimer !== null) {
      clearInterval(this.pingIntervalTimer);
      this.pingIntervalTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null || this.isDestroyed || !this.shouldReconnect) {
      return;
    }

    const exponentialDelay = Math.min(
      this.reconnectMaxMs,
      this.reconnectBaseMs * Math.pow(2, this.reconnectAttempt)
    );
    const jitter = Math.random() * 300;
    const delay = exponentialDelay + jitter;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempt += 1;
      if (!this.isDestroyed) {
        this.connect();
      }
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private clearConnectTimeout(): void {
    if (this.connectTimeoutTimer !== null) {
      clearTimeout(this.connectTimeoutTimer);
      this.connectTimeoutTimer = null;
    }
  }

  private emitConnection(connected: boolean): void {
    for (const listener of this.connectionListeners) {
      listener(connected);
    }
  }
}
