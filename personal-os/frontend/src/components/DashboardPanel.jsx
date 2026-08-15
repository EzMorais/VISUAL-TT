import { useState, useEffect, useCallback } from 'react';
import { tasks as tasksApi, agenda as agendaApi, finance } from '../services/api';

const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0);
const PRIORITY_COLOR = { high: '#ff5252', medium: '#ffcc00', low: '#00e676' };
const DIAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function DashboardPanel() {
  const [pending, setPending] = useState([]);
  const [done, setDone] = useState([]);
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, d, ev, s, t] = await Promise.all([
        tasksApi.list('pending'),
        tasksApi.list('done'),
        agendaApi.today(),
        finance.summary(),
        finance.transactions({ limit: 60 }),
      ]);
      setPending(p); setDone(d); setEvents(ev); setSummary(s); setTxs(t);
    } catch {
      setPending([]); setDone([]); setEvents([]); setSummary(null); setTxs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-header"><span className="panel-title">🎯 Painel</span></div>
        <div className="panel-body"><div className="empty-state"><div className="spinner" /></div></div>
      </div>
    );
  }

  const totalTasks = pending.length + done.length;
  const donePct = totalTasks ? Math.round((done.length / totalTasks) * 100) : 0;
  const highPriority = pending.filter(t => t.priority === 'high').slice(0, 3);
  const overBudget = (summary?.budgets || []).filter(b => {
    const spent = summary.byCategory.find(c => c.category === b.category)?.total || 0;
    return spent > b.limit_amount;
  });
  const nextEvent = events[0];

  const actionItems = [
    ...(nextEvent ? [{ kind: 'event', text: `${nextEvent.timeStr || ''} — ${nextEvent.title}`, icon: '📅' }] : []),
    ...highPriority.map(t => ({ kind: 'task', text: t.title, icon: '🔴' })),
    ...overBudget.map(b => ({ kind: 'budget', text: `Orçamento de ${b.category} estourado`, icon: '⚠️' })),
  ].slice(0, 6);

  const weekData = buildWeekSpend(txs);
  const maxWeek = Math.max(1, ...weekData.map(d => d.value));

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">🎯 Painel</span>
        <span className="text-sm dim">{donePct}% concluído</span>
      </div>

      <div className="panel-body">
        {/* ── O que fazer agora ─────────────────────── */}
        <div className="fin-section">
          <div className="fin-section-title">Prioridades agora</div>
          {actionItems.length === 0 && (
            <div className="empty-state" style={{ padding: 12 }}>Tudo em dia! Nenhuma prioridade urgente.</div>
          )}
          {actionItems.map((item, i) => (
            <div key={i} className="action-item">
              <span className="action-icon">{item.icon}</span>
              <span className="action-text">{item.text}</span>
            </div>
          ))}
        </div>

        {/* ── Charts row ────────────────────────────── */}
        <div className="chart-row">
          <div className="chart-box">
            <Donut
              data={[
                { value: done.length, color: 'var(--green)' },
                { value: pending.length, color: 'var(--border-hi)' },
              ]}
              centerLabel={`${donePct}%`}
              centerSub="tarefas"
            />
            <div className="chart-legend">
              <span><i style={{ background: 'var(--green)' }} /> Feitas ({done.length})</span>
              <span><i style={{ background: 'var(--border-hi)' }} /> Pendentes ({pending.length})</span>
            </div>
          </div>

          <div className="chart-box">
            <div className="week-chart">
              {weekData.map((d, i) => (
                <div key={i} className="week-bar-col">
                  <div className="week-bar-track">
                    <div
                      className="week-bar-fill"
                      style={{ height: `${(d.value / maxWeek) * 100}%` }}
                      title={fmt(d.value)}
                    />
                  </div>
                  <span className="week-bar-label">{d.label}</span>
                </div>
              ))}
            </div>
            <div className="chart-legend"><span className="muted text-sm">Gastos — últimos 7 dias</span></div>
          </div>
        </div>

        {/* ── Goals radial progress ────────────────── */}
        {summary?.goals?.length > 0 && (
          <div className="fin-section">
            <div className="fin-section-title">Objetivos</div>
            <div className="goal-rings">
              {summary.goals.map(g => {
                const pct = g.target_amount ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0;
                return (
                  <div key={g.id} className="goal-ring-box">
                    <RadialProgress pct={pct} label={`${pct.toFixed(0)}%`} />
                    <span className="goal-ring-name">{g.name}</span>
                    <span className="goal-ring-amount muted text-sm">{fmt(g.current_amount)}/{fmt(g.target_amount)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function buildWeekSpend(txs) {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const value = txs
      .filter(t => t.type === 'expense' && t.date === key)
      .reduce((sum, t) => sum + t.amount, 0);
    days.push({ label: DIAS[d.getDay()], value });
  }
  return days;
}

function Donut({ data, size = 96, stroke = 12, centerLabel, centerSub }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      {data.map((d, i) => {
        const frac = d.value / total;
        const dash = frac * circumference;
        const el = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
          />
        );
        offset += dash;
        return el;
      })}
      {centerLabel && (
        <text x="50%" y="47%" textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--text)" fontFamily="var(--font-mono)">
          {centerLabel}
        </text>
      )}
      {centerSub && (
        <text x="50%" y="62%" textAnchor="middle" fontSize="9" fill="var(--text-muted)">
          {centerSub}
        </text>
      )}
    </svg>
  );
}

function RadialProgress({ pct, size = 64, stroke = 7, label }) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--green)" strokeWidth={stroke}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="53%" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--text)" fontFamily="var(--font-mono)">
        {label}
      </text>
    </svg>
  );
}
