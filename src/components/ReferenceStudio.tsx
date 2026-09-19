import React from 'react';
import { ImageIcon, RefreshCw, CheckCircle2, Sparkles, User, MapPin } from 'lucide-react';
import { ProjectBible } from '../types';
import { Translations } from '../i18n';
import { ModuleHeader } from './ModuleHeader';

interface Props {
  t: Translations;
  bible: ProjectBible;
  generatingItemId: string | null;
  isGeneratingAll: boolean;
  onGenerateReference: (itemId: string) => void;
  onGenerateAll: () => void;
}

/** Phase 2 anchor images: one model sheet per character, one plate per location. */
export const ReferenceStudio: React.FC<Props> = ({
  t,
  bible,
  generatingItemId,
  isGeneratingAll,
  onGenerateReference,
  onGenerateAll,
}) => {
  const items = [
    ...(bible.characters || []).map((c) => ({ kind: 'character' as const, item: c })),
    ...(bible.locations || []).map((l) => ({ kind: 'location' as const, item: l })),
  ];
  const readyCount = items.filter(({ item }) => !!item.reference_image_url).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      <ModuleHeader
        badge="Phase 2 — References"
        meta={`${readyCount}/${items.length} ready`}
        title={t.referencesTitle}
        description={t.referencesDesc}
        action={
          <button
            id="btn-references-generate-all"
            type="button"
            disabled={isGeneratingAll || items.length === 0}
            onClick={onGenerateAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50 cursor-pointer"
          >
            {isGeneratingAll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{t.generateAllReferences}</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(({ kind, item }) => {
          const busy = generatingItemId === item.id || isGeneratingAll;
          const isPlaceholder = item.reference_image_url?.endsWith('.svg');

          return (
            <div key={item.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col">
              <div className="aspect-video bg-neutral-950 relative flex items-center justify-center">
                {item.reference_image_url ? (
                  <img
                    src={item.reference_image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-neutral-600">
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-[11px]">{t.noReferenceYet}</span>
                  </div>
                )}
                {busy && (
                  <div className="absolute inset-0 bg-neutral-950/70 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
                  </div>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  {kind === 'character' ? (
                    <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  )}
                  <span className="text-[10px] font-mono text-neutral-500">{item.id}</span>
                  {item.reference_approved && (
                    <span className="ms-auto flex items-center gap-1 text-[10px] text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> {t.referenceApproved}
                    </span>
                  )}
                  {isPlaceholder && (
                    <span className="ms-auto text-[10px] text-amber-400/80">{t.referencePlaceholder}</span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white leading-snug">{item.name}</h3>
                <p className="text-[11px] text-neutral-400 line-clamp-3 leading-relaxed flex-1">
                  {item.locked_description}
                </p>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onGenerateReference(item.id)}
                  className="mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-[11px] font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
                  <span>{item.reference_image_url ? t.regenerateBtn : t.generateReference}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
