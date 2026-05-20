import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@app/store';
import { SelectedModeE } from '../enums/general.enum';
import { MapPage } from './MapPage';
import { ModeSelectionPage } from './ModeSelectionPage';
import { MaintenancePage } from './MaintenancePage';

/**
 * Application route table — thin wiring only; views live under `src/pages/`.
 */
export function AppRoutes() {
  const selectedMode = useSelector((state: RootState) => state.systemState.selectedMode);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            selectedMode === SelectedModeE.Maintenance ? (
              <Navigate to="/maintenance" replace />
            ) : selectedMode !== null ? (
              <Navigate to="/map" replace />
            ) : (
              <ModeSelectionPage />
            )
          }
        />
        <Route path="/mode" element={<ModeSelectionPage />} />
        <Route
          path="/map"
          element={
            selectedMode === null ? (
              <Navigate to="/mode" replace />
            ) : selectedMode === SelectedModeE.Maintenance ? (
              <Navigate to="/maintenance" replace />
            ) : (
              <MapPage />
            )
          }
        />
        <Route
          path="/maintenance"
          element={
            selectedMode === SelectedModeE.Maintenance ? (
              <MaintenancePage />
            ) : (
              <Navigate to="/mode" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
