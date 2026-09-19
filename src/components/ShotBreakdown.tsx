import React, { useState } from 'react';
import { Scissors, RefreshCw, Film, Clock, Camera, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { Keyframe, ProjectBible, Scene, Shot } from '../types';
import { Translations } from '../i18n';
import { EmptyState, ModuleHeader } from './ModuleHeader';

interface Props {
  t: Translations;
  bible: ProjectBible;
  scenes: Scene[];
  keyframes: Keyframe[];
  shots: Shot[];
  isGenerating: boolean;
  onGenerateBreakdown: () => void;
}

/** Stage 3: keyframes and shots per scene, timed from the real audio duration. */
export const ShotBreakdown: React.FC<Props> = ({
  t,
  bible,
  scenes,
  keyframes,
  shots,
  isGenerating,
  onGenerateBreakdown,
}) => {
  const [expandedScene, setExpandedScene] = useState<string | null>(scenes[0]?.scene_id || null);

  const generateButton = (
    <button
      id="btn-breakdown-generate"
      type="button"
      disabled={isGenerating || scenes.length === 0}
      onClick={onGenerateBreakdown}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50 cursor-pointer"
    >
      {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
      <span>{t.generateBreakdownBtn}</span>
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      <ModuleHeader
        badge="Stage 3 — Breakdown"
        meta={`${keyframes.length} ${t.keyframesCount} · ${shots.length} ${t.shotsCount}`}
        title={t.breakdownTitle}
        description={t.breakdownDesc}
        action={generateButton}
      />

      {shots.length === 0 ? (
        <EmptyState icon={<Scissors className="w-10 h-10" />} message={t.breakdownEmpty} action={generateButton} />
      ) : (
        <div className="space-y-3">
          {scenes.map((scene) => {
            const sceneKeyframes = keyframes.filter((k) => k.scene_id === scene.scene_id);
            const sceneShots = shots.filter((s) => s.scene_id === scene.scene_id);
            const location = bible.locations.find((l) => l.id === scene.location_id);
            const expanded = expandedScene === scene.scene_id;
            const duration = scene.real_audio_duration_s || scene.estimated_duration_s;

            return (
              <div key={scene.scene_id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedScene(expanded ? null : scene.scene_id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-neutral-800/50 transition text-start cursor-pointer"
                >
                  <span className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-400 text-[11px] font-mono font-bold shrink-0">
                    {scene.scene_id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-100 truncate">{scene.summary}</p>
                    <p className="text-[11px] text-neutral-500 truncate">{location?.name}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-neutral-400 shrink-0">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {duration}s
                      {scene.real_audio_duration_s && <span className="text-emerald-400">•real</span>}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      {sceneKeyframes.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <Film className="w-3.5 h-3.5" />
                      {sceneShots.length}
                    </span>
                  </div>
                  {expanded ? (
                    <ChevronUp className="w-4 h-4 text-neutral-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
                  )}
                </button>

                {expanded && (
                  <div className="border-t border-neutral-800 p-4 space-y-3">
                    {sceneShots.map((shot) => (
                      <div key={shot.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-[11px] font-mono font-bold text-amber-400">{shot.id}</span>
                          <span className="text-[10px] font-mono text-neutral-500">
                            {t.startFrameLabel}: {shot.start_frame} → {t.endFrameLabel}: {shot.end_frame}
                          </span>
                          <span className="ms-auto text-[10px] font-mono text-neutral-400">
                            {t.audioSliceLabel} {shot.audio_slice[0]}s–{shot.audio_slice[1]}s · {shot.duration_s}s
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-300 flex items-start gap-1.5 mb-1">
                          <Camera className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-neutral-400">{t.cameraLabel}:</strong> {shot.camera}
                          </span>
                        </p>
                        <p className="text-[11px] text-neutral-400 line-clamp-2 whitespace-pre-line" dir="ltr">
                          {shot.motion_prompt}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
