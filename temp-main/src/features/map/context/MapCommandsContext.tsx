import { createContext, useContext, useMemo, type FC, type MutableRefObject, type ReactNode } from 'react';
import type { MapService } from '@/services/map/MapService';
import { createMapCommands, type MapCommands } from './mapCommands';

const MapCommandsContext = createContext<MapCommands | null>(null);

export interface MapCommandsProviderProps {
  mapServiceRef: MutableRefObject<MapService | null>;
  children: ReactNode;
}

export const MapCommandsProvider: FC<MapCommandsProviderProps> = ({
  mapServiceRef,
  children,
}) => {
  const commands = useMemo(() => createMapCommands(mapServiceRef), [mapServiceRef]);
  return (
    <MapCommandsContext.Provider value={commands}>{children}</MapCommandsContext.Provider>
  );
};

export function useMapCommands(): MapCommands {
  const ctx = useContext(MapCommandsContext);
  if (!ctx) {
    throw new Error('useMapCommands must be used within MapCommandsProvider');
  }
  return ctx;
}

export function useMapCommandsOptional(): MapCommands | null {
  return useContext(MapCommandsContext);
}
