function readEnvString(key: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[key];
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readEnvBoolean(key: keyof ImportMetaEnv, defaultValue = false): boolean {
  const raw = readEnvString(key);
  if (raw === undefined) {
    return defaultValue;
  }
  return raw === 'true' || raw === '1' || raw === 'yes';
}

export function getEnvString(key: keyof ImportMetaEnv): string | undefined {
  return readEnvString(key);
}

export function getEnvBoolean(key: keyof ImportMetaEnv, defaultValue = false): boolean {
  return readEnvBoolean(key, defaultValue);
}

export function ensureWebSocketScheme(hostOrUrl: string): string {
  const trimmed = hostOrUrl.trim();
  if (trimmed.startsWith('ws://') || trimmed.startsWith('wss://')) {
    return trimmed;
  }
  return `ws://${trimmed}`;
}

export function ensureHttpScheme(hostOrUrl: string): string {
  const trimmed = hostOrUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `http://${trimmed}`;
}
