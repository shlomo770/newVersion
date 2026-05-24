import { FC, useState } from 'react';
import { PiLineSegmentBold, PiPolygonFill } from 'react-icons/pi';
import { FaCircleNotch, FaEllipsisH, FaChartPie } from 'react-icons/fa';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { setCreationForm } from '@features/entities/store/entitiesSlice';
import { setDrawingMode } from '@features/map';
import { DegreeInput } from '@shared/components/inputs/DegreeInput';
import {
  AppButton,
  AppFloatingPanel,
  AppInput,
  AppSectionTitle,
  AppSelect,
} from '@shared/ui';
import { ENTITY_CATEGORY_OPTIONS } from '@/constants/entityCategories';
import { WebSocketService } from '@/services/webSocket/WebSocketService';
import { WsMessageName } from '@domain/enums/ws.enum';
import { EntityCategoryEnum } from '@domain/enums/entity.enum';
import { setTabooZoneSector } from '@features/taboo-zone';
import type { EntityType } from '@domain/models/entity';
import { he } from '@shared/i18n';
import styles from './EntityCreationPanel.module.css';

interface EntityCreationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type ShapeDrawType = 'circle' | 'polygon' | 'line' | 'ellipse';

const TABOOZONE_CATEGORY = 'TABOOZONE';

function toDrawingEntityType(type: ShapeDrawType): EntityType {
  if (type === 'ellipse') return 'ellipse';
  return type;
}

