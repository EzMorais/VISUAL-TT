import { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import AgendaPanel from './components/AgendaPanel';
import TaskPanel from './components/TaskPanel';
import AIChat from './components/AIChat';
import BriefingPanel from './components/BriefingPanel';
import QuickModal from './components/QuickModal';
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
  const [fabOpen, setFabOpen] = useState(false);
  const [modal, setModal] = useState(null); // { type: 'task' | 'reminder' | 'ai' }
  const [tabKey, setTabKey] = useState(0); // force remount on tab change to retrigger animation

  // Swipe tracking
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

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

  // Swipe to change tabs
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;

    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;

    // Only horizontal swipes wider than 60px and more horizontal than vertical
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.3) return;

    const currentIdx = TABS.findIndex(t => t.id === activeTab);
    let nextIdx;

    if (dx < 0 && currentIdx < TABS.length - 1) {
      nextIdx = currentIdx + 1; // swipe left → next tab
    } else if (dx > 0 && currentIdx > 0) {
      nextIdx = currentIdx - 1; // swipe right → prev tab
    }

    if (nextIdx !== undefined) {
      setActiveTab(TABS[nextIdx].id);
      setTabKey(k => k + 1);
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [activeTab]);

  function goTab(id) {
    setActiveTab(id);
    setTabKey(k => k + 1);
    setFabOpen(false);
  }

  const panelContent = {
    agenda:   <AgendaPanel />,
    tasks:    <TaskPanel />,
    ai:       <AIChat />,
    briefing: <BriefingPanel />,
  };

  return (
    <div className="app">
      <Header isOnline={isOnline} />

      {/* ── Mobile layout ───────────────────────────────── */}
      {isMobile && (
        <>
          <div
            className="tab-content"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="panel-slide" key={`${activeTab}-${tabKey}`}>
              {panelContent[activeTab]}
            </div>
          </div>

          <div className="swipe-hint">← deslize para mudar →</div>

          {/* FAB */}
          {fabOpen && (
            <div className="fab-menu">
              <div className="fab-item">
                <span className="fab-item-label">Nova tarefa</span>
                <button className="fab-item-btn" onClick={() => { setModal('task'); setFabOpen(false); }}>✅</button>
              </div>
              <div className="fab-item">
                <span className="fab-item-label">Lembrete</span>
                <button className="fab-item-btn" onClick={() => { setModal('reminder'); setFabOpen(false); }}>⏰</button>
              </div>
              <div className="fab-item">
                <span className="fab-item-label">Perguntar à IA</span>
                <button className="fab-item-btn" onClick={() => { goTab('ai'); setFabOpen(false); }}>🤖</button>
              </div>
              <div className="fab-item">
                <span className="fab-item-label">Ver agenda</span>
                <button className="fab-item-btn" onClick={() => { goTab('agenda'); }}>📅</button>
              </div>
            </div>
          )}

          <button
            className="fab"
            onClick={() => setFabOpen(v => !v)}
            aria-label="Ações rápidas"
          >
            {fabOpen ? '✕' : '⚡'}
          </button>

          {/* Bottom nav */}
          <nav className="bottom-nav">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => goTab(tab.id)}
              >
                <span className="nav-icon">{tab.icon}</span>
                <span className="nav-label">{tab.label}</span>
              </button>
            ))}
          </nav>
        </>
      )}

      {/* ── Desktop grid ────────────────────────────────── */}
      {!isMobile && (
        <div className="desktop-grid">
          <AgendaPanel />
          <AIChat />
          <TaskPanel />
          <BriefingPanel />
        </div>
      )}

      {/* ── Quick action modals ──────────────────────── */}
      {modal && (
        <QuickModal type={modal} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
