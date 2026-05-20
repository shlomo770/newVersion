import { WebSocketService } from '@/services/webSocket/WebSocketService';
import { WsMessageName } from '@domain/enums/ws.enum';

export interface AllocateTargetPayload {
  tgt_id: string;
  context: number;
}

export interface CancelEngagementPayload {
  tgt_id: string;
  context: number;
}

export interface SetTargetInfoPayload {
  tgt_id: string;
  platform_override: boolean;
  platform: number;
  identity_override: boolean;
  identity: number;
  is_allowed_in_tera: boolean;
}

const DEFAULT_ENGAGEMENT_CONTEXT = 0;

function assertNonEmptyTargetId(targetId: string): string {
  const id = String(targetId ?? '').trim();
  if (!id) {
    throw new Error('Target id is required for outbound command');
  }
  return id;
}

export function buildAllocateTargetPayload(
  targetId: string,
  context: number = DEFAULT_ENGAGEMENT_CONTEXT,
): AllocateTargetPayload {
  return {
    tgt_id: assertNonEmptyTargetId(targetId),
    context: Number.isFinite(context) ? context : DEFAULT_ENGAGEMENT_CONTEXT,
  };
}

export function buildCancelEngagementPayload(
  targetId: string,
  context: number = DEFAULT_ENGAGEMENT_CONTEXT,
): CancelEngagementPayload {
  return {
    tgt_id: assertNonEmptyTargetId(targetId),
    context: Number.isFinite(context) ? context : DEFAULT_ENGAGEMENT_CONTEXT,
  };
}

export function buildSetTargetInfoPayload(
  targetId: string,
  identityFriend: boolean,
  options?: {
    platformOverride?: boolean;
    platform?: number;
    identityOverride?: boolean;
    isAllowedInTera?: boolean;
  },
): SetTargetInfoPayload {
  return {
    tgt_id: assertNonEmptyTargetId(targetId),
    platform_override: options?.platformOverride ?? false,
    platform: options?.platform ?? 0,
    identity_override: options?.identityOverride ?? true,
    identity: identityFriend ? 1 : 0,
    is_allowed_in_tera: options?.isAllowedInTera ?? true,
  };
}

export function sendAllocateTarget(targetId: string, context?: number): void {
  const payload = buildAllocateTargetPayload(targetId, context);
  WebSocketService.getInstance().sendMessage(WsMessageName.Allocate, payload);
}

export function sendCancelEngagement(targetId: string, context?: number): void {
  const payload = buildCancelEngagementPayload(targetId, context);
  WebSocketService.getInstance().sendMessage(WsMessageName.CancelEngagement, payload);
}

export function sendSetTargetInfo(
  targetId: string,
  identityFriend: boolean,
  options?: Parameters<typeof buildSetTargetInfoPayload>[2],
): void {
  const payload = buildSetTargetInfoPayload(targetId, identityFriend, options);
  WebSocketService.getInstance().sendMessage(WsMessageName.SetTargetInfo, payload);
}
