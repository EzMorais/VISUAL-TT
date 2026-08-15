import { useState, useEffect, useRef, useCallback } from 'react';
import { terminal } from '../services/api';
import realtime from '../services/realtime';

const SESSION = 'terminal';

let lineId = 0;
const nextId = () => ++lineId;

export default function TerminalPanel() {
  const [lines, setLines] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [historyIdx, setHistoryIdx] = useState(null);
  const cmdHistory = useRef([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const streamingLineId = useRef(null);

  const scrollDown = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 30);
  }, []);

  useEffect(() => {
    terminal.history(SESSION)
      .then((rows) => {
        setLines(rows.map((r) => ({
          id: nextId(),
          type: r.role === 'user' ? 'input' : 'output',
          text: r.content,
        })));
      })
      .catch(() => {})
      .finally(scrollDown);
  }, [scrollDown]);

  // Errors captured anywhere in the app show up here as system log lines —
  // this is the "app adapts to its own errors" surface.
  useEffect(() => realtime.on('diagnostics:error', (entry) => {
    setLines((prev) => [...prev, {
      id: nextId(),
      type: 'system-error',
      text: `⚠️  [${entry.source}] ${entry.message}${entry.context ? ` (${entry.context})` : ''}`,
    }]);
    scrollDown();
  }), [scrollDown]);

  useEffect(() => realtime.on('diagnostics:diagnosed', ({ diagnosis }) => {
    setLines((prev) => [...prev, { id: nextId(), type: 'system', text: `🔧  ${diagnosis}` }]);
    scrollDown();
  }), [scrollDown]);

  function appendLine(line) {
    setLines((prev) => [...prev, { id: nextId(), ...line }]);
  }

  async function runCommand(cmd) {
    appendLine({ type: 'input', text: cmd });
    cmdHistory.current.push(cmd);
    setHistoryIdx(null);

    if (cmd.trim() === '/limpar') {
      await terminal.clearHistory(SESSION).catch(() => {});
      setLines([]);
      return;
    }

    setBusy(true);
    const outId = nextId();
    streamingLineId.current = outId;
    setLines((prev) => [...prev, { id: outId, type: 'output', text: '' }]);

    await terminal.streamCommand(cmd, SESSION, {
      onChunk: (text) => {
        setLines((prev) => prev.map((l) => (l.id === outId ? { ...l, text: l.text + text } : l)));
        scrollDown();
      },
      onDone: () => {
        setBusy(false);
        inputRef.current?.focus();
      },
      onError: (message) => {
        setLines((prev) => prev.map((l) => (l.id === outId ? { ...l, type: 'error', text: l.text || `Erro: ${message}` } : l)));
        setBusy(false);
        inputRef.current?.focus();
      },
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd || busy) return;
    setInput('');
    runCommand(cmd);
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const hist = cmdHistory.current;
      if (!hist.length) return;
      const idx = historyIdx === null ? hist.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(idx);
      setInput(hist[idx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const hist = cmdHistory.current;
      if (historyIdx === null) return;
      const idx = historyIdx + 1;
      if (idx >= hist.length) {
        setHistoryIdx(null);
        setInput('');
      } else {
        setHistoryIdx(idx);
        setInput(hist[idx]);
      }
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">▸_ Terminal</span>
        <span className="text-sm dim">conectado ao Claude</span>
      </div>

      <div className="terminal-body">
        {lines.length === 0 && (
          <div className="terminal-welcome">
            Personal OS Terminal — continue trabalhando de qualquer lugar.<br />
            Digite <span className="green mono">/ajuda</span> para ver os comandos, ou escreva livremente para conversar com o Claude.
          </div>
        )}

        {lines.map((line) => (
          <TerminalLine key={line.id} line={line} />
        ))}

        {busy && <div className="terminal-cursor-line"><span className="terminal-cursor" /></div>}

        <div ref={bottomRef} />
      </div>

      <form className="terminal-input-row" onSubmit={handleSubmit}>
        <span className="terminal-prompt">$</span>
        <input
          ref={inputRef}
          className="terminal-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="digite um comando ou uma mensagem..."
          disabled={busy}
          autoComplete="off"
          spellCheck={false}
        />
      </form>
    </div>
  );
}

function TerminalLine({ line }) {
  if (line.type === 'input') {
    return <div className="terminal-line terminal-line-input"><span className="terminal-prompt">$</span> {line.text}</div>;
  }
  if (line.type === 'system-error') {
    return <div className="terminal-line terminal-line-system-error">{line.text}</div>;
  }
  if (line.type === 'system') {
    return <div className="terminal-line terminal-line-system">{line.text}</div>;
  }
  if (line.type === 'error') {
    return <div className="terminal-line terminal-line-error">{line.text}</div>;
  }
  return <div className="terminal-line terminal-line-output">{line.text}</div>;
}
