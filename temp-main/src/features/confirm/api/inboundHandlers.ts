import type { MessageRegistry } from '@core/ws/messageRegistry';
import type { InboundHandlerContext } from '@core/ws/types';
import { WsMessageName } from '@domain/enums/ws.enum';
import { showPrompt } from '../store/confirmSlice';

function handleConfirmPosition(_data: unknown, { store }: InboundHandlerContext): void {
  store.dispatch(
    showPrompt({
      title: 'אשר את המיקום של INS',
      message: 'אנא אשר שזה המיקום האמתי שלך ',
      confirmText: 'מאשר',
      cancelText: 'בטל',
    }),
  );
}

export function registerConfirmInboundHandlers(registry: MessageRegistry): void {
  registry.register(WsMessageName.ConfirmPosition, handleConfirmPosition);
}
