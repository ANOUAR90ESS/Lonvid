import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DollarSign, PieChart as PieIcon, TrendingUp, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Edit3, Check } from 'lucide-react';
import { Project } from '../types';
import { Translations } from '../i18n';

interface Props {
  t: Translations;
  project: Project;
  onUpdateBudgetLimit?: (newLimit: number) => void;
}

export const DashboardWidget: React.FC<Props> = ({
  t,
  project,
  onUpdateBudgetLimit,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [customBudgetInput, setCustomBudgetInput] = useState(project.budget_limit.toString());

  const budget = Math.max(project.budget_limit || 35, 1);
  const totalSpent = Number(project.spent_cost || 0);

  // Compute breakdown estimates based on project state
  // 1. LLM Generation: $0.03 for Bible + $0.02 for Script scenes
  const llmCost = 0.05;
  // 2. Voice: approx $0.002 per second of voiced audio
  const voicedSeconds = (project.scenes || []).reduce(
    (acc, s) => acc + (s.real_audio_duration_s || 0),
    0
  );
  const voiceCost = Math.round(voicedSeconds * 0.0018 * 100) / 100 || 0.07;
  // 3. Keyframe Estimate (Phase 2 reserve)
  const keyframesReserve = project.pilot_mode ? 1.2 : 4.5;
  // 4. Video Generation Estimate (Veo compute reserve)
  const videoReserve = project.pilot_mode ? 4.8 : 16.0;

  const actualSpent = Math.max(totalSpent, llmCost + voiceCost);
  const remaining = Math.max(budget - actualSpent, 0);
  const remainingPercent = Math.max(0, Math.min(100, Math.round((remaining / budget) * 100)));
  const spentPercent = 100 - remainingPercent;

  const chartData = [
    { name: 'LLM & Script', value: Number(llmCost.toFixed(2)), color: '#38bdf8' },
    { name: 'Voice Synthesis', value: Number(voiceCost.toFixed(2)), color: '#f59e0b' },
    { name: 'Keyframe Reserve', value: Number(keyframesReserve.toFixed(2)), color: '#a855f7' },
    { name: 'Video Gen (Veo)', value: Number(videoReserve.toFixed(2)), color: '#ec4899' },
    { name: 'Remaining Budget', value: Number(Math.max(0, remaining - (keyframesReserve + videoReserve)).toFixed(2)) || Number(remaining.toFixed(2)), color: '#10b981' },
  ];

  const handleSaveBudget = () => {
    const val = parseFloat(customBudgetInput);
    if (!isNaN(val) && val > 0 && onUpdateBudgetLimit) {
      onUpdateBudgetLimit(val);
    }
    setIsEditingBudget(false);
  };

  const isWarning = remainingPercent < 20;

  return (
    <div
      id="project-dashboard-widget"
      className="bg-neutral-900/95 border border-neutral-800/90 rounded-2xl p-4 sm:p-5 shadow-xl shadow-black/40 backdrop-blur-md transition-all duration-200"
    >
      {/* Top Summary Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left Stats Header */}
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-inner ${
            isWarning 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            <DollarSign className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <PieIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Project Budget & Compute</span>
              </span>

              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                isWarning
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                {isWarning ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                <span>{remainingPercent}% Remaining</span>
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                ${actualSpent.toFixed(2)}
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                / ${budget.toFixed(2)} total budget
              </span>
            </div>
          </div>
        </div>

        {/* Center Donut & Mini Sparkbar */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          {/* Donut Chart */}
          <div className="w-20 h-20 sm:w-22 sm:h-22 relative shrink-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Cost']}
                  contentStyle={{
                    backgroundColor: '#171717',
                    border: '1px solid #383838',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={24}
                  outerRadius={36}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="#0a0a0a"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] font-bold font-mono text-emerald-400">
                ${remaining.toFixed(1)}
              </span>
              <span className="text-[8px] uppercase tracking-tighter text-neutral-400">
                avail
              </span>
            </div>
          </div>

          {/* Quick Details & Controls */}
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              {isEditingBudget ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-neutral-400 font-mono">$</span>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    step="5"
                    value={customBudgetInput}
                    onChange={(e) => setCustomBudgetInput(e.target.value)}
                    className="w-16 bg-neutral-950 border border-amber-500 rounded px-1.5 py-0.5 text-xs text-white font-mono focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveBudget}
                    className="p-1 rounded bg-amber-500 text-neutral-950 hover:bg-amber-400"
                    title="Save Budget"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setCustomBudgetInput(budget.toString());
                    setIsEditingBudget(true);
                  }}
                  className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-amber-400 transition"
                  title="Adjust Budget"
                >
                  <Edit3 className="w-3 h-3" />
                  <span className="underline decoration-dotted underline-offset-2">Limit: ${budget}</span>
                </button>
              )}
            </div>

            <button
              id="btn-toggle-cost-breakdown"
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
            >
              <span>{isExpanded ? 'Hide Breakdown' : 'View Breakdown'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Line Bar */}
      <div className="mt-3 w-full bg-neutral-950 rounded-full h-2 overflow-hidden border border-neutral-800 flex">
        <div
          className="bg-sky-500 h-full transition-all duration-500"
          style={{ width: `${Math.min(100, (llmCost / budget) * 100)}%` }}
          title={`LLM Scripting: $${llmCost}`}
        />
        <div
          className="bg-amber-500 h-full transition-all duration-500"
          style={{ width: `${Math.min(100, (voiceCost / budget) * 100)}%` }}
          title={`Voice Synthesis: $${voiceCost}`}
        />
        <div
          className="bg-purple-500 h-full transition-all duration-500"
          style={{ width: `${Math.min(100, (keyframesReserve / budget) * 100)}%` }}
          title={`Keyframes Reserve: $${keyframesReserve}`}
        />
        <div
          className="bg-pink-500 h-full transition-all duration-500"
          style={{ width: `${Math.min(100, (videoReserve / budget) * 100)}%` }}
          title={`Video Gen Reserve: $${videoReserve}`}
        />
        <div
          className="bg-emerald-500/80 h-full transition-all duration-500"
          style={{ width: `${Math.max(0, remainingPercent)}%` }}
          title={`Remaining Available: $${remaining.toFixed(2)}`}
        />
      </div>

      {/* Collapsible Detailed Breakdown Grid */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-neutral-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 animate-in fade-in duration-200">
          <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              <span className="text-[11px] font-medium text-neutral-400">LLM & Bible</span>
            </div>
            <span className="text-sm font-bold font-mono text-neutral-100">${llmCost.toFixed(2)}</span>
            <span className="block text-[10px] text-neutral-400 mt-0.5">Stage 1 & 2 compute</span>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-[11px] font-medium text-neutral-400">TTS Audio</span>
            </div>
            <span className="text-sm font-bold font-mono text-neutral-100">${voiceCost.toFixed(2)}</span>
            <span className="block text-[10px] text-neutral-400 mt-0.5">{voicedSeconds.toFixed(1)}s generated</span>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              <span className="text-[11px] font-medium text-neutral-400">Keyframe Reserve</span>
            </div>
            <span className="text-sm font-bold font-mono text-neutral-100">${keyframesReserve.toFixed(2)}</span>
            <span className="block text-[10px] text-neutral-400 mt-0.5">Phase 2 allocations</span>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-pink-400"></span>
              <span className="text-[11px] font-medium text-neutral-400">Video Compute</span>
            </div>
            <span className="text-sm font-bold font-mono text-neutral-100">${videoReserve.toFixed(2)}</span>
            <span className="block text-[10px] text-neutral-400 mt-0.5">Veo I2V allocation</span>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-emerald-500/30 bg-emerald-950/10 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-[11px] font-semibold text-emerald-400">Free Balance</span>
            </div>
            <span className="text-sm font-bold font-mono text-emerald-300">${remaining.toFixed(2)}</span>
            <span className="block text-[10px] text-emerald-400/80 mt-0.5">Uncommitted compute</span>
          </div>
        </div>
      )}
    </div>
  );
};
