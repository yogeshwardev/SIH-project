import React from 'react';

export function CategoryBarChart({ categories = [] }) {
  if (!categories || categories.length === 0) {
    return <div className="text-xs text-slate-400 p-4 text-center">No category data recorded yet.</div>;
  }

  const maxVal = Math.max(...categories.map(c => c.count || 1), 1);
  const colors = ['bg-terracotta-500', 'bg-amber-500', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-rose-500'];

  return (
    <div className="space-y-3">
      {categories.map((cat, idx) => {
        const percentage = Math.round(((cat.count || 1) / maxVal) * 100);
        const colorClass = colors[idx % colors.length];
        return (
          <div key={cat.name} className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span className="truncate max-w-[200px]">{cat.name}</span>
              <span className="text-slate-500 font-bold">{cat.count} listings (₹{(cat.total_value || 0).toLocaleString('en-IN')})</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className={`h-full rounded-full ${colorClass} transition-all duration-700`}
                style={{ width: `${Math.max(8, percentage)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function RegionalDistributionList({ regions = [] }) {
  if (!regions || regions.length === 0) {
    return <div className="text-xs text-slate-400 p-4 text-center">No regional craft hubs registered yet.</div>;
  }

  const total = regions.reduce((acc, r) => acc + (r.count || 0), 0) || 1;

  return (
    <div className="divide-y divide-slate-100">
      {regions.map((r) => {
        const pct = Math.round(((r.count || 0) / total) * 100);
        return (
          <div key={r.region} className="py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-terracotta-600"></span>
              <span className="font-bold text-slate-800">{r.region}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">{r.count} artisans</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-artisan-100 text-terracotta-800">
                {pct}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