const EntityCreationPanel: FC<EntityCreationPanelProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const [showTABOOZONEForm, setShowTABOOZONEForm] = useState(false);
  const [angleFrom, setAngleFrom] = useState<number>(0);
  const [angleTo, setAngleTo] = useState<number>(0);
  const [radius, setRadius] = useState<number | ''>(1500);
  const creationName = useAppSelector((s) => s.entities.creationName);
  const creationCategory = useAppSelector((s) => s.entities.creationCategory);
  const creationHeight = useAppSelector((s) => s.entities.creationHeight);
  const myPosition = useAppSelector((s) => s.myPosition.coordinates);

  const canSelectCirclePolygonEllipse = Boolean(creationName.trim());
  const canSelectEllipse = canSelectCirclePolygonEllipse && creationCategory !== EntityCategoryEnum.FIZ;
  const canSelectPolyline = Boolean(creationName.trim()) && creationCategory === EntityCategoryEnum.FREE;
  const canCreateTABOOZONE =
    Number.isFinite(angleFrom) &&
    Number.isFinite(angleTo) &&
    Number.isFinite(radius) &&
    Number(radius) > 0 &&
    Number.isFinite(myPosition?.lng) &&
    Number.isFinite(myPosition?.lat);

  const handleClose = () => {
    dispatch(setCreationForm({ name: '', category: EntityCategoryEnum.FREE, height: 0 }));
    setShowTABOOZONEForm(false);
    setAngleFrom(0);
    setAngleTo(0);
    setRadius(1500);
    onClose();
  };

  const closePanelOnly = () => {
    setShowTABOOZONEForm(false);
    onClose();
  };

  const handleCreateEntity = (type: ShapeDrawType | 'sector') => {
    if (type === 'sector') {
      setShowTABOOZONEForm(true);
      return;
    }
    if ((type === 'circle' || type === 'polygon' || type === 'ellipse') && !canSelectCirclePolygonEllipse) {
      return;
    }
    if (type === 'ellipse' && creationCategory === EntityCategoryEnum.FIZ) {
      return;
    }
    if (type === 'line') {
      if (creationCategory !== EntityCategoryEnum.FREE) return;
      dispatch(setCreationForm({ name: creationName, category: EntityCategoryEnum.FREE, height: creationHeight }));
    }
    dispatch(setDrawingMode(toDrawingEntityType(type)));
    closePanelOnly();
  };

  const handleCreateTABOOZONEFromForm = () => {
    if (!canCreateTABOOZONE) return;
    const entityId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    WebSocketService.getInstance().sendMessage(WsMessageName.SetTabooZone, {
      id: entityId,
      start: angleFrom,
      end: angleTo,
    });

    dispatch(setTabooZoneSector({ minAngle: angleFrom, maxAngle: angleTo, radiusMeters: 1500 }));
    setShowTABOOZONEForm(false);
    setAngleFrom(0);
    setAngleTo(0);
    setRadius(1500);
    onClose();
  };

  return (
    <AppFloatingPanel
      open={isOpen}
      onClose={handleClose}
      title={he.entities.panels.creationTitle}
      position="left"
    >
      {!showTABOOZONEForm ? (
        <div className={styles.formStack}>
          <AppInput
            label={he.entities.panels.name}
            compact
            value={creationName}
            onChange={(e) =>
              dispatch(setCreationForm({ name: e.target.value, category: creationCategory, height: creationHeight }))
            }
            placeholder={he.entities.panels.entityNamePlaceholder}
          />
          <AppInput
            label={he.entities.panels.heightMeters}
            compact
            type="number"
            step={1}
            value={creationHeight}
            onChange={(e) =>
              dispatch(setCreationForm({
                name: creationName,
                category: creationCategory,
                height: e.target.value === '' ? 0 : Number(e.target.value),
              }))
            }
          />
          <AppSelect
            label={he.entities.panels.category}
            compact
            value={creationCategory}
            onChange={(e) =>
              dispatch(setCreationForm({ name: creationName, category: Number(e.target.value), height: creationHeight }))
            }
          >
            {ENTITY_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {EntityCategoryEnum[opt]}
              </option>
            ))}
          </AppSelect>

          <div>
            <AppSectionTitle withBorder>{he.entities.panels.shapeSection}</AppSectionTitle>
            <div className={styles.shapeGrid}>
              <button
                type="button"
                disabled={!canSelectCirclePolygonEllipse}
                className={styles.shapeButton}
                onClick={() => handleCreateEntity('circle')}
                title={!canSelectCirclePolygonEllipse ? he.entities.panels.shapeNameRequired : undefined}
              >
                <FaCircleNotch size={22} />
                <span className={styles.shapeLabel}>{he.entities.panels.shapeCircle}</span>
              </button>
              <button
                type="button"
                disabled={!canSelectCirclePolygonEllipse}
                className={styles.shapeButton}
                onClick={() => handleCreateEntity('polygon')}
                title={!canSelectCirclePolygonEllipse ? he.entities.panels.shapeNameRequired : undefined}
              >
                <PiPolygonFill size={22} />
                <span className={styles.shapeLabel}>{he.entities.panels.shapePolygon}</span>
              </button>
              <button
                type="button"
                disabled={!canSelectEllipse}
                className={styles.shapeButton}
                onClick={() => handleCreateEntity('ellipse')}
                title={
                  !canSelectEllipse
                    ? creationCategory === EntityCategoryEnum.FIZ
                      ? he.entities.panels.shapeEllipseFizForbidden
                      : he.entities.panels.shapeNameRequired
                    : undefined
                }
              >
                <FaEllipsisH size={22} />
                <span className={styles.shapeLabel}>{he.entities.panels.shapeEllipse}</span>
              </button>
              <button
                type="button"
                disabled={!canSelectPolyline}
                className={styles.shapeButton}
                onClick={() => handleCreateEntity('line')}
                title={!canSelectPolyline ? he.entities.panels.shapePolylineFreeOnly : undefined}
              >
                <PiLineSegmentBold size={22} />
                <span className={styles.shapeLabel}>{he.entities.panels.shapePolyline}</span>
              </button>
              <button type="button" className={styles.shapeButton} onClick={() => handleCreateEntity('sector')}>
                <FaChartPie size={22} />
                <span className={styles.shapeLabel}>{he.entities.panels.shapeTaboozone}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.formStack}>
          <div className={styles.tabooHeader}>
            <label className={styles.tabooTitle}>{he.entities.panels.taboozoneFromBody}</label>
            <button type="button" className={styles.backLink} onClick={() => setShowTABOOZONEForm(false)}>
              {he.common.back}
            </button>
          </div>
          <div className={styles.degreeRow}>
            <DegreeInput label={he.entities.panels.angleFrom} value={angleFrom} onChange={setAngleFrom} />
            <DegreeInput label={he.entities.panels.angleTo} value={angleTo} onChange={setAngleTo} />
          </div>
          <AppInput
            label={he.entities.panels.radiusMeters}
            compact
            type="number"
            min={1}
            step={100}
            value={radius}
            onChange={(e) => setRadius(e.target.value === '' ? '' : +e.target.value)}
          />
          <AppInput label={he.entities.panels.category} compact readOnly value={TABOOZONE_CATEGORY} />
          <AppButton
            fullWidth
            disabled={!canCreateTABOOZONE}
            onClick={handleCreateTABOOZONEFromForm}
            title={!canCreateTABOOZONE ? he.entities.panels.taboozoneFillRequired : undefined}
          >
            {he.entities.panels.createTaboozone}
          </AppButton>
        </div>
      )}
    </AppFloatingPanel>
  );
};

export default EntityCreationPanel;
