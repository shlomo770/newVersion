export type FilterLayerDefinition = {
  category: 'targets' | 'categories';
  layer: string;
  name: string;
  icon: string;
};

export const CATEGORY_LAYER_DEFINITIONS: FilterLayerDefinition[] = [
  { category: 'categories', layer: 'No-fly zone', name: 'No-fly Zone', icon: '🚫' },
  { category: 'categories', layer: 'Allowed zone', name: 'Allowed Zone', icon: '✅' },
  { category: 'categories', layer: 'Building', name: 'Building', icon: '🏢' },
  { category: 'categories', layer: 'Station', name: 'Station', icon: '🚉' },
  { category: 'categories', layer: 'Parking', name: 'Parking', icon: '🅿️' },
  { category: 'categories', layer: 'Other', name: 'Other', icon: '📦' },
];

export const TARGET_LAYER_DEFINITIONS: FilterLayerDefinition[] = [
  { category: 'targets', layer: 'all', name: 'All Targets', icon: '🎯' },
  { category: 'targets', layer: 'friendly', name: 'Friendly', icon: '🟢' },
  { category: 'targets', layer: 'hostile', name: 'Hostile', icon: '🔴' },
  { category: 'targets', layer: 'unknown', name: 'Unknown', icon: '🟡' },
];
