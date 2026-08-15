import { useState, useEffect, useRef, useCallback } from 'react';
import { ai } from '../services/api';

export default function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const scrollDown = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  useEffect(() => {
    ai.history('web')
      .then(history => {
        setMessages(history.map(h => ({ role: h.role, content: h.content, id: h.id })));
        setHistoryLoaded(true);
      })
      .catch(() => setHistoryLoaded(true));
  }, []);

  useEffect(() => {
    if (historyLoaded) scrollDown();
  }, [messages, historyLoaded, scrollDown]);

  async function send(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    scrollDown();

    try {
      const { response } = await ai.chat(text, 'web');
      setMessages(prev => [...prev, { role: 'assistant', content: response, id: Date.now() + 1 }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Erro: ' + err.message, id: Date.now() + 1 }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function clearHistory() {
    if (!confirm('Limpar histórico do chat?')) return;
    await ai.clear('web');
    setMessages([]);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(e);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">🤖 IA Assistente</span>
        <button className="btn-icon danger" title="Limpar histórico" onClick={clearHistory}>🗑</button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && !loading && (
          <div className="empty-state">
            Olá! Como posso ajudar você hoje?<br />
            <span className="muted text-sm">Pergunte sobre sua agenda, tarefas, ou qualquer coisa.</span>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`chat-bubble ${msg.role}`}>
            {msg.content}
          </div>
        ))}

        {loading && (
          <div className="chat-bubble assistant typing">
            <span className="spinner" style={{ width: 12, height: 12 }} /> Pensando...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form className="chat-input-row" onSubmit={send}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem..."
          disabled={loading}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !input.trim()}
          style={{ flexShrink: 0 }}
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
