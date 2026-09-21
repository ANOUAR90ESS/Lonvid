import React from 'react';
import { ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2, Wrench, User, MapPin, Palette } from 'lucide-react';
import { QAReport } from '../types';
import { Translations } from '../i18n';
import { EmptyState, ModuleHeader } from './ModuleHeader';

interface Props {
  t: Translations;
  qa?: QAReport;
  isRunning: boolean;
  isApplying: boolean;
  onRunQA: () => void;
  onApplyFixes: () => void;
}

const TYPE_ICON = {
  character: <User className="w-3.5 h-3.5" />,
  location: <MapPin className="w-3.5 h-3.5" />,
  style: <Palette className="w-3.5 h-3.5" />,
};

/** Stage 4: continuity audit against the bible, with one-click correction. */
export const QAPanel: React.FC<Props> = ({ t, qa, isRunning, isApplying, onRunQA, onApplyFixes }) => {
  const runButton = (
    <button
      id="btn-qa-run"
      type="button"
      disabled={isRunning}
      onClick={onRunQA}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50 cursor-pointer"
    >
      {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
      <span>{t.runQABtn}</span>
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      <ModuleHeader
        badge="Stage 4 — QA"
        meta={qa ? `${qa.checked_keyframes} keyframes · ${qa.checked_shots} shots` : undefined}
        title={t.qaTitle}
        description={t.qaDesc}
        action={runButton}
      />

      {!qa ? (
        <EmptyState icon={<ShieldCheck className="w-10 h-10" />} message={t.qaEmpty} action={runButton} />
      ) : qa.status === 'passed' ? (
        <div className="flex items-center gap-3 p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
          <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-200">{t.qaPassed}</p>
            <p className="text-[11px] text-emerald-400/80 font-mono mt-0.5">{qa.checked_at}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-200">{t.qaDriftDetected}</p>
              <p className="text-[11px] text-amber-400/80">
                {t.driftItemsLabel}: {qa.drift_items.length}
              </p>
            </div>
            <button
              id="btn-qa-apply-fixes"
              type="button"
              disabled={isApplying}
              onClick={onApplyFixes}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[11px] font-bold transition disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isApplying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
              <span>{t.applyQAFixes}</span>
            </button>
          </div>

          {qa.drift_items.map((item, i) => (
            <div key={`${item.item_id}_${i}`} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-neutral-800 text-[10px] font-mono text-neutral-300">
                  {TYPE_ICON[item.item_type]}
                  {item.item_type}
                </span>
                <span className="text-[11px] font-mono font-bold text-amber-400">{item.item_id}</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">{item.drift_details}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
