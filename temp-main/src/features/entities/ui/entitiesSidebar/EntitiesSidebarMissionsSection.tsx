import { FC, MutableRefObject } from "react";
import { FaPlus, FaTrashAlt } from "react-icons/fa";
import type { AppDispatch } from '@app/store';
import type { Entity, Mission } from '@features/entities/store/entitiesSlice';
import {
  setActiveMissionId,
  removeMission,
} from '@features/entities/store/entitiesSlice';
import { missionEntityIds } from '@features/entities/api/missionWire';
import { sendLoadMission } from '@features/entities/api/outboundBuilders';
import MissionFormPanel from '../MissionFormPanel';
import type { EntityCategoryEnum } from '@domain/enums/entity.enum';
import { WsMessageName } from '@domain/enums/ws.enum';
import type { OutboundMessageMap, OutboundMessageName } from '@/services/webSocket/wsTypes';
import { swalConfirmDanger } from "@/utils/swalDialog";
import { he } from '@shared/i18n';
import { AppIconButton, AppInput, cn } from "@shared/ui";
import { ENTITIES_SIDEBAR_ICONS } from "@/config";
import styles from "./EntitiesSidebar.shared.module.css";

export type EntitiesSidebarMissionsSectionProps = {
  onBackToRoot: () => void;
  activeMissionId: string | null;
  activeMissionName: string | null;
  sortedMissions: Mission[];
  filteredMissions: Mission[];
  sortedMissionNames: string[];
  missionSearchQuery: string;
  setMissionSearchQuery: (q: string) => void;
  localDraftMissionNamesRef: MutableRefObject<Set<string>>;
  createLocalMission: () => void;
  sendMessage: <T extends OutboundMessageName>(headerName: T, data: OutboundMessageMap[T]) => void;
  dispatch: AppDispatch;
  entitiesById: Record<string, Entity | undefined>;
  onMissionMemberIdsChange: (ids: string[]) => void;
  saveMissionToServer: (missionId: string, explicitIds?: string[]) => void;
  onOpenMissionSaveCopy: () => void;
  handleMissionRename: (missionId: string, newName: string) => boolean | Promise<boolean>;
  onOpenCreatePanelWithCategory?: (category: EntityCategoryEnum) => void;
  onOpenCreateMarkerPanel?: () => void;
  onCenterToEntity: (entity: Entity) => void;
};

const EntitiesSidebarMissionsSection: FC<EntitiesSidebarMissionsSectionProps> = ({
  onBackToRoot,
  activeMissionId,
  activeMissionName,
  sortedMissions,
  filteredMissions,
  sortedMissionNames,
  localDraftMissionNamesRef,
  createLocalMission,
  missionSearchQuery,
  setMissionSearchQuery,
  sendMessage,
  dispatch,
  entitiesById,
  onMissionMemberIdsChange,
  saveMissionToServer,
  onOpenMissionSaveCopy,
  handleMissionRename,
  onOpenCreatePanelWithCategory,
  onOpenCreateMarkerPanel,
  onCenterToEntity,
}) => (
  <div className={styles.section}>
    <button type="button" onClick={onBackToRoot} className={styles.backLink}>
      <img src={ENTITIES_SIDEBAR_ICONS.back} alt="" className={styles.backIcon} />
      {he.common.back}
    </button>

    {!activeMissionName ? (
      <>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTitle}>{he.entities.sidebar.missions}</p>
          <AppIconButton size="sm" label={he.entities.newMission} onClick={createLocalMission}>
            <FaPlus />
          </AppIconButton>
        </div>

        <AppInput
          compact
          fieldClassName={styles.fieldStack}
          value={missionSearchQuery}
          onChange={(e) => setMissionSearchQuery(e.target.value)}
          placeholder={he.entities.sidebar.missionSearchPlaceholder}
        />

        <div className={styles.list}>
          {filteredMissions.length === 0 ? (
            <div className={styles.emptyText}>
              {sortedMissions.length === 0 ? he.entities.sidebar.noMissionsYet : he.entities.sidebar.noMissionsFound}
            </div>
          ) : (
            filteredMissions.map((mission) => (
              <div
                key={mission.id}
                className={cn(
                  styles.missionRow,
                  activeMissionId === mission.id ? styles.missionRowActive : styles.missionRowDefault,
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    dispatch(setActiveMissionId(mission.id));
                    if (!localDraftMissionNamesRef.current.has(mission.name)) {
                      sendLoadMission(mission.id);
                    }
                  }}
                  className={styles.missionNameBtn}
                  title={he.entities.sidebar.openMission}
                >
                  {mission.name}
                </button>
                <AppIconButton
                  size="sm"
                  danger
                  label={he.entities.delete.deleteMission}
                  onClick={async (e) => {
                    e.stopPropagation();
                    const ok = await swalConfirmDanger(he.entities.delete.confirmDeleteMission(mission.name), {
                      title: he.entities.delete.deleteMissionTitle,
                      confirmText: he.common.delete,
                      cancelText: he.common.cancel,
                    });
                    if (!ok) return;
                    sendMessage(WsMessageName.DeleteMission, { mission_id: mission.id });
                    dispatch(removeMission(mission.id));
                  }}
                >
                  <FaTrashAlt />
                </AppIconButton>
              </div>
            ))
          )}
        </div>
      </>
    ) : (
      <div className={styles.missionFormStack}>
        <button
          type="button"
          onClick={() => dispatch(setActiveMissionId(null))}
          className={styles.backLink}
        >
          <img src={ENTITIES_SIDEBAR_ICONS.back} alt="" className={styles.backIcon} />
          {he.entities.sidebar.backToList}
        </button>
      </div>
    )}
    {activeMissionName && activeMissionId ? (
      <MissionFormPanel
        onClose={() => dispatch(setActiveMissionId(null))}
        missionNames={sortedMissionNames}
        onMissionSwitch={(name) => {
          const mission = sortedMissions.find((m) => m.name === name);
          if (!mission) return;
          dispatch(setActiveMissionId(mission.id));
          if (!localDraftMissionNamesRef.current.has(name)) {
            sendLoadMission(mission.id);
          }
        }}
        missionName={activeMissionName}
        memberIds={missionEntityIds(
          sortedMissions.find((m) => m.id === activeMissionId) ?? { id: "", name: "", entityRefs: [] }
        )}
        allById={entitiesById}
        onMemberIdsChange={onMissionMemberIdsChange}
        onSaveMissionServer={() => saveMissionToServer(activeMissionId)}
        onOpenMissionSaveCopy={onOpenMissionSaveCopy}
        onMissionRename={(_oldName, newName) => handleMissionRename(activeMissionId, newName)}
        onCreateNewInCategory={(cat) => onOpenCreatePanelWithCategory?.(cat)}
        onOpenCreateMarkerPanel={onOpenCreateMarkerPanel}
        onCenterToEntity={onCenterToEntity}
      />
    ) : null}
  </div>
);

export default EntitiesSidebarMissionsSection;
