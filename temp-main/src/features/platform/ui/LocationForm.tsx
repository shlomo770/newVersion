import { useCallback, useEffect, useState, type ReactNode } from 'react';
import ToggleSwitch from '@shared/components/ToggleSwitch/ToggleSwitch';
import { AppButton, AppFormStack, AppInput, AppSelect } from '@shared/ui';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { updateMyCali, updateMyCoordinates } from '../store/myPositionSlice';
import { useWebSocket } from '@/hooks/useWebSocket';
import { WsMessageName } from '@domain/enums/ws.enum';
import { CaliModeE, PosTypeE } from '@domain/enums/general.enum';
import { store } from '@app/store';
import { InsStatusE } from '@domain/enums/status.enum';
import { servers } from '@/config/communication.json';
import { toggleCoordinateSystem, setUTMZone } from '@features/map';
import { formatCoordinates, parseUTMString, utmToWGS84 } from '@/utils/coordinates';
import { he } from '@shared/i18n';
import styles from './LocationForm.module.css';

const formatCoord = (n: number, decimals = 6) =>
  Number.isFinite(n) ? n.toFixed(decimals) : '—';

export const formatOneDecimal = (value: number | undefined | null): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toFixed(1);
};

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionHeaderRow}>
          <h4 className={styles.sectionTitle}>{title}</h4>
          {subtitle ? <span className={styles.sectionSubtitle}>{subtitle}</span> : null}
        </div>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function Stat({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className={styles.statRow}>
      <span className={styles.statLabel}>{label}</span>
      <span
        className={`${styles.statValue} ${mono ? styles.statValueMono : ''}`}
        dir="ltr"
      >
        {value}
      </span>
    </div>
  );
}

