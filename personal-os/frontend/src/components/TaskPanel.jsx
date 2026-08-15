import { useState, useEffect, useCallback } from 'react';
import { tasks } from '../services/api';

const PRIORITY_CLASS = { high: 'priority-high', medium: 'priority-medium', low: 'priority-low' };
const PRIORITY_LABEL = { high: 'Alta', medium: 'Média', low: 'Baixa' };

export default function TaskPanel() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [showDone, setShowDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pending, done] = await Promise.all([
        tasks.list('pending'),
        showDone ? tasks.list('done') : Promise.resolve([]),
      ]);
      setList([...pending, ...done]);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [showDone]);

  useEffect(() => { load(); }, [load]);

  async function addTask(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await tasks.create({ title: title.trim(), priority, due_date: dueDate || null });
      setTitle('');
      setDueDate('');
      load();
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  }

  async function toggleDone(task) {
    await tasks.update(task.id, { status: task.status === 'done' ? 'pending' : 'done' });
    load();
  }

  async function deleteTask(id) {
    if (!confirm('Apagar tarefa?')) return;
    await tasks.remove(id);
    load();
  }

  const pending = list.filter(t => t.status === 'pending');
  const done = list.filter(t => t.status === 'done');

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">✅ Tarefas</span>
        <div className="flex gap-1 items-center">
          <span className="text-sm dim">{pending.length} pendente{pending.length !== 1 ? 's' : ''}</span>
          <button
            className={`tab-pill ${showDone ? 'active' : ''}`}
            onClick={() => setShowDone(v => !v)}
          >
            Concluídas
          </button>
        </div>
      </div>

      <div className="panel-body">
        {loading && <div className="empty-state"><div className="spinner" /></div>}

        {!loading && pending.length === 0 && done.length === 0 && (
          <div className="empty-state">Nenhuma tarefa. Adicione uma abaixo!</div>
        )}

        {!loading && pending.map(task => (
          <TaskItem key={task.id} task={task} onToggle={toggleDone} onDelete={deleteTask} />
        ))}

        {showDone && done.length > 0 && (
          <>
            <div className="muted text-sm" style={{ paddingTop: 4 }}>— Concluídas —</div>
            {done.map(task => (
              <TaskItem key={task.id} task={task} onToggle={toggleDone} onDelete={deleteTask} />
            ))}
          </>
        )}
      </div>

      <form className="add-form" onSubmit={addTask}>
        <div className="add-form-row">
          <input
            placeholder="Nova tarefa..."
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            style={{ width: 80, flexShrink: 0 }}
          >
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
        </div>
        <div className="add-form-row">
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>Adicionar</button>
        </div>
      </form>
    </div>
  );
}

function TaskItem({ task, onToggle, onDelete }) {
  const done = task.status === 'done';
  return (
    <div className={`task-item ${done ? 'done' : ''}`}>
      <div
        className={`task-check ${done ? 'checked' : ''}`}
        onClick={() => onToggle(task)}
      >
        {done && <span style={{ color: '#000', fontSize: 10, fontWeight: 700 }}>✓</span>}
      </div>

      <div className="task-body">
        <div className="task-title">{task.title}</div>
        {(task.due_date || task.priority !== 'medium') && (
          <div className="task-meta">
            {PRIORITY_LABEL[task.priority]}
            {task.due_date && ` · ${task.due_date}`}
          </div>
        )}
      </div>

      <div className={`priority-dot ${PRIORITY_CLASS[task.priority] || ''}`} />
      <button className="btn-icon danger" onClick={() => onDelete(task.id)}>✕</button>
    </div>
  );
}
