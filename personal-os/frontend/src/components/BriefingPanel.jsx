import { useState, useEffect } from 'react';
import { briefing } from '../services/api';
import realtime from '../services/realtime';

export default function BriefingPanel() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [date, setDate] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await briefing.today();
      setContent(data.content || '');
      setDate(data.date || '');
    } catch {
      setContent('');
    } finally {
      setLoading(false);
    }
  }

  async function generate() {
    setGenerating(true);
    try {
      const data = await briefing.generate();
      setContent(data.content || '');
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Se o briefing foi gerado no computador (ou pelo cron da manhã), atualiza aqui sem recarregar.
  useEffect(() => realtime.on('briefing:generated', (data) => {
    setContent(data.content || '');
    setDate(new Date().toISOString().split('T')[0]);
  }), []);

  const dateLabel = date
    ? new Date(date + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
    : '';

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">☀️ Briefing do dia</span>
        <div className="flex gap-1 items-center">
          {dateLabel && <span className="text-sm muted">{dateLabel}</span>}
          <button
            className="btn"
            onClick={generate}
            disabled={generating}
            style={{ padding: '4px 10px', fontSize: 11 }}
          >
            {generating ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Gerando…</> : '↻ Gerar'}
          </button>
        </div>
      </div>

      <div className="panel-body">
        {loading && <div className="empty-state"><div className="spinner" /></div>}

        {!loading && !content && (
          <div className="empty-state">
            Nenhum briefing gerado hoje.<br />
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={generate} disabled={generating}>
              Gerar briefing agora
            </button>
          </div>
        )}

        {!loading && content && (
          <div className="briefing-content">{content}</div>
        )}
      </div>
    </div>
  );
}
