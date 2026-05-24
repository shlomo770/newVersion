import { FC } from "react";
import { FaClipboardList, FaCrosshairs, FaInbox, FaTrashAlt } from "react-icons/fa";
import { MISSION_DE_TABS } from '@/constants/entityCategories';
import type { Entity } from '@features/entities/store/entitiesSlice';
import { AppButton, AppIconButton, cn } from "@shared/ui";
import { missionDeStyles, section } from "./missionDePanelStyles";
import { he } from '@shared/i18n';

export type MissionDeTreeSectionProps = {
  memberIds: string[];
  missionTreeBuckets: Record<string, Entity[]>;
  otherCount: number;
  treeSelectedIds: Set<string>;
  onToggleTreeSelect: (id: string) => void;
  onClearTreeSelection: () => void;
  onDeleteTreeSelected: () => void;
  onRemoveOne: (id: string) => void;
  onCenterToEntity: (e: Entity) => void;
};

const MissionDeTreeSection: FC<MissionDeTreeSectionProps> = ({
  memberIds,
  missionTreeBuckets,
  otherCount,
  treeSelectedIds,
  onToggleTreeSelect,
  onClearTreeSelection,
  onDeleteTreeSelected,
  onRemoveOne,
  onCenterToEntity,
}) => (
  <div className={section}>
    <div className={missionDeStyles.sectionHeader}>
      <div className={missionDeStyles.sectionHeaderMain}>
        <span className={missionDeStyles.iconBadge}>
          <FaClipboardList aria-hidden />
        </span>
        <div>
          <span className={missionDeStyles.sectionTitle}>{he.entities.missionDe.treeTitle}</span>
          <span className={missionDeStyles.sectionSubtitle}>
            {he.entities.missionDe.treeSubtitle}
          </span>
        </div>
      </div>
      <div className={missionDeStyles.headerActions}>
        <span className={missionDeStyles.countBadge}>
          {he.entities.missionDe.totalCount(memberIds.length)}
        </span>
        {treeSelectedIds.size > 0 ? (
          <>
            <span className={missionDeStyles.countBadgeActive}>
              {he.entities.missionDe.selectedCount(treeSelectedIds.size)}
            </span>
            <AppButton
              type="button"
              size="sm"
              variant="danger"
              title={he.entities.missionDe.removeSelectedTitle}
              disabled={treeSelectedIds.size === 0}
              onClick={onDeleteTreeSelected}
            >
              <FaTrashAlt aria-hidden />
              {he.common.delete}
            </AppButton>
            <AppButton type="button" size="sm" variant="secondary" onClick={onClearTreeSelection}>
              {he.entities.missionDe.clearTreeSelection}
            </AppButton>
          </>
        ) : null}
      </div>
    </div>
    <div className={missionDeStyles.treeScroll}>
      {memberIds.length === 0 ? (
        <div className={missionDeStyles.emptyState}>
          <FaInbox className={missionDeStyles.emptyIcon} aria-hidden />
          <p className={missionDeStyles.emptyTitle}>{he.entities.missionDe.emptyMission}</p>
          <p className={missionDeStyles.emptyHint}>
            {he.entities.missionDe.emptyMissionHint}
          </p>
        </div>
      ) : (
        <>
          {MISSION_DE_TABS.filter((tab) => (missionTreeBuckets[tab.id] ?? []).length > 0).map(
            (tab) => {
              const items = missionTreeBuckets[tab.id] ?? [];
              return (
                <details
                  key={tab.id}
                  open
                  className={missionDeStyles.treeGroup}
                >
                  <summary className={missionDeStyles.treeSummary}>
                    <span className={missionDeStyles.treeSummaryInner}>
                      <span className={missionDeStyles.treeItemName}>{tab.label}</span>
                      <span className={missionDeStyles.typeBadge}>
                        {items.length}
                      </span>
                    </span>
                  </summary>
                  <ul className={missionDeStyles.treeList}>
                    {items.map((e) => {
                      const sel = treeSelectedIds.has(e.id);
                      return (
                        <li
                          key={e.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => onToggleTreeSelect(e.id)}
                          onKeyDown={(ev) => {
                            if (ev.key === "Enter" || ev.key === " ") {
                              ev.preventDefault();
                              onToggleTreeSelect(e.id);
                            }
                          }}
                          className={cn(missionDeStyles.treeItem, sel && missionDeStyles.treeItemSelected)}
                        >
                          <span className={missionDeStyles.treeItemName} title={e.name}>
                            {e.name}
                          </span>
                          <span className={missionDeStyles.typeBadge}>
                            {e.type}
                          </span>
                          <button
                            type="button"
                            title={he.entities.missionDe.removeOneTitle}
                            className={missionDeStyles.removeBtn}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              onRemoveOne(e.id);
                            }}
                          >
                            ×
                          </button>
                          <AppIconButton
                            size="sm"
                            label={he.common.map}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              onCenterToEntity(e);
                            }}
                          >
                            <FaCrosshairs />
                          </AppIconButton>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              );
            }
          )}
          {otherCount > 0 ? (
            <details
              open
              className={cn(missionDeStyles.treeGroup, missionDeStyles.treeGroupWarning)}
            >
              <summary className={cn(missionDeStyles.treeSummary, missionDeStyles.treeSummaryWarning)}>
                <span className={missionDeStyles.treeSummaryInner}>
                  <span>{he.entities.missionDe.other}</span>
                  <span className={missionDeStyles.typeBadgeWarning}>
                    {otherCount}
                  </span>
                </span>
              </summary>
              <ul className={missionDeStyles.treeList}>
                {(missionTreeBuckets.OTHER ?? []).map((e) => {
                  const sel = treeSelectedIds.has(e.id);
                  return (
                    <li
                      key={e.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onToggleTreeSelect(e.id)}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault();
                          onToggleTreeSelect(e.id);
                        }
                      }}
                      className={cn(missionDeStyles.treeItem, sel && missionDeStyles.treeItemSelected)}
                    >
                      <span className={missionDeStyles.treeItemName}>{e.name}</span>
                      <span className={missionDeStyles.typeBadgeWarning}>
                        {e.category || "?"}
                      </span>
                      <button
                        type="button"
                        className={missionDeStyles.removeBtn}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onRemoveOne(e.id);
                        }}
                      >
                        ×
                      </button>
                      <AppIconButton
                        size="sm"
                        label={he.common.map}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onCenterToEntity(e);
                        }}
                      >
                        <FaCrosshairs />
                      </AppIconButton>
                    </li>
                  );
                })}
              </ul>
            </details>
          ) : null}
        </>
      )}
    </div>
  </div>
);

export default MissionDeTreeSection;
