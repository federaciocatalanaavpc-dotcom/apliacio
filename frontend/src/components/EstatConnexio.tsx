import { useEffect, useState } from 'react';

// Avisa quan es perd la connexió: les dades que es vegin a partir d'aquell
// moment són les últimes que el service worker va desar (mode sense
// connexió), no necessàriament les més recents del servidor.
export default function EstatConnexio() {
  const [enLinia, setEnLinia] = useState(navigator.onLine);

  useEffect(() => {
    const marcarEnLinia = () => setEnLinia(true);
    const marcarSenseConnexio = () => setEnLinia(false);
    window.addEventListener('online', marcarEnLinia);
    window.addEventListener('offline', marcarSenseConnexio);
    return () => {
      window.removeEventListener('online', marcarEnLinia);
      window.removeEventListener('offline', marcarSenseConnexio);
    };
  }, []);

  if (enLinia) return null;

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'var(--c-warning-bg)',
        color: 'var(--c-warning)',
        borderBottom: '1px solid var(--c-warning-border)',
        padding: '6px 12px',
        fontSize: 13,
        fontWeight: 600,
        textAlign: 'center',
      }}
    >
      📡 Sense connexió — mostrant les últimes dades desades. No es podran pujar ni desar canvis fins que tornis a tenir internet.
    </div>
  );
}
