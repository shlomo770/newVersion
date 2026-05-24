import React, { useState, useEffect, FC } from 'react';
import { FaTrashAlt } from 'react-icons/fa';
import { RiImageEditLine } from "react-icons/ri";
import { useAppDispatch } from '@/hooks/useAppDispatch';
import type { Entity } from '@features/entities/store/entitiesSlice';
import { updateEntity, setSelectedEntity } from '@features/entities/store/entitiesSlice';
import { ENTITY_CATEGORY_OPTIONS } from '@/constants/entityCategories';
import { createCirclePolygon, createEllipsePolygon, createSectorPolygon } from '@/utils/geometry';
import { closePolygonCoordinates, openPolygonCoordinates } from '@/services/entities/EntityGeometryService';
import { sendUpdateEntity } from '../api/outboundBuilders';
import { hasTransparency } from '@domain/models/entity';
import { EntityCategoryEnum } from '@domain/enums/entity.enum';
import type { Coordinates } from '@domain/models/coordinates';
import type { MapService } from '@/services/map/MapService';
import { AppButton, AppFloatingPanel, AppIconButton, AppInput, AppSelect } from '@shared/ui';
import { swalWarning } from '@/utils/swalDialog';
import styles from './EntityEditPanel.module.css';



interface EntityEditPanelProps {
  entity: Entity | null;
  isOpen: boolean;
  onClose: () => void;
  onCenterToEntity: (entity: Entity) => void;
  mapServiceRef?: React.MutableRefObject<MapService | null>;
}

