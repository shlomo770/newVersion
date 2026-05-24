import React, { FC } from "react";
import { FaCrosshairs, FaEye, FaEyeSlash, FaPlus, FaTrashAlt, FaChevronLeft } from "react-icons/fa";
import { MARKER_ICONS, getMarkerIconChar } from "@/constants/markerIcons";
import type { AppDispatch } from '@app/store';
import type { Entity } from '@features/entities/store/entitiesSlice';
import {
  setPreviewEntityId,
  setSelectedEntity,
  toggleEntityVisibility,
} from '@features/entities/store/entitiesSlice';
import { setEntityVisibilityOnMap } from "@/utils/mapEntityLayerVisibility";
import { isTabooZoneEntity } from './entitiesSidebarUtils';
import type { OutboundMessageMap, OutboundMessageName } from '@/services/webSocket/wsTypes';
import { confirmAndDeleteEntity } from '@features/entities/lib/entityDelete';
import { useMapCommandsOptional } from '@features/map';
import { he } from '@shared/i18n';
import { AppIconButton, AppInput, cn } from "@shared/ui";
import { ENTITIES_SIDEBAR_ICONS } from "@/config";
import styles from "./EntitiesSidebar.shared.module.css";

export type EntitiesSidebarPointsSectionProps = {
  onBack: () => void;
  pointsSearchQuery: string;
  setPointsSearchQuery: (q: string) => void;
  filteredPointsByIcon: Record<string, Entity[]>;
  openMarkerGroup: string | null;
  setOpenMarkerGroup: (v: string | null) => void;
  activeMissionName: string | null;
  selectedEntityId: string | null;
  dispatch: AppDispatch;
  sendMessage: <T extends OutboundMessageName>(headerName: T, data: OutboundMessageMap[T]) => void;
  setGroupVisibility: (list: Entity[], visible: boolean) => void;
  deleteGroup: (list: Entity[], label: string) => void | Promise<void>;
  onEditEntity: (entity: Entity) => void;
  onCenterToEntity: (entity: Entity) => void;
  onOpenCreateMarkerPanel?: () => void;
  editingEntityId?: string | null;
};

function groupInitial(group: string): string {
  const t = String(group || "").trim();
  return t ? t.slice(0, 1).toUpperCase() : "?";
}

/** גליף מזערי לקבוצה — רק אם יש def; אחרת רק האות */
function GroupGlyph({ group, list }: { group: string; list: Entity[] }) {
  const anyEntity = list[0];
  const code = (anyEntity?.properties && (anyEntity.properties as { iconChar?: string }).iconChar) as
    | string
    | undefined;
  const def = code ? MARKER_ICONS.find((m) => m.code === code) : undefined;
  if (!def) {
    return (
      <span className={cn(styles.glyphBoxLg, styles.glyphBox)}>
        {groupInitial(group)}
      </span>
    );
  }
  return (
    <span
      className={cn(styles.glyphBoxLg, styles.glyphBox)}
      style={{ fontFamily: `${def.font}, sans-serif` }}
      title={def.label}
    >
      {getMarkerIconChar(def.code)}
    </span>
  );
}

const EntitiesSidebarPointsSection: FC<EntitiesSidebarPointsSectionProps> = ({
  onBack,
  pointsSearchQuery,
  setPointsSearchQuery,
  filteredPointsByIcon,
  openMarkerGroup,
  setOpenMarkerGroup,
  activeMissionName,
  selectedEntityId,
  dispatch,
  setGroupVisibility,
  deleteGroup,
  onEditEntity,
  onCenterToEntity,
  onOpenCreateMarkerPanel,
  editingEntityId,
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

  return (
    <div className={styles.scrollSection}>
      <button type="button" onClick={onBack} className={styles.backLink}>
        <img src={ENTITIES_SIDEBAR_ICONS.back} alt="" className={styles.backIcon} />
        {he.common.back}
      </button>

      <div className={styles.sectionHeader}>
        <p className={styles.sectionTitle}>{he.entities.sidebar.points}</p>
        <AppIconButton size="sm" label={he.entities.sidebar.newPoint} onClick={() => onOpenCreateMarkerPanel?.()}>
          <FaPlus />
        </AppIconButton>
      </div>

      <AppInput
        compact
        type="search"
        fieldClassName={styles.fieldStack}
        value={pointsSearchQuery}
        onChange={(e) => setPointsSearchQuery(e.target.value)}
        placeholder={he.common.search}
      />

      <div className={styles.list}>
        {Object.entries(filteredPointsByIcon).map(([group, list]) => {
          const isOpenGroup = openMarkerGroup === group;
          const allHidden = list.length > 0 && list.every((e) => !e.visible);
          return (
            <div key={group} className={styles.compactGroup}>
              <div className={styles.compactGroupHeader}>
                <button
                  type="button"
                  onClick={() => setOpenMarkerGroup(isOpenGroup ? null : group)}
                  className={styles.compactGroupToggle}
                >
                  <FaChevronLeft
                    className={cn(styles.chevron, isOpenGroup && styles.chevronOpen)}
                    aria-hidden
                  />
                  <GroupGlyph group={group} list={list} />
                  <span className={styles.compactGroupTitle}>{group}</span>
                  <span className={cn(styles.badgeMuted, styles.badgeSm)}>{list.length}</span>
                </button>
                <AppIconButton
                  size="sm"
                  label={allHidden ? he.common.showAll : he.common.hideAll}
                  onClick={(e) => {
                    e.stopPropagation();
                    setGroupVisibility(list, allHidden);
                  }}
                >
                  {allHidden ? <FaEye /> : <FaEyeSlash />}
                </AppIconButton>
                <AppIconButton
                  size="sm"
                  danger
                  label={he.entities.delete.deleteGroup}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteGroup(list, group);
                  }}
                >
                  <FaTrashAlt />
                </AppIconButton>
              </div>

              {isOpenGroup && (
                <ul
                  className={styles.compactGroupList}
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
                          styles.compactEntityRow,
                          isSelected ? styles.compactEntityRowSelected : styles.compactEntityRowDefault,
                        )}
                      >
                        <AppIconButton
                          size="sm"
                          label={he.common.map}
                          onClick={(e) => {
                            e.stopPropagation();
                            onCenterToEntity(entity);
                          }}
                        >
                          <FaCrosshairs />
                        </AppIconButton>
                        <span className={styles.compactEntityName}>{entity.name}</span>
                        <AppIconButton
                          size="sm"
                          label={entity.visible ? he.common.hide : he.common.show}
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextVisible = !entity.visible;
                            dispatch(toggleEntityVisibility(entity.id));
                            const map = mapCommands?.getMap() ?? null;
                            setEntityVisibilityOnMap(map, entity.id, nextVisible);
                          }}
                        >
                          {entity.visible ? <FaEye /> : <FaEyeSlash />}
                        </AppIconButton>
                        <AppIconButton
                          size="sm"
                          danger
                          label={he.common.delete}
                          onClick={(e) => handleDeleteEntity(e, entity)}
                        >
                          <FaTrashAlt />
                        </AppIconButton>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EntitiesSidebarPointsSection;
