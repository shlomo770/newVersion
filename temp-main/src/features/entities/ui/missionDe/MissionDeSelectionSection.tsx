import { FC } from "react";
import {
  FaPlus,
  FaCrosshairs,
  FaChevronLeft,
  FaListUl,
} from "react-icons/fa";
import { MISSION_DE_TABS } from '@/constants/entityCategories';
import type { Entity } from '@features/entities/store/entitiesSlice';
import { AppIconButton, AppButton, AppInput, AppSelect, cn } from "@shared/ui";
import type { DisplayFilter } from "./MissionDePanelTypes";
import { missionDeStyles, section } from "./missionDePanelStyles";
import { he } from '@shared/i18n';

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
          <span className={missionDeStyles.sectionTitle}>{he.entities.missionDe.selectionTitle}</span>
          <span className={missionDeStyles.sectionSubtitle}>{he.entities.missionDe.selectionSubtitle}</span>
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
          <AppSelect
            label={he.entities.missionDe.category}
            fieldClassName={missionDeStyles.filterField}
            value={displayFilter}
            onChange={(e) => onDisplayFilterChange(e.target.value as DisplayFilter)}
            compact
          >
            <option value="ALL">{he.entities.missionDe.all}</option>
            {MISSION_DE_TABS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </AppSelect>
          <AppInput
            label={he.entities.missionDe.searchLabel}
            type="search"
            fieldClassName={missionDeStyles.searchField}
            placeholder={he.entities.missionDe.searchPlaceholder}
            value={searchQ}
            onChange={(e) => onSearchQChange(e.target.value)}
            compact
          />
        </div>
        <div className={missionDeStyles.buttonRow}>
          <AppButton type="button" size="sm" onClick={onNewClick}>
            <FaPlus aria-hidden /> {he.common.new}
          </AppButton>
          <AppButton type="button" size="sm" variant="success" disabled={!canAdd} onClick={onAddSelected}>
            {he.entities.missionDe.addToMission}
          </AppButton>
          <AppButton type="button" size="sm" variant="danger" disabled={!canRemove} onClick={onRemoveSelected}>
            {he.entities.missionDe.removeFromMission}
          </AppButton>
          <AppButton type="button" size="sm" variant="secondary" onClick={onSelectAllInView}>
            {he.entities.missionDe.allInView}
          </AppButton>
          <AppButton type="button" size="sm" variant="secondary" onClick={onClearSelection} disabled={selectedCount === 0}>
            {he.entities.missionDe.clearCount(selectedCount)}
          </AppButton>
        </div>
        <div className={missionDeStyles.metaRow}>
          <span className={missionDeStyles.metaBadge}>
            {filterLabel}
          </span>
          <span>·</span>
          <span>{he.entities.missionDe.rows(tableRows.length)}</span>
          <span>·</span>
          <span className={cn(selectedCount > 0 && missionDeStyles.metaHighlight)}>
            {he.entities.missionDe.selectedCount(selectedCount)}
          </span>
        </div>
        <div className={missionDeStyles.tableWrap}>
          <table className={missionDeStyles.table}>
            <thead className={missionDeStyles.tableHead}>
              <tr>
                <th className={missionDeStyles.tableHeadCell}>#</th>
                <th className={missionDeStyles.tableHeadCell}>{he.entities.missionDe.colName}</th>
                <th className={missionDeStyles.tableHeadCell}>{he.entities.missionDe.colType}</th>
                <th className={missionDeStyles.tableHeadCell}>{he.entities.missionDe.colCategory}</th>
                <th className={missionDeStyles.tableHeadCell}>{he.common.map}</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className={missionDeStyles.tableEmpty}>
                    <p className={missionDeStyles.emptyTitle}>{he.entities.missionDe.noResults}</p>
                    <p className={missionDeStyles.emptyHint}>{he.entities.missionDe.noResultsHint}</p>
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
                              {he.entities.missionDe.inMission}
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
                          label={he.common.map}
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
