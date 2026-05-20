import { useEffect, useState } from 'react';
import type { PanelType } from '@/types';
import SidebarPanel from './SidebarPanel';
import SidebarForm from './SidebarForm';

export interface SidebarContainerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SidebarContainer({ isOpen }: SidebarContainerProps) {
  const [activePanel, setActivePanel] = useState<PanelType>(null);

  useEffect(() => {
    if (!isOpen) {
      setActivePanel(null);
    }
  }, [isOpen]);

  const handlePanelSelect = (panelType: PanelType) => {
    setActivePanel((current) => (current === panelType ? null : panelType));
  };

  if (!isOpen) return null;

  return (
    <>
      <SidebarPanel activePanel={activePanel} onPanelSelect={handlePanelSelect} />
      {activePanel && <SidebarForm type={activePanel} onClose={() => setActivePanel(null)} />}
    </>
  );
}
