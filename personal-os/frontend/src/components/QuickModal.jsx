import { useState, useRef, useEffect } from 'react';
import { tasks } from '../services/api';

export default function QuickModal({ type, onClose }) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {type === 'task'     && <TaskModal onClose={onClose} />}
      {type === 'reminder' && <ReminderModal onClose={onClose} />}
    </div>
  );
}

function TaskModal({ onClose }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [due, setDue] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  async function save(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await tasks.create({ title: title.trim(), priority, due_date: due || null });
      onClose();
    } catch (err) {
      alert('Erro: ' + err.message);
      setSaving(false);
    }
  }

  return (
    <div className="modal">
      <div className="modal-title">✅ Nova Tarefa</div>
      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          ref={inputRef}
          placeholder="Título da tarefa *"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={priority} onChange={e => setPriority(e.target.value)} style={{ flex: 1 }}>
            <option value="high">🔴 Alta</option>
            <option value="medium">🟡 Média</option>
            <option value="low">🟢 Baixa</option>
          </select>
          <input
            type="date"
            value={due}
            onChange={e => setDue(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving || !title.trim()}>
            {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ReminderModal({ onClose }) {
  const [time, setTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toTimeString().slice(0, 5);
  });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  async function save(e) {
    e.preventDefault();
    if (!message.trim() || !time) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), remind_at: `${today}T${time}:00` }),
      });
      if (!res.ok) throw new Error('Falhou');
      onClose();
    } catch (err) {
      alert('Erro ao salvar lembrete: ' + err.message);
      setSaving(false);
    }
  }

  return (
    <div className="modal">
      <div className="modal-title">⏰ Novo Lembrete</div>
      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
          required
        />
        <input
          ref={inputRef}
          placeholder="O que você quer lembrar? *"
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving || !message.trim()}>
            {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Criar'}
          </button>
        </div>
      </form>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
        O aviso chega via WhatsApp na hora marcada.
      </p>
    </div>
  );
}
