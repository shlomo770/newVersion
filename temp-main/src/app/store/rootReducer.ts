import { combineReducers } from '@reduxjs/toolkit';
import { entitiesReducer } from '@features/entities';
import { systemStateReducer } from '@features/system-mode';
import {
  mapReducer,
  filterReducer,
  settingsReducer,
  coordinatesReducer,
  elevationReducer,
  losReducer,
  mapInteractionReducer,
} from '@features/map';
import { targetsReducer } from '@features/targets';
import {
  radarReducer,
  gunReducer,
  insReducer,
  myPositionReducer,
} from '@features/platform';
import { faultsReducer } from '@features/faults';
import { confirmReducer } from '@features/confirm';
import { tabooZoneReducer } from '@features/taboo-zone';

export const rootReducer = combineReducers({
  entities: entitiesReducer,
  map: mapReducer,
  filter: filterReducer,
  targets: targetsReducer,
  radar: radarReducer,
  gun: gunReducer,
  ins: insReducer,
  myPosition: myPositionReducer,
  coordinates: coordinatesReducer,
  los: losReducer,
  mapInteraction: mapInteractionReducer,
  settings: settingsReducer,
  elevation: elevationReducer,
  systemState: systemStateReducer,
  faults: faultsReducer,
  confirm: confirmReducer,
  tabooZone: tabooZoneReducer,
});

export type RootReducerState = ReturnType<typeof rootReducer>;
