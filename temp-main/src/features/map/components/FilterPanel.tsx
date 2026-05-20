import React, { useCallback, useMemo } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setFilterPanelOpen, resetFilters, showTargetsOnly } from '../store/filterSlice';
import LayerToggle from './filter/LayerToggle';
import {
  CATEGORY_LAYER_DEFINITIONS,
  TARGET_LAYER_DEFINITIONS,
} from './filter/filterLayerDefinitions';

const FilterPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const filterState = useAppSelector((state) => state.filter);

  const handleClose = useCallback(() => {
    dispatch(setFilterPanelOpen(false));
  }, [dispatch]);

  const handleReset = useCallback(() => {
    dispatch(resetFilters());
  }, [dispatch]);

  const handleTargetsOnly = useCallback(() => {
    dispatch(showTargetsOnly());
  }, [dispatch]);

  const panelContent = useMemo(() => {
    if (!filterState.isFilterPanelOpen) return null;

    return (
      <div
        className="absolute z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-[280px] w-full p-0 overflow-hidden"
        style={{
          minWidth: 240,
          maxWidth: 280,
          width: '100%',
          top: '76px',
          right: '16px',
          maxHeight: '70vh',
          transform: filterState.isFilterPanelOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.2s ease-in-out',
        }}
      >
        <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
          <span className="text-base font-semibold text-gray-900">Layer Filter</span>
          <button
            type="button"
            onPointerDown={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1 mb-2">
              <span>🏷️</span>
              Categories
            </h4>
            <div className="space-y-0.5">
              {CATEGORY_LAYER_DEFINITIONS.map((def) => (
                <LayerToggle
                  key={def.layer}
                  category={def.category}
                  layer={def.layer}
                  name={def.name}
                  icon={def.icon}
                  visible={filterState.categories[def.layer as keyof typeof filterState.categories]}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1 mb-2">
              <span>🎯</span>
              Targets
            </h4>
            <div className="space-y-0.5">
              {TARGET_LAYER_DEFINITIONS.map((def) => (
                <LayerToggle
                  key={def.layer}
                  category={def.category}
                  layer={def.layer}
                  name={def.name}
                  icon={def.icon}
                  visible={filterState.targets[def.layer as keyof typeof filterState.targets]}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onPointerDown={handleTargetsOnly}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              🎯 Targets
            </button>
            <button
              type="button"
              onPointerDown={handleReset}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              🔄 Reset
            </button>
          </div>
        </div>
      </div>
    );
  }, [filterState, handleClose, handleReset, handleTargetsOnly]);

  return panelContent;
};

export default React.memo(FilterPanel);
