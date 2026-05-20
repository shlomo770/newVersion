import React, { useRef, useState } from 'react';
import { TbZoomPan, TbMapStar } from 'react-icons/tb';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setBrightness, setZoom } from '@features/map/store/mapSlice';
import { setDrawingMode } from '@features/entities';
import FlyoutMenu from '@shared/components/overlay/FlyoutMenu';
import BaseMapSelector from '../BaseMapSelector';
import type { MapFacade, JsonPathInput } from '@features/map/services/MapFacade';
import styles from './MapControls.module.css';

interface MapControlsProps {
  mapFacadeRef?: React.MutableRefObject<MapFacade | null>;
}

function normalizePoints(raw: unknown): Array<{ lng: number; lat: number; alt?: number }> {
  if (!Array.isArray(raw)) return [];
  const points: Array<{ lng: number; lat: number; alt?: number }> = [];
  raw.forEach((p) => {
    if (Array.isArray(p) && p.length >= 2) {
      const lng = Number(p[0]);
      const lat = Number(p[1]);
      const alt = p.length >= 3 ? Number(p[2]) : undefined;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      points.push({ lat, lng, alt: Number.isFinite(alt) ? alt : undefined });
      return;
    }
    if (p && typeof p === 'object') {
      const obj = p as Record<string, unknown>;
      const lat = Number(obj.lat ?? obj.latitude);
      const lng = Number(obj.lng ?? obj.lon ?? obj.longitude);
      const alt = Number(obj.alt ?? obj.altitude ?? obj.height);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      points.push({ lat, lng, alt: Number.isFinite(alt) ? alt : undefined });
    }
  });
  return points;
}

function normalizePaths(raw: unknown): JsonPathInput[] {
  if (Array.isArray(raw)) {
    if (raw.length === 0) return [];
    const first = raw[0];
    const looksLikePathObject =
      first &&
      typeof first === 'object' &&
      (Array.isArray((first as Record<string, unknown>).points) ||
        Array.isArray((first as Record<string, unknown>).path) ||
        Array.isArray((first as Record<string, unknown>).coordinates));
    if (looksLikePathObject) {
      const paths: JsonPathInput[] = [];
      raw.forEach((p) => {
        if (!p || typeof p !== 'object') return;
        const row = p as Record<string, unknown>;
        const pts = normalizePoints(row.points ?? row.path ?? row.coordinates ?? []);
        if (pts.length >= 2) {
          paths.push({
            id: typeof row.id === 'string' ? row.id : undefined,
            name: typeof row.name === 'string' ? row.name : undefined,
            points: pts,
          });
        }
      });
      return paths;
    }
    const points = normalizePoints(raw);
    return points.length ? [{ points }] : [];
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const fromObj = obj.paths ?? obj.routes ?? obj.lines;
    if (Array.isArray(fromObj)) return normalizePaths(fromObj);
    const pts = normalizePoints(obj.points ?? obj.path ?? obj.coordinates ?? []);
    return pts.length ? [{ points: pts }] : [];
  }
  return [];
}

