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

export function getEntityTypeLabel(type: string): string {
  switch (type) {
    case 'circle':
      return 'מעגל';
    case 'ellipse':
      return 'אליפסה';
    case 'polygon':
      return 'פוליגון';
    case 'line':
      return 'קו';
    case 'sector':
      return 'מגזר (Taboo Zone)';
    case 'rectangle':
      return 'מלבן';
    case 'target':
      return 'Target';
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
