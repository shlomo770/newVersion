import type { FC, KeyboardEvent, MouseEvent } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { ToggleSwitch } from '@shared/components';
import {
  TARGET_FILTER_ITEMS,
  TARGET_FILTER_MENU_TITLE,
  type TargetFilterItem,
} from '@features/map/config';
import styles from './TargetFilterMenu.module.css';

/**
 * Target filter sub-menu — fully config-driven.
 *
 * Every row in the menu is described declaratively in
 * `TARGET_FILTER_ITEMS`. The component is a pure renderer:
 *   - iterates the config array,
 *   - reads each row's selector from Redux,
 *   - dispatches each row's toggle action when the user clicks.
 *
 * To add a new filter the only edit required is one record in
 * `mapTools.config.ts`. No JSX changes here.
 *
 * The filters are INDEPENDENT — toggling labels never affects trails
 * and vice-versa. Target icons themselves remain visible regardless.
 * Layer visibility is performed by `TargetsLayer` via
 * `setLayoutProperty('visibility', …)` — layers are never recreated.
 */
const TargetFilterMenu: FC = () => {
  return (
    <div
      className={styles.panel}
      onClick={(e) => e.stopPropagation()}
      role="menu"
      aria-label="Target map filters"
    >
      <div className={styles.header}>{TARGET_FILTER_MENU_TITLE}</div>
      {TARGET_FILTER_ITEMS.map((item) => (
        <TargetFilterRow key={item.id} item={item} />
      ))}
    </div>
  );
};

interface TargetFilterRowProps {
  item: TargetFilterItem;
}

const TargetFilterRow: FC<TargetFilterRowProps> = ({ item }) => {
  const dispatch = useAppDispatch();
  const checked = useAppSelector(item.selector);

  const handleToggle = () => {
    dispatch(item.toggleAction());
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  /** Stop the inner ToggleSwitch button's click from bubbling to the
   *  row container — otherwise `handleToggle` would fire twice (once
   *  from the toggle's own onChange, once from the row's onClick) and
   *  cancel itself out. */
  const stopBubble = (e: MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
  };

  const Icon = item.icon;

  return (
    <div
      className={styles.row}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      title={item.title}
      role="menuitemcheckbox"
      aria-checked={checked}
      tabIndex={0}
    >
      <span className={styles.label}>
        <Icon size={18} className={styles.icon} />
        <span>{item.label}</span>
      </span>
      <span onClick={stopBubble}>
        <ToggleSwitch
          checked={checked}
          onChange={handleToggle}
          size="sm"
          ariaLabel={item.ariaLabel}
        />
      </span>
    </div>
  );
};

export default TargetFilterMenu;
