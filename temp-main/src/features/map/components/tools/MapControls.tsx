import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  TbZoomPan,
  TbMapStar,
  TbAdjustmentsHorizontal,
  TbLayoutSidebarRightCollapse,
} from 'react-icons/tb';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setBrightness, setZoom } from '@features/map/store/mapSlice';
import { toggleTargetPanelVisible } from '@features/map/store/filterSlice';
import { FlyoutMenu } from '@shared/components';
import BaseMapSelector from '../BaseMapSelector';
import TargetFilterMenu from './TargetFilterMenu';
import MeasureToolMenu from './MeasureToolMenu';
import type { MapFacade, JsonPathInput } from '@features/map/services/MapFacade';
import { MAP_TOOLBAR_FLYOUT, BRIGHTNESS_CONFIG } from '@features/map/config';
import { MAP_TOOL_ICONS } from '@/config';
import styles from './MapControls.module.css';

/** Zoom level applied by the "Zoom 1:1" reset button. */
const ZOOM_RESET_LEVEL = 10;
/** Common Tabler icon size used inside the toolbar flyout. */
const TOOLBAR_ICON_SIZE_PX = 25;

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

/**
 * MapControls — floating round launcher button at top-left of the map
 * that opens the main map tools flyout.
 *
 * Architecture:
 *  - Main flyout: one-shot actions (zoom 1:1, brightness, ruler, JSON
 *    import, basemap selector) PLUS two stateful buttons that the user
 *    must be able to identify separately:
 *      • "Filter" button  → opens a sub-flyout (`TargetFilterMenu`) that
 *        controls visibility of target *map elements* (trails, labels).
 *      • "Panel" button   → toggles the right-side target cards panel.
 *        This is a separate concern (UI panel vs map elements) so it is
 *        deliberately NOT inside the filter sub-flyout.
 *  - Brightness slider sub-flyout — same pattern as the filter.
 *
 * Tunable flyout offsets live in `@features/map/config/mapTools.config.ts`;
 * brightness slider range in `@features/map/config/mapDefaults.config.ts`;
 * toolbar icon paths in `@/config/appIcons.config.ts`.
 */
