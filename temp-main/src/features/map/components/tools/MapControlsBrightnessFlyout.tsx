import type { FC, RefObject } from 'react';
import { FlyoutMenu } from '@shared/components';
import { BRIGHTNESS_CONFIG } from '@features/map/config';
import { MAP_TOOL_ICONS } from '@/config';
import subMenuStyles from './mapToolSubMenu.module.css';

interface MapControlsBrightnessFlyoutProps {
  anchorRef: RefObject<HTMLElement>;
  isOpen: boolean;
  onClose: () => void;
  brightness: number;
  onBrightnessChange: (value: number) => void;
}

const MapControlsBrightnessFlyout: FC<MapControlsBrightnessFlyoutProps> = ({
  anchorRef,
  isOpen,
  onClose,
  brightness,
  onBrightnessChange,
}) => (
  <FlyoutMenu
    anchorRef={anchorRef}
    isOpen={isOpen}
    placement="bottom"
    align="center"
    onClose={onClose}
    className={subMenuStyles.compactFlyout}
  >
    <div className={subMenuStyles.brightnessPanel} onClick={(e) => e.stopPropagation()}>
      <img src={MAP_TOOL_ICONS.brightness} className={subMenuStyles.brightnessIcon} alt="" />
      <input
        type="range"
        min={BRIGHTNESS_CONFIG.uiMin}
        max={BRIGHTNESS_CONFIG.uiMax}
        step={BRIGHTNESS_CONFIG.uiStep}
        value={brightness}
        onChange={(e) => onBrightnessChange(Number(e.target.value))}
        onClick={(e) => e.stopPropagation()}
        className={subMenuStyles.brightnessSlider}
        style={{
          background: `linear-gradient(to right, var(--theme-color-primary) 0%, var(--theme-color-primary) ${brightness * 100}%, var(--theme-color-border) ${brightness * 100}%, var(--theme-color-border) 100%)`,
        }}
      />
    </div>
  </FlyoutMenu>
);

export default MapControlsBrightnessFlyout;
