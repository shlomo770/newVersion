import type { AppDispatch } from '@app/store';
import type { Entity } from '@features/entities/store/entitiesSlice';
import { removeEntity, setSelectedEntity } from '@features/entities/store/entitiesSlice';
import { sendDeleteEntity } from '@features/entities/api/outboundBuilders';
import type { MapCommands } from '@features/map/context/mapCommands';
import { swalConfirmDanger, swalInfo } from '@/utils/swalDialog';
import { he } from '@shared/i18n';

export interface DeleteEntityOptions {
  entity: Entity;
  editingEntityId?: string | null;
  dispatch: AppDispatch;
  mapCommands?: MapCommands | null;
  selectedEntityId?: string | null;
  onEditClosed?: () => void;
}

/** Same flow as entity-tree delete: confirm → WS → Redux → map layer. */
export async function confirmAndDeleteEntity({
  entity,
  editingEntityId,
  dispatch,
  mapCommands,
  selectedEntityId,
  onEditClosed,
}: DeleteEntityOptions): Promise<boolean> {
  if (editingEntityId === entity.id) {
    await swalInfo(he.entities.delete.cannotDeleteEditing, he.entities.delete.cannotDeleteTitle);
    return false;
  }

  const ok = await swalConfirmDanger(he.entities.delete.confirmSingle(entity.name), {
    title: he.entities.delete.entityTitle,
    confirmText: he.common.delete,
    cancelText: he.common.cancel,
  });
  if (!ok) return false;

  sendDeleteEntity(entity.id);
  dispatch(removeEntity(entity.id));
  mapCommands?.removeEntityFromMap(entity.id);
  if (selectedEntityId === entity.id) {
    dispatch(setSelectedEntity(null));
  }
  if (editingEntityId === entity.id) {
    onEditClosed?.();
  }
  return true;
}
