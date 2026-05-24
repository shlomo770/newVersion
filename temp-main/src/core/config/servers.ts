import communicationJson from '@/config/communication.json';
import type { CommunicationConfig, ServerEndpoints } from './communication.types';
import { ensureHttpScheme, ensureWebSocketScheme, getEnvString } from './env';

const communication = communicationJson as CommunicationConfig;

function resolveProfile(): ServerEndpoints {
  const mapFromEnv = getEnvString('VITE_MAP_SERVER');
  const messagesFromEnv =
    getEnvString('VITE_MESSAGES_WS_URL') ?? getEnvString('VITE_MESSAGES_SERVER');
  const apiFromEnv = getEnvString('VITE_API_SERVER') ?? getEnvString('VITE_API_BASE_URL');

  if (mapFromEnv || messagesFromEnv || apiFromEnv) {
    return {
      mapServer: mapFromEnv ?? communication.servers.mapServer,
      messagesServer: messagesFromEnv ?? communication.servers.messagesServer,
      apiServer: apiFromEnv ?? communication.servers.apiServer,
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

/**
 * Returns the REST API base URL (fully scheme-qualified), or `undefined`
 * when no REST endpoint is configured. Callers that require REST must
 * check before constructing a `RestClient`.
 */
export function getApiBaseUrl(): string | undefined {
  const raw = getServerEndpoints().apiServer;
  if (!raw) return undefined;
  return ensureHttpScheme(raw);
}
