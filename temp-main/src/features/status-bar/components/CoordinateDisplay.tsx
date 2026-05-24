import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import type { MutableRefObject } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { updateClickCord } from '@features/platform';
import { formatCoordinates } from '@/utils/coordinates';
import type { MapService } from '@/services/map/MapService';
import { STATUS_BAR_ICONS } from '@/config';
import { useClickOutside } from '@shared/hooks/useClickOutside';
import { COORDINATE_CENTER_UI } from '../config/statusBar.config';
import { selectStatusBarDisplayCoords } from '../selectors/statusBarSelectors';
import { parseStatusBarCoordInput } from '../utils/coordinateInputUtils';
import CoordinateCenterMenu from './CoordinateCenterMenu';
import styles from './StatusBar.module.css';

export interface CoordinateDisplayProps {
  mapServiceRef: MutableRefObject<MapService | null>;
}

function CoordinateDisplay({ mapServiceRef }: CoordinateDisplayProps) {
  const dispatch = useAppDispatch();
  const isUTM = useAppSelector((state) => state.coordinates.isUTM);
  const utmZone = useAppSelector((state) => state.coordinates.utmZone);
  const displayCoords = useAppSelector(selectStatusBarDisplayCoords);

  const [menuOpen, setMenuOpen] = useState(false);
  const [outsideClickEnabled, setOutsideClickEnabled] = useState(false);
  const [draft, setDraft] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useClickOutside([wrapRef, menuRef], () => setMenuOpen(false), {
    enabled: menuOpen && outsideClickEnabled,
  });

  useEffect(() => {
    if (!menuOpen) {
      setOutsideClickEnabled(false);
      return;
    }
    const frameId = requestAnimationFrame(() => setOutsideClickEnabled(true));
    return () => cancelAnimationFrame(frameId);
  }, [menuOpen]);

  useEffect(() => {
    if (isEditing) return;
    if (displayCoords) {
      setDraft(formatCoordinates(displayCoords, isUTM, utmZone));
      return;
    }
    setDraft('');
  }, [displayCoords, isUTM, utmZone, isEditing]);

  const commitDraft = useCallback(() => {
    const parsed = parseStatusBarCoordInput(draft, isUTM);
    if (parsed) {
      dispatch(updateClickCord(parsed));
      setDraft(formatCoordinates(parsed, isUTM, utmZone));
    } else if (displayCoords) {
      setDraft(formatCoordinates(displayCoords, isUTM, utmZone));
    }
    setIsEditing(false);
  }, [dispatch, displayCoords, draft, isUTM, utmZone]);

  const handleToggleMenu = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setMenuOpen((open) => !open);
  }, []);

  const handleInputFocus = useCallback(() => {
    setIsEditing(true);
    setMenuOpen(false);
  }, []);

  const handleInputBlur = useCallback(
    (_e: FocusEvent<HTMLInputElement>) => {
      commitDraft();
    },
    [commitDraft],
  );

  const handleInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        inputRef.current?.blur();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsEditing(false);
        if (displayCoords) {
          setDraft(formatCoordinates(displayCoords, isUTM, utmZone));
        }
        inputRef.current?.blur();
      }
    },
    [displayCoords, isUTM, utmZone],
  );

  return (
    <div ref={wrapRef} className={styles.coordsWrap}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.coordsCenterButton}
        onClick={handleToggleMenu}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title="מרכוז מפה"
      >
        <img src={STATUS_BAR_ICONS.coordinatesCenter} alt="" className={styles.coordsIcon} />
      </button>
      <span className={styles.coordsDivider} aria-hidden />
      <input
        ref={inputRef}
        type="text"
        className={styles.coordsInput}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        dir="ltr"
        inputMode={isUTM ? 'text' : 'decimal'}
        autoComplete="off"
        spellCheck={false}
        placeholder="לחץ על המפה או הזן נ.צ"
        aria-label={COORDINATE_CENTER_UI.coordsInputAriaLabel}
      />
      {menuOpen ? (
        <CoordinateCenterMenu
          anchorRef={buttonRef}
          menuRef={menuRef}
          mapServiceRef={mapServiceRef}
          onClose={() => setMenuOpen(false)}
        />
      ) : null}
    </div>
  );
}

export default memo(CoordinateDisplay);
