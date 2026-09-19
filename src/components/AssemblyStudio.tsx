import React from 'react';
import { Clapperboard, RefreshCw, Download, Clock, Monitor, Film, ImageIcon, Volume2 } from 'lucide-react';
import { Assembly, Project } from '../types';
import { Translations } from '../i18n';
import { EmptyState, ModuleHeader } from './ModuleHeader';

interface Props {
  t: Translations;
  project: Project;
  assembly?: Assembly;
  isBuilding: boolean;
  onBuildAssembly: () => void;
}

/** Phase 3 output: the cut timeline plus downloadable FFmpeg / EDL exports. */
export const AssemblyStudio: React.FC<Props> = ({ t, project, assembly, isBuilding, onBuildAssembly }) => {
  const buildButton = (
    <button
      id="btn-assembly-build"
      type="button"
      disabled={isBuilding || (project.shots || []).length === 0}
      onClick={onBuildAssembly}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50 cursor-pointer"
    >
      {isBuilding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Clapperboard className="w-4 h-4" />}
      <span>{t.buildAssemblyBtn}</span>
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      <ModuleHeader
        badge="Phase 3 — Assembly"
        meta={assembly ? `${assembly.shot_count} shots · ${assembly.total_duration_label}` : undefined}
        title={t.assemblyTitle}
        description={t.assemblyDesc}
        action={buildButton}
      />

      {!assembly ? (
        <EmptyState icon={<Clapperboard className="w-10 h-10" />} message={t.assemblyEmpty} action={buildButton} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat icon={<Clock className="w-4 h-4" />} label={t.totalDurationLabel} value={assembly.total_duration_label} />
            <Stat icon={<Monitor className="w-4 h-4" />} label={t.resolutionLabel} value={assembly.resolution} />
            <Stat icon={<Film className="w-4 h-4" />} label="Video shots" value={String(assembly.video_shot_count)} />
            <Stat icon={<ImageIcon className="w-4 h-4" />} label="Still shots" value={String(assembly.still_shot_count)} />
          </div>

          <div className="flex flex-wrap gap-2">
            <DownloadLink href={`/api/assembly/${project.id}/ffmpeg`} label={t.downloadFfmpeg} />
            <DownloadLink href={`/api/assembly/${project.id}/edl`} label={t.downloadEdl} />
            <DownloadLink href={`/api/assembly/${project.id}/timeline`} label={t.downloadTimeline} />
          </div>

          {/* Timeline strip: one proportional block per shot. */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-3">Timeline</h3>
            <div className="flex gap-0.5 h-14 rounded-lg overflow-hidden mb-3" dir="ltr">
              {assembly.timeline.map((entry) => (
                <div
                  key={entry.shot_id}
                  title={`${entry.shot_id} · ${entry.duration_s}s`}
                  style={{ flexGrow: entry.duration_s }}
                  className={`relative min-w-[6px] ${
                    entry.source === 'video' ? 'bg-emerald-600/70' : 'bg-blue-600/50'
                  } hover:brightness-125 transition`}
                >
                  {entry.still_url && (
                    <img src={entry.still_url} alt="" className="w-full h-full object-cover opacity-40" loading="lazy" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 text-[10px] text-neutral-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-600/70" /> video
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-600/50" /> still
              </span>
              <span className="flex items-center gap-1.5 ms-auto">
                <Volume2 className="w-3 h-3" /> narration muxed per scene
              </span>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-3">FFmpeg script</h3>
            <pre className="text-[10px] text-neutral-400 font-mono bg-neutral-950 border border-neutral-800 rounded-xl p-3 overflow-x-auto max-h-72 leading-relaxed" dir="ltr">
              {assembly.ffmpeg_script}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
    <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
      {icon}
      <span className="text-[10px] uppercase font-bold tracking-wide">{label}</span>
    </div>
    <p className="text-lg font-black text-white font-mono">{value}</p>
  </div>
);

const DownloadLink: React.FC<{ href: string; label: string }> = ({ href, label }) => (
  <a
    href={href}
    download
    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-[11px] font-bold transition cursor-pointer"
  >
    <Download className="w-3.5 h-3.5" />
    <span>{label}</span>
  </a>
);
