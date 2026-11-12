// FRONTEND UI ONLY: anonymous presence; no authentication or mock fallback.
const rawBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api/v1';
const base = rawBase.startsWith('http') ? '/api/v1' : rawBase.replace(/\/$/, '');
const key = 'unifind_anonymous_presence_v1';
let memoryID;
let latestStatistics = null;
const subscribers = new Set();
export function publishStatistics(data) {
  latestStatistics = data;
  subscribers.forEach(listener => listener(data));
}
export function subscribeStatistics(listener) {
  subscribers.add(listener);
  listener(latestStatistics);
  return () => subscribers.delete(listener);
}

export function getPresenceID() {
  try {
    const stored = localStorage.getItem(key);
    if (/^[a-f0-9]{32}$/.test(stored)) return stored;
  } catch { /* Storage blocked: retain one in-memory ID for this tab. */ }
  memoryID ||= Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
  try { localStorage.setItem(key, memoryID); } catch { /* No PII or cookies required. */ }
  return memoryID;
}

async function request(path, signal, body) {
  const response = await fetch(`${base}/statistics${path}`, {
    method: body ? 'POST' : 'GET', signal, credentials: 'omit', cache: 'no-store',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new Error('Statistics unavailable');
  return response.json();
}

// Completion-based timeout avoids overlap. Hidden pages stop heartbeating.
export function startStatisticsPolling(onUpdate, environment = {}) {
  const doc = environment.document || document;
  const schedule = environment.setTimeout || setTimeout;
  const cancel = environment.clearTimeout || clearTimeout;
  const send = environment.request || request;
  let stopped = false;
  let controller;
  let timer;
  async function poll() {
    if (stopped || doc.hidden || controller) return;
    controller = new AbortController();
    const current = controller;
    const deadline = schedule(() => current.abort(), 8000);
    try {
      let active = null;
      try {
        const heartbeat = await send('/heartbeat', current.signal, { session_id: getPresenceID() });
        active = heartbeat.active_sessions;
      } catch (error) {
        if (current.signal.aborted) throw error;
      }
      const data = await send('', current.signal);
      if (!stopped && !current.signal.aborted) onUpdate({ ...data, active_sessions: active });
    } catch {
      if (!stopped && !doc.hidden) onUpdate(null);
    } finally {
      cancel(deadline);
      controller = null;
      if (!stopped && !doc.hidden) timer = schedule(poll, 30000);
    }
  }
  function visibility() {
    cancel(timer);
    if (doc.hidden) controller?.abort();
    else poll();
  }
  doc.addEventListener('visibilitychange', visibility);
  poll();
  return () => {
    stopped = true;
    cancel(timer);
    controller?.abort();
    doc.removeEventListener('visibilitychange', visibility);
  };
}
