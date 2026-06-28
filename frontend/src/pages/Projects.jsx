import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { projectsApi } from '../api';
import { StageBadge, StageProgress, STAGES } from '../components/StageSelector';
import ProjectModal from '../components/ProjectModal';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalProject, setModalProject] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [stageFilter, setStageFilter] = useState(Number(searchParams.get('stage')) || 0);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    const params = {};
    if (stageFilter) params.stage = stageFilter;
    if (search) params.search = search;
    setLoading(true);
    projectsApi.list(params).then(setProjects).finally(() => setLoading(false));
  }, [stageFilter, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const s = Number(searchParams.get('stage'));
    if (s) setStageFilter(s);
  }, [searchParams]);

  const handleSave = async (data) => {
    if (data.id) {
      await projectsApi.update(data.id, data);
    } else {
      await projectsApi.create(data);
    }
    load();
  };

  const handleStageChange = async (id, stage) => {
    await projectsApi.updateStage(id, stage);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除此專案？')) return;
    setDeleting(id);
    await projectsApi.delete(id).finally(() => setDeleting(null));
    load();
  };

  const getStageIndex = (stage) => STAGES.findIndex((s) => s.value === stage);

  const advanceStage = async (p) => {
    const idx = getStageIndex(p.stage);
    if (idx < STAGES.length - 1) {
      await handleStageChange(p.id, STAGES[idx + 1].value);
    }
  };

  const regressStage = async (p) => {
    const idx = getStageIndex(p.stage);
    if (idx > 0) {
      await handleStageChange(p.id, STAGES[idx - 1].value);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">專案管理</h1>
        <button
          onClick={() => setModalProject(null)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> 新增專案
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="搜尋客戶、專案、AWS服務..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setStageFilter(0); setSearchParams({}); }}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              stageFilter === 0
                ? 'bg-aws-dark text-white border-aws-dark'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            全部
          </button>
          {STAGES.map((s) => (
            <button
              key={s.value}
              onClick={() => { setStageFilter(s.value); setSearchParams({ stage: s.value }); }}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                stageFilter === s.value
                  ? s.color + ' font-medium'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {s.value}% {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">載入中...</div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 mb-3">尚無符合的專案</p>
            <button onClick={() => setModalProject(null)} className="btn-primary">
              <Plus className="w-4 h-4 inline mr-1" /> 新增第一個專案
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 text-gray-600 font-medium">客戶/專案</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">AWS 服務</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">階段</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">預估金額</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">下一步/截止</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.map((p) => {
                const today = new Date().toISOString().slice(0, 10);
                const isOverdue = p.deadline && p.deadline <= today && p.stage < 100;
                const idx = getStageIndex(p.stage);
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{p.client_name}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{p.project_name}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-32">
                      {p.aws_services || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StageBadge stage={p.stage} />
                      <div className="mt-1.5 w-24">
                        <StageProgress stage={p.stage} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {p.estimated_amount > 0
                        ? `${p.estimated_amount.toLocaleString()} ${p.currency}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 max-w-48">
                      {p.next_action && (
                        <p className="text-gray-700 text-xs truncate">→ {p.next_action}</p>
                      )}
                      {p.deadline && (
                        <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                          {isOverdue ? '⚠️' : '📅'} {p.deadline}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          title="降級"
                          disabled={idx === 0}
                          onClick={() => regressStage(p)}
                          className="p-1.5 rounded hover:bg-gray-200 text-gray-400 disabled:opacity-20 transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          title="升級"
                          disabled={idx === STAGES.length - 1}
                          onClick={() => advanceStage(p)}
                          className="p-1.5 rounded hover:bg-green-100 text-green-600 disabled:opacity-20 transition-colors"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          title="編輯"
                          onClick={() => setModalProject(p)}
                          className="p-1.5 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          title="刪除"
                          onClick={() => handleDelete(p.id)}
                          disabled={deleting === p.id}
                          className="p-1.5 rounded hover:bg-red-100 text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalProject !== undefined && (
        <ProjectModal
          project={modalProject}
          onSave={handleSave}
          onClose={() => setModalProject(undefined)}
        />
      )}
    </div>
  );
}
