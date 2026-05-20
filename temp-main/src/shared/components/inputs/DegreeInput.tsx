import type { ChangeEvent } from 'react';
import styles from './DegreeInput.module.css';

export interface DegreeInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  id?: string;
}

export function DegreeInput({
  label,
  value,
  onChange,
  min = 0,
  max = 360,
  disabled = false,
  id,
}: DegreeInputProps) {
  const inputId = id ?? `degree-input-${label.replace(/\s+/g, '-')}`;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (raw === '') {
      onChange(min);
      return;
    }
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= min && parsed <= max) {
      onChange(parsed);
    }
  };

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className={styles.input}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={`${min}–${max}`}
      />
    </div>
  );
}
