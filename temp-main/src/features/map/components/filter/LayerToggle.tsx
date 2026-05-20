import React, { useCallback, useState } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { toggleLayer } from '../../store/filterSlice';

export interface LayerToggleProps {
  category: 'targets' | 'categories';
  layer: string;
  name: string;
  icon: string;
  visible: boolean;
}

function LayerToggle({ category, layer, name, icon, visible }: LayerToggleProps) {
  const dispatch = useAppDispatch();
  const [isDisabled, setIsDisabled] = useState(false);

  const handleToggle = useCallback(() => {
    if (isDisabled) return;
    setIsDisabled(true);
    dispatch(toggleLayer({ category, layer }));
    setTimeout(() => setIsDisabled(false), 1000);
  }, [isDisabled, dispatch, category, layer]);

  return (
    <div className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 rounded-md transition-colors">
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-medium text-gray-700">{name}</span>
      </div>
      <button
        type="button"
        onPointerDown={handleToggle}
        disabled={isDisabled}
        className={`
          relative inline-flex h-4 w-7 items-center rounded-full
          transition-all duration-200 ease-in-out
          ${visible ? 'bg-blue-500' : 'bg-gray-300'}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}
        `}
      >
        <span
          className={`
          inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-sm
          transition-all duration-200 ease-in-out
          ${visible ? 'translate-x-3.5' : 'translate-x-0.5'}
        `}
        />
      </button>
    </div>
  );
}

export default React.memo(LayerToggle);
