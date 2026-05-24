import { memo, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { clearModeSelection } from '@features/system-mode';
import { SelectedModeE } from '@domain/enums/general.enum';
import {
  GunStatusE,
  InsStatusE,
  RadarStateE,
  RadarStatusE,
} from '@domain/enums/status.enum';
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  RenderInsIcon,
  RenderGunIcon,
  RenderRadarIcon,
} from '@features/status-bar';
import styles from './MaintenanceDashboard.module.css';
import { he } from '@shared/i18n';

type Panel = 'ins' | 'gun' | 'radar';

function fmtNum(value: unknown, digits = 4): string {
  const x = Number(value);
  return Number.isFinite(x) ? x.toFixed(digits) : '—';
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.dataRow}>
      <span className={styles.dataLabel}>{label}</span>
      <span className={styles.dataValue}>{value}</span>
    </div>
  );
}

function MaintenanceDashboard() {
  useWebSocket();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [panel, setPanel] = useState<Panel>('ins');
  const [tick, setTick] = useState(0);

  const insStatus = useAppSelector((s) => s.ins.status as InsStatusE);
  const gunStatus = useAppSelector((s) => s.gun.status as GunStatusE | undefined);
  const guns = useAppSelector((s) => s.gun.guns);
  const radarStatus = useAppSelector((s) => s.radar.status as RadarStatusE | null);
  const radarServer = useAppSelector((s) => s.radar.serverValues);
  const radarRange = useAppSelector((s) => s.radar.radarRange);
  const radarNon = useAppSelector((s) => s.radar.radarNonCoverage);
  const my = useAppSelector((s) => s.myPosition);
  const selectedMode = useAppSelector((s) => s.systemState.selectedMode);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (selectedMode !== SelectedModeE.Maintenance) {
      navigate('/mode', { replace: true });
    }
  }, [selectedMode, navigate]);

  const nowLabel = useMemo(() => new Date().toLocaleString('he-IL'), [tick]);

  const gunRows = useMemo(() => {
    const entries = Object.values(guns ?? {});
    if (!entries.length) return null;
    return entries.map((g) => (
      <DataRow key={g.gunId} label={he.maintenance.gunLabel(g.gunId)} value={GunStatusE[g.status]} />
    ));
  }, [guns]);

  const leave = () => {
    dispatch(clearModeSelection());
    navigate('/mode', { replace: true });
  };

  const cards = [
    {
      id: 'ins' as const,
      title: 'INS',
      subtitle: he.maintenance.insSubtitle,
      icon: <RenderInsIcon status={insStatus} />,
    },
    {
      id: 'gun' as const,
      title: 'GUN',
      subtitle: he.maintenance.gunSubtitle,
      icon: <RenderGunIcon status={gunStatus ?? GunStatusE.NO_COMM} />,
    },
    {
      id: 'radar' as const,
      title: 'RADAR',
      subtitle: he.maintenance.radarSubtitle,
      icon: <RenderRadarIcon status={radarStatus ?? RadarStatusE.NO_COMM} />,
    },
  ] as const;

  return (
    <div className={styles.page}>
      <div className={styles.pageBackdrop} aria-hidden />
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>{he.maintenance.kicker}</p>
            <h1 className={styles.title}>{he.maintenance.title}</h1>
            <p className={styles.subtitle}>
              {he.maintenance.subtitle}
            </p>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.clockLabel}>{he.maintenance.clockLabel}</span>
            <span className={styles.clockValue}>{nowLabel}</span>
            <button type="button" onClick={leave} className={styles.leaveButton}>
              {he.maintenance.backToMode}
            </button>
          </div>
        </header>

        <div className={styles.cardGrid}>
          {cards.map((c) => {
            const active = panel === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setPanel(c.id)}
                className={`${styles.systemCard} ${active ? styles.systemCardActive : ''}`}
              >
                <div className={`${styles.iconBox} ${active ? styles.iconBoxActive : ''}`}>
                  <div className={styles.iconScaled}>{c.icon}</div>
                </div>
                <span className={styles.cardTitle}>{c.title}</span>
                <span className={styles.cardSubtitle}>{c.subtitle}</span>
                {active && <span className={styles.activeBadge}>{he.maintenance.active}</span>}
              </button>
            );
          })}
        </div>

        <section className={styles.detailSection}>
          {panel === 'ins' && (
            <div>
              <h2 className={styles.detailTitle}>{he.maintenance.insDetailTitle}</h2>
              <div className={styles.detailGrid}>
                <DataRow label={he.maintenance.insStatus} value={InsStatusE[insStatus] ?? insStatus} />
                <DataRow label={he.maintenance.heading} value={fmtNum(my.heading, 2)} />
                <DataRow label="Pitch (°)" value={fmtNum(my.pitch, 2)} />
                <DataRow label="Roll (°)" value={fmtNum(my.roll, 2)} />
                <DataRow label={he.maintenance.activeLat} value={fmtNum(my.coordinates?.lat, 6)} />
                <DataRow label={he.maintenance.activeLng} value={fmtNum(my.coordinates?.lng, 6)} />
                <DataRow label="GPS" value={`${fmtNum(my.gps_pos?.lat, 5)}, ${fmtNum(my.gps_pos?.lng, 5)}`} />
                <DataRow label="TMAPS" value={`${fmtNum(my.tmaps_pos?.lat, 5)}, ${fmtNum(my.tmaps_pos?.lng, 5)}`} />
                <DataRow label={he.maintenance.useGps} value={String(my.use_gps)} />
                <DataRow label={he.maintenance.useManual} value={String(my.use_manual)} />
                <DataRow label={he.maintenance.zone} value={String(my.zone)} />
                <DataRow label="Fig of merit" value={fmtNum(my.fig_of_merit, 2)} />
                <DataRow label={he.maintenance.cumulativeDistance} value={fmtNum(my.distance_travelled, 2)} />
              </div>
            </div>
          )}

          {panel === 'gun' && (
            <div>
              <h2 className={styles.detailTitle}>{he.maintenance.gunDetailTitle}</h2>
              <div className={styles.detailStack}>
                <DataRow label={he.maintenance.gunGeneralStatus} value={gunStatus != null ? GunStatusE[gunStatus] : '—'} />
                <DataRow label={he.maintenance.gunAzimuth} value={fmtNum(my.gunAzimut, 2)} />
                {gunRows}
                {!gunRows && (
                  <p className={styles.emptyHint}>{he.maintenance.noGunRecords}</p>
                )}
              </div>
            </div>
          )}

          {panel === 'radar' && (
            <div>
              <h2 className={styles.detailTitle}>{he.maintenance.radarDetailTitle}</h2>
              <div className={styles.detailGrid}>
                <DataRow label={he.maintenance.radarDisplayStatus} value={radarStatus != null ? RadarStatusE[radarStatus] : '—'} />
                <DataRow label={he.maintenance.radarServerStatus} value={RadarStatusE[radarServer.state]} />
                <DataRow label={he.maintenance.workMode} value={RadarStateE[radarServer.mode]} />
                <DataRow label={he.maintenance.workRoom} value={String(radarServer.workRoom)} />
                <DataRow label={he.maintenance.missionCategory} value={String(radarServer.missionCategory)} />
                <DataRow label={he.maintenance.freqIndex} value={String(radarServer.freqIndex)} />
                <DataRow label={he.maintenance.minElevation} value={String(radarServer.min_elevation)} />
                <DataRow label={he.maintenance.blankingSectors} value={String(radarServer.blanking_sectors)} />
                <DataRow label={he.maintenance.rangeMeters} value={String(radarRange)} />
                <DataRow
                  label={he.maintenance.nonCoverageSectors}
                  value={
                    radarNon && radarNon.length ? (
                      <span className={styles.dataValueBreak}>{radarNon.join(', ')}</span>
                    ) : (
                      '—'
                    )
                  }
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default memo(MaintenanceDashboard);
