const router = require('express').Router();
const { getDB } = require('../db/database');
const { chatStream } = require('../services/ai');
const memory = require('../services/memory');

const SESSION = 'terminal';

router.get('/history', (req, res) => {
  const sessionId = req.query.sessionId || SESSION;
  const rows = getDB().prepare(
    `SELECT id, role, content, created_at FROM chat_history WHERE session_id = ? ORDER BY created_at ASC LIMIT 200`
  ).all(sessionId);
  res.json(rows);
});

router.delete('/history', (req, res) => {
  const sessionId = req.query.sessionId || SESSION;
  getDB().prepare(`DELETE FROM chat_history WHERE session_id = ?`).run(sessionId);
  res.json({ success: true });
});

function sseWrite(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// Slash commands handled locally — no round-trip to Claude needed.
async function handleSlashCommand(cmd) {
  const [name, ...rest] = cmd.slice(1).trim().split(/\s+/);
  const arg = rest.join(' ');

  if (name === 'lembrar') {
    if (!arg) return 'Uso: /lembrar <fato sobre você>';
    memory.addFact(arg);
    return `✓ Guardado na memória: "${arg}"`;
  }

  if (name === 'esquecer') {
    const id = parseInt(arg, 10);
    if (!id) return 'Uso: /esquecer <id> (veja os ids com /memoria)';
    memory.removeFact(id);
    return `✓ Removido da memória (#${id})`;
  }

  if (name === 'memoria') {
    const facts = memory.listFacts();
    if (!facts.length) return 'Memória vazia. Use /lembrar <fato> para guardar algo.';
    return facts.map((f) => `#${f.id} [${f.category}] ${f.fact}`).join('\n');
  }

  if (name === 'ajuda' || name === 'help') {
    return [
      'Comandos disponíveis:',
      '  /lembrar <fato>   guarda um fato sobre você (usado em todas as respostas da IA)',
      '  /memoria          lista o que foi guardado',
      '  /esquecer <id>    remove um fato da memória',
      '  /limpar           limpa o histórico deste terminal',
      '  /ajuda            esta mensagem',
      '',
      'Qualquer outra coisa é enviada direto para o Claude — pode continuar',
      'uma conversa técnica, pedir ajuda com código, ou só pensar em voz alta.',
    ].join('\n');
  }

  return `Comando desconhecido: /${name}. Digite /ajuda para ver os comandos.`;
}

// POST /api/terminal/stream — Server-Sent Events. The body carries the
// command as JSON, the reply streams back token by token so the terminal
// feels live instead of waiting for one big blob.
router.post('/stream', async (req, res) => {
  const { command, sessionId = SESSION } = req.body;
  if (!command || !command.trim()) {
    return res.status(400).json({ error: 'command é obrigatório' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const trimmed = command.trim();

  try {
    if (trimmed.startsWith('/')) {
      const reply = await handleSlashCommand(trimmed);
      sseWrite(res, 'chunk', { text: reply });
      sseWrite(res, 'done', {});
      return res.end();
    }

    for await (const chunk of chatStream(trimmed, sessionId)) {
      sseWrite(res, 'chunk', { text: chunk });
    }
    sseWrite(res, 'done', {});
    res.end();
  } catch (err) {
    sseWrite(res, 'error', { message: err.message });
    res.end();
  }
});

module.exports = router;
