import { globalMessageRegistry } from '@core/ws/messageRegistry';
import { registerEntitiesInboundHandlers } from '@features/entities/api/inboundHandlers';
import { registerTargetsInboundHandlers } from '@features/targets/api/inboundHandlers';
import { registerPlatformInboundHandlers } from '@features/platform/api/inboundHandlers';
import { registerMapInboundHandlers } from '@features/map/api/inboundHandlers';
import { registerFaultsInboundHandlers } from '@features/faults/api/inboundHandlers';
import { registerConfirmInboundHandlers } from '@features/confirm/api/inboundHandlers';
import { WsMessageName } from '@domain/enums/ws.enum';

let bootstrapped = false;

function registerNoopHandlers(): void {
  globalMessageRegistry.register(WsMessageName.SaveResult, () => {});
}

/**
 * Wires all feature-level inbound handlers into the core message registry.
 * Idempotent — safe to call more than once during hot reload.
 */
export function registerInboundHandlers(): void {
  if (bootstrapped) return;

  registerEntitiesInboundHandlers(globalMessageRegistry);
  registerTargetsInboundHandlers(globalMessageRegistry);
  registerPlatformInboundHandlers(globalMessageRegistry);
  registerMapInboundHandlers(globalMessageRegistry);
  registerFaultsInboundHandlers(globalMessageRegistry);
  registerConfirmInboundHandlers(globalMessageRegistry);
  registerNoopHandlers();

  bootstrapped = true;
}
