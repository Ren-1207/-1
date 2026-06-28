const express = require('express');
const router = express.Router();
const db = require('../database');
const { sendReminder, buildReminderContent } = require('../cron/dailyReminder');

router.get('/logs', (req, res) => {
  const logs = db.prepare(
    'SELECT * FROM reminder_logs ORDER BY sent_at DESC LIMIT 30'
  ).all();
  res.json(logs);
});

router.get('/preview', (req, res) => {
  const content = buildReminderContent();
  res.json({ content });
});

router.post('/send-now', async (req, res) => {
  try {
    await sendReminder();
    res.json({ success: true, message: '提醒已發送（或記錄至系統）' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
