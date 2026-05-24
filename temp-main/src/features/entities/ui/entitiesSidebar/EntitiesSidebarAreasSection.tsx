import React, { FC } from "react";
import { FaCopy, FaCrosshairs, FaEye, FaEyeSlash, FaPlus, FaTrashAlt } from "react-icons/fa";
import type { AppDispatch } from '@app/store';
import type { Entity } from '@features/entities/store/entitiesSlice';
import {
  setPreviewEntityId,
  setSelectedEntity,
  toggleEntityVisibility,
} from '@features/entities/store/entitiesSlice';
import { setEntityVisibilityOnMap } from "@/utils/mapEntityLayerVisibility";
import {
  EntityCategoryBadge,
  EntityTypeGlyph,
  getEntityTypeLabel,
} from "./entityDisplay";
import { isTabooZoneEntity } from './entitiesSidebarUtils';
import type { OutboundMessageMap, OutboundMessageName } from '@/services/webSocket/wsTypes';
import { confirmAndDeleteEntity } from '@features/entities/lib/entityDelete';
import { he } from '@shared/i18n';
import { useMapCommandsOptional } from '@features/map';
import { AppButton, AppIconButton, AppInput, cn } from "@shared/ui";
import { ENTITIES_SIDEBAR_ICONS } from "@/config";
import styles from "./EntitiesSidebar.shared.module.css";

export type EntitiesSidebarAreasSectionProps = {
  onBack: () => void;
  areaSearchQuery: string;
  setAreaSearchQuery: (q: string) => void;
  filteredAreaByCategory: Record<string, Record<string, Entity[]>>;
  openAreaCategory: string | null;
  setOpenAreaCategory: (v: string | null) => void;
  openAreaTypeKey: string | null;
  setOpenAreaTypeKey: (v: string | null) => void;
  editingEntityId?: string | null;
  selectedEntityId: string | null;
  activeMissionName: string | null;
  dispatch: AppDispatch;
  sendMessage: <T extends OutboundMessageName>(headerName: T, data: OutboundMessageMap[T]) => void;
  setGroupVisibility: (list: Entity[], visible: boolean) => void;
  deleteGroup: (list: Entity[], label: string) => void | Promise<void>;
  onEditEntity: (entity: Entity) => void;
  onCenterToEntity: (entity: Entity) => void;
  onOpenCreatePanel?: () => void;
  entityOpen: Entity | null;
  openDuplicatePanel: (entity: Entity) => void;
};

