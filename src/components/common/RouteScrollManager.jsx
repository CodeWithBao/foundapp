import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import scrollRestorationService from '../../services/scrollRestorationService';

function scrollImmediately(top) {
  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  window.scrollTo({ top: Math.max(0, top), left: 0, behavior: 'auto' });
  root.style.scrollBehavior = previousBehavior;
}

function getHashTarget(hash) {
  if (!hash || hash === '#') return null;
  let targetName = hash.slice(1);
  try {
    targetName = decodeURIComponent(targetName);
  } catch {
    // Giữ nguyên hash nếu chuỗi không thể decode.
  }
  return document.getElementById(targetName) || document.getElementsByName(targetName)[0] || null;
}

function getStickyHeaderOffset() {
  const header = document.querySelector('[data-sticky-header], header.sticky');
  return header ? header.getBoundingClientRect().height + 12 : 12;
}

export default function RouteScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positionsRef = useRef(new Map());
  const previousPathnameRef = useRef(null);

  useLayoutEffect(() => {
    const { key, pathname, hash } = location;
    const positions = positionsRef.current;
    const previousPathname = previousPathnameRef.current;
    const routeChanged = previousPathname === null || previousPathname !== pathname;
    previousPathnameRef.current = pathname;
    let observer;
    let frame;

    const scrollToHash = () => {
      const target = getHashTarget(hash);
      if (!target) return false;
      const rect = target.getBoundingClientRect();
      scrollImmediately(window.scrollY + rect.top - getStickyHeaderOffset());
      return true;
    };

    if (hash) {
      scrollImmediately(0);
      frame = requestAnimationFrame(() => {
        if (scrollToHash()) return;
        observer = new MutationObserver(() => {
          if (scrollToHash()) observer?.disconnect();
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });
    } else if (navigationType === 'POP') {
      const customSnapshot = scrollRestorationService.getSnapshot(pathname);
      if (!customSnapshot) {
        const savedPosition = positionsRef.current.get(key);
        scrollImmediately(typeof savedPosition === 'number' ? savedPosition : 0);
      }
    } else if (routeChanged) {
      scrollImmediately(0);
    }


    return () => {
      positions.set(key, window.scrollY || document.documentElement.scrollTop || 0);
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [location, navigationType]);

  return null;
}
