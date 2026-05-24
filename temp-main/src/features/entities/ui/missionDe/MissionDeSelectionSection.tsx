import { FC } from "react";
import {
  FaPlus,
  FaCrosshairs,
  FaFilter,
  FaChevronLeft,
  FaListUl,
} from "react-icons/fa";
import { MISSION_DE_TABS } from '@/constants/entityCategories';
import type { Entity } from '@features/entities/store/entitiesSlice';
import { AppIconButton, cn } from "@shared/ui";
import type { DisplayFilter } from "./MissionDePanelTypes";
import { btn, btnEmerald, btnRose, btnSky, inp, missionDeStyles, section, sel } from "./missionDePanelStyles";

export type MissionDeSelectionSectionProps = {
  selectionOpen: boolean;
  onToggleSelectionOpen: () => void;
  displayFilter: DisplayFilter;
  onDisplayFilterChange: (f: DisplayFilter) => void;
  searchQ: string;
  onSearchQChange: (q: string) => void;
  onNewClick: () => void;
  canAdd: boolean;
  canRemove: boolean;
  onAddSelected: () => void;
  onRemoveSelected: () => void;
  onSelectAllInView: () => void;
  onClearSelection: () => void;
  selectedCount: number;
  filterLabel: string;
  tableRows: Entity[];
  memberSet: Set<string>;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onCenterToEntity: (e: Entity) => void;
};

const MissionDeSelectionSection: FC<MissionDeSelectionSectionProps> = ({
  selectionOpen,
  onToggleSelectionOpen,
  displayFilter,
  onDisplayFilterChange,
  searchQ,
  onSearchQChange,
  onNewClick,
  canAdd,
  canRemove,
  onAddSelected,
  onRemoveSelected,
  onSelectAllInView,
  onClearSelection,
  selectedCount,
  filterLabel,
  tableRows,
  memberSet,
  selectedIds,
  onToggleSelect,
  onCenterToEntity,
}) => (
  <div className={section}>
    <button
      type="button"
      onClick={onToggleSelectionOpen}
      className={cn(
        missionDeStyles.toggleHeader,
        selectionOpen && missionDeStyles.toggleHeaderOpen,
      )}
    >
      <span className={missionDeStyles.sectionHeaderMain}>
        <span className={missionDeStyles.iconBadgeViolet}>
          <FaListUl aria-hidden />
        </span>
        <span>
          <span className={missionDeStyles.sectionTitle}>בחירה מהמערכת</span>
          <span className={missionDeStyles.sectionSubtitle}>סינון · חיפוש · לחיצה על שורה</span>
        </span>
      </span>
      <FaChevronLeft
        className={cn(
          missionDeStyles.chevronToggle,
          selectionOpen && missionDeStyles.chevronToggleOpen,
        )}
        aria-hidden
      />
    </button>

    {selectionOpen ? (
      <div className={missionDeStyles.toggleBody}>
        <div className={missionDeStyles.filterRow}>
          <div className={missionDeStyles.filterField}>
            <span className={missionDeStyles.fieldLabel}>
              <FaFilter aria-hidden />
              קטגוריה
            </span>
            <select
              className={sel}
              value={displayFilter}
              onChange={(e) => onDisplayFilterChange(e.target.value as DisplayFilter)}
            >
              <option value="ALL">הכל</option>
              {MISSION_DE_TABS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className={missionDeStyles.searchField}>
            <span className={missionDeStyles.fieldLabel}>חיפוש</span>
            <input
              type="search"
              className={inp}
              placeholder="שם, סוג או קטגוריה…"
              value={searchQ}
              onChange={(e) => onSearchQChange(e.target.value)}
            />
          </div>
        </div>
        <div className={missionDeStyles.buttonRow}>
          <button type="button" className={btnSky} onClick={onNewClick}>
            <FaPlus aria-hidden /> חדש
          </button>
          <button type="button" className={btnEmerald} disabled={!canAdd} onClick={onAddSelected}>
            הוסף למשימה
          </button>
          <button type="button" className={btnRose} disabled={!canRemove} onClick={onRemoveSelected}>
            הסר מהמשימה
          </button>
          <button type="button" className={btn} onClick={onSelectAllInView}>
            כל התצוגה
          </button>
          <button type="button" className={btn} onClick={onClearSelection} disabled={selectedCount === 0}>
            נקה ({selectedCount})
          </button>
        </div>
        <div className={missionDeStyles.metaRow}>
          <span className={missionDeStyles.metaBadge}>
            {filterLabel}
          </span>
          <span>·</span>
          <span>{tableRows.length} שורות</span>
          <span>·</span>
          <span className={cn(selectedCount > 0 && missionDeStyles.metaHighlight)}>
            נבחרו {selectedCount}
          </span>
        </div>
        <div className={missionDeStyles.tableWrap}>
          <table className={missionDeStyles.table}>
            <thead className={missionDeStyles.tableHead}>
              <tr>
                <th className={missionDeStyles.tableHeadCell}>#</th>
                <th className={missionDeStyles.tableHeadCell}>שם</th>
                <th className={missionDeStyles.tableHeadCell}>סוג</th>
                <th className={missionDeStyles.tableHeadCell}>קטגוריה</th>
                <th className={missionDeStyles.tableHeadCell}>מפה</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className={missionDeStyles.tableEmpty}>
                    <p className={missionDeStyles.emptyTitle}>ללא תוצאות</p>
                    <p className={missionDeStyles.emptyHint}>נסו לשנות סינון או את מילות החיפוש</p>
                  </td>
                </tr>
              ) : (
                tableRows.map((e, idx) => {
                  const inM = memberSet.has(e.id);
                  const selRow = selectedIds.has(e.id);
                  return (
                    <tr
                      key={e.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onToggleSelect(e.id)}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault();
                          onToggleSelect(e.id);
                        }
                      }}
                      className={cn(
                        missionDeStyles.tableRow,
                        selRow && missionDeStyles.tableRowSelected,
                        !selRow && inM && missionDeStyles.tableRowInMission,
                      )}
                    >
                      <td className={missionDeStyles.tableCell}>{idx + 1}</td>
                      <td className={missionDeStyles.tableCell}>
                        <span className={missionDeStyles.nameCell}>
                          {inM ? (
                            <span className={missionDeStyles.inMissionBadge}>
                              במשימה
                            </span>
                          ) : null}
                          <span className={missionDeStyles.nameText}>{e.name}</span>
                        </span>
                      </td>
                      <td className={missionDeStyles.tableCell}>
                        <span className={missionDeStyles.typeBadge}>
                          {e.type}
                        </span>
                      </td>
                      <td className={missionDeStyles.tableCell}>{e.category || "—"}</td>
                      <td className={missionDeStyles.tableCell}>
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
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    ) : null}
  </div>
);

export default MissionDeSelectionSection;
