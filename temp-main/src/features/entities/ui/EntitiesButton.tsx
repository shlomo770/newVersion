import { FC } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setSelectedEntity } from '@features/entities/store/entitiesSlice';
import { ENTITIES_SIDEBAR_ICONS } from '@/config';
import styles from './EntitiesButton.module.css';

interface EntitiesButtonProps {
  onToggleSidebar: () => void;
}

const EntitiesButton: FC<EntitiesButtonProps> = ({ onToggleSidebar }) => {
  const dispatch = useAppDispatch();

  const handleClick = () => {
    dispatch(setSelectedEntity(null));
    onToggleSidebar();
  };

  return (
    <button type="button" onClick={handleClick} className={styles.fab} aria-label="Entities">
      <img src={ENTITIES_SIDEBAR_ICONS.fab} alt="" className={styles.fabIcon} />
    </button>
  );
};

export default EntitiesButton;
