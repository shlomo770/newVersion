import { FC } from "react";
import { AppButton } from "@shared/ui";
import { missionDeStyles } from "./missionDePanelStyles";

export type MissionDeFooterProps = {
  onSaveMissionServer: () => void;
  onOpenMissionSaveCopy: () => void;
};

const MissionDeFooter: FC<MissionDeFooterProps> = ({
  onSaveMissionServer,
  onOpenMissionSaveCopy,
}) => (
  <div className={missionDeStyles.footerActions}>
    <AppButton variant="primary" size="sm" onClick={onSaveMissionServer}>
      שמור לשרת
    </AppButton>
    <AppButton variant="secondary" size="sm" onClick={onOpenMissionSaveCopy}>
      שמור עותק למשימה
    </AppButton>
  </div>
);

export default MissionDeFooter;
