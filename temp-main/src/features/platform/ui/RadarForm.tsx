import type { ReactNode } from 'react';
import ToggleSwitch from '@shared/components/ToggleSwitch/ToggleSwitch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useWebSocket } from '@/hooks/useWebSocket';
import { RadarStateE } from '@domain/enums/status.enum';
import { WsMessageName } from '@domain/enums/ws.enum';
import { hydrateFormFromServer, updateFormValue } from '../store/radarSlice';
import { buildSetRadarParamsPayload, RADAR_PARAM_KEYS } from '@domain/mappers/radarWire.mapper';
import { AppButton, AppFormStack, AppInput, AppSelect, cn } from '@shared/ui';
import { he } from '@shared/i18n';
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
        <h3 className={styles.title}>{he.platform.radar.title}</h3>
        <p className={styles.subtitle}>
          <span className={styles.subtitleDraft}>{he.platform.radar.draftHint}</span> — {he.platform.radar.draftDesc}{' '}
          <span className={styles.subtitleSep}>|</span>{' '}
          <span className={styles.subtitleServer}>{he.platform.radar.serverHint}</span> — {he.platform.radar.serverDesc}
        </p>
      </div>

      <AppFormStack className={styles.fields}>
        <div className={styles.modeCard}>
          <div className={styles.modeRow}>
            <span className={styles.modeLabel}>{he.platform.radar.operationalMode}</span>
            <div className={styles.modeValueWrap}>
              <span
                className={`${styles.modeValue} ${isOperate ? styles.modeValueActive : ''}`}
              >
                {isOperate ? he.platform.radar.operational : modeLabel(formValues.mode)}
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
                ariaLabel={he.platform.radar.toggleOperational}
              />
            </div>
          </div>
          <div className={styles.modeMeta}>
            <span>{he.platform.radar.draftValue}: {modeLabel(formValues.mode)}</span>
            <span className={styles.modeMetaServer}>{he.platform.radar.serverValue}: {modeLabel(serverValues.mode)}</span>
          </div>
          {mismatches.mode && (
            <p className={styles.mismatchHint}>{he.platform.radar.mismatch}</p>
          )}
        </div>

        <div className={styles.fieldGrid}>
          <FieldBlock
            label={he.platform.radar.missionType}
            mismatch={!!mismatches.missionCategory}
            draft={
              <AppSelect
                value={String(formValues.missionCategory)}
                onChange={(e) =>
                  dispatch(
                    updateFormValue({
                      field: 'missionCategory',
                      value: Number.parseInt(e.target.value, 10) || 1,
                    }),
                  )
                }
              >
                {MISSION_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </AppSelect>
            }
            serverText={String(serverValues.missionCategory)}
          />

          <FieldBlock
            label={he.platform.radar.freqIndex}
            mismatch={!!mismatches.freqIndex}
            draft={
              <AppSelect
                value={String(formValues.freqIndex)}
                onChange={(e) =>
                  dispatch(
                    updateFormValue({
                      field: 'freqIndex',
                      value: Number.parseInt(e.target.value, 10) || 0,
                    }),
                  )
                }
              >
                {FREQ_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </AppSelect>
            }
            serverText={String(serverValues.freqIndex)}
          />

          <div className={styles.fieldGridTwo}>
            <FieldBlock
              label={he.platform.radar.minElevation}
              mismatch={!!mismatches.min_elevation}
              draft={
                <AppInput
                  type="text"
                  inputMode="numeric"
                  center
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
                />
              }
              serverText={String(serverValues.min_elevation)}
            />
            <FieldBlock
              label={he.platform.radar.blankingSectors}
              mismatch={!!mismatches.blanking_sectors}
              draft={
                <AppInput
                  type="text"
                  inputMode="numeric"
                  center
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
                />
              }
              serverText={String(serverValues.blanking_sectors)}
            />
          </div>
        </div>

        <AppFormStack actions>
          <AppButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => dispatch(hydrateFormFromServer())}
            disabled={!hasPending}
          >
            {he.platform.radar.resetToServer}
          </AppButton>
          <AppButton type="button" size="sm" onClick={sendParams} disabled={!hasPending}>
            {he.platform.radar.sendForConfig}
          </AppButton>
        </AppFormStack>
      </AppFormStack>
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
    <div className={cn(styles.fieldBlock, mismatch && styles.fieldBlockMismatch)}>
      <div className={styles.fieldHeader}>
        <span className={styles.fieldLabel}>{label}</span>
        <span className={styles.fieldServer}>{he.platform.radar.serverValue}: {serverText}</span>
      </div>
      {draft}
    </div>
  );
}

export default RadarForm;
