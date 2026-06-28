import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Users, DollarSign, AlertCircle, ArrowRight, Plus,
} from 'lucide-react';
import { projectsApi, notesApi } from '../api';
import { StageBadge, StageProgress, STAGES } from '../components/StageSelector';

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function Dashboard() {
  const [stats, setStats] = useState([]);
  const [projects, setProjects] = useState([]);
  const [todayNote, setTodayNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      projectsApi.stats(),
      projectsApi.list(),
      notesApi.today(),
    ]).then(([s, p, n]) => {
      setStats(s);
      setProjects(p);
      setTodayNote(n);
    }).finally(() => setLoading(false));
  }, []);

  const todayStr = today();
  const urgentProjects = projects.filter(
    (p) => p.deadline && p.deadline <= todayStr && p.stage < 100
  );
  const activeProjects = projects.filter((p) => p.stage < 100);

  const totalPipeline = stats.reduce((sum, s) => sum + (s.total || 0), 0);
  const closedAmount = stats.find((s) => s.stage === 100)?.total || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">載入中...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">儀表板</h1>
          <p className="text-gray-500 text-sm">{todayStr} 早安！今天也要加油！</p>
        </div>
        <button
          onClick={() => navigate('/projects')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> 新增專案
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">進行中專案</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-800">{activeProjects.length}</div>
          <div className="text-xs text-gray-400 mt-1">共 {projects.length} 個專案</div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">總 Pipeline</span>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {totalPipeline.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400 mt-1">TWD</div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">已開發票</span>
            <DollarSign className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            {closedAmount.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400 mt-1">TWD</div>
        </div>

        <div className={`card ${urgentProjects.length > 0 ? 'border-red-200 bg-red-50' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">逾期/今日到期</span>
            <AlertCircle className={`w-4 h-4 ${urgentProjects.length > 0 ? 'text-red-500' : 'text-gray-300'}`} />
          </div>
          <div className={`text-2xl font-bold ${urgentProjects.length > 0 ? 'text-red-600' : 'text-gray-800'}`}>
            {urgentProjects.length}
          </div>
          <div className="text-xs text-gray-400 mt-1">需要立即關注</div>
        </div>
      </div>

      {/* Stage funnel */}
      <div className="card">
        <h2 className="font-semibold text-gray-700 mb-4">銷售漏斗</h2>
        <div className="space-y-3">
          {stats.map((s) => (
            <div
              key={s.stage}
              className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
              onClick={() => navigate(`/projects?stage=${s.stage}`)}
            >
              <StageBadge stage={s.stage} />
              <div className="flex-1">
                <StageProgress stage={s.stage} />
              </div>
              <div className="text-sm font-medium text-gray-700 w-8 text-right">
                {s.count}
              </div>
              <div className="text-sm text-gray-400 w-28 text-right">
                {s.total > 0 ? s.total.toLocaleString() + ' TWD' : '—'}
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Urgent / upcoming */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">需要關注</h2>
            <button
              onClick={() => navigate('/projects')}
              className="text-xs text-aws-orange hover:underline"
            >
              全部專案 →
            </button>
          </div>
          {urgentProjects.length === 0 && activeProjects.length === 0 && (
            <p className="text-gray-400 text-sm">目前無進行中專案</p>
          )}
          <div className="space-y-3">
            {(urgentProjects.length > 0 ? urgentProjects : activeProjects.slice(0, 5)).map((p) => {
              const isOverdue = p.deadline && p.deadline <= todayStr;
              return (
                <div key={p.id} className="flex items-start gap-3">
                  <StageBadge stage={p.stage} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {p.client_name} — {p.project_name}
                    </p>
                    {p.next_action && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">→ {p.next_action}</p>
                    )}
                    {p.deadline && (
                      <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                        {isOverdue ? '⚠️ 逾期：' : '截止：'}{p.deadline}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's note */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">今日筆記</h2>
            <button
              onClick={() => navigate('/notes')}
              className="text-xs text-aws-orange hover:underline"
            >
              編輯 →
            </button>
          </div>
          {todayNote && (
            <>
              {todayNote.key_items?.length > 0 && (
                <ul className="space-y-1.5 mb-3">
                  {todayNote.key_items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-aws-orange mt-0.5">✓</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {todayNote.content && (
                <p className="text-sm text-gray-500 whitespace-pre-line border-t pt-2">
                  {todayNote.content}
                </p>
              )}
              {!todayNote.key_items?.length && !todayNote.content && (
                <button
                  onClick={() => navigate('/notes')}
                  className="text-sm text-gray-400 hover:text-aws-orange"
                >
                  + 點此新增今日筆記
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
