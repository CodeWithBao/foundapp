import { useLayoutEffect, useRef, useState } from 'react';

const KEYBOARD_THRESHOLD = 120;
const MOBILE_VIEWPORT_QUERY = '(max-width: 767px), (max-width: 932px) and (max-height: 500px)';

function isEditableElement(element) {
  if (!element || element.disabled || element.readOnly) return false;
  return element.matches?.('input, textarea, select, [contenteditable="true"]') || false;
}

function initialViewportState() {
  if (typeof window === 'undefined') {
    return {
      height: 0,
      width: 0,
      offsetTop: 0,
      keyboardInset: 0,
      keyboardOpen: false,
      editableFocused: false,
      isMobile: false,
    };
  }

  const viewport = window.visualViewport;
  return {
    height: Math.round(viewport?.height || window.innerHeight),
    width: Math.round(viewport?.width || window.innerWidth),
    offsetTop: Math.round(viewport?.offsetTop || 0),
    keyboardInset: 0,
    keyboardOpen: false,
    editableFocused: isEditableElement(document.activeElement),
    isMobile: window.matchMedia(MOBILE_VIEWPORT_QUERY).matches,
  };
}

export default function useVisualViewport() {
  const [state, setState] = useState(initialViewportState);
  const baselineHeightRef = useRef(0);

  useLayoutEffect(() => {
    const root = document.documentElement;
    let frame = 0;

    const readViewport = ({ resetBaseline = false } = {}) => {
      const viewport = window.visualViewport;
      const height = Math.round(viewport?.height || window.innerHeight);
      const width = Math.round(viewport?.width || window.innerWidth);
      const offsetTop = Math.max(0, Math.round(viewport?.offsetTop || 0));
      const visibleBottom = height + offsetTop;
      const editableFocused = isEditableElement(document.activeElement);
      const isMobile = window.matchMedia(MOBILE_VIEWPORT_QUERY).matches;

      if (resetBaseline || baselineHeightRef.current === 0) {
        baselineHeightRef.current = Math.max(window.innerHeight, visibleBottom);
      } else if (!editableFocused) {
        baselineHeightRef.current = Math.max(baselineHeightRef.current, window.innerHeight, visibleBottom);
      }

      const keyboardInset = isMobile && editableFocused
        ? Math.max(0, baselineHeightRef.current - visibleBottom)
        : 0;
      const keyboardOpen = keyboardInset >= KEYBOARD_THRESHOLD;
      const nextState = {
        height,
        width,
        offsetTop,
        keyboardInset,
        keyboardOpen,
        editableFocused,
        isMobile,
      };

      root.style.setProperty('--visual-viewport-height', `${height}px`);
      root.style.setProperty('--visual-viewport-width', `${width}px`);
      root.style.setProperty('--visual-viewport-top', `${offsetTop}px`);
      root.style.setProperty('--keyboard-inset', `${keyboardInset}px`);
      root.dataset.keyboardOpen = keyboardOpen ? 'true' : 'false';

      setState(previous => (
        previous.height === nextState.height
        && previous.width === nextState.width
        && previous.offsetTop === nextState.offsetTop
        && previous.keyboardInset === nextState.keyboardInset
        && previous.keyboardOpen === nextState.keyboardOpen
        && previous.editableFocused === nextState.editableFocused
        && previous.isMobile === nextState.isMobile
          ? previous
          : nextState
      ));
    };

    const scheduleRead = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => readViewport());
    };
    const handleOrientationChange = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => readViewport({ resetBaseline: true }));
    };

    readViewport({ resetBaseline: true });
    window.addEventListener('resize', scheduleRead, { passive: true });
    window.addEventListener('orientationchange', handleOrientationChange, { passive: true });
    document.addEventListener('focusin', scheduleRead);
    document.addEventListener('focusout', scheduleRead);
    window.visualViewport?.addEventListener('resize', scheduleRead, { passive: true });
    window.visualViewport?.addEventListener('scroll', scheduleRead, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', scheduleRead);
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('focusin', scheduleRead);
      document.removeEventListener('focusout', scheduleRead);
      window.visualViewport?.removeEventListener('resize', scheduleRead);
      window.visualViewport?.removeEventListener('scroll', scheduleRead);
      root.style.removeProperty('--visual-viewport-height');
      root.style.removeProperty('--visual-viewport-width');
      root.style.removeProperty('--visual-viewport-top');
      root.style.removeProperty('--keyboard-inset');
      delete root.dataset.keyboardOpen;
    };
  }, []);

  return state;
}
