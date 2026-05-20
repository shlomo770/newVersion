import { useEffect, useState } from 'react';

export interface WindowSize {
  width: number;
  height: number;
}

const getSize = (): WindowSize => ({
  width: typeof window !== 'undefined' ? window.innerWidth : 0,
  height: typeof window !== 'undefined' ? window.innerHeight : 0,
});

/**
 * Tracks viewport inner width/height; updates on window resize.
 */
export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>(getSize);

  useEffect(() => {
    const onResize = () => setSize(getSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return size;
}
