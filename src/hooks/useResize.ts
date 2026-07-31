import { useState, useCallback, useRef, useEffect } from 'react';

interface UseResizeOptions {
  initialSize: number;
  minSize: number;
  maxSize?: number;
  direction: 'horizontal' | 'vertical';
  reverse?: boolean; // If true, moving mouse right/down decreases size (e.g. right sidebar)
  storageKey?: string;
}

export function useResize({ initialSize, minSize, maxSize, direction, reverse = false, storageKey }: UseResizeOptions) {
  const [size, setSize] = useState(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed)) return parsed;
      }
    }
    return initialSize;
  });
  const [isResizing, setIsResizing] = useState(false);
  const startPosRef = useRef(0);
  const startSizeRef = useRef(size);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
    startSizeRef.current = size;
  }, [direction, size]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
    const diff = currentPos - startPosRef.current;
    
    let newSize = startSizeRef.current + (reverse ? -diff : diff);
    
    if (newSize < minSize) newSize = minSize;
    if (maxSize && newSize > maxSize) newSize = maxSize;
    
    
    setSize(newSize);
    if (storageKey) {
      localStorage.setItem(storageKey, newSize.toString());
    }
  }, [isResizing, direction, minSize, maxSize, reverse, storageKey]);

  const onMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, onMouseMove, onMouseUp, direction]);

  return { size, isResizing, onMouseDown, setSize };
}
