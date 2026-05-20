import type { EntityType } from './entity';

export interface MissionEntityRef {
  id: string;
  type: EntityType;
}

export interface Mission {
  id: string;
  name: string;
  entityRefs: MissionEntityRef[];
}

export interface SaveMissionEntityWire {
  id: string;
  type: string;
}
