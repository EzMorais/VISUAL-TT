const { getDB } = require('../db/database');

function addFact(fact, category = 'geral') {
  const db = getDB();
  const r = db.prepare(`INSERT INTO memory (fact, category) VALUES (?, ?)`).run(fact.trim(), category);
  return db.prepare(`SELECT * FROM memory WHERE id = ?`).get(r.lastInsertRowid);
}

function listFacts() {
  return getDB().prepare(`SELECT * FROM memory ORDER BY created_at DESC`).all();
}

function removeFact(id) {
  getDB().prepare(`DELETE FROM memory WHERE id = ?`).run(id);
}

// Rendered into every Claude system prompt so the assistant carries the same
// understanding of the user across chat, terminal, voice and the briefing —
// this is what makes it feel like it "knows" the person instead of starting
// from zero on every screen.
function renderForPrompt(limit = 40) {
  const facts = getDB().prepare(`SELECT fact, category FROM memory ORDER BY created_at DESC LIMIT ?`).all(limit);
  if (!facts.length) return '';
  const byCategory = {};
  for (const f of facts) {
    (byCategory[f.category] ??= []).push(f.fact);
  }
  const lines = Object.entries(byCategory)
    .map(([cat, items]) => `[${cat}]\n` + items.map((i) => `- ${i}`).join('\n'))
    .join('\n');
  return `\n\nO QUE VOCÊ SABE SOBRE ESTE USUÁRIO (use isso para personalizar suas respostas, sem precisar perguntar de novo):\n${lines}`;
}

module.exports = { addFact, listFacts, removeFact, renderForPrompt };
