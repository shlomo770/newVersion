import type { Map as MaplibreMap } from 'maplibre-gl';
import GunLosLayer from './gun/GunLosLayer';
import LosSectorLayer from './los/LosSectorLayer';
import MyPositionLayer from './myPosition/MyPositionLayer';
import RadarCoverageLayer from './radar/RadarCoverageLayer';
import TabooZoneLayer from './taboo/TabooZoneLayer';
import TargetsLayer from './targets/TargetsLayer';

export interface MapTacticalLayersProps {
  map: MaplibreMap;
  onAbortTarget: (targetId: string) => void;
}

/**
 * Unified tactical layer stack — mounts feature-bound render loops on the map canvas.
 */
export default function MapTacticalLayers({ map, onAbortTarget }: MapTacticalLayersProps) {
  return (
    <>
      <MyPositionLayer map={map} />
      <RadarCoverageLayer map={map} />
      <TabooZoneLayer map={map} />
      <LosSectorLayer map={map} />
      <GunLosLayer map={map} />
      <TargetsLayer map={map} onAbort={onAbortTarget} />
    </>
  );
}
