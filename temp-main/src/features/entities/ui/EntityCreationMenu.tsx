import React, { FC } from 'react';
import { PiPolygonFill } from 'react-icons/pi';
import { FaCircleNotch, FaEllipsisH, FaChartPie } from 'react-icons/fa';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import type { EntityType } from '@domain/models/entity';
import { setDrawingMode } from '@features/entities/store/entitiesSlice';
import FlyoutMenu from '@shared/components/overlay/FlyoutMenu';
import styles from './EntityPanels.module.css';

interface EntityCreationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
}

const EntityCreationMenu: FC<EntityCreationMenuProps> = ({ isOpen, onClose, anchorRef }) => {
  const dispatch = useAppDispatch();

  const handleCreateEntity = (type: 'circle' | 'polygon' | 'line' | 'ellipse' | 'sector') => {
    const entityType: EntityType = type === 'ellipse' ? 'ellipse' : type;
    dispatch(setDrawingMode(entityType));
    onClose();
  };

  return (
    <FlyoutMenu
      anchorRef={anchorRef}
      isOpen={isOpen}
      placement="right"
      top={880}
      left={110}
      arow={0}
      onClose={onClose}
    >
      <div className={styles.flyoutMenu} onClick={(e) => e.stopPropagation()}>
        <div className={styles.flyoutActions}>
          <button
            type="button"
            className={styles.shapeBtn}
            onClick={(e) => {
              e.stopPropagation();
              handleCreateEntity('circle');
            }}
            title="Create Circle"
          >
            <FaCircleNotch size={20} />
            <span className={styles.shapeLabel}>Circle</span>
          </button>
          <button
            type="button"
            className={styles.shapeBtn}
            onClick={(e) => {
              e.stopPropagation();
              handleCreateEntity('polygon');
            }}
            title="Create Polygon"
          >
            <PiPolygonFill size={20} />
            <span className={styles.shapeLabel}>Polygon</span>
          </button>
          <button
            type="button"
            className={styles.shapeBtn}
            onClick={(e) => {
              e.stopPropagation();
              handleCreateEntity('ellipse');
            }}
            title="Create Ellipse"
          >
            <FaEllipsisH size={20} />
            <span className={styles.shapeLabel}>Ellipse</span>
          </button>
          <button
            type="button"
            className={styles.shapeBtn}
            onClick={(e) => {
              e.stopPropagation();
              handleCreateEntity('sector');
            }}
            title="Create Sector"
          >
            <FaChartPie size={20} />
            <span className={styles.shapeLabel}>Sector</span>
          </button>
        </div>
      </div>
    </FlyoutMenu>
  );
};

export default EntityCreationMenu;