const MapControls: React.FC<MapControlsProps> = ({ mapFacadeRef }) => {
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenBrightness, setIsOpenBrightness] = useState(false);
  const [isOpenFilter, setIsOpenFilter] = useState(false);
  const [isOpenMeasure, setIsOpenMeasure] = useState(false);
  const [isMapSelectorOpen, setIsMapSelectorOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brightness = useAppSelector((state) => state.map.brightness);
  const drawingMode = useAppSelector((state) => state.entities.drawingMode);
  // Defensive against an older slice shape that may still be in the running
  // Redux store across HMR — `targetVisibility` could be undefined.
  const panelVisible = useAppSelector(
    (state) => state.filter.targetVisibility?.panel ?? true,
  );
  const isMeasuring =
    drawingMode === 'measure' || drawingMode === 'measure-area';

  // Closing the main flyout MUST always close every sub-flyout — otherwise
  // a stale sub-popup can float on the map alone.
  const closeAllFlyouts = useCallback(() => {
    setIsOpen(false);
    setIsOpenBrightness(false);
    setIsOpenFilter(false);
    setIsOpenMeasure(false);
    setIsMapSelectorOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsOpenBrightness(false);
      setIsOpenFilter(false);
      setIsOpenMeasure(false);
      setIsMapSelectorOpen(false);
    }
  }, [isOpen]);

  const handleZoomReset = () => {
    dispatch(setZoom(ZOOM_RESET_LEVEL));
    mapFacadeRef?.current?.setZoom(ZOOM_RESET_LEVEL);
    closeAllFlyouts();
  };

  const handleBrightnessChange = (value: number) => {
    dispatch(setBrightness(value));
  };

  const handleMeasureMenuToggle = () => {
    setIsOpenMeasure((open) => !open);
  };

  const handleMapTypeToggle = () => {
    setIsMapSelectorOpen((open) => !open);
  };

  const handleToggleTargetsPanel = () => {
    dispatch(toggleTargetPanelVisible());
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
        if (import.meta.env.DEV) {
          console.warn('JSON must include at least one path with 2+ points.');
        }
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
        <img src={MAP_TOOL_ICONS.launcher} alt="" className={styles.launcherIcon} />
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
        top={MAP_TOOLBAR_FLYOUT.brightness.top}
        left={MAP_TOOLBAR_FLYOUT.brightness.left}
        arow={MAP_TOOLBAR_FLYOUT.brightness.arrow}
        onClose={() => setIsOpenBrightness(false)}
      >
        <div className={styles.brightnessPanel} onClick={(e) => e.stopPropagation()}>
          <img src={MAP_TOOL_ICONS.brightness} className={styles.brightnessIcon} alt="" />
          <input
            type="range"
            min={BRIGHTNESS_CONFIG.uiMin}
            max={BRIGHTNESS_CONFIG.uiMax}
            step={BRIGHTNESS_CONFIG.uiStep}
            value={brightness}
            onChange={(e) => handleBrightnessChange(Number(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            className={styles.brightnessSlider}
            style={{
              background: `linear-gradient(to right, var(--theme-color-primary) 0%, var(--theme-color-primary) ${brightness * 100}%, var(--theme-color-border) ${brightness * 100}%, var(--theme-color-border) 100%)`,
            }}
          />
        </div>
      </FlyoutMenu>

      <FlyoutMenu
        anchorRef={buttonRef}
        isOpen={isOpenFilter}
        placement="bottom"
        top={MAP_TOOLBAR_FLYOUT.filter.top}
        left={MAP_TOOLBAR_FLYOUT.filter.left}
        arow={MAP_TOOLBAR_FLYOUT.filter.arrow}
        onClose={() => setIsOpenFilter(false)}
      >
        <TargetFilterMenu />
      </FlyoutMenu>

      <FlyoutMenu
        anchorRef={buttonRef}
        isOpen={isOpenMeasure}
        placement="bottom"
        top={MAP_TOOLBAR_FLYOUT.measure.top}
        left={MAP_TOOLBAR_FLYOUT.measure.left}
        arow={MAP_TOOLBAR_FLYOUT.measure.arrow}
        onClose={() => setIsOpenMeasure(false)}
      >
        <MeasureToolMenu onClose={() => setIsOpenMeasure(false)} />
      </FlyoutMenu>

      <FlyoutMenu
        anchorRef={buttonRef}
        isOpen={isOpen}
        placement="bottom"
        top={MAP_TOOLBAR_FLYOUT.main.top}
        left={MAP_TOOLBAR_FLYOUT.main.left}
        arow={MAP_TOOLBAR_FLYOUT.main.arrow}
        onClose={() => {
          if (isOpenBrightness || isMapSelectorOpen || isOpenFilter || isOpenMeasure) return;
          setIsOpen(false);
        }}
      >
        <div className={styles.menuPanel} onClick={(e) => e.stopPropagation()}>
          <div className={styles.menuRow}>
            <button
              type="button"
              className={styles.menuItem}
              onClick={(e) => {
                e.stopPropagation();
                handleZoomReset();
              }}
              title="Zoom 1:1"
            >
              <TbZoomPan size={TOOLBAR_ICON_SIZE_PX} className={styles.menuItemIconWhite} />
              <span className={styles.menuItemLabel}>{'זום  1:1'}</span>
            </button>

            <button
              type="button"
              className={styles.menuItem}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpenBrightness((open) => !open);
              }}
              title="Brightness"
            >
              <img src={MAP_TOOL_ICONS.brightness} alt="" className={styles.menuItemIcon} />
              <span className={styles.menuItemLabel}>בהירות</span>
            </button>

            <button
              type="button"
              className={`${styles.menuItem} ${isMeasuring || isOpenMeasure ? styles.menuItemActive : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleMeasureMenuToggle();
              }}
              title="Measurement tools"
              aria-haspopup="menu"
              aria-expanded={isOpenMeasure}
            >
              <img src={MAP_TOOL_ICONS.ruler} alt="" className={styles.menuItemIcon} />
              <span className={styles.menuItemLabel}>מדידות</span>
              {isMeasuring ? <div className={styles.activeDot} /> : null}
            </button>

            <button
              type="button"
              className={`${styles.menuItem} ${isOpenFilter ? styles.menuItemActive : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpenFilter((open) => !open);
              }}
              title="Map filters (trails, labels)"
              aria-haspopup="menu"
              aria-expanded={isOpenFilter}
            >
              <TbAdjustmentsHorizontal
                size={TOOLBAR_ICON_SIZE_PX}
                className={styles.menuItemIconWhite}
              />
              <span className={styles.menuItemLabel}>סינון</span>
            </button>

            <button
              type="button"
              className={`${styles.menuItem} ${panelVisible ? styles.menuItemActive : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleTargetsPanel();
              }}
              title={panelVisible ? 'Hide targets panel' : 'Show targets panel'}
              aria-pressed={panelVisible}
            >
              <TbLayoutSidebarRightCollapse
                size={TOOLBAR_ICON_SIZE_PX}
                className={styles.menuItemIconWhite}
              />
              <span className={styles.menuItemLabel}>פאנל</span>
              {panelVisible ? <div className={styles.activeDot} /> : null}
            </button>

            <button
              type="button"
              className={styles.menuItem}
              onClick={(e) => {
                e.stopPropagation();
                handleJsonFilePick();
                closeAllFlyouts();
              }}
              title="Load JSON Path"
            >
              <img src={MAP_TOOL_ICONS.jsonImport} alt="" className={styles.menuItemIcon} />
              <span className={styles.menuItemLabel}>JSON</span>
            </button>

            <div className={`${styles.menuItem} ${styles.mapSelectorWrap}`}>
              <button
                type="button"
                className={styles.menuItem}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMapTypeToggle();
                }}
                title="Map Type"
              >
                <TbMapStar size={TOOLBAR_ICON_SIZE_PX} className={styles.menuItemIconWhite} />
                <span className={styles.menuItemLabel}>החלף</span>
              </button>
              {isMapSelectorOpen ? (
                <div className={styles.mapSelectorDropdown}>
                  <BaseMapSelector
                    isOpen={isMapSelectorOpen}
                    onToggle={() => setIsMapSelectorOpen(false)}
                  />
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
