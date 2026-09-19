import React from 'react';
import { AlertTriangle, Lock, Unlock, X } from 'lucide-react';
import { Translations } from '../i18n';

interface Props {
  isOpen: boolean;
  targetName: string;
  targetType: 'character' | 'location';
  t: Translations;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ContinuityWarningModal: React.FC<Props> = ({
  isOpen,
  targetName,
  targetType,
  t,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="continuity-warning-modal"
        className="w-full max-w-lg bg-neutral-900 border border-red-500/40 rounded-xl p-6 shadow-2xl shadow-red-950/40"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-200">
                {t.continuityWarningTitle}
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                {targetType === 'character' ? t.charactersTitle : t.locationsTitle}: <span className="font-semibold text-neutral-200">{targetName}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            className="text-neutral-400 hover:text-neutral-100 p-1.5 rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-red-950/20 border border-red-900/40 rounded-lg p-4 mb-6 text-sm leading-relaxed text-red-200/90">
          <p className="mb-2 font-medium">
            {t.continuityWarningBody}
          </p>
          <div className="flex items-center gap-2 text-xs text-amber-300/80 bg-neutral-900/80 p-2.5 rounded border border-amber-500/20">
            <Lock className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{t.verbatimRuleNotice}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            id="btn-cancel-continuity"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium transition"
          >
            {t.continuityCancel}
          </button>
          <button
            id="btn-confirm-unlock"
            onClick={onConfirm}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition shadow-lg shadow-red-600/20"
          >
            <Unlock className="w-4 h-4" />
            {t.continuityConfirmUnlock}
          </button>
        </div>
      </div>
    </div>
  );
};
