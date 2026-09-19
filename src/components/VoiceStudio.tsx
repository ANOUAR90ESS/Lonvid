import React, { useState, useRef } from 'react';
import { Volume2, Play, Pause, RefreshCw, CheckCircle2, Clock, Music, ShieldCheck, Download, Sparkles, Layers } from 'lucide-react';
import { ProjectBible, Scene } from '../types';
import { Translations } from '../i18n';

interface Props {
  t: Translations;
  bible: ProjectBible;
  scenes: Scene[];
  projectId: string;
  onGenerateVoice: (sceneId: string) => Promise<void>;
  onGenerateAllVoices: () => Promise<void>;
  generatingVoiceSceneId: string | null;
  isGeneratingAllVoices: boolean;
}

export const VoiceStudio: React.FC<Props> = ({
  t,
  bible,
  scenes,
  projectId,
  onGenerateVoice,
  onGenerateAllVoices,
  generatingVoiceSceneId,
  isGeneratingAllVoices,
}) => {
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const totalWords = scenes.reduce((acc, s) => acc + (s.word_count || 0), 0);
  const totalRealDurationSec = scenes.reduce((acc, s) => acc + (s.real_audio_duration_s || 0), 0);
  const voicedScenesCount = scenes.filter((s) => !!s.real_audio_duration_s).length;

  const handlePlayToggle = (scene: Scene) => {
    if (!scene.audio_url) return;

    if (activePlayingId === scene.scene_id) {
      audioRef.current?.pause();
      setActivePlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = scene.audio_url;
        audioRef.current.play();
        setActivePlayingId(scene.scene_id);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      <audio
        ref={audioRef}
        onEnded={() => setActivePlayingId(null)}
        onError={() => setActivePlayingId(null)}
        className="hidden"
      />

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Voice & Audio Measurement
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              ElevenLabs &bull; Gemini TTS &bull; Real Duration Reading
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t.voiceTitle}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 mt-1 max-w-3xl leading-relaxed">
            {t.voiceDesc}
          </p>
        </div>

        <button
          id="btn-voice-studio-generate-all"
          type="button"
          disabled={scenes.length === 0 || isGeneratingAllVoices}
          onClick={onGenerateAllVoices}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50 cursor-pointer"
        >
          {isGeneratingAllVoices ? (
            <RefreshCw className="w-4 h-4 animate-spin text-neutral-950" />
          ) : (
            <Volume2 className="w-4 h-4 text-neutral-950" />
          )}
          <span>{isGeneratingAllVoices ? t.generatingAllVoices : t.generateAllVoices}</span>
        </button>
      </div>

      {/* Character Voice Reference Card */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 mb-8">
        <h2 className="text-sm font-bold text-neutral-200 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Bible Character Fixed Voice Registry</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(bible.characters || []).map((char) => (
            <div
              key={char.id}
              className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-start justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    {char.id}
                  </span>
                  <span className="text-xs font-bold text-white">{char.name}</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Voice ID: <strong className="text-neutral-200 font-mono">{char.voice?.voice_id || 'Fenrir'}</strong>
                </p>
                <p className="text-[10px] text-neutral-500 mt-0.5 truncate max-w-xs">
                  Tone: {char.voice?.tone || 'Steady, authoritative narrative'}
                </p>
              </div>

              <div className="p-2 rounded-lg bg-neutral-900 text-amber-400">
                <Volume2 className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voice Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-xs text-neutral-400 block mb-1">Voiced Scenes Status</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">
              {voicedScenesCount} / {scenes.length}
            </span>
            <span className="text-xs text-neutral-400">
              ({Math.round((voicedScenesCount / (scenes.length || 1)) * 100)}%)
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-xs text-neutral-400 block mb-1">Total Real Audio Duration</span>
          <span className="text-2xl font-black text-emerald-400 font-mono">
            {totalRealDurationSec.toFixed(2)}s
          </span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-xs text-neutral-400 block mb-1">Total Word Count</span>
          <span className="text-2xl font-black text-blue-400 font-mono">
            {totalWords} {t.wordsWord}
          </span>
        </div>
      </div>

      {/* Scenes Audio Breakdown Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Music className="w-4 h-4 text-amber-400" />
            <span>Scene Audio & Real Duration Registry</span>
          </h2>
          <span className="text-xs font-mono text-neutral-400">
            {t.wordsPerMinuteRule}
          </span>
        </div>

        <div className="divide-y divide-neutral-800 overflow-x-auto">
          {scenes.map((scene) => {
            const isPlaying = activePlayingId === scene.scene_id;
            const isGenerating = generatingVoiceSceneId === scene.scene_id;

            return (
              <div
                key={scene.scene_id}
                className="p-4 hover:bg-neutral-800/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Scene Meta */}
                <div className="flex items-start gap-3.5 min-w-[240px]">
                  <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-mono font-black text-xs border border-amber-500/30">
                    {scene.scene_id}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white line-clamp-1">{scene.summary}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 italic max-w-md">
                      &ldquo;{scene.narration_text}&rdquo;
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono mt-1">
                      <span>{scene.word_count} words</span>
                      <span>&bull;</span>
                      <span>Est: ~{scene.estimated_duration_s}s</span>
                      <span>&bull;</span>
                      <span className="text-neutral-400">
                        File: {projectId}/{scene.scene_id}/narration.wav
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audio Controls & Real Duration */}
                <div className="flex items-center gap-4">
                  {scene.real_audio_duration_s ? (
                    <div className="flex items-center gap-3 bg-neutral-950 px-3 py-2 rounded-xl border border-neutral-800">
                      <button
                        type="button"
                        onClick={() => handlePlayToggle(scene)}
                        className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 flex items-center justify-center font-bold transition shadow"
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                      </button>

                      {/* Simulated Audio Waveform */}
                      <div className="flex items-center gap-0.5 h-6">
                        {[12, 18, 8, 22, 14, 20, 10, 16, 24, 12, 18, 14, 22, 8].map((h, i) => (
                          <div
                            key={i}
                            className={`w-1 rounded-full transition-all duration-300 ${
                              isPlaying ? 'bg-amber-400 animate-pulse' : 'bg-neutral-700'
                            }`}
                            style={{ height: `${isPlaying ? Math.max(4, Math.round(h * Math.random())) : h}px` }}
                          />
                        ))}
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-xs font-black text-emerald-400 block">
                          {scene.real_audio_duration_s.toFixed(2)}s
                        </span>
                        <span className="text-[9px] text-neutral-400 uppercase">
                          Exact Timing
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-neutral-500 italic">
                      {t.noAudioYet}
                    </span>
                  )}

                  {/* Regenerate Button */}
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => onGenerateVoice(scene.scene_id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-neutral-200 text-xs font-semibold border border-neutral-700 transition disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                    <span>{scene.real_audio_duration_s ? 'Regenerate' : 'Generate'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
