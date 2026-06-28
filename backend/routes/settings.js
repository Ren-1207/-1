const express = require('express');
const router = express.Router();
const db = require('../database');
const nodemailer = require('nodemailer');

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  rows.forEach((r) => { settings[r.key] = r.value; });
  // never expose password in plaintext
  if (settings.email_smtp_pass) settings.email_smtp_pass = '••••••';
  res.json(settings);
});

router.put('/', (req, res) => {
  const allowed = [
    'email_enabled', 'email_smtp_host', 'email_smtp_port',
    'email_smtp_user', 'email_smtp_pass', 'email_to',
    'reminder_time', 'timezone',
  ];

  const upsert = db.prepare(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)'
  );

  const update = db.transaction((data) => {
    for (const key of allowed) {
      if (key in data) {
        if (key === 'email_smtp_pass' && data[key] === '••••••') continue;
        upsert.run(key, String(data[key]));
      }
    }
  });

  update(req.body);
  res.json({ success: true });
});

router.post('/test-email', async (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const s = {};
  rows.forEach((r) => { s[r.key] = r.value; });

  if (!s.email_smtp_host || !s.email_smtp_user || !s.email_smtp_pass || !s.email_to) {
    return res.status(400).json({ error: '請先完整設定Email資訊' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: s.email_smtp_host,
      port: Number(s.email_smtp_port) || 587,
      secure: Number(s.email_smtp_port) === 465,
      auth: { user: s.email_smtp_user, pass: s.email_smtp_pass },
    });

    await transporter.sendMail({
      from: s.email_smtp_user,
      to: s.email_to,
      subject: '【AWS專案追蹤】測試Email',
      text: '測試成功！每日提醒功能已正確設定。',
    });

    res.json({ success: true, message: '測試Email已發送' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
