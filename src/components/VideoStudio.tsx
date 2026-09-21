import React from 'react';
import { Film, RefreshCw, PlayCircle, ImageIcon, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Keyframe, Shot } from '../types';
import { Translations } from '../i18n';
import { EmptyState, ModuleHeader } from './ModuleHeader';

interface Props {
  t: Translations;
  shots: Shot[];
  keyframes: Keyframe[];
  generatingShotId: string | null;
  isGeneratingAll: boolean;
  onGenerateShotVideo: (shotId: string) => void;
  onGenerateAll: () => void;
}

/** Phase 3: per-shot image-to-video renders, or timed stills when unavailable. */
export const VideoStudio: React.FC<Props> = ({
  t,
  shots,
  keyframes,
  generatingShotId,
  isGeneratingAll,
  onGenerateShotVideo,
  onGenerateAll,
}) => {
  const renderedCount = shots.filter((s) => !!s.video_url).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      <ModuleHeader
        badge="Phase 3 — Video"
        meta={`${renderedCount}/${shots.length} rendered`}
        title={t.videoTitle}
        description={t.videoDesc}
        action={
          <button
            id="btn-video-generate-all"
            type="button"
            disabled={isGeneratingAll || shots.length === 0}
            onClick={onGenerateAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50 cursor-pointer"
          >
            {isGeneratingAll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
            <span>{t.generateShotVideoBtn}</span>
          </button>
        }
      />

      {shots.length === 0 ? (
        <EmptyState icon={<Film className="w-10 h-10" />} message={t.videoEmpty} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {shots.map((shot) => {
            const busy = generatingShotId === shot.id || shot.status === 'generating' || isGeneratingAll;
            const startKeyframe = keyframes.find((k) => k.id === shot.start_frame);

            return (
              <div key={shot.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col">
                <div className="aspect-video bg-neutral-950 relative flex items-center justify-center">
                  {shot.video_url ? (
                    <video src={shot.video_url} controls className="w-full h-full object-cover" preload="metadata" />
                  ) : startKeyframe?.image_url ? (
                    <>
                      <img src={startKeyframe.image_url} alt={shot.id} className="w-full h-full object-cover opacity-60" loading="lazy" />
                      <PlayCircle className="w-10 h-10 text-neutral-300/70 absolute" />
                    </>
                  ) : (
                    <ImageIcon className="w-8 h-8 text-neutral-700" />
                  )}
                  {busy && (
                    <div className="absolute inset-0 bg-neutral-950/80 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
                      <span className="text-[10px] text-neutral-300">rendering…</span>
                    </div>
                  )}
                </div>

                <div className="p-3.5 flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-bold text-amber-400">{shot.id}</span>
                    <span className="text-[10px] font-mono text-neutral-500">{shot.duration_s}s</span>
                    {shot.status === 'completed' && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> video
                      </span>
                    )}
                    {shot.status === 'storyboard' && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-400/90">
                        <ImageIcon className="w-3 h-3" /> {t.storyboardOnly}
                      </span>
                    )}
                    {shot.status === 'failed' && (
                      <span className="flex items-center gap-1 text-[10px] text-red-400">
                        <AlertTriangle className="w-3 h-3" /> failed
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-neutral-400 line-clamp-2">{shot.camera}</p>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onGenerateShotVideo(shot.id)}
                    className="mt-auto flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-[11px] font-bold transition disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
                    <span>{shot.video_url ? t.regenerateBtn : t.generateShotVideoBtn}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