const MapControls: React.FC<MapControlsProps> = ({ mapFacadeRef }) => {
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenBrightness, setIsOpenBrightness] = useState(false);
  const [isMapSelectorOpen, setIsMapSelectorOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brightness = useAppSelector((state) => state.map.brightness);
  const drawingMode = useAppSelector((state) => state.entities.drawingMode);
  const isMeasuringDistance = drawingMode === 'measure';

  const handleZoomReset = () => {
    dispatch(setZoom(10));
    mapFacadeRef?.current?.setZoom(10);
    setIsOpen(false);
  };

  const handleBrightnessChange = (value: number) => {
    dispatch(setBrightness(value));
  };

  const handleRulerToggle = () => {
    const newMode = isMeasuringDistance ? null : 'measure';
    dispatch(setDrawingMode(newMode));
    setIsOpen(false);
  };

  const handleMapTypeToggle = () => {
    setIsMapSelectorOpen(!isMapSelectorOpen);
  };

  const handleJsonFilePick = () => {
    fileInputRef.current?.click();
  };

  const handleJsonFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !mapFacadeRef?.current) return;
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      const paths = normalizePaths(parsed);
      if (paths.length === 0) {
        console.warn('JSON must include at least one path with 2+ points.');
        return;
      }
      mapFacadeRef.current.renderJsonPaths(paths);
    } catch (err) {
      console.error('Failed to parse JSON path file:', err);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <>
      <div
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={styles.launcher}
        title="Map Controls"
        role="button"
        tabIndex={0}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') setIsOpen(!isOpen);
        }}
      >
        <img src="./icons/Map_512.png" alt="" className={styles.launcherIcon} />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className={styles.hiddenFileInput}
        onChange={handleJsonFileChange}
      />

      <FlyoutMenu
        anchorRef={buttonRef}
        isOpen={isOpenBrightness}
        placement="bottom"
        top={260}
        left={240}
        arow={55}
        onClose={() => setIsOpenBrightness(false)}
      >
        <div className={styles.brightnessPanel} onClick={(e) => e.stopPropagation()}>
          <img src="./icons/brightness_512.png" className={styles.brightnessIcon} alt="" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={brightness}
            onChange={(e) => handleBrightnessChange(Number(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            className={styles.brightnessSlider}
            style={{
              background: `linear-gradient(to right, #2F67FF 0%, #2F67FF ${brightness * 100}%, #C9CDD3 ${brightness * 100}%, #C9CDD3 100%)`,
            }}
          />
        </div>
      </FlyoutMenu>

      <FlyoutMenu
        anchorRef={buttonRef}
        isOpen={isOpen}
        placement="bottom"
        top={155}
        left={285}
        arow={25}
        onClose={() => !isOpenBrightness && setIsOpen(false)}
      >
        <div className={styles.menuPanel} onClick={(e) => e.stopPropagation()}>
          <div className={styles.menuRow}>
            <div
              className={styles.menuItem}
              onClick={(e) => {
                e.stopPropagation();
                handleZoomReset();
              }}
              title="Zoom 1:1"
              role="button"
              tabIndex={0}
            >
              <TbZoomPan size={25} className="text-white" />
              <span className={styles.menuItemLabel}>{"זום  1:1"}</span>
            </div>

            <div
              className={styles.menuItem}
              onClick={() => setIsOpenBrightness(!isOpenBrightness)}
              role="button"
              tabIndex={0}
            >
              <img src="./icons/brightness_512.png" alt="" className={styles.menuItemIcon} />
              <span className={styles.menuItemLabel}>בהירות</span>
            </div>

            <div
              className={`${styles.menuItem} ${isMeasuringDistance ? styles.menuItemActive : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleRulerToggle();
              }}
              title="Ruler"
              role="button"
              tabIndex={0}
            >
              <img src="./icons/ruler_512.png" alt="" className={styles.menuItemIcon} />
              <span className={styles.menuItemLabel}>מדידות</span>
              {isMeasuringDistance ? <div className={styles.activeDot} /> : null}
            </div>

            <div
              className={styles.menuItem}
              onClick={(e) => {
                e.stopPropagation();
                handleJsonFilePick();
                setIsOpen(false);
              }}
              title="Load JSON Path"
              role="button"
              tabIndex={0}
            >
              <img src="./icons/endpoints.png" alt="" className={styles.menuItemIcon} />
              <span className={styles.menuItemLabel}>JSON</span>
            </div>

            <div className={`${styles.menuItem} ${styles.mapSelectorWrap}`}>
              <div
                className={styles.menuItem}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMapTypeToggle();
                }}
                title="Map Type"
                role="button"
                tabIndex={0}
              >
                <TbMapStar size={25} className="text-white" />
                <span className={styles.menuItemLabel}>החלף</span>
              </div>
              {isMapSelectorOpen ? (
                <div className={styles.mapSelectorDropdown}>
                  <BaseMapSelector isOpen={isMapSelectorOpen} onToggle={() => setIsMapSelectorOpen(false)} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </FlyoutMenu>
    </>
  );
};

export default MapControls;
