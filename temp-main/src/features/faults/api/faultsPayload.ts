import { ErrorSeverityE, ErrorStateE } from '@/enums/general.enum';

export interface FaultWireItem {
  code: number;
  description: string;
  severity: ErrorSeverityE;
  state: ErrorStateE;
  category: string;
}

export interface DeviceSnapshot {
  items: FaultWireItem[];
}

function asRecord(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  return data as Record<string, unknown>;
}

function parseFaultBitEntry(raw: unknown): FaultWireItem | null {
  const b = asRecord(raw);
  if (!b) return null;
  const code = Number(b.code);
  const description = typeof b.description === 'string' ? b.description : String(b.description ?? '');
  const severity = Number(b.severity);
  const state = Number(b.state);
  if (!Number.isFinite(code) || !Number.isFinite(severity) || !Number.isFinite(state)) {
    return null;
  }
  return {
    code,
    description,
    severity: severity as ErrorSeverityE,
    state: state as ErrorStateE,
    category: '',
  };
}

export function mapPayloadToSnapshot(device: string, data: unknown): DeviceSnapshot {
  const bits = Array.isArray(data) ? data : [];
  const items: FaultWireItem[] = [];
  for (const raw of bits) {
    const item = parseFaultBitEntry(raw);
    if (!item) continue;
    items.push({ ...item, category: device });
  }
  return { items };
}
