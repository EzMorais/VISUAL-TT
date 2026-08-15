import { useState, useEffect } from 'react';

export default function Header({ isOnline }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

  return (
    <header className="header">
      <div className="header-logo">⬡ PERSONAL OS</div>

      <div className="header-clock">
        <span className="time mono">{time}</span>
        <span className="dim text-sm">{date}</span>
      </div>

      <div className="header-status">
        <div className={`status-dot ${isOnline ? '' : 'offline'}`} />
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>
    </header>
  );
}
