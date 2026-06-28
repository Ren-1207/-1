import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Save, ChevronLeft, ChevronRight, Calendar,
} from 'lucide-react';
import { notesApi } from '../api';

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });
}

function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function DailyNotes() {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [note, setNote] = useState({ content: '', key_items: [] });
  const [newItem, setNewItem] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [recentDates, setRecentDates] = useState([]);

  const loadNote = useCallback(async (date) => {
    try {
      const data = await notesApi.get(date);
      setNote({ content: data.content || '', key_items: data.key_items || [] });
    } catch {
      setNote({ content: '', key_items: [] });
    }
  }, []);

  useEffect(() => {
    loadNote(selectedDate);
  }, [selectedDate, loadNote]);

  useEffect(() => {
    const month = selectedDate.slice(0, 7);
    notesApi.list(month).then((notes) => {
      setRecentDates(notes.map((n) => n.note_date).filter((d) => d !== selectedDate));
    });
  }, [selectedDate]);

  const save = async () => {
    setSaving(true);
    try {
      await notesApi.save(selectedDate, note);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const addItem = (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    setNote((n) => ({ ...n, key_items: [...n.key_items, newItem.trim()] }));
    setNewItem('');
  };

  const removeItem = (i) => {
    setNote((n) => ({ ...n, key_items: n.key_items.filter((_, idx) => idx !== i) }));
  };

  const changeDay = (delta) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const isToday = selectedDate === todayStr();

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">每日筆記</h1>
        {!isToday && (
          <button onClick={() => setSelectedDate(todayStr())} className="btn-secondary text-sm">
            回到今天
          </button>
        )}
      </div>

      {/* Date nav */}
      <div className="card py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => changeDay(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-aws-orange" />
            <div className="text-center">
              <div className="font-semibold text-gray-800">{formatDate(selectedDate)}</div>
              {isToday && (
                <span className="text-xs bg-aws-orange text-white px-2 py-0.5 rounded-full">
                  今天
                </span>
              )}
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm text-gray-600"
            />
          </div>

          <button
            onClick={() => changeDay(1)}
            disabled={isToday}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Key items */}
        <div className="col-span-2 card space-y-4">
          <h2 className="font-semibold text-gray-700">重點事項</h2>
          <p className="text-xs text-gray-400">這些項目會出現在每日早報提醒中</p>

          <form onSubmit={addItem} className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="新增重點事項..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
            />
            <button type="submit" className="btn-primary px-3">
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <ul className="space-y-2">
            {note.key_items.length === 0 ? (
              <li className="text-gray-400 text-sm py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
                尚無重點事項，新增一個吧！
              </li>
            ) : (
              note.key_items.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2"
                >
                  <span className="text-aws-orange font-bold text-sm">✓</span>
                  <span className="flex-1 text-sm text-gray-700">{item}</span>
                  <button
                    onClick={() => removeItem(i)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))
            )}
          </ul>

          <div>
            <label className="label">備忘錄（自由撰寫）</label>
            <textarea
              className="input h-40 resize-none"
              placeholder="今天的筆記、想法、會議紀錄..."
              value={note.content}
              onChange={(e) => setNote((n) => ({ ...n, content: e.target.value }))}
            />
          </div>

          <button
            onClick={save}
            disabled={saving}
            className={`btn-primary flex items-center gap-2 ${saved ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            <Save className="w-4 h-4" />
            {saving ? '儲存中...' : saved ? '已儲存！' : '儲存筆記'}
          </button>
        </div>

        {/* Recent notes sidebar */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-700">本月筆記</h2>
          {recentDates.length === 0 ? (
            <p className="text-gray-400 text-sm">本月無其他筆記</p>
          ) : (
            <ul className="space-y-1">
              {recentDates.map((d) => (
                <li key={d}>
                  <button
                    onClick={() => setSelectedDate(d)}
                    className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {d}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
