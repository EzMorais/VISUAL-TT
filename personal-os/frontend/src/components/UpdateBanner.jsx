import { useState, useEffect } from 'react';
import realtime from '../services/realtime';

const CURRENT = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function UpdateBanner() {
  const [remoteVersion, setRemoteVersion] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  // The backend announces its version the moment a device connects — this
  // is how a PC that's been open for days finds out the phone (or a git
  // pull + restart) is already running something newer.
  useEffect(() => realtime.on('connected', (payload) => {
    if (payload?.version && payload.version !== CURRENT) setRemoteVersion(payload.version);
  }), []);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch(`${API_BASE}/version`);
        const data = await res.json();
        if (!cancelled && data.version && data.version !== CURRENT) setRemoteVersion(data.version);
      } catch { /* offline — try again next tick */ }
    }
    check();
    const t = setInterval(check, 5 * 60_000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  if (!remoteVersion || dismissed) return null;

  return (
    <div className="update-banner">
      <span>🚀 Nova versão disponível ({remoteVersion})</span>
      <button
        className="btn btn-primary"
        style={{ padding: '5px 12px', fontSize: 11 }}
        onClick={() => window.location.reload()}
      >
        Atualizar
      </button>
      <button className="btn-icon" onClick={() => setDismissed(true)} aria-label="Dispensar">✕</button>
    </div>
  );
}
