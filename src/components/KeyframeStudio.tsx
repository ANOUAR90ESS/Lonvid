import React, { useState } from 'react';
import { ImageIcon, RefreshCw, AlertTriangle, CheckCircle2, Link2, X } from 'lucide-react';
import { Keyframe } from '../types';
import { Translations } from '../i18n';
import { EmptyState, ModuleHeader } from './ModuleHeader';

interface Props {
  t: Translations;
  keyframes: Keyframe[];
  generatingKeyframeId: string | null;
  isGeneratingAll: boolean;
  onGenerateKeyframe: (keyframeId: string) => void;
  onGenerateAll: () => void;
}

/** Phase 2 output: the K1..Kn image grid, with prompt inspection per frame. */
export const KeyframeStudio: React.FC<Props> = ({
  t,
  keyframes,
  generatingKeyframeId,
  isGeneratingAll,
  onGenerateKeyframe,
  onGenerateAll,
}) => {
  const [inspecting, setInspecting] = useState<Keyframe | null>(null);
  const readyCount = keyframes.filter((k) => !!k.image_url).length;

  const generateAllButton = (
    <button
      id="btn-keyframes-generate-all"
      type="button"
      disabled={isGeneratingAll || keyframes.length === 0}
      onClick={onGenerateAll}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50 cursor-pointer"
    >
      {isGeneratingAll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
      <span>{t.generateKeyframeBtn}</span>
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      <ModuleHeader
        badge="Phase 2 — Keyframes"
        meta={`${readyCount}/${keyframes.length} rendered`}
        title={t.imagesTitle}
        description={t.imagesDesc}
        action={generateAllButton}
      />

      {keyframes.length === 0 ? (
        <EmptyState icon={<ImageIcon className="w-10 h-10" />} message={t.imagesEmpty} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {keyframes.map((keyframe) => {
            const busy = generatingKeyframeId === keyframe.id || keyframe.status === 'generating' || isGeneratingAll;
            return (
              <div key={keyframe.id} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden group">
                <button
                  type="button"
                  onClick={() => setInspecting(keyframe)}
                  className="aspect-video bg-neutral-950 relative w-full flex items-center justify-center cursor-pointer"
                >
                  {keyframe.image_url ? (
                    <img src={keyframe.image_url} alt={keyframe.id} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <ImageIcon className="w-7 h-7 text-neutral-700" />
                  )}
                  {busy && (
                    <div className="absolute inset-0 bg-neutral-950/70 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
                    </div>
                  )}
                  {keyframe.drift_status === 'corrected' && (
                    <span className="absolute top-1.5 end-1.5 p-1 rounded-md bg-amber-500/90" title={keyframe.drift_notes}>
                      <AlertTriangle className="w-3 h-3 text-neutral-950" />
                    </span>
                  )}
                </button>

                <div className="p-2.5 flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-amber-400 truncate">{keyframe.id}</span>
                  {keyframe.status === 'approved' && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onGenerateKeyframe(keyframe.id)}
                    className="ms-auto p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition disabled:opacity-50 cursor-pointer"
                    title={keyframe.image_url ? t.regenerateBtn : t.generateKeyframeBtn}
                  >
                    <RefreshCw className={`w-3 h-3 text-neutral-300 ${busy ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {inspecting && (
        <div
          className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setInspecting(null)}
        >
          <div
            className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 p-4 border-b border-neutral-800 sticky top-0 bg-neutral-900">
              <span className="text-sm font-mono font-bold text-amber-400">{inspecting.id}</span>
              <button
                type="button"
                onClick={() => setInspecting(null)}
                className="ms-auto p-1.5 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            {inspecting.image_url && (
              <img src={inspecting.image_url} alt={inspecting.id} className="w-full" />
            )}

            <div className="p-4 space-y-3">
              <div>
                <h4 className="text-[11px] font-bold uppercase text-neutral-400 mb-1 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5" /> {t.referencesUsed}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {inspecting.reference_images.map((ref) => (
                    <span key={ref} className="px-2 py-0.5 rounded-md bg-neutral-800 text-[10px] font-mono text-neutral-300">
                      {ref}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold uppercase text-neutral-400 mb-1">{t.promptLabel}</h4>
                <pre className="text-[11px] text-neutral-300 whitespace-pre-wrap font-mono bg-neutral-950 border border-neutral-800 rounded-xl p-3 leading-relaxed" dir="ltr">
                  {inspecting.image_prompt}
                </pre>
              </div>

              {inspecting.drift_notes && (
                <p className="text-[11px] text-amber-300 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {inspecting.drift_notes}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
