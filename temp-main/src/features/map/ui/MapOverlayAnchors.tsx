import { FC } from 'react';
import styles from './MapOverlayAnchors.module.css';

interface ScreenPoint {
  x: number;
  y: number;
}

interface MapOverlayAnchorsProps {
  drawUiPos: ScreenPoint | null;
  drawCanFinish: boolean;
  onFinishDraw: () => void;
  measureUiPos: ScreenPoint | null;
  measureCanFinish: boolean;
  onFinishMeasure: () => void;
  tooltip: { x: number; y: number; text: string } | null;
}

const MapOverlayAnchors: FC<MapOverlayAnchorsProps> = ({
  drawUiPos,
  drawCanFinish,
  onFinishDraw,
  measureUiPos,
  measureCanFinish,
  onFinishMeasure,
  tooltip,
}) => {
  return (
    <>
      {drawUiPos && drawCanFinish ? (
        <button
          type="button"
          onClick={onFinishDraw}
          className={styles.finishButton}
          style={{ left: drawUiPos.x + 12, top: drawUiPos.y - 12 }}
          aria-label="Finish drawing"
        >
          ✓
        </button>
      ) : null}
      {measureUiPos && measureCanFinish ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onFinishMeasure();
          }}
          className={styles.finishButton}
          style={{ left: measureUiPos.x + 12, top: measureUiPos.y - 12 }}
          aria-label="Finish measurement"
        >
          ✓
        </button>
      ) : null}
      {tooltip ? (
        <div
          className={styles.measureTooltip}
          style={{ left: tooltip.x, top: tooltip.y - 32 }}
        >
          {tooltip.text}
        </div>
      ) : null}
    </>
  );
};

export default MapOverlayAnchors;

export type { ScreenPoint };
