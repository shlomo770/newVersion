import { FC } from "react";
import { FaChevronDown, FaTimes } from "react-icons/fa";
import { AppButton, AppIconButton } from "@shared/ui";
import { missionDeStyles } from "./missionDe/missionDePanelStyles";
import MissionDePanel, { type MissionDePanelProps } from "./MissionDePanel";

export type MissionFormPanelProps = MissionDePanelProps & {
  onClose: () => void;
  missionNames: string[];
  onMissionSwitch: (missionName: string) => void;
};

const MissionFormPanel: FC<MissionFormPanelProps> = ({
  onClose,
  missionNames,
  onMissionSwitch,
  onSaveMissionServer,
  onOpenMissionSaveCopy,
  ...panel
}) => {
  return (
    <div
      className={missionDeStyles.panelShell}
      role="dialog"
      aria-labelledby="mission-form-title"
    >
      <header className={missionDeStyles.panelHeader}>
        <AppIconButton size="sm" label="סגור" onClick={onClose}>
          <FaTimes />
        </AppIconButton>
        <h2
          id="mission-form-title"
          className={missionDeStyles.panelTitle}
        >
          משימה
        </h2>
        <div className={missionDeStyles.missionSelectWrap}>
          <select
            className={missionDeStyles.missionSelect}
            value={panel.missionName}
            onChange={(e) => onMissionSwitch(e.target.value)}
          >
            {missionNames.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <FaChevronDown className={missionDeStyles.selectChevron} />
        </div>
      </header>

      <div className={missionDeStyles.panelBody}>
        <MissionDePanel
          {...panel}
          onSaveMissionServer={onSaveMissionServer}
          onOpenMissionSaveCopy={onOpenMissionSaveCopy}
          showFooter={false}
        />
      </div>

      <footer className={missionDeStyles.panelFooter}>
        <AppButton variant="secondary" size="sm" onClick={onOpenMissionSaveCopy}>
          שמור עותק למשימה
        </AppButton>
        <AppButton variant="primary" size="sm" onClick={onSaveMissionServer}>
          שמור לשרת
        </AppButton>
      </footer>
    </div>
  );
};

export default MissionFormPanel;
