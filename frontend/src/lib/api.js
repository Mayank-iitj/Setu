const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_URL = import.meta.env.VITE_WS_URL || BASE_URL.replace(/^http/, 'ws');

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

// ── REST helpers ──────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

// ── Fleet ─────────────────────────────────────────────────────────────────────
export const getStats = () => apiFetch('/api/stats');
export const getFleet = () => apiFetch('/api/fleet');
export const getShipments = () => apiFetch('/api/shipments');

// ── Exchange ──────────────────────────────────────────────────────────────────
export const getCurrentRound = () => apiFetch('/api/exchange/round');
export const submitBid = (bid) =>
  apiFetch('/api/exchange/bid', { method: 'POST', body: JSON.stringify(bid) });

// ── Contact ───────────────────────────────────────────────────────────────────
export const submitContact = (data) =>
  apiFetch('/api/contact', { method: 'POST', body: JSON.stringify(data) });

// ── WebSocket factory ─────────────────────────────────────────────────────────
export function createEventSocket(onMessage, onError) {
  const url = authToken ? `${WS_URL}/ws/events?token=${authToken}` : `${WS_URL}/ws/events`;
  const ws = new WebSocket(url);

  ws.onopen = () => {
    console.log('[Setu WS] Connected');
    // Send ping every 20s to keep alive
    ws._pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send('ping');
    }, 20000);
  };

  ws.onmessage = (evt) => {
    try {
      const data = JSON.parse(evt.data);
      onMessage(data);
    } catch (e) {
      console.warn('[Setu WS] Bad message', e);
    }
  };

  ws.onerror = (e) => {
    console.error('[Setu WS] Error', e);
    if (onError) onError(e);
  };

  ws.onclose = () => {
    console.log('[Setu WS] Disconnected');
    clearInterval(ws._pingInterval);
  };

  return ws;
}
