import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import StageSelector from './StageSelector';

const AWS_SERVICES = [
  'EC2', 'S3', 'RDS', 'Lambda', 'CloudFront', 'VPC', 'EKS', 'ECS',
  'DynamoDB', 'SQS', 'SNS', 'API Gateway', 'CloudWatch', 'IAM',
  'Route 53', 'ElastiCache', 'Redshift', 'SageMaker', 'Bedrock',
];

const empty = {
  client_name: '',
  project_name: '',
  aws_services: '',
  stage: 20,
  estimated_amount: '',
  currency: 'TWD',
  next_action: '',
  deadline: '',
  notes: '',
};

export default function ProjectModal({ project, onSave, onClose }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (project) {
      setForm({
        ...empty,
        ...project,
        estimated_amount: project.estimated_amount || '',
      });
    } else {
      setForm(empty);
    }
    setErrors({});
  }, [project]);

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.client_name.trim()) e.client_name = '必填';
    if (!form.project_name.trim()) e.project_name = '必填';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }

    setSaving(true);
    try {
      await onSave({
        ...form,
        estimated_amount: Number(form.estimated_amount) || 0,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!project?.id;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="font-bold text-lg text-gray-800">
            {isEdit ? '編輯專案' : '新增專案'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">客戶名稱 <span className="text-red-500">*</span></label>
              <input
                className={`input ${errors.client_name ? 'border-red-400' : ''}`}
                value={form.client_name}
                onChange={(e) => set('client_name', e.target.value)}
                placeholder="e.g. 台積電"
              />
              {errors.client_name && <p className="text-red-500 text-xs mt-1">{errors.client_name}</p>}
            </div>
            <div>
              <label className="label">專案名稱 <span className="text-red-500">*</span></label>
              <input
                className={`input ${errors.project_name ? 'border-red-400' : ''}`}
                value={form.project_name}
                onChange={(e) => set('project_name', e.target.value)}
                placeholder="e.g. 雲端遷移專案"
              />
              {errors.project_name && <p className="text-red-500 text-xs mt-1">{errors.project_name}</p>}
            </div>
          </div>

          <div>
            <label className="label">AWS 服務</label>
            <input
              className="input"
              value={form.aws_services}
              onChange={(e) => set('aws_services', e.target.value)}
              placeholder="e.g. EC2, S3, RDS"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {AWS_SERVICES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    const current = form.aws_services.split(',').map((x) => x.trim()).filter(Boolean);
                    if (!current.includes(s)) {
                      set('aws_services', [...current, s].join(', '));
                    }
                  }}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-0.5 rounded"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">專案階段</label>
            <StageSelector value={form.stage} onChange={(v) => set('stage', v)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">預估金額</label>
              <div className="flex gap-2">
                <select
                  className="border border-gray-300 rounded-lg px-2 py-2 text-sm"
                  value={form.currency}
                  onChange={(e) => set('currency', e.target.value)}
                >
                  <option>TWD</option>
                  <option>USD</option>
                </select>
                <input
                  type="number"
                  className="input"
                  value={form.estimated_amount}
                  onChange={(e) => set('estimated_amount', e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="label">截止日期</label>
              <input
                type="date"
                className="input"
                value={form.deadline}
                onChange={(e) => set('deadline', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">下一步行動</label>
            <input
              className="input"
              value={form.next_action}
              onChange={(e) => set('next_action', e.target.value)}
              placeholder="e.g. 準備技術提案，安排下週簡報"
            />
          </div>

          <div>
            <label className="label">備註</label>
            <textarea
              className="input h-24 resize-none"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="其他注意事項..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? '儲存中...' : isEdit ? '更新專案' : '新增專案'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
