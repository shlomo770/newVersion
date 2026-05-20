import { useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useTargetCommands, useTargetStatusLifecycle } from '@features/targets';
import { WebSocketService } from '@/services/webSocket/WebSocketService';
import { store } from '@app/store';
import { WsMessageName } from '@domain/enums/ws.enum';
import {
  sendSaveEntity,
  buildSaveMissionEntitiesField,
} from '@features/entities';
import type { Entity } from '@/types';
import type { MapService } from '@/services/map/MapService';

export interface MapPageSessionState {
  measurePoints: { lng: number; lat: number }[];
  setMeasurePoints: React.Dispatch<React.SetStateAction<{ lng: number; lat: number }[]>>;
  isMeasuring: boolean;
  drawingMode: string | null;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isTargetsPanelOpen: boolean;
  setIsTargetsPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  focusEntityRef: MutableRefObject<((entity: Entity) => void) | undefined>;
  mapServiceRef: MutableRefObject<MapService | null>;
  handleAttackTarget: (targetId: string) => void;
  handleAbortTarget: (targetId: string) => void;
  handleTargetInfo: (targetId: string, identity: boolean) => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  toggleTargetsPanel: () => void;
}

export function useMapPageSession(): MapPageSessionState {
  const [measurePoints, setMeasurePoints] = useState<{ lng: number; lat: number }[]>([]);
  const drawingMode = useAppSelector((state) => state.entities.drawingMode);
  const isMeasuring = drawingMode === 'measure' || drawingMode === 'measure-area';
  const [isVisible, setIsVisible] = useState(true);
  const { allocateTarget, abortTarget, setTargetInfo } = useTargetCommands();

  useTargetStatusLifecycle(true);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTargetsPanelOpen, setIsTargetsPanelOpen] = useState(false);
  const focusEntityRef = useRef<((entity: Entity) => void) | undefined>(undefined);
  const mapServiceRef = useRef<MapService | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const newVisibility = !document.hidden;
      if (newVisibility !== isVisible) {
        setIsVisible(newVisibility);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isVisible]);

  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => event.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  const handleAttackTarget = useCallback(
    (targetId: string) => {
      allocateTarget(targetId);
    },
    [allocateTarget],
  );

  const handleAbortTarget = useCallback(
    (targetId: string) => {
      abortTarget(targetId);
    },
    [abortTarget],
  );

  const handleTargetInfo = useCallback(
    (targetId: string, identity: boolean) => {
      setTargetInfo(targetId, identity);
    },
    [setTargetInfo],
  );

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setIsSidebarOpen((open) => !open), []);
  const toggleTargetsPanel = useCallback(() => setIsTargetsPanelOpen((open) => !open), []);

  useEffect(() => {
    const ws = WebSocketService.getInstance();
    const unsubscribe = ws.onConnectionChange((connected) => {
      if (!connected) return;
      const entities = Object.values(store.getState().entities.byId);
      for (const entity of entities) {
        if (!entity) continue;
        if (entity.id.includes('temp')) {
          sendSaveEntity(
            entity.id,
            entity.category,
            entity.type,
            entity.coordinates ?? [],
            entity.name,
          );
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const ws = WebSocketService.getInstance();

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastSignature = '';

    const emitMissionSaveIfNeeded = () => {
      const state = store.getState().entities;
      const missions = Object.values(state.missionsById);
      if (!missions.length) return;

      const signature = JSON.stringify(
        missions
          .map((m) => ({
            id: m.id,
            name: m.name,
            refs: m.entityRefs.map((r) => ({ id: r.id, type: r.type })),
          }))
          .sort((a, b) => a.id.localeCompare(b.id)),
      );

      if (signature === lastSignature) return;

      lastSignature = signature;

      for (const mission of missions) {
        ws.sendMessage(WsMessageName.SaveMission, {
          mission_id: mission.id,
          mission_name: mission.name,
          entities: buildSaveMissionEntitiesField(mission.entityRefs, state.byId),
        });
      }
    };

    const unsubscribe = store.subscribe(() => {
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        emitMissionSaveIfNeeded();
      }, 500);
    });

    return () => {
      unsubscribe();

      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return {
    measurePoints,
    setMeasurePoints,
    isMeasuring,
    drawingMode,
    isSidebarOpen,
    setIsSidebarOpen,
    isTargetsPanelOpen,
    setIsTargetsPanelOpen,
    focusEntityRef,
    mapServiceRef,
    handleAttackTarget,
    handleAbortTarget,
    handleTargetInfo,
    closeSidebar,
    toggleSidebar,
    toggleTargetsPanel,
  };
}
