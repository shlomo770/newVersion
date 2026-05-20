import { useCallback, useEffect, useRef, useState } from 'react';
import { WebSocketService } from '@/services/webSocket/WebSocketService';
import type { OutboundMessageMap, OutboundMessageName } from '@/services/webSocket/wsTypes';

export interface UseWebSocketResult {
  sendMessage: <T extends OutboundMessageName>(headerName: T, data: OutboundMessageMap[T]) => void;
  isConnected: boolean;
}

export function useWebSocket(): UseWebSocketResult {
  const serviceRef = useRef<WebSocketService | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const service = WebSocketService.getInstance();
    serviceRef.current = service;
    setIsConnected(service.isConnected());

    const unsubscribe = service.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    return unsubscribe;
  }, []);

  const sendMessage = useCallback(
    <T extends OutboundMessageName>(headerName: T, data: OutboundMessageMap[T]) => {
      const service = serviceRef.current ?? WebSocketService.getInstance();
      service.sendMessage(headerName, data);
    },
    []
  );

  return {
    sendMessage,
    isConnected,
  };
}
