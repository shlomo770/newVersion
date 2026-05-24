import { useState } from 'react';
import { CenterModal } from '@shared/components/Modal/CenterModal';
import { DegreeInput } from '@shared/components/inputs/DegreeInput';
import { AppButton, AppIconButton, AppInput } from '@shared/ui';
import styles from './TabooZoneSectorModal.module.css';

export interface TabooZoneSectorModalProps {
  open: boolean;
  onClose: () => void;
  onSend: (values: { minAngle: number; maxAngle: number; radius: number }) => void;
}

export function TabooZoneSectorModal({ open, onClose, onSend }: TabooZoneSectorModalProps) {
  const [minAngle, setMinAngle] = useState(0);
  const [maxAngle, setMaxAngle] = useState(0);
  const [radius, setRadius] = useState(5000);

  const valid =
    minAngle >= 0 &&
    maxAngle >= 0 &&
    minAngle <= 360 &&
    maxAngle <= 360 &&
    radius > 0;

  return (
    <CenterModal open={open} onClose={onClose}>
      <div className={styles.header}>
        <div className={styles.title}>Taboo Zone Sector</div>
        <AppIconButton label="Close" size="sm" onClick={onClose}>
          ✕
        </AppIconButton>
      </div>

      <div className={styles.row}>
        <DegreeInput label="Min°" value={minAngle} onChange={setMinAngle} />
        <DegreeInput label="Max°" value={maxAngle} onChange={setMaxAngle} />
      </div>

      <div className={styles.field}>
        <AppInput
          id="taboo-sector-radius"
          label="Range (m)"
          type="number"
          min={1}
          step={100}
          value={radius}
          onChange={(event) => setRadius(Number(event.target.value) || 0)}
        />
      </div>

      <div className={styles.footer}>
        <AppButton size="sm" variant="secondary" onClick={onClose}>
          Cancel
        </AppButton>
        <AppButton
          size="sm"
          disabled={!valid}
          onClick={() => {
            onSend({ minAngle, maxAngle, radius });
            onClose();
          }}
        >
          Apply
        </AppButton>
      </div>
    </CenterModal>
  );
}

/** @deprecated Use `TabooZoneSectorModal`. */
export const RadarSectorModal = TabooZoneSectorModal;
