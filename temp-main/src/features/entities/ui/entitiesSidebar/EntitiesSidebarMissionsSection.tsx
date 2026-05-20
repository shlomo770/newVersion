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
  <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
    <button
      type="button"
      onClick={onBackToRoot}
      className="mb-2 flex shrink-0 items-center gap-2 text-sm text-gray-400 hover:text-white"
    >
      <img src="./icons/back_arrow512.png" alt="" className="h-4 w-4 invert opacity-70" />
      ????
    </button>

    {!activeMissionName ? (
      <>
        <div className="mb-3 shrink-0 rounded-lg border border-gray-700/50 bg-gray-800/40 px-3 py-2">
          <p className="text-[11px] leading-snug text-gray-400">
            ??? ?? + ??? ????? ????? ???? ? ??? ????? ?????? ?? ?? ????? ????. ??? ?? ?? ????? ?????? ??? ????? ????? (??????, ????? ??, ????? ????).
            ??? ????? ????? ???? ????? ?? ?? ??????? ??????.
          </p>
        </div>

        <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
          <p className="px-1 text-xs uppercase tracking-wide text-gray-500">?? ???????</p>
          <button
            type="button"
            onClick={createLocalMission}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-white shadow transition-colors hover:bg-sky-500"
            title="????? ???? ??????"
          >
            <FaPlus className="h-4 w-4" />
          </button>
        </div>

        <input
          type="text"
          value={missionSearchQuery}
          onChange={(e) => setMissionSearchQuery(e.target.value)}
          placeholder="????? ??? ?????..."
          className="mb-2 w-full shrink-0 rounded-lg border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-400 focus:border-sky-500 focus:outline-none"
        />

        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
          {filteredMissions.length === 0 ? (
            <div className="text-xs text-gray-400">
              {sortedMissions.length === 0 ? "??? ?????? ?????" : "??? ?????? ??????"}
            </div>
          ) : (
            filteredMissions.map((mission) => (
              <div
                key={mission.id}
                className={`group flex items-center justify-between gap-1.5 rounded-lg px-2 py-2 transition-colors ${
                  activeMissionId === mission.id
                    ? "border border-sky-500/40 bg-sky-600/25"
                    : "bg-gray-800/60 hover:bg-gray-700/70"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    dispatch(setActiveMissionId(mission.id));
                    if (!localDraftMissionNamesRef.current.has(mission.name)) {
                      sendLoadMission(mission.id);
                    }
                  }}
                  className="min-w-0 flex-1 truncate pl-1 text-right text-sm font-medium text-gray-100"
                  title="??? ????? ?????"
                >
                  {mission.name}
                </button>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const ok = await swalConfirmDanger(`????? ?? ?????? "${mission.name}"?`, {
                      title: "????? ?????",
                      confirmText: "???",
                      cancelText: "?????",
                    });
                    if (!ok) return;
                    sendMessage(WsMessageName.DeleteMission, { mission_id: mission.id });
                    dispatch(removeMission(mission.id));
                  }}
                  className="shrink-0 rounded p-2 text-gray-400 hover:bg-red-900/20 hover:text-red-400"
                  title="??? ?????"
                >
                  <FaTrashAlt className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </>
    ) : (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <button
          type="button"
          onClick={() => dispatch(setActiveMissionId(null))}
          className="w-fit shrink-0 text-right text-[11px] text-sky-400 hover:text-sky-300"
        >
          ? ???? ?????? ??????
        </button>
        <p className="shrink-0 text-[11px] leading-relaxed text-gray-500">
          ???? ?????: ???? ?? ???????, ????? ?????, ????? ??????, ???? ?????, ????? ????. ????? ?? ?? ??????.
        </p>
        <p className="shrink-0 text-[10px] leading-snug text-gray-600">
          ???? ????? ?? ?????? ??????. ???? ???? ???? ????? ??????? ?????? ??????. ????? ???? ?? ?&quot;???? ????&quot;.
        </p>
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

