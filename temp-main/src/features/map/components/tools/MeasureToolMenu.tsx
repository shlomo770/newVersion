import type { FC } from 'react';
import { TbRulerMeasure, TbDimensions } from 'react-icons/tb';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setDrawingMode } from '@features/entities';
import {
  MEASURE_MENU_ITEMS,
  MEASURE_MENU_TITLE,
  type MeasureMenuItem,
  type MeasureToolMode,
} from '@features/map/config';
import styles from './MeasureToolMenu.module.css';

interface MeasureToolMenuProps {
  onClose?: () => void;
}

const MEASURE_ICONS: Record<MeasureToolMode, FC<{ size?: number; className?: string }>> = {
  measure: TbRulerMeasure,
  'measure-area': TbDimensions,
};

const MeasureToolMenu: FC<MeasureToolMenuProps> = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const drawingMode = useAppSelector((state) => state.entities.drawingMode);

  const handleSelect = (mode: MeasureToolMode) => {
    if (drawingMode === mode) {
      dispatch(setDrawingMode(null));
    } else {
      dispatch(setDrawingMode(mode));
    }
    onClose?.();
  };

  return (
    <div
      className={styles.panel}
      onClick={(e) => e.stopPropagation()}
      role="menu"
      aria-label="Map measurement tools"
    >
      <div className={styles.header}>{MEASURE_MENU_TITLE}</div>
      {MEASURE_MENU_ITEMS.map((item) => (
        <MeasureToolRow
          key={item.id}
          item={item}
          active={drawingMode === item.id}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
};

interface MeasureToolRowProps {
  item: MeasureMenuItem;
  active: boolean;
  onSelect: (mode: MeasureToolMode) => void;
}

const MeasureToolRow: FC<MeasureToolRowProps> = ({ item, active, onSelect }) => {
  const Icon = MEASURE_ICONS[item.id];

  return (
    <button
      type="button"
      className={`${styles.row} ${active ? styles.rowActive : ''}`}
      onClick={() => onSelect(item.id)}
      title={item.title}
      role="menuitemradio"
      aria-checked={active}
    >
      <span className={styles.label}>
        <Icon size={18} className={styles.icon} aria-hidden />
        {item.label}
      </span>
      {active ? <span className={styles.activeDot} aria-hidden /> : null}
    </button>
  );
};

export default MeasureToolMenu;