export default function LocationForm() {
  const dispatch = useAppDispatch();
  const myPosition = useAppSelector((s) => s.myPosition);
  const tmapsStatus = useAppSelector((s) => s.ins.status);
  const isUTM = useAppSelector((s) => s.coordinates.isUTM);
  const utmZone = useAppSelector((s) => s.coordinates.utmZone);
  const { sendMessage } = useWebSocket();
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [altInput, setAltInput] = useState(0);
  const [headInput, setHeadInput] = useState(0);
  const [utmInput, setUtmInput] = useState('');

  const coords = myPosition.coordinates;
  const lat = coords?.lat ?? 0;
  const lng = coords?.lng ?? 0;
  const alt = coords?.alt ?? 0;

  const insBlocked = tmapsStatus === InsStatusE.NO_COMM;

  useEffect(() => {
    if (manualOpen && myPosition.clickCord) {
      setLatInput(myPosition.clickCord.lat.toString().slice(0, 7));
      setLngInput(myPosition.clickCord.lng.toString().slice(0, 7));
      setUtmInput(
        formatCoordinates(
          { lat: myPosition.clickCord.lat, lng: myPosition.clickCord.lng },
          isUTM,
          utmZone,
        ),
      );
    }
  }, [myPosition.clickCord, manualOpen, isUTM, utmZone]);

  useEffect(() => {
    if (myPosition.use_manual) {
      setManualOpen(true);
    }
  }, [myPosition.use_manual]);

  useEffect(() => {
    if (manualOpen) {
      setLatInput(formatCoord(lat));
      setLngInput(formatCoord(lng));
      setUtmInput(formatCoordinates({ lat, lng }, isUTM, utmZone));
      setHeadInput((h) => h || 0);
    }
  }, [manualOpen, lat, lng, isUTM, utmZone]);

  useEffect(() => {
    if (manualOpen) {
      if (latInput === '' || lngInput === '') {
        setUtmInput(formatCoordinates({ lat, lng }, isUTM, utmZone));
      } else {
        setUtmInput(
          formatCoordinates({ lat: Number(latInput), lng: Number(lngInput) }, isUTM, utmZone),
        );
      }
    }
  }, [isUTM, manualOpen, latInput, lngInput, lat, lng, utmZone]);

  const onConfirmManual = useCallback(async () => {
    const la = parseFloat(latInput.replace(/,/g, '.'));
    const lo = parseFloat(lngInput.replace(/,/g, '.'));
    const al = parseFloat(altInput.toString().replace(/,/g, '.'));
    let finaAlt = Number.isFinite(al) ? al : alt;
    if (!Number.isFinite(la) || !Number.isFinite(lo)) return;
    dispatch(
      updateMyCoordinates({
        lat: la,
        lng: lo,
        alt: Number.isFinite(al) ? al : alt,
      }),
    );
    try {
      const url = `http://${servers.mapServer}/elevation?lon=${lngInput}&lat=${latInput}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = (await response.json()) as number;
        finaAlt = data;
        setAltInput(data);
      }
    } catch {
      /* elevation optional */
    }

    sendMessage(WsMessageName.SetPosType, { pos: PosTypeE.Manual });
    sendMessage(WsMessageName.SetPosition, {
      manual_pos: {
        lat: latInput,
        lng: lngInput,
        alt: finaAlt,
        heading: headInput,
      },
    });
  }, [dispatch, latInput, lngInput, headInput, altInput, alt, sendMessage]);

  const posSourceLabel = myPosition.use_manual
    ? he.platform.location.posSourceManual
    : he.platform.location.posSourceTmaps;

  return (
    <div lang="he" className={styles.form}>
      <header className={styles.header}>
        <h3 className={styles.title}>{he.platform.location.title}</h3>
        <p className={styles.subtitle}>{he.platform.location.subtitle}</p>
      </header>

      <div className={styles.stack}>
        <div className={insBlocked ? styles.insBlocked : undefined} aria-hidden={insBlocked || undefined}>
          <SectionCard title={he.platform.location.gpsSection} subtitle={isUTM ? `UTM · ${utmZone}` : 'WGS84'}>
            <div className={styles.toggleRow}>
              <span className={styles.toggleLabel}>{he.platform.location.useGps}</span>
              <div className={styles.toggleWrap} dir="ltr">
                <span className={styles.toggleState}>{gpsEnabled ? he.common.yes : he.common.no}</span>
                <ToggleSwitch
                  checked={gpsEnabled}
                  onChange={() => {
                    sendMessage(WsMessageName.GpsIntegration, { use_gps: !gpsEnabled });
                    setGpsEnabled(!gpsEnabled);
                  }}
                  size="sm"
                  ariaLabel={he.platform.location.useGpsAria}
                />
              </div>
            </div>
            <div
              className={styles.coordDisplay}
              dir="ltr"
              title={formatCoordinates(myPosition.gps_pos, isUTM, utmZone)}
            >
              {formatCoordinates(myPosition.gps_pos, isUTM, utmZone)}
              <span className={styles.coordSep}> · </span>
              <span className={styles.coordAlt}>Alt {myPosition.gps_pos.alt}</span>
            </div>
            <div className={styles.statGrid}>
              <Stat label={he.platform.location.figOfMerit} value={myPosition.fig_of_merit} mono />
              <Stat label={he.platform.location.zone} value={myPosition.zone} mono />
            </div>
          </SectionCard>

          <SectionCard title={he.platform.location.tmapsSection}>
            <div
              className={styles.coordDisplay}
              dir="ltr"
              title={formatCoordinates(myPosition.tmaps_pos, isUTM, utmZone)}
            >
              {formatCoordinates(myPosition.tmaps_pos, isUTM, utmZone)}
              <span className={styles.coordSep}> · </span>
              <span className={styles.coordAlt}>Alt {myPosition.tmaps_pos.alt}</span>
            </div>
            <div className={styles.statList}>
              <Stat label={he.platform.location.cumulativeDistance} value={myPosition.distance_travelled} mono />
              <Stat label={he.platform.location.odometerCalibration} value={CaliModeE[myPosition.odo_cali_finished || 0]} />
              <Stat label={he.platform.location.positionSource} value={posSourceLabel} />
            </div>
            <div className={styles.telemetryGrid} dir="ltr">
              {(
                [
                  ['Hdg', myPosition.heading],
                  ['Pitch', myPosition.pitch],
                  ['Roll', myPosition.roll],
                ] as const
              ).map(([lab, v]) => (
                <div key={lab} className={styles.telemetryCell}>
                  <div className={styles.telemetryLabel}>{lab}</div>
                  <div className={styles.telemetryValue}>
                    {formatOneDecimal(v)}
                    <span className={styles.telemetryUnit}>°</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className={styles.actionGrid}>
          <button
            type="button"
            disabled={insBlocked}
            className={`${styles.actionButton} ${styles.actionButtonCalibrate}`}
            onClick={() => {
              sendMessage(WsMessageName.StartOdoCali, {});
              store.dispatch(updateMyCali(CaliModeE.NO));
            }}
          >
            {he.platform.location.calibrate}
          </button>
          <button
            type="button"
            disabled={insBlocked}
            className={styles.actionButton}
            onClick={() => sendMessage(WsMessageName.StartRealing, {})}
          >
            {he.platform.location.realign}
          </button>
          <button
            type="button"
            onClick={() => {
              setManualOpen((o) => {
                const next = !o;
                if (o) sendMessage(WsMessageName.SetPosType, { pos: PosTypeE.TMAPS });
                return next;
              });
            }}
            className={`${styles.actionButton} ${manualOpen ? styles.actionButtonManualActive : ''}`}
          >
            {he.platform.location.manual}
          </button>
        </div>

        {manualOpen && (
          <div className={styles.manualPanel}>
            <div className={styles.manualTitle}>{he.platform.location.manualEntry}</div>
            <AppFormStack className={styles.manualInputs} dir="ltr">
              <div className={styles.manualInputRow}>
                {!isUTM && (
                  <div className={styles.latLngGroup}>
                    <AppInput
                      label={he.platform.location.latitude}
                      value={latInput}
                      onChange={(e) => setLatInput(e.target.value)}
                      placeholder="32.0853"
                      inputMode="decimal"
                      autoComplete="off"
                      spellCheck={false}
                      title="Latitude"
                      center
                      fieldClassName={styles.inputGroup}
                    />
                    <AppInput
                      label={he.platform.location.longitude}
                      value={lngInput}
                      onChange={(e) => setLngInput(e.target.value)}
                      placeholder="34.7818"
                      inputMode="decimal"
                      autoComplete="off"
                      spellCheck={false}
                      title="Longitude"
                      center
                      fieldClassName={styles.inputGroup}
                    />
                  </div>
                )}
                {isUTM && (
                  <AppInput
                    label="UTM"
                    value={utmInput}
                    onChange={(e) => {
                      setUtmInput(e.target.value);
                      const latLngConvert = utmToWGS84(parseUTMString(e.target.value));
                      setLatInput(latLngConvert.lat.toString().slice(0, 8));
                      setLngInput(latLngConvert.lng.toString().slice(0, 8));
                    }}
                    inputMode="text"
                    autoComplete="off"
                    spellCheck={false}
                    title="UTM"
                    center
                    fieldClassName={styles.inputGroup}
                  />
                )}
                <AppInput
                  label={he.platform.location.heading}
                  type="number"
                  value={headInput}
                  onChange={(e) => setHeadInput(Number(e.target.value))}
                  inputMode="decimal"
                  center
                  fieldClassName={styles.inputGroupNarrow}
                />
              </div>
              <AppButton type="button" size="sm" fullWidth onClick={onConfirmManual}>
                {he.platform.location.confirmSubmit}
              </AppButton>
            </AppFormStack>
          </div>
        )}

        <div className={styles.coordToggleCard}>
          <div className={styles.coordToggleRow}>
            <span className={styles.coordToggleLabel}>{he.platform.location.coordDisplayInUi}</span>
            <button
              type="button"
              onClick={() => dispatch(toggleCoordinateSystem())}
              className={styles.coordToggleButton}
            >
              {isUTM ? 'UTM' : 'WGS84'}
            </button>
          </div>
          {isUTM && myPosition.use_manual && (
            <AppSelect
              compact
              label={he.platform.location.utmZone}
              fieldClassName={styles.utmZoneRow}
              value={utmZone}
              onChange={(e) => dispatch(setUTMZone(Number(e.target.value)))}
            >
              {[33, 34, 35, 36, 37, 38].map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </AppSelect>
          )}
        </div>
      </div>

      {insBlocked && (
        <p className={styles.insWarning}>
          {he.platform.location.insNoCommWarning}
        </p>
      )}
    </div>
  );
}
