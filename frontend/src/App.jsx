import React from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, BookOpen, Bell, Settings, Cloud,
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import DailyNotes from './pages/DailyNotes';
import Reminders from './pages/Reminders';
import SettingsPage from './pages/SettingsPage';

const navItems = [
  { to: '/', label: '儀表板', icon: LayoutDashboard, end: true },
  { to: '/projects', label: '專案管理', icon: FolderKanban },
  { to: '/notes', label: '每日筆記', icon: BookOpen },
  { to: '/reminders', label: '提醒紀錄', icon: Bell },
  { to: '/settings', label: '設定', icon: Settings },
];

export default function App() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-aws-dark flex flex-col flex-shrink-0">
        <div className="px-4 py-5 flex items-center gap-2 border-b border-gray-700">
          <Cloud className="text-aws-orange w-6 h-6" />
          <div>
            <div className="text-white font-bold text-sm leading-tight">AWS 專案</div>
            <div className="text-gray-400 text-xs">追蹤系統</div>
          </div>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-aws-orange text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-gray-700">
          <p className="text-gray-500 text-xs">個人版 v1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/notes" element={<DailyNotes />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
