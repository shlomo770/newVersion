import { useEffect } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setElevation } from '@features/map';
import { servers } from '@/config/communication.json';
import { selectStatusBarClickCoords } from '../selectors/statusBarSelectors';
import { useAppSelector } from '@/hooks/useAppSelector';

/**
 * Fetches elevation for the current map click coordinate only.
 * Isolated from the map canvas render tree.
 */
export function useStatusBarElevation(): void {
  const dispatch = useAppDispatch();
  const clickedCoords = useAppSelector(selectStatusBarClickCoords);

  useEffect(() => {
    if (clickedCoords?.lat != null && clickedCoords?.lng != null) {
      const fetchElevation = async () => {
        const url = `http://${servers.mapServer}/elevation?lon=${clickedCoords.lng}&lat=${clickedCoords.lat}`;
        try {
          const response = await fetch(url);
          if (response.ok) {
            const data = (await response.json()) as number;
            dispatch(setElevation(data));
          } else {
            dispatch(setElevation(null));
          }
        } catch {
          dispatch(setElevation(null));
        }
      };
      const timeoutId = setTimeout(fetchElevation, 300);
      return () => clearTimeout(timeoutId);
    }
    dispatch(setElevation(null));
    return undefined;
  }, [clickedCoords, dispatch]);
}
