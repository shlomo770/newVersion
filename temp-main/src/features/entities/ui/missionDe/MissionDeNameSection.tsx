import { FC } from 'react';
import { AppInput } from '@shared/ui';
import { missionDeStyles, section } from './missionDePanelStyles';

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
    <AppInput
      label="שם משימה"
      type="text"
      value={editMissionName}
      onChange={(e) => onEditChange(e.target.value)}
      onBlur={onCommitRename}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onEnterBlur(e.target as HTMLInputElement);
      }}
      autoComplete="off"
      fieldClassName={missionDeStyles.nameFieldRow}
    />
  </div>
);

export default MissionDeNameSection;
