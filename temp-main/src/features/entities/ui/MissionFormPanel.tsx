import { FC } from "react";
import { FaTimes } from "react-icons/fa";
import { AppButton, AppIconButton, AppSelect } from "@shared/ui";
import { missionDeStyles } from "./missionDe/missionDePanelStyles";
import MissionDePanel, { type MissionDePanelProps } from "./MissionDePanel";
import { he } from '@shared/i18n';

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
        <AppIconButton size="sm" label={he.common.close} onClick={onClose}>
          <FaTimes />
        </AppIconButton>
        <h2
          id="mission-form-title"
          className={missionDeStyles.panelTitle}
        >
          {he.entities.missionDe.panelTitle}
        </h2>
        <AppSelect
          compact
          fieldClassName={missionDeStyles.missionSelectWrap}
          className={missionDeStyles.missionSelect}
          value={panel.missionName}
          onChange={(e) => onMissionSwitch(e.target.value)}
          aria-label={he.entities.missionDe.missionSelectAria}
        >
          {missionNames.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </AppSelect>
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
          {he.entities.missionDe.saveCopyToMission}
        </AppButton>
        <AppButton variant="primary" size="sm" onClick={onSaveMissionServer}>
          {he.entities.missionDe.saveToServer}
        </AppButton>
      </footer>
    </div>
  );
};

export default MissionFormPanel;
