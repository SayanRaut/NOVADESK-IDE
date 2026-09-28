import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export interface UseLenisOptions {
  duration?: number;
  easing?: (t: number) => number;
  smoothWheel?: boolean;
  wrapper?: HTMLElement | null;
  content?: HTMLElement | null;
}

export function useLenis(enabled = true, options?: UseLenisOptions) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    try {
      const lenis = new Lenis({
        duration: options?.duration ?? 1.1,
        easing: options?.easing ?? ((t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))),
        smoothWheel: options?.smoothWheel ?? true,
        ...(options?.wrapper ? { wrapper: options.wrapper } : {}),
        ...(options?.content ? { content: options.content } : {}),
      });

      lenisRef.current = lenis;

      let rafId: number;
      const raf = (time: number) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };

      rafId = requestAnimationFrame(raf);

      return () => {
        cancelAnimationFrame(rafId);
        lenis.destroy();
        lenisRef.current = null;
      };
    } catch (e) {
      console.warn('Lenis smooth scroll initialization skipped:', e);
    }
  }, [enabled, options?.duration, options?.smoothWheel, options?.wrapper, options?.content]);

  return lenisRef;
}
