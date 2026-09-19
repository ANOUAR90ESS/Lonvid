import React, { useState, useRef } from 'react';
import { Sparkles, Play, Pause, RefreshCw, Volume2, Clock, FileText, Plus, Trash2, CheckCircle2, AlertCircle, MapPin, UserCheck, BarChart3 } from 'lucide-react';
import { ProjectBible, Scene } from '../types';
import { Translations } from '../i18n';

interface Props {
  t: Translations;
  bible: ProjectBible;
  scenes: Scene[];
  pilotMode: boolean;
  isGeneratingScript: boolean;
  onGenerateScript: () => void;
  onUpdateScenes: (scenes: Scene[]) => void;
  onGenerateVoice: (sceneId: string) => Promise<void>;
  onGenerateAllVoices: () => Promise<void>;
  generatingVoiceSceneId: string | null;
  isGeneratingAllVoices: boolean;
}

export const ScriptEditor: React.FC<Props> = ({
  t,
  bible,
  scenes,
  pilotMode,
  isGeneratingScript,
  onGenerateScript,
  onUpdateScenes,
  onGenerateVoice,
  onGenerateAllVoices,
  generatingVoiceSceneId,
  isGeneratingAllVoices,
}) => {
  const [playingSceneId, setPlayingSceneId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Totals calculations
  const totalWords = scenes.reduce((acc, s) => acc + (s.word_count || 0), 0);
  const totalEstDurationSec = scenes.reduce((acc, s) => acc + (s.estimated_duration_s || 0), 0);
  const totalRealDurationSec = scenes.reduce((acc, s) => acc + (s.real_audio_duration_s || 0), 0);

  const formatMinSec = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const handleUpdateScene = (sceneId: string, updates: Partial<Scene>) => {
    const updated = scenes.map((s) => {
      if (s.scene_id === sceneId) {
        const nextScene = { ...s, ...updates };
        if (updates.narration_text !== undefined) {
          const words = nextScene.narration_text.trim().split(/\s+/).filter(Boolean).length;
          nextScene.word_count = words;
          nextScene.estimated_duration_s = Math.round((words / 150) * 60);
        }
        return nextScene;
      }
      return s;
    });
    onUpdateScenes(updated);
  };

  const handleAddScene = () => {
    const nextIdx = scenes.length + 1;
    const sceneId = `S00${nextIdx}`;
    const newScene: Scene = {
      scene_id: sceneId,
      location_id: bible.locations?.[0]?.id || 'LOC_01',
      character_ids: [bible.characters?.[0]?.id || 'CHAR_01'],
      summary: `Scene ${nextIdx} narrative progression.`,
      narration_text: "Write dialogue or narration here. Approximately 150 spoken words equals 60 seconds of real audio duration.",
      emotional_beat: "Heightened tension",
      word_count: 17,
      estimated_duration_s: 30,
      status: 'draft',
    };
    onUpdateScenes([...scenes, newScene]);
  };

  const handleDeleteScene = (sceneId: string) => {
    onUpdateScenes(scenes.filter((s) => s.scene_id !== sceneId));
  };

  const togglePlayAudio = (scene: Scene) => {
    if (!scene.audio_url) return;

    if (playingSceneId === scene.scene_id) {
      audioRef.current?.pause();
      setPlayingSceneId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = scene.audio_url;
        audioRef.current.play();
        setPlayingSceneId(scene.scene_id);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      <audio
        ref={audioRef}
        onEnded={() => setPlayingSceneId(null)}
        onError={() => setPlayingSceneId(null)}
        className="hidden"
      />

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Stage 2 &bull; Script Engine
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              30–90s / scene &bull; ~150 words = 1 minute
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t.scriptTitle}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 mt-1 max-w-3xl leading-relaxed">
            {t.scriptDesc}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            id="btn-generate-all-voices"
            type="button"
            disabled={scenes.length === 0 || isGeneratingAllVoices}
            onClick={onGenerateAllVoices}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-xs sm:text-sm font-semibold border border-neutral-700 transition disabled:opacity-50"
          >
            {isGeneratingAllVoices ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-400" />
            )}
            <span>{isGeneratingAllVoices ? t.generatingAllVoices : t.generateAllVoices}</span>
          </button>

          <button
            id="btn-generate-stage2-script"
            type="button"
            disabled={isGeneratingScript}
            onClick={onGenerateScript}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50 cursor-pointer"
          >
            {isGeneratingScript ? (
              <RefreshCw className="w-4 h-4 animate-spin text-neutral-950" />
            ) : (
              <Sparkles className="w-4 h-4 text-neutral-950" />
            )}
            <span>{isGeneratingScript ? t.generatingScript : t.generateScriptBtn}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
          <span className="text-xs text-neutral-400 block mb-1">{t.scenesCount}</span>
          <span className="text-2xl font-black text-white font-mono">{scenes.length}</span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
          <span className="text-xs text-neutral-400 block mb-1">{t.totalWords}</span>
          <span className="text-2xl font-black text-amber-400 font-mono">{totalWords}</span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
          <span className="text-xs text-neutral-400 block mb-1">{t.totalEstDuration}</span>
          <span className="text-2xl font-black text-blue-400 font-mono">{formatMinSec(totalEstDurationSec)}</span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
          <span className="text-xs text-neutral-400 block mb-1">{t.realDurationLabel}</span>
          <span className="text-2xl font-black text-emerald-400 font-mono">
            {totalRealDurationSec > 0 ? formatMinSec(totalRealDurationSec) : '--:--'}
          </span>
        </div>
      </div>

      {/* Scenes List */}
      {scenes.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-12 text-center max-w-lg mx-auto">
          <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-200 mb-2">No script scenes generated yet</h3>
          <p className="text-xs text-neutral-400 mb-6">
            Click &ldquo;{t.generateScriptBtn}&rdquo; to let Director AI read the Bible and structure full dialogue and narration.
          </p>
          <button
            onClick={onGenerateScript}
            disabled={isGeneratingScript}
            className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition"
          >
            {isGeneratingScript ? t.generatingScript : t.generateScriptBtn}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {scenes.map((scene, index) => {
            const isPlaying = playingSceneId === scene.scene_id;
            const isVoiceGenerating = generatingVoiceSceneId === scene.scene_id;
            const isPacingWarning = scene.estimated_duration_s < 30 || scene.estimated_duration_s > 90;

            return (
              <div
                key={scene.scene_id}
                id={`scene-card-${scene.scene_id}`}
                className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 transition hover:border-neutral-700 shadow-md"
              >
                {/* Scene Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-black text-sm border border-amber-500/30">
                      {scene.scene_id}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
                        {t.sceneCard} #{index + 1}
                      </span>
                      <input
                        type="text"
                        value={scene.summary}
                        onChange={(e) => handleUpdateScene(scene.scene_id, { summary: e.target.value })}
                        placeholder="Brief summary..."
                        className="text-sm font-semibold text-white bg-transparent border-b border-transparent hover:border-neutral-700 focus:border-amber-500 focus:outline-none px-0.5 py-0.5"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Voice State Badge */}
                    {scene.real_audio_duration_s ? (
                      <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{scene.real_audio_duration_s}s (Real)</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                        Draft
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteScene(scene.scene_id)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition"
                      title={t.deleteScene}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Assignments: Location & Characters & Beat */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-xs">
                  {/* Location Selector */}
                  <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-blue-400" />
                      <span>{t.assignedLocation}</span>
                    </label>
                    <select
                      value={scene.location_id}
                      onChange={(e) => handleUpdateScene(scene.scene_id, { location_id: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 text-neutral-200 text-xs"
                    >
                      {(bible.locations || []).map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Character Selector */}
                  <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-amber-400" />
                      <span>{t.assignedCharacters}</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(bible.characters || []).map((char) => {
                        const isSelected = scene.character_ids?.includes(char.id);
                        return (
                          <button
                            key={char.id}
                            type="button"
                            onClick={() => {
                              const next = isSelected
                                ? scene.character_ids.filter((id) => id !== char.id)
                                : [...(scene.character_ids || []), char.id];
                              handleUpdateScene(scene.scene_id, { character_ids: next });
                            }}
                            className={`px-2 py-1 rounded text-[11px] font-semibold border transition ${
                              isSelected
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                            }`}
                          >
                            {char.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Emotional Beat */}
                  <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                      {t.emotionalBeat}
                    </label>
                    <input
                      type="text"
                      value={scene.emotional_beat}
                      onChange={(e) => handleUpdateScene(scene.scene_id, { emotional_beat: e.target.value })}
                      placeholder="Emotional tone & beat..."
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 text-neutral-200 text-xs"
                    />
                  </div>
                </div>

                {/* Narration Textarea */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-neutral-300">
                      {t.narrationDialogue}
                    </label>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-neutral-400 font-mono">
                        {scene.word_count} {t.wordsWord}
                      </span>
                      <span className="text-neutral-400 font-mono">
                        ~{scene.estimated_duration_s}s ({t.estDurationLabel})
                      </span>
                      {isPacingWarning && (
                        <span className="text-amber-400 text-[11px] flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Recommended: 30–90s</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    id={`narration-textarea-${scene.scene_id}`}
                    value={scene.narration_text}
                    onChange={(e) => handleUpdateScene(scene.scene_id, { narration_text: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 focus:border-amber-500 rounded-xl p-3 text-sm text-neutral-100 leading-relaxed font-sans"
                  />
                </div>

                {/* Audio Engine Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-neutral-950 rounded-xl border border-neutral-800/90">
                  <div className="flex items-center gap-3">
                    {scene.audio_url ? (
                      <button
                        type="button"
                        id={`btn-play-${scene.scene_id}`}
                        onClick={() => togglePlayAudio(scene)}
                        className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 flex items-center justify-center font-bold transition shadow"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-neutral-800 text-neutral-500 flex items-center justify-center">
                        <Volume2 className="w-4 h-4" />
                      </div>
                    )}

                    <div>
                      {scene.real_audio_duration_s ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-200">
                            {t.realDurationDetected} <strong className="text-emerald-400 font-mono">{scene.real_audio_duration_s}s</strong>
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            ({scene.voice_provider || 'TTS'})
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400">
                          {t.noAudioYet}
                        </span>
                      )}
                      <p className="text-[10px] text-neutral-500 font-mono">
                        Voice ID: {bible.characters?.[0]?.voice?.voice_id || 'Fenrir'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id={`btn-voice-${scene.scene_id}`}
                      disabled={isVoiceGenerating}
                      onClick={() => onGenerateVoice(scene.scene_id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-neutral-200 text-xs font-semibold border border-neutral-700 transition disabled:opacity-50"
                    >
                      {isVoiceGenerating ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                      <span>{isVoiceGenerating ? t.generatingVoice : t.generateSceneVoice}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex justify-center pt-4">
            <button
              type="button"
              id="btn-add-scene"
              onClick={handleAddScene}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold border border-neutral-700 transition"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>{t.addScene}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
