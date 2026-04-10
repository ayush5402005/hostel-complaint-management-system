import { EventSourcePolyfill } from 'event-source-polyfill';

let es = null;

export function connectSSE(onNotification) {
  const token = localStorage.getItem('token');
  if (!token || es) return;

  es = new EventSourcePolyfill(
    `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/notifications/stream`,
    {
      headers: { Authorization: `Bearer ${token}` },
      heartbeatTimeout: 120000,
    }
  );

  es.addEventListener('CONNECTED', () => {
    console.log('🔔 SSE connected');
  });

  ['COMPLAINT_CREATED', 'COMPLAINT_ASSIGNED', 'STATUS_UPDATED',
   'COMPLAINT_CLOSED', 'COMPLAINT_ESCALATED'].forEach(type => {
    es.addEventListener(type, (e) => {
      onNotification(JSON.parse(e.data));
    });
  });

  es.onerror = () => {
    es?.close();
    es = null;
  };
}

export function disconnectSSE() {
  es?.close();
  es = null;
}