const EntitiesSidebarAreasSection: FC<EntitiesSidebarAreasSectionProps> = ({
  onBack,
  areaSearchQuery,
  setAreaSearchQuery,
  filteredAreaByCategory,
  openAreaCategory,
  setOpenAreaCategory,
  openAreaTypeKey,
  setOpenAreaTypeKey,
  editingEntityId,
  selectedEntityId,
  activeMissionName,
  dispatch,
  setGroupVisibility,
  deleteGroup,
  onEditEntity,
  onCenterToEntity,
  onOpenCreatePanel,
  entityOpen,
  openDuplicatePanel,
}) => {
  const mapCommands = useMapCommandsOptional();

  const handleEntityClick = (entity: Entity) => {
    if (entity.type === 'marker' || isTabooZoneEntity(entity)) {
      dispatch(setSelectedEntity(entity.id));
      return;
    }
    dispatch(setSelectedEntity(entity.id));
    onEditEntity(entity);
  };

  const handleDeleteEntity = async (e: React.MouseEvent, entity: Entity) => {
    e.stopPropagation();
    await confirmAndDeleteEntity({
      entity,
      editingEntityId,
      dispatch,
      mapCommands,
      selectedEntityId,
    });
  };

  const applyVisibility = (entity: Entity, nextVisible: boolean) => {
    dispatch(toggleEntityVisibility(entity.id));
    const map = mapCommands?.getMap() ?? null;
    setEntityVisibilityOnMap(map, entity.id, nextVisible);
  };

  return (
    <div className={styles.scrollSection}>
      <button type="button" onClick={onBack} className={styles.backLink}>
        <img src={ENTITIES_SIDEBAR_ICONS.back} alt="" className={styles.backIcon} />
        {he.common.back}
      </button>

      <div className={styles.sectionHeader}>
        <p className={styles.sectionTitle}>{he.entities.sidebar.areas}</p>
        <AppIconButton size="sm" label={he.entities.sidebar.newAreaEntity} onClick={() => onOpenCreatePanel?.()}>
          <FaPlus />
        </AppIconButton>
      </div>

      <AppInput
        compact
        fieldClassName={styles.fieldStack}
        value={areaSearchQuery}
        onChange={(e) => setAreaSearchQuery(e.target.value)}
        placeholder={he.entities.sidebar.areaSearchPlaceholder}
      />

      <div className={styles.listSpaced}>
        {Object.entries(filteredAreaByCategory).map(([cat, types]) => {
          const catList = Object.values(types).flat();
          const catCount = catList.length;
          const isCatOpen = openAreaCategory === cat;
          const allHidden = catList.length > 0 && catList.every((e) => !e.visible);
          const hasEditingInCategory =
            !!editingEntityId && catList.some((e) => e.id === editingEntityId);
          return (
            <div key={cat}>
              <div className={cn(styles.groupCard, styles.groupHeader)}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenAreaCategory(isCatOpen ? null : cat);
                    setOpenAreaTypeKey(null);
                  }}
                  className={styles.groupToggle}
                >
                  <span className={styles.groupToggleInner}>
                    <EntityCategoryBadge category={cat} />
                    <span className={styles.badge}>{catCount}</span>
                    <span className={styles.entityName}>{cat}</span>
                  </span>
                  <span
                    className={cn(styles.groupChevron, isCatOpen && styles.groupChevronOpen)}
                    aria-hidden
                  />
                </button>
                <AppIconButton
                  size="sm"
                  label={allHidden ? he.common.showAllPlural : he.common.hideAllPlural}
                  onClick={(e) => {
                    e.stopPropagation();
                    setGroupVisibility(catList, allHidden);
                  }}
                >
                  {allHidden ? <FaEye /> : <FaEyeSlash />}
                </AppIconButton>
                <AppIconButton
                  size="sm"
                  danger
                  label={
                    hasEditingInCategory
                      ? he.entities.delete.cannotDeleteCategoryEditing
                      : he.entities.delete.deleteCategory
                  }
                  disabled={hasEditingInCategory}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteGroup(catList, he.entities.sidebar.categoryDeletePrefix(cat));
                  }}
                >
                  <FaTrashAlt />
                </AppIconButton>
              </div>

              {isCatOpen && (
                <div className={styles.groupChildren}>
                  {Object.entries(types).map(([type, list]) => {
                    const typeKey = `${cat}:${type}`;
                    const isTypeOpen = openAreaTypeKey === typeKey;
                    const typeCount = list.length;
                    const typeLabel = getEntityTypeLabel(type);
                    const typeAllHidden = list.length > 0 && list.every((e) => !e.visible);
                    const hasEditingInType =
                      !!editingEntityId && list.some((e) => e.id === editingEntityId);
                    return (
                      <div key={typeKey}>
                        <div className={cn(styles.groupCard, styles.groupCardNested, styles.groupHeader)}>
                          <button
                            type="button"
                            onClick={() => setOpenAreaTypeKey(isTypeOpen ? null : typeKey)}
                            className={styles.groupToggle}
                          >
                            <span className={styles.groupToggleInner}>
                              <span className={styles.glyphBox}>
                                <EntityTypeGlyph type={type} />
                              </span>
                              <span className={cn(styles.badge, styles.badgeSm)}>{typeCount}</span>
                              <span className={styles.entityName}>{typeLabel}</span>
                            </span>
                            <span
                              className={cn(styles.groupChevron, isTypeOpen && styles.groupChevronOpen)}
                              aria-hidden
                            />
                          </button>
                          <AppIconButton
                            size="sm"
                            label={typeAllHidden ? he.common.showAllPlural : he.common.hideAllPlural}
                            onClick={(e) => {
                              e.stopPropagation();
                              setGroupVisibility(list, typeAllHidden);
                            }}
                          >
                            {typeAllHidden ? <FaEye /> : <FaEyeSlash />}
                          </AppIconButton>
                          <AppIconButton
                            size="sm"
                            danger
                            label={
                              hasEditingInType
                                ? he.entities.delete.cannotDeleteTypeEditing
                                : he.entities.delete.deleteType
                            }
                            disabled={hasEditingInType}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteGroup(list, he.entities.sidebar.typeDeletePrefix(typeLabel));
                            }}
                          >
                            <FaTrashAlt />
                          </AppIconButton>
                        </div>

                        {isTypeOpen && (
                          <ul
                            className={styles.entityList}
                            onMouseLeave={() => {
                              if (activeMissionName) dispatch(setPreviewEntityId(null));
                            }}
                          >
                            {list.map((entity) => {
                              const isSelected = selectedEntityId === entity.id;
                              return (
                                <li
                                  key={entity.id}
                                  onMouseEnter={() => {
                                    if (activeMissionName) dispatch(setPreviewEntityId(entity.id));
                                  }}
                                  onClick={() => handleEntityClick(entity)}
                                  className={cn(
                                    styles.entityRow,
                                    isSelected ? styles.entityRowSelected : styles.entityRowDefault,
                                    !entity.visible && styles.entityRowHidden,
                                  )}
                                >
                                  <div className={styles.entityName}>{entity.name}</div>
                                  <div className={styles.entityActions}>
                                    <AppIconButton
                                      size="sm"
                                      label={he.entities.sidebar.centerOnMapAlt}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onCenterToEntity(entity);
                                      }}
                                    >
                                      <FaCrosshairs />
                                    </AppIconButton>
                                    <AppIconButton
                                      size="sm"
                                      label={entity.visible ? he.common.hide : he.common.show}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        applyVisibility(entity, !entity.visible);
                                      }}
                                    >
                                      {entity.visible ? <FaEye /> : <FaEyeSlash />}
                                    </AppIconButton>
                                    <AppIconButton
                                      size="sm"
                                      danger
                                      label={
                                        editingEntityId === entity.id
                                          ? he.entities.delete.cannotDeleteEntityEditing
                                          : he.common.delete
                                      }
                                      disabled={editingEntityId === entity.id}
                                      onClick={(e) => handleDeleteEntity(e, entity)}
                                    >
                                      <FaTrashAlt />
                                    </AppIconButton>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {entityOpen && selectedEntityId === entityOpen.id && (
        <div className={styles.selectedFooter}>
          <div className={styles.selectedFooterRow}>
            <div className={styles.entityName}>
              <span className={styles.selectedLabel}>{he.entities.sidebar.selectedPrefix}</span>
              <span className={styles.selectedName}>{entityOpen.name}</span>
              {entityOpen.category && (
                <span className={styles.selectedMeta}> · {entityOpen.category}</span>
              )}
            </div>
            <AppButton
              variant="secondary"
              size="sm"
              onClick={() => openDuplicatePanel(entityOpen)}
              title={he.entities.sidebar.duplicateEntityTitle}
            >
              <FaCopy />
              {he.entities.sidebar.duplicateVerb}
            </AppButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntitiesSidebarAreasSection;
