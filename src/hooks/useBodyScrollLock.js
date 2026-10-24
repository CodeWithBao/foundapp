import { useLayoutEffect } from 'react';

let activeLocks = 0;
let restoreState = null;

function lockBody() {
  if (activeLocks === 0) {
    const body = document.body;
    restoreState = {
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${restoreState.scrollY}px`;
    body.style.left = `-${restoreState.scrollX}px`;
    body.style.right = '0';
    body.style.width = '100%';
  }
  activeLocks += 1;
}

function unlockBody() {
  activeLocks = Math.max(0, activeLocks - 1);
  if (activeLocks !== 0 || !restoreState) return;

  const body = document.body;
  const saved = restoreState;
  restoreState = null;
  body.style.overflow = saved.overflow;
  body.style.position = saved.position;
  body.style.top = saved.top;
  body.style.left = saved.left;
  body.style.right = saved.right;
  body.style.width = saved.width;
  window.scrollTo({ left: saved.scrollX, top: saved.scrollY, behavior: 'auto' });
}

export default function useBodyScrollLock(locked) {
  useLayoutEffect(() => {
    if (!locked) return undefined;
    lockBody();
    return unlockBody;
  }, [locked]);
}
