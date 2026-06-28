const cron = require('node-cron');
const nodemailer = require('nodemailer');
const db = require('../database');

const STAGE_LABELS = {
  20: '🔵 開發中',
  40: '🟡 報價中',
  60: '🟠 初步同意',
  80: '🟣 簽約',
  100: '🟢 開立發票',
};

function todayDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildReminderContent() {
  const date = todayDate();

  // projects with deadline today or overdue, plus all active
  const projects = db.prepare(`
    SELECT * FROM projects
    WHERE stage < 100
    ORDER BY
      CASE
        WHEN deadline != '' AND deadline <= ? THEN 0
        ELSE 1
      END,
      stage DESC,
      updated_at DESC
    LIMIT 20
  `).all(date);

  const todayNote = db.prepare(
    'SELECT * FROM daily_notes WHERE note_date = ?'
  ).get(date);

  const keyItems = todayNote ? JSON.parse(todayNote.key_items || '[]') : [];
  const noteContent = todayNote?.content || '';

  // Build text
  const lines = [
    `📋 AWS專案追蹤 — 每日早報 ${date}`,
    '═'.repeat(50),
    '',
    '【今日重點專案】',
  ];

  if (projects.length === 0) {
    lines.push('  目前無進行中專案');
  } else {
    projects.forEach((p) => {
      const urgentFlag = p.deadline && p.deadline <= date ? ' ⚠️ 已逾期！' : '';
      const deadlineStr = p.deadline ? ` | 截止：${p.deadline}${urgentFlag}` : '';
      lines.push(`  ${STAGE_LABELS[p.stage]} | ${p.client_name} — ${p.project_name}${deadlineStr}`);
      if (p.next_action) lines.push(`    → 下一步：${p.next_action}`);
    });
  }

  lines.push('', '【今日筆記重點】');

  if (keyItems.length === 0 && !noteContent) {
    lines.push('  今日尚無筆記，記得在系統中新增！');
  } else {
    keyItems.forEach((item) => lines.push(`  ✅ ${item}`));
    if (noteContent) {
      lines.push('', '  備忘錄：');
      noteContent.split('\n').forEach((l) => lines.push(`  ${l}`));
    }
  }

  lines.push('', '═'.repeat(50));
  lines.push('請記得更新各專案狀態！');

  return lines.join('\n');
}

async function sendReminder() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const s = {};
  rows.forEach((r) => { s[r.key] = r.value; });

  const content = buildReminderContent();

  // Log to DB
  const logResult = db.prepare(
    'INSERT INTO reminder_logs (status, content) VALUES (?, ?)'
  ).run('sent', content);

  if (s.email_enabled !== 'true') {
    console.log('[Reminder] Email disabled, logged to DB only.');
    console.log(content);
    return;
  }

  if (!s.email_smtp_host || !s.email_smtp_user || !s.email_smtp_pass || !s.email_to) {
    console.log('[Reminder] Email not configured, skipping.');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: s.email_smtp_host,
      port: Number(s.email_smtp_port) || 587,
      secure: Number(s.email_smtp_port) === 465,
      auth: { user: s.email_smtp_user, pass: s.email_smtp_pass },
    });

    await transporter.sendMail({
      from: `AWS專案追蹤 <${s.email_smtp_user}>`,
      to: s.email_to,
      subject: `📋 AWS專案早報 — ${todayDate()}`,
      text: content,
      html: content.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;'),
    });

    db.prepare('UPDATE reminder_logs SET status = ? WHERE id = ?')
      .run('email_sent', logResult.lastInsertRowid);

    console.log('[Reminder] Email sent successfully.');
  } catch (err) {
    console.error('[Reminder] Email failed:', err.message);
    db.prepare('UPDATE reminder_logs SET status = ? WHERE id = ?')
      .run('email_failed', logResult.lastInsertRowid);
  }
}

function getReminderTime() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'reminder_time'").get();
  const time = row?.value || '09:00';
  const [hour, minute] = time.split(':');
  return { hour, minute };
}

function start() {
  // Check every minute, send when time matches
  cron.schedule('* * * * *', () => {
    const now = new Date();
    const { hour, minute } = getReminderTime();
    if (
      String(now.getHours()).padStart(2, '0') === hour &&
      String(now.getMinutes()).padStart(2, '0') === minute
    ) {
      console.log('[Reminder] Triggering daily reminder...');
      sendReminder();
    }
  });

  console.log('[Reminder] Daily reminder cron started.');
}

module.exports = { start, sendReminder, buildReminderContent };
