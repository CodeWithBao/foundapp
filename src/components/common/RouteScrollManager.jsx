import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteScrollManager() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    if (pathname !== '/campus' && pathname !== '/campus/') return undefined;

    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;

    root.style.scrollBehavior = 'auto';
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    const frame = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      root.style.scrollBehavior = previousBehavior;
    });

    return () => {
      cancelAnimationFrame(frame);
      root.style.scrollBehavior = previousBehavior;
    };
  }, [pathname]);

  return null;
}
