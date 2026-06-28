import React, { useEffect, useState } from 'react';
import { Save, Mail, Clock, TestTube } from 'lucide-react';
import { settingsApi, remindersApi } from '../api';

export default function SettingsPage() {
  const [form, setForm] = useState({
    email_enabled: 'false',
    email_smtp_host: '',
    email_smtp_port: '587',
    email_smtp_user: '',
    email_smtp_pass: '',
    email_to: '',
    reminder_time: '09:00',
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsApi.get().then((data) => {
      setForm((f) => ({ ...f, ...data }));
    }).finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await settingsApi.save(form);
      setMessage({ type: 'success', text: '設定已儲存' });
    } catch (err) {
      setMessage({ type: 'error', text: '儲存失敗：' + (err.response?.data?.error || err.message) });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    setMessage(null);
    try {
      // Save first
      await settingsApi.save(form);
      const data = await settingsApi.testEmail();
      setMessage({ type: 'success', text: data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || '測試失敗' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-400">載入中...</div>;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800">設定</h1>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Reminder time */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-aws-orange" />
            <h2 className="font-semibold text-gray-700">提醒時間</h2>
          </div>
          <div>
            <label className="label">每日提醒時間</label>
            <input
              type="time"
              className="input w-40"
              value={form.reminder_time}
              onChange={(e) => set('reminder_time', e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">系統每天此時間自動執行提醒（預設 09:00）</p>
          </div>
        </div>

        {/* Email settings */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-aws-orange" />
            <h2 className="font-semibold text-gray-700">Email 提醒</h2>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-orange-500"
                checked={form.email_enabled === 'true'}
                onChange={(e) => set('email_enabled', e.target.checked ? 'true' : 'false')}
              />
              <span className="text-sm font-medium text-gray-700">啟用 Email 提醒</span>
            </label>
          </div>

          <div className={form.email_enabled !== 'true' ? 'opacity-50 pointer-events-none' : ''}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">SMTP Host</label>
                <input
                  className="input"
                  placeholder="smtp.gmail.com"
                  value={form.email_smtp_host}
                  onChange={(e) => set('email_smtp_host', e.target.value)}
                />
              </div>
              <div>
                <label className="label">SMTP Port</label>
                <input
                  className="input"
                  placeholder="587"
                  value={form.email_smtp_port}
                  onChange={(e) => set('email_smtp_port', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="label">SMTP 帳號</label>
                <input
                  className="input"
                  type="email"
                  placeholder="your@gmail.com"
                  value={form.email_smtp_user}
                  onChange={(e) => set('email_smtp_user', e.target.value)}
                />
              </div>
              <div>
                <label className="label">SMTP 密碼/應用程式密碼</label>
                <input
                  className="input"
                  type="password"
                  placeholder="留空表示不修改"
                  value={form.email_smtp_pass === '••••••' ? '' : form.email_smtp_pass}
                  onChange={(e) => set('email_smtp_pass', e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="label">收件人 Email</label>
              <input
                className="input"
                type="email"
                placeholder="receive@example.com"
                value={form.email_to}
                onChange={(e) => set('email_to', e.target.value)}
              />
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
              <strong>Gmail 設定：</strong><br />
              Host: smtp.gmail.com | Port: 587<br />
              密碼請使用「應用程式密碼」（需先開啟兩步驟驗證）
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? '儲存中...' : '儲存設定'}
          </button>
          {form.email_enabled === 'true' && (
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={testing}
              className="btn-secondary flex items-center gap-2"
            >
              <TestTube className="w-4 h-4" />
              {testing ? '測試中...' : '發送測試Email'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
