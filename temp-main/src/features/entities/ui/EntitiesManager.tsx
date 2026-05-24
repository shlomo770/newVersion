import React, { useState, FC } from 'react';
import type { Entity } from '../store/entitiesSlice';
import { useAppSelector } from '@/hooks/useAppSelector';
import { handleCenterToEntity } from '@/utils/general';
import EntitiesButton from './EntitiesButton';
import EntitiesSidebar from './EntitiesSidebar';
import EntityEditPanel from './EntityEditPanel';
import EntityCreationPanel from './EntityCreationPanel';
import EntityMarkerCreationPanel from './EntityMarkerCreationPanel';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setCreationForm, setActiveEditEntityId } from '@features/entities/store/entitiesSlice';
import { EntityCategoryEnum } from '@domain/enums/entity.enum';
import type { MapService } from '@/services/map/MapService';

interface EntitiesManagerProps {
  map: maplibregl.Map;
  mapServiceRef?: React.MutableRefObject<MapService | null>;
  isSidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;
  hideOwnButton?: boolean;
}

const EntitiesManager: FC<EntitiesManagerProps> = ({
  map,
  mapServiceRef,
  isSidebarOpen: controlledOpen,
  onSidebarOpenChange,
  hideOwnButton = false,
}) => {
  const dispatch = useAppDispatch();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isSidebarOpen = isControlled ? Boolean(controlledOpen) : internalOpen;
  const setIsSidebarOpen = (next: boolean) => {
    if (isControlled) {
      onSidebarOpenChange?.(next);
    } else {
      setInternalOpen(next);
      onSidebarOpenChange?.(next);
    }
  };
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [isCreationPanelOpen, setIsCreationPanelOpen] = useState(false);
  const [isMarkerCreationOpen, setIsMarkerCreationOpen] = useState(false);
  const activeEditEntityId = useAppSelector((state) => state.entities.activeEditEntityId);
  const entities = useAppSelector((state) => state.entities.byId);
  const editingEntity = activeEditEntityId ? entities[activeEditEntityId] : null;

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleEditEntity = (entity: Entity) => {
    dispatch(setActiveEditEntityId(entity.id));
    setIsEditPanelOpen(true);
    setIsCreationPanelOpen(false);
    setIsMarkerCreationOpen(false);
  };

  const handleCloseEditPanel = () => {
    setIsEditPanelOpen(false);
    dispatch(setActiveEditEntityId(null));
  };

  const handleOpenAreas = () => {
    setIsCreationPanelOpen(true);
    setIsMarkerCreationOpen(false);
  };

  const handleOpenMarkers = () => {
    setIsMarkerCreationOpen(true);
    setIsCreationPanelOpen(false);
  };

  const handleOpenCreateWithCategory = (category: EntityCategoryEnum) => {
    dispatch(setCreationForm({ name: '', category, height: 0 }));
    setIsCreationPanelOpen(true);
    setIsMarkerCreationOpen(false);
    setIsEditPanelOpen(false);
    dispatch(setActiveEditEntityId(null));
  };

  const clickToHandleCenterToEntity = (entity: Entity) => {
    handleCenterToEntity(entity, map);
  };

  return (
    <>
      {!hideOwnButton && <EntitiesButton onToggleSidebar={handleToggleSidebar} />}
      <EntitiesSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onEditEntity={handleEditEntity}
        onCenterToEntity={clickToHandleCenterToEntity}
        onOpenCreatePanel={handleOpenAreas}
        onOpenCreatePanelWithCategory={handleOpenCreateWithCategory}
        onRequestCloseEditPanel={handleCloseEditPanel}
        onOpenCreateMarkerPanel={handleOpenMarkers}
        editingEntityId={isEditPanelOpen ? activeEditEntityId : null}
        mapServiceRef={mapServiceRef}
      />
      <EntityEditPanel
        entity={editingEntity}
        isOpen={isEditPanelOpen}
        onClose={handleCloseEditPanel}
        onCenterToEntity={clickToHandleCenterToEntity}
        mapServiceRef={mapServiceRef}
      />
      {isCreationPanelOpen && (
        <EntityCreationPanel
          isOpen={isCreationPanelOpen}
          onClose={() => setIsCreationPanelOpen(false)}
        />
      )}
      {isMarkerCreationOpen && (
        <EntityMarkerCreationPanel
          isOpen={isMarkerCreationOpen}
          onClose={() => setIsMarkerCreationOpen(false)}
        />
      )}
    </>
  );
};

export default EntitiesManager;
