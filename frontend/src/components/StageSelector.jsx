import React from 'react';

const STAGES = [
  { value: 20, label: '開發中', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 40, label: '報價中', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { value: 60, label: '初步同意', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { value: 80, label: '簽約', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { value: 100, label: '開立發票', color: 'bg-green-100 text-green-700 border-green-300' },
];

export function StageBadge({ stage, size = 'sm' }) {
  const s = STAGES.find((x) => x.value === stage) || STAGES[0];
  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${s.color} ${pad}`}>
      {stage}% {s.label}
    </span>
  );
}

export function StageProgress({ stage }) {
  const pct = stage;
  const colorMap = {
    20: 'bg-blue-500',
    40: 'bg-yellow-500',
    60: 'bg-orange-500',
    80: 'bg-purple-500',
    100: 'bg-green-500',
  };
  return (
    <div className="w-full bg-gray-200 rounded-full h-1.5">
      <div
        className={`h-1.5 rounded-full transition-all ${colorMap[stage] || 'bg-gray-400'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function StageSelector({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {STAGES.map((s) => (
        <button
          key={s.value}
          type="button"
          onClick={() => onChange(s.value)}
          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
            value === s.value
              ? s.color + ' ring-2 ring-offset-1 ring-current'
              : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
          }`}
        >
          {s.value}% {s.label}
        </button>
      ))}
    </div>
  );
}

export { STAGES };
