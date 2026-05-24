import { useEffect } from 'react';
import type { PanelType } from '@/types';
import SidebarPanel from './SidebarPanel';
import SidebarForm from './SidebarForm';

export interface SidebarContainerProps {
  isOpen: boolean;
  activePanel: PanelType;
  onActivePanelChange: (panel: PanelType) => void;
}

export default function SidebarContainer({
  isOpen,
  activePanel,
  onActivePanelChange,
}: SidebarContainerProps) {
  useEffect(() => {
    if (!isOpen) {
      onActivePanelChange(null);
    }
  }, [isOpen, onActivePanelChange]);

  const handlePanelSelect = (panelType: PanelType) => {
    onActivePanelChange(activePanel === panelType ? null : panelType);
  };

  if (!isOpen) return null;

  return (
    <>
      <SidebarPanel activePanel={activePanel} onPanelSelect={handlePanelSelect} />
      {activePanel ? (
        <SidebarForm type={activePanel} onClose={() => onActivePanelChange(null)} />
      ) : null}
    </>
  );
}
