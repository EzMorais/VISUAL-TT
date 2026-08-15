import { useState, useEffect } from 'react';
import VoiceButton from './VoiceButton';

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export default function Header({ isOnline }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const dia = DIAS[now.getDay()];
  const data = `${dia} ${now.getDate()} ${MESES[now.getMonth()]}`;

  return (
    <header className="header">
      <div className="header-logo">⬡ OS</div>

      <div className="header-clock">
        <span className="time">
          {hh}<span style={{ opacity: now.getSeconds() % 2 === 0 ? 1 : 0.3, transition: 'opacity .15s' }}>:</span>{mm}<span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 2 }}>{ss}</span>
        </span>
        <span className="date">{data}</span>
      </div>

      <div className="header-status">
        <VoiceButton />
        <div className={`status-dot ${isOnline ? '' : 'offline'}`} />
        <span style={{ display: 'none' }}>{isOnline ? 'Online' : 'Offline'}</span>
      </div>
    </header>
  );
}
