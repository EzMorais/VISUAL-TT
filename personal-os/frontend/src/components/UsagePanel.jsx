import { useState, useEffect, useCallback } from 'react';
import { usage } from '../services/api';
import realtime from '../services/realtime';

const fmtNum = (n) => new Intl.NumberFormat('pt-BR').format(n ?? 0);
const fmtMoney = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0);
const FEATURE_LABEL = {
  chat: '🤖 Chat', whatsapp: '📱 WhatsApp', voice: '🎙️ Voz', terminal: '▸_ Terminal',
  briefing: '☀️ Briefing', diagnostics: '⚠️ Diagnóstico',
};
const DIAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function UsagePanel() {
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, d] = await Promise.all([usage.summary(), usage.daily(14)]);
      setSummary(s);
      setDaily(d);
    } catch {
      setSummary(null);
      setDaily([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => realtime.on('usage:recorded', () => load()), [load]);

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-header"><span className="panel-title">📊 Uso</span></div>
        <div className="panel-body"><div className="empty-state"><div className="spinner" /></div></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="panel">
        <div className="panel-header"><span className="panel-title">📊 Uso</span></div>
        <div className="panel-body"><div className="empty-state">Sem dados de uso ainda.</div></div>
      </div>
    );
  }

  const maxDay = Math.max(1, ...daily.map((d) => d.total));

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">📊 Uso</span>
        <span className="text-sm dim">{fmtNum(summary.allTime.calls)} chamadas ao todo</span>
      </div>

      <div className="panel-body">
        <div className="fin-cards">
          <div className="fin-card">
            <span className="fin-card-label">Hoje</span>
            <span className="fin-card-value">{fmtNum(summary.today.total)} tokens</span>
          </div>
          <div className="fin-card">
            <span className="fin-card-label">Este mês</span>
            <span className="fin-card-value">{fmtNum(summary.month.total)} tokens</span>
          </div>
          {summary.pricingConfigured ? (
            <>
              <div className="fin-card">
                <span className="fin-card-label">Custo hoje (estimado)</span>
                <span className="fin-card-value up">{fmtMoney(summary.today.costEstimate)}</span>
              </div>
              <div className="fin-card">
                <span className="fin-card-label">Custo no mês (estimado)</span>
                <span className="fin-card-value up">{fmtMoney(summary.month.costEstimate)}</span>
              </div>
            </>
          ) : (
            <div className="fin-card" style={{ gridColumn: '1 / -1' }}>
              <span className="fin-card-label">Custo estimado</span>
              <span className="text-sm dim">Configure CLAUDE_INPUT_PRICE_PER_1M / CLAUDE_OUTPUT_PRICE_PER_1M no .env para ver um R$ aproximado aqui.</span>
            </div>
          )}
        </div>

        <div className="fin-section">
          <div className="fin-section-title">Últimos 14 dias</div>
          <div className="week-chart" style={{ height: 90 }}>
            {daily.map((d, i) => (
              <div key={i} className="week-bar-col">
                <div className="week-bar-track">
                  <div
                    className="week-bar-fill"
                    style={{ height: `${(d.total / maxDay) * 100}%` }}
                    title={`${fmtNum(d.total)} tokens`}
                  />
                </div>
                <span className="week-bar-label">{DIAS[new Date(d.date + 'T12:00').getDay()]}</span>
              </div>
            ))}
          </div>
        </div>

        {summary.byFeature.length > 0 && (
          <div className="fin-section">
            <div className="fin-section-title">Por área este mês</div>
            {summary.byFeature.map((f) => (
              <div key={f.feature} className="fin-cat-row">
                <span className="fin-cat-name" style={{ width: 96 }}>{FEATURE_LABEL[f.feature] || f.feature}</span>
                <div className="fin-cat-bar-track">
                  <div
                    className="fin-cat-bar-fill"
                    style={{ width: `${(f.total / (summary.byFeature[0].total || 1)) * 100}%`, background: 'var(--green)' }}
                  />
                </div>
                <span className="fin-cat-value">{fmtNum(f.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
