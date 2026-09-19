import React from 'react';
import { Settings, X, Shield, Cpu, Volume2, Image, Video, CheckCircle2, AlertTriangle, Key } from 'lucide-react';
import { ProviderSettings } from '../types';
import { Translations } from '../i18n';

interface Props {
  isOpen: boolean;
  t: Translations;
  settings: ProviderSettings;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({
  isOpen,
  t,
  settings,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="settings-modal"
        className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {t.settingsTitle}
              </h3>
              <p className="text-xs text-neutral-400">
                Pipeline Provider Adapters & Server-Side Key Vault
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-3 p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 mb-6">
          <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-neutral-300">
            <strong className="block text-emerald-400 font-bold mb-0.5">
              Zero Client-Side Secret Leakage
            </strong>
            <p className="text-neutral-400 leading-relaxed">
              {t.apiKeyNotice}
            </p>
          </div>
        </div>

        {/* Adapters List */}
        <div className="space-y-4">
          {/* LLM Provider */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">{t.llmProvider}</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Active</span>
              </span>
            </div>
            <p className="text-xs text-neutral-400 mb-2">
              Model: <strong className="text-neutral-200 font-mono">gemini-3.8-flash</strong> (Director AI Stage 1-4 Engine)
            </p>
            <div className="text-[11px] text-neutral-500">
              Provider Adapter: Google GenAI SDK (Server-Side)
            </div>
          </div>

          {/* Voice Provider */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">{t.voiceProvider}</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {settings.has_elevenlabs_key ? 'ElevenLabs' : 'Gemini TTS / Synth'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mb-2">
              Engine: <strong className="text-neutral-200 font-mono">gemini-3.1-flash-tts-preview & ElevenLabs Adapter</strong>
            </p>
            <div className="text-[11px] text-neutral-500">
              Reads real audio buffer duration down to milliseconds.
            </div>
          </div>

          {/* Image Provider (Preview for Phase 2) */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white">{t.imageProvider}</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                Configured for Phase 2
              </span>
            </div>
            <p className="text-xs text-neutral-400 mb-1">
              Engine: <strong className="text-neutral-200 font-mono">gemini-3.1-flash-image / gemini-3-pro-image</strong>
            </p>
            <div className="text-[11px] text-neutral-500">
              K1-K4 Keyframes per scene with attached character sheet & previous K4 continuity reference.
            </div>
          </div>

          {/* Video Provider (Preview for Phase 3) */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-white">{t.videoProvider}</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                Configured for Phase 3
              </span>
            </div>
            <p className="text-xs text-neutral-400 mb-1">
              Engine: <strong className="text-neutral-200 font-mono">Veo 3.1 (veo-3.1-fast-generate-preview)</strong>
            </p>
            <div className="text-[11px] text-neutral-500">
              Image-to-video with first and last frame interpolation.
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};
