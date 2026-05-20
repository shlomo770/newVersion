import type { ReactNode } from 'react';
import ToggleSwitch from '@shared/components/ToggleSwitch/ToggleSwitch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useWebSocket } from '@/hooks/useWebSocket';
import { RadarStateE } from '@domain/enums/status.enum';
import { WsMessageName } from '@/enums/ws.enum';
import { hydrateFormFromServer, updateFormValue } from '../store/radarSlice';
import { buildSetRadarParamsPayload, RADAR_PARAM_KEYS } from '@domain/mappers/radarWire.mapper';
import styles from './RadarForm.module.css';

const FREQ_OPTIONS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const MISSION_OPTIONS = ['1', '2', '3', '4', '5'];

function modeLabel(mode: RadarStateE): string {
  return RadarStateE[mode] ?? String(mode);
}

function RadarForm() {
  const dispatch = useAppDispatch();
  const { sendMessage } = useWebSocket();
  const { formValues, serverValues, mismatches } = useAppSelector((s) => s.radar);

  const hasPending = RADAR_PARAM_KEYS.some((k) => mismatches[k]);

  const sendParams = () => {
    sendMessage(WsMessageName.SetRadarParams, buildSetRadarParamsPayload(formValues));
  };

  const isOperate = formValues.mode === RadarStateE.OPERATE;

  return (
    <div className={styles.form}>
      <div className={styles.header}>
        <h3 className={styles.title}>מכ״ם — פרמטרים</h3>
        <p className={styles.subtitle}>
          <span className={styles.subtitleDraft}>טיוטה</span> — מה שאתה עורך.{' '}
          <span className={styles.subtitleSep}>|</span>{' '}
          <span className={styles.subtitleServer}>במכשיר</span> — אושר מהשרת לאחרונה.
        </p>
      </div>

      <div className={styles.fields}>
        <div className={styles.modeCard}>
          <div className={styles.modeRow}>
            <span className={styles.modeLabel}>מצב מבצעי</span>
            <div className={styles.modeValueWrap}>
              <span
                className={`${styles.modeValue} ${isOperate ? styles.modeValueActive : ''}`}
              >
                {isOperate ? 'מבצעי' : modeLabel(formValues.mode)}
              </span>
              <ToggleSwitch
                checked={isOperate}
                onChange={() =>
                  dispatch(
                    updateFormValue({
                      field: 'mode',
                      value: isOperate ? RadarStateE.STANDBY : RadarStateE.OPERATE,
                    }),
                  )
                }
                size="sm"
                ariaLabel="החלפת מצב מבצעי"
              />
            </div>
          </div>
          <div className={styles.modeMeta}>
            <span>טיוטה: {modeLabel(formValues.mode)}</span>
            <span className={styles.modeMetaServer}>במכשיר: {modeLabel(serverValues.mode)}</span>
          </div>
          {mismatches.mode && (
            <p className={styles.mismatchHint}>ערך השליחה שונה ממה שהמכשיר דיווח</p>
          )}
        </div>

        <div className={styles.fieldGrid}>
          <FieldBlock
            label="סוג משימה"
            mismatch={!!mismatches.missionCategory}
            draft={
              <select
                value={String(formValues.missionCategory)}
                onChange={(e) =>
                  dispatch(
                    updateFormValue({
                      field: 'missionCategory',
                      value: Number.parseInt(e.target.value, 10) || 1,
                    }),
                  )
                }
                className={styles.select}
              >
                {MISSION_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            }
            serverText={String(serverValues.missionCategory)}
          />

          <FieldBlock
            label="תדר (מדד)"
            mismatch={!!mismatches.freqIndex}
            draft={
              <select
                value={String(formValues.freqIndex)}
                onChange={(e) =>
                  dispatch(
                    updateFormValue({
                      field: 'freqIndex',
                      value: Number.parseInt(e.target.value, 10) || 0,
                    }),
                  )
                }
                className={styles.select}
              >
                {FREQ_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            }
            serverText={String(serverValues.freqIndex)}
          />

          <div className={styles.fieldGridTwo}>
            <FieldBlock
              label="גובה מינימלי"
              mismatch={!!mismatches.min_elevation}
              draft={
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(formValues.min_elevation)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    dispatch(
                      updateFormValue({
                        field: 'min_elevation',
                        value: raw === '' ? 0 : Number.parseInt(raw, 10),
                      }),
                    );
                  }}
                  className={styles.input}
                />
              }
              serverText={String(serverValues.min_elevation)}
            />
            <FieldBlock
              label="גיזרת החסמה"
              mismatch={!!mismatches.blanking_sectors}
              draft={
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(formValues.blanking_sectors)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    dispatch(
                      updateFormValue({
                        field: 'blanking_sectors',
                        value: raw === '' ? 0 : Number.parseInt(raw, 10),
                      }),
                    );
                  }}
                  className={styles.input}
                />
              }
              serverText={String(serverValues.blanking_sectors)}
            />
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => dispatch(hydrateFormFromServer())}
            disabled={!hasPending}
            className={styles.resetButton}
          >
            איפוס לערכי השרת
          </button>
          <button type="button" onClick={sendParams} disabled={!hasPending} className={styles.submitButton}>
            שלח להגדרה
          </button>
        </div>
      </div>
    </div>
  );
}

interface FieldBlockProps {
  label: string;
  mismatch: boolean;
  draft: ReactNode;
  serverText: string;
}

function FieldBlock({ label, mismatch, draft, serverText }: FieldBlockProps) {
  return (
    <div className={`${styles.fieldBlock} ${mismatch ? styles.fieldBlockMismatch : ''}`}>
      <div className={styles.fieldHeader}>
        <span className={styles.fieldLabel}>{label}</span>
        <span className={styles.fieldServer}>במכשיר: {serverText}</span>
      </div>
      {draft}
    </div>
  );
}

export default RadarForm;
