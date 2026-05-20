import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@app/store';
import { ErrorSeverityE, ErrorStateE } from '@/enums/general.enum';
import {
  selectCategories,
  selectFilteredFaults,
  setSelectedCategories,
  setSeverityFilter,
  setShowInactive,
  getBadge,
  type Fault,
} from '../store/faultsSlice';
import styles from './FaultsList.module.css';

const normalizeTs = (ts: number) => (ts < 1e12 ? ts * 1000 : ts);

const formatTs = (ts: number, tz = 'Asia/Jerusalem') =>
  new Date(normalizeTs(ts)).toLocaleString('he-IL', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const sevText = (value: ErrorSeverityE) => ErrorSeverityE[value] ?? String(value);
const stateText = (value: ErrorStateE) => ErrorStateE[value] ?? String(value);

function severityClass(severity: ErrorSeverityE): string {
  switch (severity) {
    case ErrorSeverityE.SEVERE:
      return styles.sevSevere;
    case ErrorSeverityE.INTERMEDIATE:
      return styles.sevIntermediate;
    case ErrorSeverityE.WARNING:
    default:
      return styles.sevWarning;
  }
}

function stateDotClass(state: ErrorStateE): string {
  if (state === ErrorStateE.EXISTS || state === ErrorStateE.REPEATED) {
    return styles.stateDotActive;
  }
  return styles.stateDotIdle;
}

export default function FaultsList() {
  const dispatch = useDispatch();
  const categories = useSelector((state: RootState) => selectCategories(state));
  const faults = useSelector((state: RootState) => selectFilteredFaults(state));
  const selectedCategories = useSelector(
    (state: RootState) => state.faults.filters.selectedCategories,
  );
  const severity = useSelector((state: RootState) => state.faults.filters.severity);
  const showInactive = useSelector((state: RootState) => state.faults.filters.showInactive);

  const view = useMemo(
    () =>
      faults.map((fault: Fault) => ({
        ...fault,
        timeText: fault.lastSeen ? formatTs(fault.lastSeen) : '--',
      })),
    [faults],
  );

  const toggleCategory = (cat: string) => {
    const set = new Set(selectedCategories ?? []);
    if (set.has(cat)) set.delete(cat);
    else set.add(cat);
    dispatch(setSelectedCategories(Array.from(set)));
  };

  return (
    <div className={styles.panel}>
      <div className={styles.filters}>
        <div className={styles.legendRow}>
          <div className={styles.legendItem}>
            <span className={styles.dotCritical} />
            <span>Critical</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.dotIntermediate} />
            <span>Intermediate</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.dotWarning} />
            <span>Warning</span>
          </div>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Severity</span>
          <select
            className={styles.severitySelect}
            value={severity}
            onChange={(e) => {
              const value = e.target.value;
              dispatch(
                setSeverityFilter(value === 'ALL' ? 'ALL' : (Number(value) as ErrorSeverityE)),
              );
            }}
          >
            <option value="ALL">All</option>
            <option value={ErrorSeverityE.SEVERE}>{sevText(ErrorSeverityE.SEVERE)}</option>
            <option value={ErrorSeverityE.INTERMEDIATE}>
              {sevText(ErrorSeverityE.INTERMEDIATE)}
            </option>
            <option value={ErrorSeverityE.WARNING}>{sevText(ErrorSeverityE.WARNING)}</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Categories</span>
          <div className={styles.categoryList}>
            {categories.map((cat) => {
              const isOn =
                selectedCategories.length === 0 || selectedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`${styles.categoryChip} ${isOn ? styles.categoryChipOn : ''}`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <label className={styles.inactiveToggle}>
          <input
            type="checkbox"
            className={styles.inactiveCheckbox}
            checked={showInactive}
            onChange={(e) => dispatch(setShowInactive(e.target.checked))}
          />
          Show inactive
        </label>
      </div>

      <div className={styles.tableHeader}>
        <div className={styles.tableHeaderGrid}>
          <span>Cat / Code</span>
          <span>Severity</span>
          <span>Status</span>
          <span>Description</span>
          <span>Last seen</span>
        </div>
      </div>

      <div className={styles.rows}>
        {view.map((fault) => {
          const badge = getBadge(fault);
          const isInactive = badge.label === 'INACTIVE';

          return (
            <div
              key={fault.id}
              className={`${styles.row} ${isInactive ? styles.rowInactive : ''}`}
            >
              <div className={styles.catBlock}>
                <span className={stateDotClass(fault.state)} />
                <span className={styles.catName}>{fault.category}</span>
                <span className={styles.catCode}>#{fault.code}</span>
              </div>

              <div className={`${styles.sevPill} ${severityClass(fault.severity)}`}>
                {sevText(fault.severity).toLowerCase()}
              </div>

              <div className={styles.statePill}>
                <span className={styles.stateBadge}>{stateText(fault.state)}</span>
              </div>

              <div className={styles.descriptionBlock}>
                <div className={styles.descriptionTitle}>{fault.description}</div>
                <div className={styles.descriptionMeta}>{badge.label}</div>
              </div>

              <div className={styles.lastSeen}>{fault.timeText}</div>
            </div>
          );
        })}

        {view.length === 0 && (
          <div className={styles.emptyState}>אין תקלות לפי הפילטר הנוכחי</div>
        )}
      </div>
    </div>
  );
}
