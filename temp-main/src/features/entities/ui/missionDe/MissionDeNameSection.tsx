import { FC } from "react";
import { inp, missionDeStyles, section } from "./missionDePanelStyles";

export type MissionDeNameSectionProps = {
  editMissionName: string;
  onEditChange: (v: string) => void;
  onCommitRename: () => void;
  onEnterBlur: (el: HTMLInputElement) => void;
};

const MissionDeNameSection: FC<MissionDeNameSectionProps> = ({
  editMissionName,
  onEditChange,
  onCommitRename,
  onEnterBlur,
}) => (
  <div className={section}>
    <div className={missionDeStyles.nameFieldRow}>
      <label className={missionDeStyles.fieldLabel}>
        שם משימה
      </label>
      <input
        type="text"
        value={editMissionName}
        onChange={(e) => onEditChange(e.target.value)}
        onBlur={onCommitRename}
        onKeyDown={(e) => {
          if (e.key === "Enter") onEnterBlur(e.target as HTMLInputElement);
        }}
        className={inp}
        autoComplete="off"
      />
    </div>
  </div>
);

export default MissionDeNameSection;
