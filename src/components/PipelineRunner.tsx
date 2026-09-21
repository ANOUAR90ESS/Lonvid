import React, { useState } from 'react';
import {
  Play, Square, RefreshCw, CheckCircle2, CircleDashed, XCircle, SkipForward,
  Loader2, Terminal, ChevronDown, ChevronUp, WifiOff, Wallet,
} from 'lucide-react';
import { PipelineJob, PipelineStep } from '../types';
import { Translations } from '../i18n';

interface Props {
  t: Translations;
  job: PipelineJob | null;
  offlineMode: boolean;
  onRun: (options: { force: boolean; skipVideo: boolean }) => void;
  onCancel: () => void;
}

const STEP_ICON: Record<PipelineStep['status'], React.ReactNode> = {
  pending: <CircleDashed className="w-4 h-4 text-neutral-600" />,
  running: <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />,
  done: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  skipped: <SkipForward className="w-4 h-4 text-neutral-500" />,
  failed: <XCircle className="w-4 h-4 text-red-400" />,
};

/**
 * Drives the whole production from one panel: start, watch live progress
 * step by step, and stop. Progress arrives over SSE from the server.
 */
export const PipelineRunner: React.FC<Props> = ({ t, job, offlineMode, onRun, onCancel }) => {
  const [force, setForce] = useState(false);
  const [skipVideo, setSkipVideo] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const running = job?.status === 'running';
  const steps = job?.steps || [];
  const completedSteps = steps.filter((s) => s.status === 'done' || s.status === 'skipped').length;
  const overall = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;

  const statusLine = !job
    ? t.pipelineIdle
    : job.status === 'running'
      ? t.runningPipeline
      : job.status === 'completed'
        ? t.pipelineCompleted
        : job.status === 'cancelled'
          ? t.pipelineCancelledLabel
          : job.status === 'budget_exceeded'
            ? t.pipelineBudgetStop
            : t.pipelineFailedLabel;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {t.pipelineTitle}
            </span>
            {job && (
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                  job.status === 'running'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : job.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-red-500/10 text-red-300 border-red-500/30'
                }`}
              >
                {job.status}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-300">{statusLine}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-1.5 text-[11px] text-neutral-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={force}
              disabled={running}
              onChange={(e) => setForce(e.target.checked)}
              className="accent-amber-500"
            />
            {t.forceRerun}
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-neutral-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={skipVideo}
              disabled={running}
              onChange={(e) => setSkipVideo(e.target.checked)}
              className="accent-amber-500"
            />
            {t.skipVideoStep}
          </label>

          {running ? (
            <button
              id="btn-pipeline-cancel"
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/90 hover:bg-red-500 text-white text-xs font-bold transition cursor-pointer"
            >
              <Square className="w-4 h-4" />
              <span>{t.cancelPipeline}</span>
            </button>
          ) : (
            <button
              id="btn-pipeline-run"
              type="button"
              onClick={() => onRun({ force, skipVideo })}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>{force ? t.runPipelineFull : t.runPipeline}</span>
            </button>
          )}
        </div>
      </div>

      {offlineMode && (
        <div className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200">
          <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{t.offlineModeBanner}</span>
        </div>
      )}

      {job && (
        <>
          <div className="w-full bg-neutral-950 rounded-full h-2 overflow-hidden border border-neutral-800 mb-3">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${overall}%` }}
            />
          </div>

          {!running && (
            <button
              type="button"
              onClick={() => setDetailsOpen((v) => !v)}
              className="flex items-center gap-2 mb-3 text-[11px] font-semibold text-neutral-400 hover:text-neutral-200 transition cursor-pointer"
            >
              <span>
                {completedSteps}/{steps.length} steps
              </span>
              {detailsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}

          <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 ${running || detailsOpen ? '' : 'hidden'}`}>
            {steps.map((step) => (
              <div
                key={step.key}
                className={`p-2.5 rounded-xl border text-xs transition ${
                  step.status === 'running'
                    ? 'bg-neutral-800 border-amber-500/50 ring-1 ring-amber-500/20'
                    : step.status === 'failed'
                      ? 'bg-red-950/30 border-red-500/40'
                      : 'bg-neutral-900/60 border-neutral-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {STEP_ICON[step.status]}
                  <span className="font-semibold text-neutral-200 truncate">{step.label}</span>
                  {step.total > 1 && (
                    <span className="ms-auto text-[10px] font-mono text-neutral-400 shrink-0">
                      {step.progress}/{step.total}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 line-clamp-2">{step.error || step.message || '—'}</p>
              </div>
            ))}
          </div>

          {job.log.length > 0 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setLogOpen((v) => !v)}
                className="flex items-center gap-2 text-[11px] font-semibold text-neutral-400 hover:text-neutral-200 transition cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{t.activityLog} ({job.log.length})</span>
                {logOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {logOpen && (
                <div className="mt-2 max-h-52 overflow-y-auto rounded-xl bg-neutral-950 border border-neutral-800 p-3 font-mono text-[11px] leading-relaxed" dir="ltr">
                  {job.log.map((entry, i) => (
                    <div
                      key={i}
                      className={
                        entry.level === 'error'
                          ? 'text-red-400'
                          : entry.level === 'warn'
                            ? 'text-amber-400'
                            : 'text-neutral-400'
                      }
                    >
                      <span className="text-neutral-600">{entry.at.slice(11, 19)}</span> {entry.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {job.status === 'budget_exceeded' && (
            <div className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200">
              <Wallet className="w-4 h-4 shrink-0" />
              <span>{t.pipelineBudgetStop}</span>
            </div>
          )}
        </>
      )}

      {!job && (
        <p className="text-[11px] text-neutral-500 flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          {t.pipelineDesc}
        </p>
      )}
    </div>
  );
};
