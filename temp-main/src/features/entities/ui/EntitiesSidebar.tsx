import { FC, useState } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import type { Entity } from '@features/entities/store/entitiesSlice';
import { selectActiveMissionName } from '@features/entities/store/selectors';
import { EntityCategoryEnum } from '@domain/enums/entity.enum';
import { ENTITY_CATEGORY_OPTIONS } from '@/constants/entityCategories';
import { ENTITIES_SIDEBAR_ICONS } from '@/config';
import { he } from '@shared/i18n';
import { AppButton, AppFloatingPanel, AppIconButton, AppInput, AppSelect, cn } from '@shared/ui';
import {
  useEntitiesSidebarNavigation,
  useEntitiesSidebarGrouping,
  useEntityGroupActions,
  useMissionActions,
  useEntityDuplicate,
} from '@features/entities/hooks/useEntitiesSidebar';
import EntitiesSidebarHome from './entitiesSidebar/EntitiesSidebarHome';
import EntitiesSidebarMissionsSection from './entitiesSidebar/EntitiesSidebarMissionsSection';
import EntitiesSidebarAreasSection from './entitiesSidebar/EntitiesSidebarAreasSection';
import EntitiesSidebarPointsSection from './entitiesSidebar/EntitiesSidebarPointsSection';
import type { MapService } from '@/services/map/MapService';
import styles from './entitiesSidebar/EntitiesSidebar.shared.module.css';

interface EntitiesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onEditEntity: (entity: Entity) => void;
  onCenterToEntity: (entity: Entity) => void;
  onRequestCloseEditPanel?: () => void;
  onOpenCreatePanel?: () => void;
  onOpenCreatePanelWithCategory?: (category: EntityCategoryEnum) => void;
  onOpenCreateMarkerPanel?: () => void;
  editingEntityId?: string | null;
  /** @deprecated Use MapCommandsProvider instead */
  mapServiceRef?: React.MutableRefObject<MapService | null>;
}

