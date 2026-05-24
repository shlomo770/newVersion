import { FC } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setSelectedMode } from '../store/systemSlice';
import { SelectedModeE } from '@domain/enums/general.enum';
import { AppButton } from '@shared/ui';
import { PLATFORM_ICONS } from '@/config';
import { he } from '@shared/i18n';
import styles from './ModeSelector.module.css';

/** Short pause after entering fullscreen before triggering the route
 *  change — gives the browser time to settle the resize layout. */
const FULLSCREEN_TRANSITION_DELAY_MS = 400;

const ModeSelector: FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const enterFullscreen = async () => {
    const el = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
      msRequestFullscreen?: () => Promise<void> | void;
    };

    if (document.fullscreenElement) return;

    if (el.requestFullscreen) {
      await el.requestFullscreen();
      return;
    }

    if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
      return;
    }

    if (el.msRequestFullscreen) {
      await el.msRequestFullscreen();
    }
  };

  const handleModeSelect = async (mode: SelectedModeE, path: '/map' | '/maintenance') => {
    try {
      await enterFullscreen();
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }

    setTimeout(() => {
      dispatch(setSelectedMode(mode));
      navigate(path);
    }, FULLSCREEN_TRANSITION_DELAY_MS);
  };

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} />

      <div className={styles.content}>
        <div className={styles.hero}>
          <img
            src={PLATFORM_ICONS.jeepHero}
            alt="Vehicle"
            className={styles.heroImage}
            draggable={false}
          />

          <h1 className={styles.title}>JBK</h1>
        </div>

        <p className={styles.subtitle}>{he.systemMode.subtitle}</p>

        <div className={styles.actions}>
          <AppButton
            variant="primary"
            size="lg"
            className={styles.modeButton}
            onClick={() => handleModeSelect(SelectedModeE.Mission, '/map')}
          >
            {he.systemMode.mission}
          </AppButton>

          <AppButton
            variant="secondary"
            size="lg"
            className={styles.modeButton}
            onClick={() => handleModeSelect(SelectedModeE.Maintenance, '/maintenance')}
          >
            {he.systemMode.maintenance}
          </AppButton>

          <AppButton
            variant="ghost"
            size="lg"
            className={styles.modeButton}
            onClick={() => handleModeSelect(SelectedModeE.Training, '/map')}
          >
            {he.systemMode.training}
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;
