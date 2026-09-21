import React from 'react';
import { CheckCircle2, Clock, Sparkles, Layers, ArrowRight, ShieldCheck } from 'lucide-react';
import { PhaseProgress } from '../types';
import { Translations } from '../i18n';

interface Props {
  t: Translations;
  phaseProgress: PhaseProgress;
  onPhaseClick?: (phaseNumber: number) => void;
}

export const PhaseProgressBar: React.FC<Props> = ({ t, phaseProgress, onPhaseClick }) => {
  /** A phase is active while it is the first one not yet finished. */
  const statusFor = (percent: number, previousPercent: number): 'complete' | 'active' | 'pending' => {
    if (percent >= 100) return 'complete';
    if (previousPercent >= 100 || percent > 0) return 'active';
    return 'pending';
  };

  const phases = [
    {
      num: 1,
      title: t.phase1Title,
      desc: t.phase1Desc,
      percent: phaseProgress.phase1,
      status: statusFor(phaseProgress.phase1, 100),
      color: 'from-amber-500 to-amber-600',
    },
    {
      num: 2,
      title: t.phase2Title,
      desc: t.phase2Desc,
      percent: phaseProgress.phase2,
      status: statusFor(phaseProgress.phase2, phaseProgress.phase1),
      color: 'from-blue-500 to-blue-600',
    },
    {
      num: 3,
      title: t.phase3Title,
      desc: t.phase3Desc,
      percent: phaseProgress.phase3,
      status: statusFor(phaseProgress.phase3, phaseProgress.phase2),
      color: 'from-purple-500 to-purple-600',
    },
    {
      num: 4,
      title: t.phase4Title,
      desc: t.phase4Desc,
      percent: phaseProgress.phase4,
      status: statusFor(phaseProgress.phase4, phaseProgress.phase3),
      color: 'from-emerald-500 to-emerald-600',
    },
  ];

  const overallPercent = Math.round(
    (phaseProgress.phase1 + phaseProgress.phase2 + phaseProgress.phase3 + phaseProgress.phase4) / 4
  );
  const completedPhases = phases.filter((p) => p.percent >= 100).length;

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 py-3.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs uppercase font-bold tracking-wider text-neutral-300">
              {t.phasesOverview}
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
              {overallPercent}% &bull; {completedPhases}/4 {t.completed}
            </span>
          </div>

          <p className="text-xs text-neutral-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.phaseApprovalNote}</span>
          </p>
        </div>

        {/* 4-Phase Progress Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {phases.map((phase) => (
            <div
              key={phase.num}
              className={`p-2.5 rounded-xl border transition ${
                phase.status === 'complete'
                  ? 'bg-neutral-800/70 border-emerald-500/40'
                  : phase.status === 'active'
                    ? 'bg-neutral-800/90 border-amber-500/50 ring-1 ring-amber-500/20 shadow-md shadow-amber-950/20'
                    : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      phase.status === 'complete'
                        ? 'bg-emerald-500 text-neutral-950'
                        : phase.status === 'active'
                          ? 'bg-amber-500 text-neutral-950'
                          : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                    }`}
                  >
                    {phase.num}
                  </span>
                  <span className="text-xs font-semibold text-neutral-200 truncate max-w-[170px]">
                    {phase.title.split(':')[0]}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-neutral-400">
                  {phase.percent}%
                </span>
              </div>

              {/* Progress Bar Line */}
              <div className="w-full bg-neutral-950 rounded-full h-1.5 overflow-hidden border border-neutral-800">
                <div
                  className={`h-full bg-gradient-to-r ${phase.color} transition-all duration-500 rounded-full`}
                  style={{ width: `${phase.percent}%` }}
                />
              </div>

              <p className="text-[10px] text-neutral-400 mt-1.5 truncate">
                {phase.title.split(':')[1] || phase.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
