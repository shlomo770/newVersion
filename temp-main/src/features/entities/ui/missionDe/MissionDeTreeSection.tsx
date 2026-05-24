import { FC } from "react";
import { FaClipboardList, FaCrosshairs, FaInbox, FaTrashAlt } from "react-icons/fa";
import { MISSION_DE_TABS } from '@/constants/entityCategories';
import type { Entity } from '@features/entities/store/entitiesSlice';
import { AppIconButton, cn } from "@shared/ui";
import { btn, btnRose, missionDeStyles, section } from "./missionDePanelStyles";

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
          <span className={missionDeStyles.sectionTitle}>במשימה</span>
          <span className={missionDeStyles.sectionSubtitle}>
            לפי קטגוריה · לחיצה על שורה לבחירה
          </span>
        </div>
      </div>
      <div className={missionDeStyles.headerActions}>
        <span className={missionDeStyles.countBadge}>
          {memberIds.length} סה״כ
        </span>
        {treeSelectedIds.size > 0 ? (
          <>
            <span className={missionDeStyles.countBadgeActive}>
              נבחרו {treeSelectedIds.size}
            </span>
            <button
              type="button"
              title="הסר מהמשימה את הנבחרים"
              className={btnRose}
              disabled={treeSelectedIds.size === 0}
              onClick={onDeleteTreeSelected}
            >
              <FaTrashAlt aria-hidden />
              מחיקה
            </button>
            <button
              type="button"
              className={btn}
              onClick={onClearTreeSelection}
            >
              נקה בחירה
            </button>
          </>
        ) : null}
      </div>
    </div>
    <div className={missionDeStyles.treeScroll}>
      {memberIds.length === 0 ? (
        <div className={missionDeStyles.emptyState}>
          <FaInbox className={missionDeStyles.emptyIcon} aria-hidden />
          <p className={missionDeStyles.emptyTitle}>אין ישויות במשימה</p>
          <p className={missionDeStyles.emptyHint}>
            פתחו את «בחירה» למטה והוסיפו ישויות מהמערכת
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
                            title="הסר מהמשימה"
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
                            label="מפה"
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
                  <span>אחר</span>
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
                        label="מפה"
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
