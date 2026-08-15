import { useState, useEffect } from 'react';
import Header from './components/Header';
import AgendaPanel from './components/AgendaPanel';
import TaskPanel from './components/TaskPanel';
import AIChat from './components/AIChat';
import BriefingPanel from './components/BriefingPanel';
import { health } from './services/api';

const TABS = [
  { id: 'agenda',   label: 'Agenda',   icon: '📅' },
  { id: 'tasks',    label: 'Tarefas',  icon: '✅' },
  { id: 'ai',       label: 'IA',       icon: '🤖' },
  { id: 'briefing', label: 'Briefing', icon: '☀️' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('agenda');
  const [isOnline, setIsOnline] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const check = async () => {
      try { await health.check(); setIsOnline(true); }
      catch { setIsOnline(false); }
    };
    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="app">
      <Header isOnline={isOnline} />

      {isMobile ? (
        <>
          <div className="tab-content">
            {activeTab === 'agenda'   && <AgendaPanel />}
            {activeTab === 'tasks'    && <TaskPanel />}
            {activeTab === 'ai'       && <AIChat />}
            {activeTab === 'briefing' && <BriefingPanel />}
          </div>

          <nav className="bottom-nav">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="nav-icon">{tab.icon}</span>
                <span className="nav-label">{tab.label}</span>
              </button>
            ))}
          </nav>
        </>
      ) : (
        <div className="desktop-grid">
          <AgendaPanel />
          <AIChat />
          <TaskPanel />
          <BriefingPanel />
        </div>
      )}
    </div>
  );
}