const EntitiesSidebar: FC<EntitiesSidebarProps> = ({
  isOpen,
  onClose,
  onEditEntity,
  onCenterToEntity,
  onRequestCloseEditPanel,
  onOpenCreatePanel,
  onOpenCreatePanelWithCategory,
  onOpenCreateMarkerPanel,
  editingEntityId,
}) => {
  const dispatch = useAppDispatch();
  const selectedEntityId = useAppSelector((s) => s.entities.selectedId);
  const activeMissionId = useAppSelector((s) => s.entities.activeMissionId);
  const activeMissionName = useAppSelector(selectActiveMissionName);
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const [pointsSearchQuery, setPointsSearchQuery] = useState('');
  const [missionSearchQuery, setMissionSearchQuery] = useState('');
  const nav = useEntitiesSidebarNavigation();
  const grouping = useEntitiesSidebarGrouping(areaSearchQuery, pointsSearchQuery, missionSearchQuery);
  const { setGroupVisibility, deleteGroup } = useEntityGroupActions(editingEntityId);
  const missions = useMissionActions();
  const duplicate = useEntityDuplicate(onRequestCloseEditPanel);

  if (!isOpen) return null;

  const {
    entities,
    entityOpen,
    filteredAreaByCategory,
    filteredPointsByIcon,
    sortedMissions,
    sortedMissionNames,
    filteredMissions,
  } = grouping;

  const openMissions = () => { nav.setIsMissionsOpen(true); nav.setIsEntityOpen(false); nav.setIsPointsOpen(false); };
  const openPoints = () => { nav.setIsPointsOpen(true); nav.setIsEntityOpen(false); nav.setOpenMarkerGroup(null); };
  const closePoints = () => { nav.setIsPointsOpen(false); nav.setOpenMarkerGroup(null); };

  return (
    <div className={cn('jbk-sidebar-panel', styles.shell)}>
      <AppFloatingPanel
        open={Boolean(duplicate.duplicateSourceEntity)}
        onClose={duplicate.closeDuplicatePanel}
        title={he.entities.sidebar.duplicateTitle}
        position="left"
      >
        <div className={styles.fieldStack}>
          <AppInput
            label={he.entities.sidebar.duplicateNameLabel}
            value={duplicate.duplicateName}
            onChange={(e) => duplicate.setDuplicateName(e.target.value)}
            autoFocus
          />
          <AppSelect
            label={he.entities.sidebar.duplicateCategoryLabel}
            value={duplicate.duplicateCategory}
            onChange={(e) => duplicate.setDuplicateCategory(Number(e.target.value) as EntityCategoryEnum)}
          >
            {ENTITY_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{EntityCategoryEnum[opt]}</option>
            ))}
          </AppSelect>
          <div className={styles.sectionHeader}>
            <AppButton variant="ghost" size="sm" onClick={duplicate.closeDuplicatePanel}>
              {he.entities.sidebar.cancel}
            </AppButton>
            <AppButton size="sm" onClick={duplicate.handleDuplicateSave} disabled={!duplicate.duplicateName.trim()}>
              {he.entities.sidebar.saveDuplicate}
            </AppButton>
          </div>
        </div>
      </AppFloatingPanel>
      <div className={styles.header}>
        <AppIconButton label={he.entities.sidebar.close} size="sm" onClick={onClose}>
          <img src={ENTITIES_SIDEBAR_ICONS.back} alt="" className={styles.backIcon} />
        </AppIconButton>
        <span className={styles.headerTitle}>{nav.headerTitle}</span>
      </div>
      {!nav.isEntityOpen && !nav.isPointsOpen && !nav.isMissionsOpen ? (
        <EntitiesSidebarHome onOpenMissions={openMissions} onOpenAreas={nav.toggleAreas} onOpenPoints={openPoints} />
      ) : nav.isMissionsOpen ? (
        <EntitiesSidebarMissionsSection
          onBackToRoot={() => nav.setIsMissionsOpen(false)}
          activeMissionId={activeMissionId}
          activeMissionName={activeMissionName}
          sortedMissions={sortedMissions}
          filteredMissions={filteredMissions}
          sortedMissionNames={sortedMissionNames}
          missionSearchQuery={missionSearchQuery}
          setMissionSearchQuery={setMissionSearchQuery}
          localDraftMissionNamesRef={missions.localDraftMissionNamesRef}
          createLocalMission={missions.createLocalMission}
          sendMessage={missions.sendMessage}
          dispatch={dispatch}
          entitiesById={entities.byId}
          onMissionMemberIdsChange={missions.handleMissionMemberIdsChange}
          saveMissionToServer={missions.saveMissionToServer}
          onOpenMissionSaveCopy={missions.saveMissionCopyToServer}
          handleMissionRename={missions.handleMissionRename}
          onOpenCreatePanelWithCategory={onOpenCreatePanelWithCategory}
          onOpenCreateMarkerPanel={onOpenCreateMarkerPanel}
          onCenterToEntity={onCenterToEntity}
        />
      ) : nav.isEntityOpen ? (
        <EntitiesSidebarAreasSection
          onBack={nav.toggleAreas}
          areaSearchQuery={areaSearchQuery}
          setAreaSearchQuery={setAreaSearchQuery}
          filteredAreaByCategory={filteredAreaByCategory}
          openAreaCategory={nav.openAreaCategory}
          setOpenAreaCategory={nav.setOpenAreaCategory}
          openAreaTypeKey={nav.openAreaTypeKey}
          setOpenAreaTypeKey={nav.setOpenAreaTypeKey}
          editingEntityId={editingEntityId}
          selectedEntityId={selectedEntityId}
          activeMissionName={activeMissionName}
          dispatch={dispatch}
          sendMessage={missions.sendMessage}
          setGroupVisibility={setGroupVisibility}
          deleteGroup={deleteGroup}
          onEditEntity={onEditEntity}
          onCenterToEntity={onCenterToEntity}
          onOpenCreatePanel={onOpenCreatePanel}
          entityOpen={entityOpen}
          openDuplicatePanel={duplicate.openDuplicatePanel}
        />
      ) : (
        <EntitiesSidebarPointsSection
          onBack={closePoints}
          pointsSearchQuery={pointsSearchQuery}
          setPointsSearchQuery={setPointsSearchQuery}
          filteredPointsByIcon={filteredPointsByIcon}
          openMarkerGroup={nav.openMarkerGroup}
          setOpenMarkerGroup={nav.setOpenMarkerGroup}
          activeMissionName={activeMissionName}
          selectedEntityId={selectedEntityId}
          dispatch={dispatch}
          sendMessage={missions.sendMessage}
          setGroupVisibility={setGroupVisibility}
          deleteGroup={deleteGroup}
          onEditEntity={onEditEntity}
          onCenterToEntity={onCenterToEntity}
          onOpenCreateMarkerPanel={onOpenCreateMarkerPanel}
          editingEntityId={editingEntityId}
        />
      )}
    </div>
  );
};

export default EntitiesSidebar;
