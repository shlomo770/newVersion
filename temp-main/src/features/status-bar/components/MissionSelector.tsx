import { memo } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  setActiveMissionId,
  setPreviewEntityId,
  requestMissionListUiReset,
  selectMissionsForStatusBar,
  sendLoadMission,
} from '@features/entities';
import { selectActiveMissionId } from '../selectors/statusBarSelectors';
import styles from './StatusBar.module.css';

function MissionSelector() {
  const dispatch = useAppDispatch();
  const statusBarMissions = useAppSelector(selectMissionsForStatusBar);
  const activeMissionId = useAppSelector(selectActiveMissionId);

  return (
    <>
      <select
        className={styles.missionSelect}
        value={activeMissionId ?? ''}
        onChange={(e) => {
          const missionId = e.target.value.trim();
          dispatch(requestMissionListUiReset());
          dispatch(setPreviewEntityId(null));
          if (!missionId) {
            dispatch(setActiveMissionId(null));
            return;
          }
          dispatch(setActiveMissionId(missionId));
          sendLoadMission(missionId);
        }}
        aria-label="בחירת משימה"
      >
        <option value="">כל הישויות</option>
        {statusBarMissions.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <span className={styles.missionLabel}>משימה</span>
    </>
  );
}

export default memo(MissionSelector);
