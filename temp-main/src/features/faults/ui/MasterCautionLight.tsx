import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@app/store';
import { acknowledgeAll, selectMasterCautionOn } from '../store/faultsSlice';
import styles from './MasterCautionLight.module.css';

export function MasterCautionLight() {
  const on = useSelector((state: RootState) => selectMasterCautionOn(state));
  const dispatch = useDispatch();
  return (
    <button
      type="button"
      onClick={() => dispatch(acknowledgeAll())}
      className={`${styles.button} ${on ? styles.buttonActive : styles.buttonIdle}`}
      title="לחיצה = אישור כל התקלות הפעילות"
    >
      MASTER CAUTION
    </button>
  );
}
