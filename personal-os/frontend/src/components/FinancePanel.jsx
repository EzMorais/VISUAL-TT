import { useState, useEffect, useCallback } from 'react';
import { finance } from '../services/api';

const fmt = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0);

const CAT_COLORS = ['#00e676', '#40c4ff', '#ffcc00', '#ff5252', '#b388ff', '#ff8a65', '#69ffb0', '#4dd0e1'];

export default function FinancePanel() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([finance.summary(), finance.transactions({ limit: 8 })]);
      setSummary(s);
      setTransactions(t);
    } catch {
      setSummary(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const result = summary ? summary.monthIncome - summary.monthExpenses : 0;
  const maxCat = summary?.byCategory?.[0]?.total || 1;

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">💰 Financeiro</span>
        <button className="btn-icon" title="Nova transação" onClick={() => setShowForm(v => !v)}>
          {showForm ? '✕' : '➕'}
        </button>
      </div>

      <div className="panel-body">
        {loading && <div className="empty-state"><div className="spinner" /></div>}

        {!loading && summary && (
          <>
            <div className="fin-cards">
              <div className="fin-card">
                <span className="fin-card-label">Saldo total</span>
                <span className="fin-card-value">{fmt(summary.totalBalance)}</span>
              </div>
              <div className="fin-card">
                <span className="fin-card-label">Entradas</span>
                <span className="fin-card-value up">↑ {fmt(summary.monthIncome)}</span>
              </div>
              <div className="fin-card">
                <span className="fin-card-label">Saídas</span>
                <span className="fin-card-value down">↓ {fmt(summary.monthExpenses)}</span>
              </div>
              <div className="fin-card">
                <span className="fin-card-label">Resultado</span>
                <span className={`fin-card-value ${result >= 0 ? 'up' : 'down'}`}>{fmt(result)}</span>
              </div>
            </div>

            {showForm && <QuickTransactionForm onSaved={() => { setShowForm(false); load(); }} />}

            {summary.byCategory.length > 0 && (
              <div className="fin-section">
                <div className="fin-section-title">Gastos por categoria</div>
                {summary.byCategory.map((c, i) => (
                  <div key={c.category} className="fin-cat-row">
                    <span className="fin-cat-name">{c.category}</span>
                    <div className="fin-cat-bar-track">
                      <div
                        className="fin-cat-bar-fill"
                        style={{ width: `${(c.total / maxCat) * 100}%`, background: CAT_COLORS[i % CAT_COLORS.length] }}
                      />
                    </div>
                    <span className="fin-cat-value">{fmt(c.total)}</span>
                  </div>
                ))}
              </div>
            )}

            {summary.goals.length > 0 && (
              <div className="fin-section">
                <div className="fin-section-title">Metas de economia</div>
                {summary.goals.map(g => {
                  const pct = g.target_amount ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0;
                  return (
                    <div key={g.id} className="fin-goal">
                      <div className="fin-goal-row">
                        <span className="fin-goal-name">🎯 {g.name}</span>
                        <span className="fin-goal-pct">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="fin-cat-bar-track">
                        <div className="fin-cat-bar-fill" style={{ width: `${pct}%`, background: 'var(--green)' }} />
                      </div>
                      <div className="fin-goal-amounts">{fmt(g.current_amount)} / {fmt(g.target_amount)}</div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="fin-section">
              <div className="fin-section-title">Últimas transações</div>
              {transactions.length === 0 && <div className="empty-state" style={{ padding: 12 }}>Nenhuma transação este mês.</div>}
              {transactions.map(t => (
                <div key={t.id} className="fin-tx">
                  <span className={`fin-tx-dot ${t.type}`} />
                  <div className="fin-tx-body">
                    <div className="fin-tx-desc">{t.description}</div>
                    <div className="fin-tx-meta">{t.category} · {t.date}</div>
                  </div>
                  <span className={`fin-tx-amount ${t.type}`}>
                    {t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function QuickTransactionForm({ onSaved }) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('outros');
  const [saving, setSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    if (!amount || !description.trim()) return;
    setSaving(true);
    try {
      await finance.createTransaction({ type, amount: parseFloat(amount), description: description.trim(), category });
      onSaved();
    } catch (err) {
      alert('Erro: ' + err.message);
      setSaving(false);
    }
  }

  return (
    <form className="fin-quick-form" onSubmit={save}>
      <div className="fin-type-toggle">
        <button type="button" className={type === 'expense' ? 'active down' : ''} onClick={() => setType('expense')}>↓ Gasto</button>
        <button type="button" className={type === 'income' ? 'active up' : ''} onClick={() => setType('income')}>↑ Entrada</button>
      </div>
      <div className="add-form-row">
        <input type="number" step="0.01" placeholder="Valor" value={amount} onChange={e => setAmount(e.target.value)} style={{ width: 100, flexShrink: 0 }} />
        <input placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div className="add-form-row">
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ flex: 1 }}>
          <option value="outros">Outros</option>
          <option value="mercado">Mercado</option>
          <option value="transporte">Transporte</option>
          <option value="moradia">Moradia</option>
          <option value="lazer">Lazer</option>
          <option value="saude">Saúde</option>
          <option value="salario">Salário</option>
        </select>
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ flexShrink: 0 }}>
          {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
