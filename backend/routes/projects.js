const express = require('express');
const router = express.Router();
const db = require('../database');

const STAGES = [20, 40, 60, 80, 100];
const STAGE_LABELS = {
  20: '開發中',
  40: '報價中',
  60: '初步同意',
  80: '簽約',
  100: '開立發票',
};

router.get('/', (req, res) => {
  const { stage, search } = req.query;
  let query = 'SELECT * FROM projects';
  const params = [];

  const conditions = [];
  if (stage) {
    conditions.push('stage = ?');
    params.push(Number(stage));
  }
  if (search) {
    conditions.push('(client_name LIKE ? OR project_name LIKE ? OR aws_services LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY stage ASC, updated_at DESC';

  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

router.get('/stats', (req, res) => {
  const counts = db.prepare(
    'SELECT stage, COUNT(*) as count FROM projects GROUP BY stage'
  ).all();

  const amounts = db.prepare(
    'SELECT stage, SUM(estimated_amount) as total FROM projects GROUP BY stage'
  ).all();

  const stats = STAGES.map((s) => ({
    stage: s,
    label: STAGE_LABELS[s],
    count: counts.find((c) => c.stage === s)?.count || 0,
    total: amounts.find((a) => a.stage === s)?.total || 0,
  }));

  res.json(stats);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  const {
    client_name, project_name, aws_services = '', stage = 20,
    estimated_amount = 0, currency = 'TWD', next_action = '',
    deadline = '', notes = '',
  } = req.body;

  if (!client_name || !project_name) {
    return res.status(400).json({ error: '客戶名稱和專案名稱為必填' });
  }
  if (!STAGES.includes(Number(stage))) {
    return res.status(400).json({ error: '無效的階段' });
  }

  const result = db.prepare(`
    INSERT INTO projects (client_name, project_name, aws_services, stage,
      estimated_amount, currency, next_action, deadline, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(client_name, project_name, aws_services, Number(stage),
    Number(estimated_amount), currency, next_action, deadline, notes);

  const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const {
    client_name = existing.client_name,
    project_name = existing.project_name,
    aws_services = existing.aws_services,
    stage = existing.stage,
    estimated_amount = existing.estimated_amount,
    currency = existing.currency,
    next_action = existing.next_action,
    deadline = existing.deadline,
    notes = existing.notes,
  } = req.body;

  if (!STAGES.includes(Number(stage))) {
    return res.status(400).json({ error: '無效的階段' });
  }

  db.prepare(`
    UPDATE projects SET
      client_name = ?, project_name = ?, aws_services = ?, stage = ?,
      estimated_amount = ?, currency = ?, next_action = ?, deadline = ?,
      notes = ?, updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(client_name, project_name, aws_services, Number(stage),
    Number(estimated_amount), currency, next_action, deadline, notes,
    req.params.id);

  res.json(db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id));
});

router.patch('/:id/stage', (req, res) => {
  const { stage } = req.body;
  if (!STAGES.includes(Number(stage))) {
    return res.status(400).json({ error: '無效的階段' });
  }
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  db.prepare(
    "UPDATE projects SET stage = ?, updated_at = datetime('now','localtime') WHERE id = ?"
  ).run(Number(stage), req.params.id);

  res.json(db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
