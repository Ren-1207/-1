const express = require('express');
const router = express.Router();
const db = require('../database');

function todayDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

router.get('/', (req, res) => {
  const { month } = req.query;
  let query = 'SELECT * FROM daily_notes';
  const params = [];

  if (month) {
    query += ' WHERE note_date LIKE ?';
    params.push(`${month}%`);
  }

  query += ' ORDER BY note_date DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows.map((r) => ({ ...r, key_items: JSON.parse(r.key_items || '[]') })));
});

router.get('/today', (req, res) => {
  const date = todayDate();
  let row = db.prepare('SELECT * FROM daily_notes WHERE note_date = ?').get(date);
  if (!row) {
    db.prepare(
      'INSERT INTO daily_notes (note_date, content, key_items) VALUES (?, ?, ?)'
    ).run(date, '', '[]');
    row = db.prepare('SELECT * FROM daily_notes WHERE note_date = ?').get(date);
  }
  res.json({ ...row, key_items: JSON.parse(row.key_items || '[]') });
});

router.get('/:date', (req, res) => {
  const row = db.prepare('SELECT * FROM daily_notes WHERE note_date = ?').get(req.params.date);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ ...row, key_items: JSON.parse(row.key_items || '[]') });
});

router.put('/:date', (req, res) => {
  const { content = '', key_items = [] } = req.body;
  const { date } = req.params;

  const existing = db.prepare('SELECT id FROM daily_notes WHERE note_date = ?').get(date);
  if (existing) {
    db.prepare(`
      UPDATE daily_notes SET content = ?, key_items = ?,
        updated_at = datetime('now','localtime')
      WHERE note_date = ?
    `).run(content, JSON.stringify(key_items), date);
  } else {
    db.prepare(
      'INSERT INTO daily_notes (note_date, content, key_items) VALUES (?, ?, ?)'
    ).run(date, content, JSON.stringify(key_items));
  }

  const row = db.prepare('SELECT * FROM daily_notes WHERE note_date = ?').get(date);
  res.json({ ...row, key_items: JSON.parse(row.key_items || '[]') });
});

module.exports = router;
