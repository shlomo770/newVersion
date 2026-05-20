import communicationJson from '@/config/communication.json';
import type { CommunicationConfig, ServerEndpoints } from './communication.types';
import { ensureHttpScheme, ensureWebSocketScheme, getEnvString } from './env';

const communication = communicationJson as CommunicationConfig;

function resolveProfile(): ServerEndpoints {
  const mapFromEnv = getEnvString('VITE_MAP_SERVER');
  const messagesFromEnv =
    getEnvString('VITE_MESSAGES_WS_URL') ?? getEnvString('VITE_MESSAGES_SERVER');

  if (mapFromEnv || messagesFromEnv) {
    return {
      mapServer: mapFromEnv ?? communication.servers.mapServer,
      messagesServer: messagesFromEnv ?? communication.servers.messagesServer,
    };
  }

  return communication.servers;
}

export function getServerEndpoints(): ServerEndpoints {
  return resolveProfile();
}

export function getMapServerHost(): string {
  return getServerEndpoints().mapServer;
}

export function getMapServerBaseUrl(): string {
  return ensureHttpScheme(getMapServerHost());
}

export function getMessagesWebSocketUrl(): string {
  const messagesServer = getServerEndpoints().messagesServer;
  return ensureWebSocketScheme(messagesServer);
}

export function getAlternateServerEndpoints(): ServerEndpoints | undefined {
  return communication.serversc;
}
