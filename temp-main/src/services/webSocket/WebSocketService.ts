import type { Store } from 'redux';
import { WebSocketClient } from '@core/api/wsClient';
import type { InboundWireMessage } from '@core/api/wsTypes';
import { globalMessageRegistry } from '@core/ws/messageRegistry';
import { getMessagesWebSocketUrl } from '@core/config/servers';
import { store } from '@app/store';
import { registerInboundHandlers } from '@app/ws/registerInboundHandlers';
import type { OutboundMessageMap, OutboundMessageName } from './wsTypes';
import { unwrapVal } from '@domain/utils/unwrapVal';
import { WsMessageName } from '@domain/enums/ws.enum';
import { validateOutboundMessage } from './wsValidators';

let serviceInstance: WebSocketService | null = null;

export class WebSocketService {
  private readonly client: WebSocketClient;

  private constructor(client: WebSocketClient) {
    this.client = client;
    this.client.subscribe(this.routeInboundMessage);
  }

  public static getInstance(url?: string): WebSocketService {
    if (!serviceInstance) {
      registerInboundHandlers();
      const resolvedUrl = url ?? getMessagesWebSocketUrl();
      const client = new WebSocketClient({
        url: resolvedUrl,
        reconnectBaseMs: 1000,
        reconnectMaxMs: 15000,
        connectTimeoutMs: 5000,
        maxQueueSize: 500,
        ping: {
          headerName: WsMessageName.Ping,
          intervalMs: 30000,
          buildData: () => ({ timestamp: Date.now() }),
        },
      });
      serviceInstance = new WebSocketService(client);
    }
    return serviceInstance;
  }

  public getClient(): WebSocketClient {
    return this.client;
  }

  public onConnectionChange(listener: (connected: boolean) => void): () => void {
    return this.client.onConnectionChange(listener);
  }

  public isConnected(): boolean {
    return this.client.isConnected();
  }

  public getReadyState(): number {
    return this.client.getReadyState();
  }

  public sendMessage<T extends OutboundMessageName>(headerName: T, data: OutboundMessageMap[T]): void {
    if (!validateOutboundMessage(headerName, data)) {
      console.error('WS OUT invalid payload:', headerName, data);
      return;
    }
    this.client.send(headerName, data);
  }

  public disconnect(): void {
    this.client.destroy();
    serviceInstance = null;
  }

  private routeInboundMessage = (message: InboundWireMessage): void => {
    const messageName = message.header.name;

    if (!this.isKnownMessageName(messageName)) {
      return;
    }

    const handler = globalMessageRegistry.get(messageName);
    if (!handler) {
      console.warn('No handler for message type:', messageName);
      return;
    }

    const normalizedData = unwrapVal(message.data);

    try {
      const result = handler(normalizedData, { store });
      if (result instanceof Promise) {
        result.catch((error: unknown) => {
          console.error('Async handler error for', messageName, error);
        });
      }
    } catch (error) {
      console.error('Handler error for', messageName, error);
    }
  };

  private isKnownMessageName(name: string): name is WsMessageName {
    return Object.values(WsMessageName).includes(name as WsMessageName);
  }
}

export function getWebSocketStore(): Store {
  return store;
}
