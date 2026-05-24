import React, { useState, useEffect } from 'react';
import { ENTITY_CATEGORY_OPTIONS } from '@/constants/entityCategories';
import type { EntityType } from '@domain/models/entity';
import { AppButton, AppInput, AppSelect } from '@shared/ui';
import styles from './EntityCreationModal.module.css';

interface EntityCreationModalProps {
  open: boolean;
  defaultType: EntityType;
  onSave: (name: string, category: string) => void;
  onCancel: () => void;
  position?: { x: number; y: number };
  initialName?: string;
}

const EntityCreationModal: React.FC<EntityCreationModalProps> = ({
  open,
  onSave,
  onCancel,
  position,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Enter' && name.trim() && category.trim()) {
        e.preventDefault();
        onSave(name, category);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, name, category, onSave, onCancel]);

  if (!open) return null;
  if (position && (typeof position.x !== 'number' || typeof position.y !== 'number')) return null;

  const modalStyle = position
    ? { position: 'absolute' as const, left: position.x, top: position.y, transform: 'translate(-10px, 10px)' }
    : { position: 'absolute' as const, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <div className={styles.overlay}>
      <div style={modalStyle} className={styles.panel}>
        <div className={styles.header}>
          <h3 className={styles.title}>New Entity</h3>
          <button type="button" onPointerDown={onCancel} className={styles.closeBtn} title="Cancel (Esc)" aria-label="Close">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim() && category.trim()) onSave(name, category);
          }}
        >
          <AppInput
            compact
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Entity name..."
            required
            autoFocus
          />
          <AppSelect compact value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="" disabled>
              Select category...
            </option>
            {ENTITY_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </AppSelect>
          <div className={styles.actions}>
            <AppButton type="submit" size="sm" fullWidth disabled={!name.trim() || !category.trim()} title="Save (Enter)">
              Save
            </AppButton>
            <AppButton type="button" size="sm" variant="ghost" onPointerDown={onCancel} title="Cancel (Esc)">
              Cancel
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EntityCreationModal;