const EntityEditPanel: FC<EntityEditPanelProps> = ({
  entity,
  isOpen,
  onClose,
  mapServiceRef
}) => {
  const dispatch = useAppDispatch();
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [editingCoords, setEditingCoords] = useState<Array<{ lng: number, lat: number }>>([]);
  const [, setEditMode] = useState<boolean>(false);
  const [heightMeters, setHeightMeters] = useState<number>(0);


  const sendUpdatedEntity = (nextEntity: Entity) => {
    sendUpdateEntity(
      nextEntity.id,
      nextEntity.category,
      nextEntity.type,
      nextEntity.coordinates ?? [],
      nextEntity.name,
    );
  };

  useEffect(() => {
    if (entity?.coordinates && showCoordinates) {
      let coords = [...entity.coordinates];
      // For polygon, strip duplicate closing point so form shows real vertices (3 created → 3 in form)
      if (entity.type === 'polygon') {
        coords = openPolygonCoordinates(coords);
      }
      setEditingCoords(coords);
    }
  }, [entity?.id, entity?.type, showCoordinates, entity?.coordinates]);

  useEffect(() => {
    const alt = Number(entity?.coordinates?.[0]?.alt ?? 0);
    setHeightMeters(Number.isFinite(alt) ? alt : 0);
  }, [entity?.id, entity?.coordinates]);

  const applyCoordinateChanges = async () => {
    if (!entity || !mapServiceRef?.current) return;

    // Polygon must have at least 3 points
    if (entity.type === 'polygon' && editingCoords.length < 3) {
      await swalWarning('פוליגון חייב לכלול לפחות 3 נקודות.', 'עריכת פוליגון');
      return;
    }

    let geoJsonCoordinates;
    let nextCoordinats = [...editingCoords];
    if (entity.type === 'polygon') {
      // GeoJSON Polygon ring must be closed (first position = last position)
      const closedCoords = closePolygonCoordinates(editingCoords);
      nextCoordinats = closedCoords;
      geoJsonCoordinates = [closedCoords.map(c => [c.lng, c.lat])];
    } else if (entity.type === 'line') {
      geoJsonCoordinates = editingCoords.map(c => [c.lng, c.lat]);
    } else if (entity.type === 'circle' && editingCoords.length >= 2) {
      const polygonPoints = createCirclePolygon(editingCoords[0], editingCoords[1], 64);
      geoJsonCoordinates = [polygonPoints.map(c => [c.lng, c.lat])];
    } else if (entity.type === 'ellipse' && editingCoords.length >= 2) {
      const polygonPoints = createEllipsePolygon(editingCoords[0], editingCoords[1], 64);
      geoJsonCoordinates = [polygonPoints.map(c => [c.lng, c.lat])];
    } else if (entity.type === 'sector' && editingCoords.length >= 3) {
      const polygonPoints = createSectorPolygon(editingCoords[0], editingCoords[1], editingCoords[2], 32);
      geoJsonCoordinates = [polygonPoints.map(c => [c.lng, c.lat])];
    } else {
      geoJsonCoordinates = editingCoords.length > 0 ? [editingCoords[0].lng, editingCoords[0].lat] : [0, 0];
    }

    dispatch(updateEntity({
      id: entity.id,
      coordinates: nextCoordinats,
      geometry: { type: entity.geometry.type, coordinates: geoJsonCoordinates }
    }));
  };

  const handleFormChange = (updates: Partial<Entity>) => {
    if (!entity) return;
    dispatch(updateEntity({
      id: entity.id,
      ...updates
    }));
  };

  const handleHeightChange = (next: number) => {
    if (!entity) return;
    const safeHeight = Number.isFinite(next) ? next : 0;
    setHeightMeters(safeHeight);
    const nextCoords = (entity.coordinates ?? []).map((c: Coordinates): Coordinates => ({ ...c, alt: safeHeight }));
    handleFormChange({ coordinates: nextCoords });
  }

  const handleCancel = () => {
    dispatch(setSelectedEntity(null));
    setShowCoordinates(false);
    onClose();
  };


  const handleSubmit = () => {
    if (!entity) return;
    sendUpdatedEntity(entity);
  }

  const handleWaypointsClick = () => {
    if (!entity) return;
    if (entity.type === 'marker') {
      return;
    }
    if (entity && mapServiceRef?.current) {
      mapServiceRef.current.setEditMode(entity.id, entity);
      setEditMode(true);
    }
  };

  if (!isOpen || !entity) return null;

  return (
    <AppFloatingPanel open={isOpen} onClose={handleCancel} title="Editing Entity" position="left">
      <div className={styles.formStack}>
        <AppInput
          compact
          label="Name"
          value={entity?.name || ''}
          onChange={(e) => handleFormChange({ name: e.target.value })}
        />
        <AppInput
          compact
          label="Height"
          type="number"
          value={heightMeters}
          onChange={(e) => handleHeightChange(Number(e.target.value))}
        />

        <div className={styles.row}>
          <AppSelect
            compact
            label="Type"
            fieldClassName={styles.rowGrow}
            value={entity?.category || 'FREE'}
            onChange={(e) => handleFormChange({ category: Number(e.target.value) })}
          >
            {ENTITY_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {EntityCategoryEnum[opt]}
              </option>
            ))}
          </AppSelect>
          <input
            type="color"
            value={entity?.color || '#3b82f6'}
            onChange={(e) => handleFormChange({ color: e.target.value })}
            className={styles.colorInput}
            aria-label="Entity color"
          />
        </div>

        {entity && hasTransparency(entity) ? (
          <div>
            <label className={styles.rowLabel}>
              Opacity {Math.round(entity.transparency * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={entity.transparency}
              onChange={(e) => handleFormChange({ transparency: Number(e.target.value) })}
              className={styles.range}
            />
          </div>
        ) : null}

        <div className={styles.actionsStack}>
          <AppButton variant="secondary" fullWidth onClick={() => handleWaypointsClick()}>
            <RiImageEditLine className="w-6 h-6" />
          </AppButton>

          <AppButton variant="secondary" fullWidth onClick={handleSubmit}>
            שליחה
          </AppButton>

          <AppButton variant="ghost" fullWidth onClick={() => setShowCoordinates(!showCoordinates)}>
            {showCoordinates ? 'Hide' : 'Show'} Points
          </AppButton>

          {showCoordinates && entity?.coordinates ? (
            <div className={styles.coordsSection}>
              {editingCoords.map((coord, index) => {
                const minPoints =
                  entity.type === 'polygon' ? 3 :
                    entity.type === 'line' ? 2 :
                      entity.type === 'sector' ? 3 :
                        2;
                const canDelete =
                  (entity.type === 'polygon' || entity.type === 'line' || entity.type === 'sector') &&
                  editingCoords.length > minPoints;
                return (
                  <div key={index} className={styles.coordRow}>
                    <AppInput
                      compact
                      className={styles.coordInput}
                      step="0.000001"
                      value={coord.lng}
                      onChange={(e) => {
                        const newCoords = [...editingCoords];
                        newCoords[index] = { ...newCoords[index], lng: parseFloat(e.target.value) || 0 };
                        setEditingCoords(newCoords);
                      }}
                    />
                    <AppInput
                      compact
                      className={styles.coordInput}
                      step="0.000001"
                      value={coord.lat}
                      onChange={(e) => {
                        const newCoords = [...editingCoords];
                        newCoords[index] = { ...newCoords[index], lat: parseFloat(e.target.value) || 0 };
                        setEditingCoords(newCoords);
                      }}
                    />
                    {canDelete ? (
                      <AppIconButton
                        label="מחק נקודה"
                        size="sm"
                        danger
                        onClick={() => {
                          const newCoords = editingCoords.filter((_, i) => i !== index);
                          setEditingCoords(newCoords);
                        }}
                      >
                        <FaTrashAlt className="w-3 h-3" />
                      </AppIconButton>
                    ) : null}
                  </div>
                );
              })}

              <div className={styles.actionsStack}>
                <AppButton variant="primary" fullWidth onClick={applyCoordinateChanges}>
                  Ok
                </AppButton>
                <AppButton variant="ghost" fullWidth onClick={onClose}>
                  Cancel
                </AppButton>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AppFloatingPanel>
  );
};

export default EntityEditPanel;