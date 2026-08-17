import { useEffect, useRef, useCallback } from 'react';
import { createEventSocket } from '../lib/api';

/**
 * Hook that opens a WebSocket to /ws/events, auto-reconnects on disconnect,
 * and calls onMessage with parsed JSON payloads.
 */
export function useSetuWebSocket(onMessage) {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    wsRef.current = createEventSocket(
      (data) => onMessageRef.current(data),
      () => {
        // On error, schedule reconnect
        reconnectTimer.current = setTimeout(connect, 3000);
      }
    );

    wsRef.current.addEventListener('close', () => {
      reconnectTimer.current = setTimeout(connect, 3000);
    });
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect on unmount
        wsRef.current.close();
      }
    };
  }, [connect]);

  return wsRef;
}
