import { memo, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { clearModeSelection } from '@features/system-mode';
import { SelectedModeE } from '@/enums/general.enum';
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
      <DataRow key={g.gunId} label={`תותח ${g.gunId}`} value={GunStatusE[g.status]} />
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
      subtitle: 'ניווט ועמדה',
      icon: <RenderInsIcon status={insStatus} />,
    },
    {
      id: 'gun' as const,
      title: 'GUN',
      subtitle: 'תותח',
      icon: <RenderGunIcon status={gunStatus ?? GunStatusE.NO_COMM} />,
    },
    {
      id: 'radar' as const,
      title: 'RADAR',
      subtitle: 'מכ״ם',
      icon: <RenderRadarIcon status={radarStatus ?? RadarStatusE.NO_COMM} />,
    },
  ] as const;

  return (
    <div className={styles.page}>
      <div className={styles.pageBackdrop} aria-hidden />
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>תחזוקה</p>
            <h1 className={styles.title}>לוח בקרת מערכות</h1>
            <p className={styles.subtitle}>
              נתונים חיים מהמצב האחרון שהתקבל מהרשת. בחרו מערכת כדי לראות פירוט מלא.
            </p>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.clockLabel}>עדכון שעון מקומי</span>
            <span className={styles.clockValue}>{nowLabel}</span>
            <button type="button" onClick={leave} className={styles.leaveButton}>
              חזרה לבחירת מצב
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
                {active && <span className={styles.activeBadge}>פעיל</span>}
              </button>
            );
          })}
        </div>

        <section className={styles.detailSection}>
          {panel === 'ins' && (
            <div>
              <h2 className={styles.detailTitle}>INS — מצב ועמדה</h2>
              <div className={styles.detailGrid}>
                <DataRow label="סטטוס TMAPS / INS" value={InsStatusE[insStatus] ?? insStatus} />
                <DataRow label="כיוון (°)" value={fmtNum(my.heading, 2)} />
                <DataRow label="Pitch (°)" value={fmtNum(my.pitch, 2)} />
                <DataRow label="Roll (°)" value={fmtNum(my.roll, 2)} />
                <DataRow label="מיקום פעיל (lat)" value={fmtNum(my.coordinates?.lat, 6)} />
                <DataRow label="מיקום פעיל (lng)" value={fmtNum(my.coordinates?.lng, 6)} />
                <DataRow label="GPS" value={`${fmtNum(my.gps_pos?.lat, 5)}, ${fmtNum(my.gps_pos?.lng, 5)}`} />
                <DataRow label="TMAPS" value={`${fmtNum(my.tmaps_pos?.lat, 5)}, ${fmtNum(my.tmaps_pos?.lng, 5)}`} />
                <DataRow label="שימוש ב-GPS" value={String(my.use_gps)} />
                <DataRow label="שימוש בידני" value={String(my.use_manual)} />
                <DataRow label="אזור" value={String(my.zone)} />
                <DataRow label="Fig of merit" value={fmtNum(my.fig_of_merit, 2)} />
                <DataRow label="מרחק מצטבר" value={fmtNum(my.distance_travelled, 2)} />
              </div>
            </div>
          )}

          {panel === 'gun' && (
            <div>
              <h2 className={styles.detailTitle}>GUN — תותח</h2>
              <div className={styles.detailStack}>
                <DataRow label="סטטוס כללי" value={gunStatus != null ? GunStatusE[gunStatus] : '—'} />
                <DataRow label="אזימוט כיוון (°)" value={fmtNum(my.gunAzimut, 2)} />
                {gunRows}
                {!gunRows && (
                  <p className={styles.emptyHint}>אין רשומות תותח נפרדות — מוצג סטטוס כללי בלבד.</p>
                )}
              </div>
            </div>
          )}

          {panel === 'radar' && (
            <div>
              <h2 className={styles.detailTitle}>RADAR — מכ״ם</h2>
              <div className={styles.detailGrid}>
                <DataRow label="סטטוס תצוגה" value={radarStatus != null ? RadarStatusE[radarStatus] : '—'} />
                <DataRow label="סטטוס שרת" value={RadarStatusE[radarServer.state]} />
                <DataRow label="מצב עבודה" value={RadarStateE[radarServer.mode]} />
                <DataRow label="חדר עבודה" value={String(radarServer.workRoom)} />
                <DataRow label="קטגוריית משימה" value={String(radarServer.missionCategory)} />
                <DataRow label="אינדקס תדר" value={String(radarServer.freqIndex)} />
                <DataRow label="גובה מינימלי" value={String(radarServer.min_elevation)} />
                <DataRow label="מגזרי בלנקינג" value={String(radarServer.blanking_sectors)} />
                <DataRow label="טווח (מ׳)" value={String(radarRange)} />
                <DataRow
                  label="מגזרי אי-כיסוי"
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
