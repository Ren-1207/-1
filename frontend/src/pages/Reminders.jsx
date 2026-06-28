import React, { useEffect, useState } from 'react';
import { Bell, Play, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { remindersApi } from '../api';

export default function Reminders() {
  const [logs, setLogs] = useState([]);
  const [preview, setPreview] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    remindersApi.logs().then(setLogs);
  };

  const handlePreview = async () => {
    const data = await remindersApi.preview();
    setPreview(data.content);
    setShowPreview(true);
  };

  const handleSendNow = async () => {
    setSending(true);
    setMessage(null);
    try {
      const data = await remindersApi.sendNow();
      setMessage({ type: 'success', text: data.message });
      loadLogs();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || '發送失敗' });
    } finally {
      setSending(false);
    }
  };

  const statusIcon = (status) => {
    if (status === 'email_sent') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'email_failed') return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const statusLabel = (status) => {
    const map = {
      sent: '已記錄',
      email_sent: 'Email已發送',
      email_failed: 'Email失敗',
      pending: '待發送',
    };
    return map[status] || status;
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">提醒紀錄</h1>
        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            className="btn-secondary flex items-center gap-2"
          >
            <Eye className="w-4 h-4" /> 預覽今日早報
          </button>
          <button
            onClick={handleSendNow}
            disabled={sending}
            className="btn-primary flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {sending ? '發送中...' : '立即發送'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <div className="card">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-5 h-5 text-aws-orange" />
          <h2 className="font-semibold text-gray-700">每日提醒設定</h2>
        </div>
        <p className="text-sm text-gray-500">
          每天早上9:00自動執行，將今日重點專案與筆記整理成早報。
          若有設定Email，會寄送到您的信箱；否則僅記錄在系統中。
        </p>
        <p className="text-xs text-gray-400 mt-2">
          可在「設定」頁面調整提醒時間和Email設定。
        </p>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold">今日早報預覽</h2>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="p-6">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-lg">
                {preview}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-700">發送紀錄</h2>
        </div>
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            尚無提醒紀錄
          </div>
        ) : (
          <div className="divide-y">
            {logs.map((log) => (
              <div key={log.id} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {statusIcon(log.status)}
                    <span className="text-sm font-medium text-gray-700">
                      {statusLabel(log.status)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{log.sent_at}</span>
                </div>
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-700">查看內容</summary>
                  <pre className="mt-2 bg-gray-50 p-3 rounded text-xs whitespace-pre-wrap font-mono overflow-x-auto">
                    {log.content}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
