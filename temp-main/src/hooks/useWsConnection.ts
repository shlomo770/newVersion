import { useWebSocket } from '@core/api/hooks/useWebSocket';

/**
 * @deprecated Prefer `useWebSocket().isConnected` — kept for backward compatibility.
 */
export const useWsConnection = (): boolean => {
  const { isConnected } = useWebSocket();
  return isConnected;
};
