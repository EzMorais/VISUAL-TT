import { useState, useEffect, useCallback } from 'react';
import { agenda } from '../services/api';

export default function AgendaPanel() {
  const [day, setDay] = useState('today');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', startTime: '', endTime: '', location: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = day === 'today' ? await agenda.today() : await agenda.tomorrow();
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [day]);

  useEffect(() => { load(); }, [load]);

  async function addEvent(e) {
    e.preventDefault();
    if (!form.title || !form.date || !form.startTime) return;

    const start = new Date(`${form.date}T${form.startTime}`);
    const end = form.endTime
      ? new Date(`${form.date}T${form.endTime}`)
      : new Date(start.getTime() + 60 * 60_000);

    try {
      await agenda.create({
        title: form.title,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        description: form.location,
      });
      setForm({ title: '', date: '', startTime: '', endTime: '', location: '' });
      setShowAdd(false);
      load();
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">📅 Agenda</span>
        <div className="flex gap-1 items-center">
          <div className="tab-row">
            <button className={`tab-pill ${day === 'today' ? 'active' : ''}`} onClick={() => setDay('today')}>Hoje</button>
            <button className={`tab-pill ${day === 'tomorrow' ? 'active' : ''}`} onClick={() => setDay('tomorrow')}>Amanhã</button>
          </div>
          <button className="btn-icon" title="Adicionar evento" onClick={() => setShowAdd(v => !v)}>＋</button>
        </div>
      </div>

      <div className="panel-body">
        {loading && <div className="empty-state"><div className="spinner" /></div>}

        {!loading && events.length === 0 && (
          <div className="empty-state">Nenhum evento {day === 'today' ? 'hoje' : 'amanhã'}</div>
        )}

        {!loading && events.map(ev => (
          <div key={ev.id} className="event-card">
            <div className="event-time mono">{ev.timeStr}</div>
            <div className="event-title">{ev.title}</div>
            {ev.location && <div className="event-location">📍 {ev.location}</div>}
            {ev.description && <div className="event-location">{ev.description}</div>}
          </div>
        ))}
      </div>

      {showAdd && (
        <form className="add-form" onSubmit={addEvent}>
          <input
            placeholder="Título do evento *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
          />
          <div className="add-form-row">
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              required
              style={{ flex: 1 }}
            />
            <input
              type="time"
              value={form.startTime}
              onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
              required
              style={{ flex: 1 }}
            />
            <input
              type="time"
              value={form.endTime}
              onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
              style={{ flex: 1 }}
            />
          </div>
          <div className="add-form-row">
            <input
              placeholder="Local (opcional)"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            />
            <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>Salvar</button>
            <button type="button" className="btn" onClick={() => setShowAdd(false)} style={{ flexShrink: 0 }}>✕</button>
          </div>
        </form>
      )}
    </div>
  );
}
