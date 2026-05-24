import { FC } from 'react';
import {
  FaCircleNotch,
  FaEllipsisH,
  FaMinus,
  FaChartPie,
  FaRegSquare,
} from 'react-icons/fa';
import { PiPolygonFill } from 'react-icons/pi';
import styles from './entityDisplay.module.css';
import { he } from '@shared/i18n';

export function getEntityTypeLabel(type: string): string {
  switch (type) {
    case 'circle':
      return he.entities.types.circle;
    case 'ellipse':
      return he.entities.types.ellipse;
    case 'polygon':
      return he.entities.types.polygon;
    case 'line':
      return he.entities.types.line;
    case 'sector':
      return he.entities.types.sector;
    case 'rectangle':
      return he.entities.types.rectangle;
    case 'target':
      return he.entities.types.target;
    default:
      return type;
  }
}

export const EntityCategoryBadge: FC<{ category: string }> = ({ category }) => {
  const short = String(category || '?')
    .trim()
    .slice(0, 3);
  const normalized = short ? short.toUpperCase() : '?';
  return <span className={styles.badge}>{normalized}</span>;
};

export const EntityTypeGlyph: FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'circle':
      return <FaCircleNotch className={styles.glyph} />;
    case 'ellipse':
      return <FaEllipsisH className={styles.glyph} />;
    case 'polygon':
    case 'rectangle':
      return <PiPolygonFill className={styles.glyph} />;
    case 'line':
      return <FaMinus className={styles.glyph} />;
    case 'sector':
      return <FaChartPie className={styles.glyph} />;
    default:
      return <FaRegSquare className={styles.glyph} />;
  }
};
