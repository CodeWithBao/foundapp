import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { getAuthToken } from '../services/apiClient';
import savedItemService from '../services/savedItemService';

const SavedItemsContext = createContext(null);

export function SavedItemsProvider({ children }) {
  const { user, loading } = useAuth();
  const identity = !loading && user?.id ? `${user.id}:${getAuthToken() || ''}` : '';
  return <SavedItemsSession key={identity} identity={identity} uid={user?.id}>{children}</SavedItemsSession>;
}

function SavedItemsSession({ children, identity, uid }) {
  const [entries, setEntries] = useState({});
  const [revision, setRevision] = useState(0);
  const cache = useRef({});
  const active = useRef(true);
  const epoch = useRef(0);
  const pending = useRef(new Map());
  const toggles = useRef(new Map());
  const queue = useRef(new Set());
  const timer = useRef(null);
  const channel = useRef(null);
  const valid = useCallback(() => active.current && identity && identity === `${uid}:${getAuthToken() || ''}`, [identity, uid]);
  const publish = useCallback(() => setEntries({ ...cache.current }), []);
  const invalidate = useCallback(() => {
    epoch.current++;
    cache.current = {};
    publish();
    setRevision(n => n + 1);
  }, [publish]);

  useEffect(() => {
    active.current = true;
    if (identity && typeof BroadcastChannel !== 'undefined') {
      channel.current = new BroadcastChannel('unifind:saved-items');
      channel.current.onmessage = event => {
        if (String(event.data?.uid) === String(uid) && valid()) invalidate();
      };
    }
    const refresh = () => { if (valid()) invalidate(); };
    window.addEventListener('focus', refresh);
    const visibility = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      active.current = false;
      channel.current?.close();
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [identity, uid, valid, invalidate]);

  const ensure = useCallback(id => {
    id = String(id);
    if (!valid() || !/^[1-9]\d*$/.test(id) || cache.current[id] || pending.current.has(id)) return;
    cache.current[id] = { loading: true };
    queue.current.add(id);
    publish();
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const ids = [...queue.current];
      queue.current.clear();
      const version = epoch.current;
      for (let i = 0; i < ids.length; i += 100) {
        const batch = ids.slice(i, i + 100);
        try {
          const result = await savedItemService.status(batch);
          if (!valid() || version !== epoch.current) return;
          result.items.forEach(row => {
            if (!pending.current.has(String(row.item_id))) cache.current[row.item_id] = { saved: row.saved };
          });
        } catch (error) {
          if (!valid() || version !== epoch.current) return;
          batch.forEach(key => { if (!pending.current.has(key)) cache.current[key] = { error: error.message }; });
        }
        publish();
      }
    }, 0);
  }, [publish, valid]);

  const setSaved = useCallback((id, desired) => {
    id = String(id);
    if (!valid()) return Promise.reject(new Error('Vui lòng đăng nhập để lưu tin.'));
    if (pending.current.has(id)) return pending.current.get(id);
    const previous = cache.current[id];
    cache.current[id] = { ...previous, pending: true };
    publish();
    const request = (async () => {
      try {
        const result = await savedItemService.set(id, desired);
        if (!valid()) return;
        epoch.current++;
        // Discard in-flight reads; mounted controls revalidate unknown membership.
        cache.current = Object.fromEntries(Object.entries(cache.current).filter(([, value]) => !value.loading));
        cache.current[id] = { saved: result.saved };
        setRevision(n => n + 1);
        channel.current?.postMessage({ uid });
      } catch (error) {
        if (valid()) {
          cache.current[id] = { saved: previous?.saved, error: error.message };
          // A failed/timeout mutation must never be presented as a successful save.
          throw error;
        }
      } finally {
        pending.current.delete(id);
        if (valid()) publish();
      }
    })();
    pending.current.set(id, request);
    return request;
  }, [publish, uid, valid]);

  const toggle = useCallback(id => {
    const key = String(id);
    if (toggles.current.has(key)) return toggles.current.get(key);
    if (pending.current.has(key)) return pending.current.get(key);
    const request = (async () => {
      if (!valid()) throw new Error('Vui lòng đăng nhập để lưu tin.');
      let saved = cache.current[key]?.saved;
      if (saved === undefined || cache.current[key]?.error) {
        // Determine true membership before toggling; never guess on a failed read.
        const result = await savedItemService.status([key]);
        if (!valid()) return;
        saved = result.items[0].saved;
      }
      return setSaved(key, !saved);
    })().finally(() => toggles.current.delete(key));
    toggles.current.set(key, request);
    return request;
  }, [setSaved, valid]);

  return <SavedItemsContext.Provider value={{ entries, ensure, toggle, setSaved, revision, identity, valid }}>{children}</SavedItemsContext.Provider>;
}

export const useSavedItems = () => useContext(SavedItemsContext);
