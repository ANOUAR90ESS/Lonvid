import React, { useState } from 'react';
import { Sparkles, Lock, Unlock, Plus, Trash2, Copy, Check, ShieldAlert, Eye, Code, Palette, Users, MapPin, RefreshCw } from 'lucide-react';
import { ProjectBible, Character, Location } from '../types';
import { Translations } from '../i18n';
import { ContinuityWarningModal } from './ContinuityWarningModal';

interface Props {
  t: Translations;
  bible: ProjectBible;
  projectIdea: string;
  isGenerating: boolean;
  onGenerateBible: () => void;
  onUpdateBible: (bible: ProjectBible) => void;
}

export const BibleEditor: React.FC<Props> = ({
  t,
  bible,
  projectIdea,
  isGenerating,
  onGenerateBible,
  onUpdateBible,
}) => {
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newColor, setNewColor] = useState('#38bdf8');

  // Continuity Warning Modal State
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<{
    type: 'character' | 'location';
    id: string;
    name: string;
  } | null>(null);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(bible, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateField = (field: keyof ProjectBible, value: any) => {
    onUpdateBible({
      ...bible,
      [field]: value,
    });
  };

  const handleUpdateStyle = (key: string, value: any) => {
    onUpdateBible({
      ...bible,
      visual_style: {
        ...bible.visual_style,
        [key]: value,
      },
    });
  };

  const handleAddColor = () => {
    if (!newColor) return;
    const current = bible.visual_style.color_palette || [];
    if (!current.includes(newColor)) {
      handleUpdateStyle('color_palette', [...current, newColor]);
    }
  };

  const handleRemoveColor = (index: number) => {
    const current = [...(bible.visual_style.color_palette || [])];
    current.splice(index, 1);
    handleUpdateStyle('color_palette', current);
  };

  // Character handlers
  const handleCharacterLockToggle = (char: Character) => {
    if (char.locked) {
      // Opening warning modal before unlocking
      setUnlockTarget({
        type: 'character',
        id: char.id,
        name: char.name,
      });
      setWarningModalOpen(true);
    } else {
      // Locking is safe
      const updated = bible.characters.map((c) =>
        c.id === char.id ? { ...c, locked: true } : c
      );
      handleUpdateField('characters', updated);
    }
  };

  const handleLocationLockToggle = (loc: Location) => {
    if (loc.locked) {
      // Opening warning modal before unlocking
      setUnlockTarget({
        type: 'location',
        id: loc.id,
        name: loc.name,
      });
      setWarningModalOpen(true);
    } else {
      const updated = bible.locations.map((l) =>
        l.id === loc.id ? { ...l, locked: true } : l
      );
      handleUpdateField('locations', updated);
    }
  };

  const handleConfirmUnlock = () => {
    if (!unlockTarget) return;

    if (unlockTarget.type === 'character') {
      const updated = bible.characters.map((c) =>
        c.id === unlockTarget.id ? { ...c, locked: false } : c
      );
      handleUpdateField('characters', updated);
    } else {
      const updated = bible.locations.map((l) =>
        l.id === unlockTarget.id ? { ...l, locked: false } : l
      );
      handleUpdateField('locations', updated);
    }

    setWarningModalOpen(false);
    setUnlockTarget(null);
  };

  const handleAddCharacter = () => {
    const nextNum = (bible.characters?.length || 0) + 1;
    const newChar: Character = {
      id: `CHAR_0${nextNum}`,
      name: `Character ${nextNum}`,
      locked_description: "Dense description: species, height, build, facial features, garments, signature accessories, and optical proportions.",
      voice: {
        voice_id: "Fenrir",
        tone: "Steady cinematic baritone, calm authority with melancholic undertone",
        pitch: "Deep / Low Pitch",
        pace: "Deliberate (~135 wpm)",
        accent_or_style: "Cyberpunk Noir / Classical Dramatic",
        vocal_traits: ["Controlled dynamic range", "Measured dramatic pauses", "Slight gravel"],
      },
      reference_sheet_prompt: "Full model turnaround sheet: front, profile, back views, 4 facial expressions.",
      locked: false,
    };
    handleUpdateField('characters', [...(bible.characters || []), newChar]);
  };

  const handleAddLocation = () => {
    const nextNum = (bible.locations?.length || 0) + 1;
    const newLoc: Location = {
      id: `LOC_0${nextNum}`,
      name: `Location ${nextNum}`,
      locked_description: "Dense architectural environment description: lighting atmosphere, materials, weather, spatial scale.",
      reference_prompt: "Wide architectural establishing shot, volumetric lighting, rich textural detail.",
      locked: false,
    };
    handleUpdateField('locations', [...(bible.locations || []), newLoc]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Stage 1 &bull; Source of Truth
            </span>
            <span className="text-xs text-neutral-400">
              JSON Bible &bull; Strict Verbatim Copying
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t.bibleEditorTitle}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 mt-1 max-w-3xl leading-relaxed">
            {t.bibleEditorDesc}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            id="btn-toggle-raw-json"
            type="button"
            onClick={() => setShowRawJson(!showRawJson)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition"
          >
            <Code className="w-4 h-4 text-amber-400" />
            <span>{showRawJson ? 'View Form' : 'View JSON'}</span>
          </button>

          <button
            id="btn-copy-bible-json"
            type="button"
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition"
            title="Copy Bible JSON"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
          </button>

          <button
            id="btn-generate-stage1-bible"
            type="button"
            disabled={isGenerating}
            onClick={onGenerateBible}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin text-neutral-950" />
            ) : (
              <Sparkles className="w-4 h-4 text-neutral-950" />
            )}
            <span>{isGenerating ? t.generatingBible : t.generateBibleBtn}</span>
          </button>
        </div>
      </div>

      {showRawJson ? (
        /* JSON View */
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
            <span className="text-xs font-mono text-neutral-400">
              project-bible.json (The only source of truth sent to Director AI)
            </span>
          </div>
          <pre className="text-xs font-mono text-emerald-400 bg-neutral-950 p-4 rounded-xl overflow-x-auto max-h-[600px] border border-neutral-800/80 leading-relaxed">
            {JSON.stringify(bible, null, 2)}
          </pre>
        </div>
      ) : (
        /* Form View */
        <div className="space-y-8">
          {/* Section 1: Film Metadata */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-base font-bold text-neutral-100 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>General Film Information</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {t.titleLabel}
                </label>
                <input
                  type="text"
                  id="input-bible-title"
                  value={bible.title || ''}
                  onChange={(e) => handleUpdateField('title', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {t.targetDuration}
                </label>
                <input
                  type="number"
                  min={3}
                  max={60}
                  value={bible.target_duration_min || 30}
                  onChange={(e) => handleUpdateField('target_duration_min', parseInt(e.target.value) || 30)}
                  className="w-full bg-neutral-950 border border-neutral-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {t.loglineLabel}
                </label>
                <textarea
                  rows={2}
                  id="input-bible-logline"
                  value={bible.logline || ''}
                  onChange={(e) => handleUpdateField('logline', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 focus:border-amber-500 rounded-xl p-3 text-sm text-neutral-100"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Visual Style */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-base font-bold text-neutral-100 mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-amber-400" />
              <span>{t.visualStyle}</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {t.stylePrompt}
                </label>
                <textarea
                  rows={3}
                  id="input-style-prompt"
                  value={bible.visual_style?.style_prompt || ''}
                  onChange={(e) => handleUpdateStyle('style_prompt', e.target.value)}
                  placeholder="Cinematic 35mm film aesthetic, anamorphic lens flare, rich shadow textures..."
                  className="w-full bg-neutral-950 border border-neutral-700 focus:border-amber-500 rounded-xl p-3 text-sm text-neutral-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Color Palette */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    {t.colorPalette}
                  </label>
                  <div className="flex flex-wrap items-center gap-2 mb-2 p-2 bg-neutral-950 rounded-xl border border-neutral-800 min-h-[44px]">
                    {(bible.visual_style?.color_palette || []).map((hex, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-xs font-mono text-neutral-200"
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: hex }}
                        />
                        <span>{hex}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(idx)}
                          className="text-neutral-500 hover:text-red-400 text-sm ml-1"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="w-28 bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-200"
                    />
                    <button
                      type="button"
                      onClick={handleAddColor}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition"
                    >
                      Add Color
                    </button>
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    {t.aspectRatio}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['16:9', '9:16', '1:1', '21:9'].map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => handleUpdateStyle('aspect_ratio', ratio)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center ${
                          bible.visual_style?.aspect_ratio === ratio
                            ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md shadow-amber-500/20'
                            : 'bg-neutral-950 text-neutral-300 border-neutral-700 hover:border-neutral-600'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      {t.negativePrompt}
                    </label>
                    <input
                      type="text"
                      value={bible.visual_style?.negative_prompt || ''}
                      onChange={(e) => handleUpdateStyle('negative_prompt', e.target.value)}
                      placeholder="cartoon, oversaturated, deformed anatomy, blurry..."
                      className="w-full bg-neutral-950 border border-neutral-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-neutral-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Characters & Locked Descriptions */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-neutral-100">
                  {t.charactersTitle} ({bible.characters?.length || 0})
                </h2>
              </div>

              <button
                type="button"
                id="btn-add-character"
                onClick={handleAddCharacter}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-xs font-semibold border border-neutral-700 transition"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addCharacter}</span>
              </button>
            </div>

            <div className="space-y-6">
              {(bible.characters || []).map((char, index) => (
                <div
                  key={char.id}
                  id={`char-card-${char.id}`}
                  className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded font-mono text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {char.id}
                      </span>
                      <input
                        type="text"
                        value={char.name}
                        onChange={(e) => {
                          const updated = bible.characters.map((c) =>
                            c.id === char.id ? { ...c, name: e.target.value } : c
                          );
                          handleUpdateField('characters', updated);
                        }}
                        className="font-bold text-sm bg-transparent border-b border-transparent hover:border-neutral-700 focus:border-amber-500 text-white px-1 py-0.5 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Lock Status Button */}
                      <button
                        type="button"
                        id={`btn-lock-${char.id}`}
                        onClick={() => handleCharacterLockToggle(char)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          char.locked
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                            : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                        }`}
                      >
                        {char.locked ? (
                          <>
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                            <span>{t.lockedBadge}</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5 text-neutral-400" />
                            <span>{t.unlockedBadge}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = bible.characters.filter((c) => c.id !== char.id);
                          handleUpdateField('characters', updated);
                        }}
                        className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800"
                        title={t.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Locked Description */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>{t.lockedDescription}</span>
                      </label>
                      {char.locked && (
                        <span className="text-[10px] text-amber-400/80 font-mono">
                          Copied verbatim into every image prompt
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      id={`textarea-desc-${char.id}`}
                      readOnly={char.locked}
                      value={char.locked_description}
                      onChange={(e) => {
                        const updated = bible.characters.map((c) =>
                          c.id === char.id ? { ...c, locked_description: e.target.value } : c
                        );
                        handleUpdateField('characters', updated);
                      }}
                      className={`w-full rounded-xl p-3 text-xs leading-relaxed transition ${
                        char.locked
                          ? 'bg-neutral-900/90 border border-amber-500/30 text-neutral-200 cursor-not-allowed select-text'
                          : 'bg-neutral-950 border border-neutral-700 focus:border-amber-500 text-neutral-100'
                      }`}
                    />
                  </div>

                  {/* Character Voice Characteristics & Reference Prompt */}
                  <div className="space-y-3 pt-2">
                    <div className="bg-neutral-900/90 p-3.5 rounded-xl border border-neutral-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span>{t.voiceSettings}</span>
                          <span className="text-[10px] text-neutral-400 lowercase font-normal">
                            (stored in characters[].voice)
                          </span>
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {char.voice?.voice_id || 'Fenrir'}
                        </span>
                      </div>

                      {/* Line 1: Voice ID & Tone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-semibold text-neutral-400 mb-1">{t.voiceId}</label>
                          <select
                            value={char.voice?.voice_id || 'Fenrir'}
                            onChange={(e) => {
                              const updated = bible.characters.map((c) =>
                                c.id === char.id
                                  ? { ...c, voice: { ...c.voice, voice_id: e.target.value } }
                                  : c
                              );
                              handleUpdateField('characters', updated);
                            }}
                            className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200 focus:border-amber-500"
                          >
                            <option value="Fenrir">Fenrir (Authoritative Deep Baritone)</option>
                            <option value="Kore">Kore (Warm Melodic & Precise)</option>
                            <option value="Puck">Puck (Crisp Narrative Cadence)</option>
                            <option value="Charon">Charon (Subtle Raspy Whisper)</option>
                            <option value="Zephyr">Zephyr (Bright Energetic Dynamic)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-neutral-400 mb-1">{t.voiceTone}</label>
                          <input
                            type="text"
                            value={char.voice?.tone || ''}
                            onChange={(e) => {
                              const updated = bible.characters.map((c) =>
                                c.id === char.id
                                  ? { ...c, voice: { ...c.voice, tone: e.target.value } }
                                  : c
                              );
                              handleUpdateField('characters', updated);
                            }}
                            placeholder="e.g. Deep resonant baritone, gravelly calm authority..."
                            className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200 focus:border-amber-500"
                          />
                        </div>
                      </div>

                      {/* Line 2: Pitch, Pace & Accent/Style */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-semibold text-neutral-400 mb-1">Vocal Pitch</label>
                          <select
                            value={char.voice?.pitch || 'Deep / Low Pitch'}
                            onChange={(e) => {
                              const updated = bible.characters.map((c) =>
                                c.id === char.id
                                  ? { ...c, voice: { ...c.voice, pitch: e.target.value } }
                                  : c
                              );
                              handleUpdateField('characters', updated);
                            }}
                            className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200 focus:border-amber-500"
                          >
                            <option value="Deep / Low Pitch">Deep / Low Pitch (85-115 Hz)</option>
                            <option value="Medium-Low Pitch">Medium-Low Pitch (120-145 Hz)</option>
                            <option value="Neutral / Balanced">Neutral / Balanced (150-185 Hz)</option>
                            <option value="High Pitch">High Pitch (190+ Hz)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-neutral-400 mb-1">Pacing / Tempo</label>
                          <select
                            value={char.voice?.pace || 'Deliberate (~135 wpm)'}
                            onChange={(e) => {
                              const updated = bible.characters.map((c) =>
                                c.id === char.id
                                  ? { ...c, voice: { ...c.voice, pace: e.target.value } }
                                  : c
                              );
                              handleUpdateField('characters', updated);
                            }}
                            className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200 focus:border-amber-500"
                          >
                            <option value="Deliberate (~135 wpm)">Deliberate (~135 wpm)</option>
                            <option value="Narrative Mid-Tempo (~150 wpm)">Narrative Mid-Tempo (~150 wpm)</option>
                            <option value="Fast & Urgent (~175 wpm)">Fast & Urgent (~175 wpm)</option>
                            <option value="Slow Contemplative (~115 wpm)">Slow Contemplative (~115 wpm)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-neutral-400 mb-1">Accent & Style</label>
                          <input
                            type="text"
                            value={char.voice?.accent_or_style || ''}
                            onChange={(e) => {
                              const updated = bible.characters.map((c) =>
                                c.id === char.id
                                  ? { ...c, voice: { ...c.voice, accent_or_style: e.target.value } }
                                  : c
                              );
                              handleUpdateField('characters', updated);
                            }}
                            placeholder="e.g. Cyberpunk Noir / Classical Dramatic"
                            className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200 focus:border-amber-500"
                          />
                        </div>
                      </div>

                      {/* Line 3: Vocal Traits Chips & Input */}
                      <div>
                        <label className="block text-[10px] font-semibold text-neutral-400 mb-1">
                          Vocal Traits & Nuances (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={Array.isArray(char.voice?.vocal_traits) ? char.voice.vocal_traits.join(', ') : (char.voice?.vocal_traits || '')}
                          onChange={(e) => {
                            const traits = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                            const updated = bible.characters.map((c) =>
                              c.id === char.id
                                ? { ...c, voice: { ...c.voice, vocal_traits: traits } }
                                : c
                            );
                            handleUpdateField('characters', updated);
                          }}
                          placeholder="e.g. Gravelly breathing, subtle cybernetic resonance, dramatic pauses"
                          className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200 focus:border-amber-500"
                        />
                        {Array.isArray(char.voice?.vocal_traits) && char.voice.vocal_traits.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {char.voice.vocal_traits.map((trait, tIdx) => (
                              <span
                                key={tIdx}
                                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-neutral-800 text-amber-300 border border-neutral-700"
                              >
                                {trait}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reference Sheet Prompt */}
                    <div className="bg-neutral-900/70 p-3 rounded-xl border border-neutral-800">
                      <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                        {t.refSheetPrompt}
                      </label>
                      <input
                        type="text"
                        value={char.reference_sheet_prompt || ''}
                        onChange={(e) => {
                          const updated = bible.characters.map((c) =>
                            c.id === char.id ? { ...c, reference_sheet_prompt: e.target.value } : c
                          );
                          handleUpdateField('characters', updated);
                        }}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200 focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Locations & Locked Descriptions */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-neutral-100">
                  {t.locationsTitle} ({bible.locations?.length || 0})
                </h2>
              </div>

              <button
                type="button"
                id="btn-add-location"
                onClick={handleAddLocation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-xs font-semibold border border-neutral-700 transition"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addLocation}</span>
              </button>
            </div>

            <div className="space-y-6">
              {(bible.locations || []).map((loc) => (
                <div
                  key={loc.id}
                  id={`loc-card-${loc.id}`}
                  className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded font-mono text-xs font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {loc.id}
                      </span>
                      <input
                        type="text"
                        value={loc.name}
                        onChange={(e) => {
                          const updated = bible.locations.map((l) =>
                            l.id === loc.id ? { ...l, name: e.target.value } : l
                          );
                          handleUpdateField('locations', updated);
                        }}
                        className="font-bold text-sm bg-transparent border-b border-transparent hover:border-neutral-700 focus:border-amber-500 text-white px-1 py-0.5 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        id={`btn-lock-${loc.id}`}
                        onClick={() => handleLocationLockToggle(loc)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          loc.locked
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                            : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                        }`}
                      >
                        {loc.locked ? (
                          <>
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                            <span>{t.lockedBadge}</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5 text-neutral-400" />
                            <span>{t.unlockedBadge}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = bible.locations.filter((l) => l.id !== loc.id);
                          handleUpdateField('locations', updated);
                        }}
                        className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800"
                        title={t.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Location Locked Description */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>{t.lockedDescription}</span>
                      </label>
                      {loc.locked && (
                        <span className="text-[10px] text-amber-400/80 font-mono">
                          Copied verbatim into every scene prompt
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      readOnly={loc.locked}
                      value={loc.locked_description}
                      onChange={(e) => {
                        const updated = bible.locations.map((l) =>
                          l.id === loc.id ? { ...l, locked_description: e.target.value } : l
                        );
                        handleUpdateField('locations', updated);
                      }}
                      className={`w-full rounded-xl p-3 text-xs leading-relaxed transition ${
                        loc.locked
                          ? 'bg-neutral-900/90 border border-amber-500/30 text-neutral-200 cursor-not-allowed select-text'
                          : 'bg-neutral-950 border border-neutral-700 focus:border-amber-500 text-neutral-100'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                      {t.refPrompt}
                    </label>
                    <input
                      type="text"
                      value={loc.reference_prompt || ''}
                      onChange={(e) => {
                        const updated = bible.locations.map((l) =>
                          l.id === loc.id ? { ...l, reference_prompt: e.target.value } : l
                        );
                        handleUpdateField('locations', updated);
                      }}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Continuity Warning Modal */}
      <ContinuityWarningModal
        isOpen={warningModalOpen}
        targetName={unlockTarget?.name || ''}
        targetType={unlockTarget?.type || 'character'}
        t={t}
        onConfirm={handleConfirmUnlock}
        onCancel={() => {
          setWarningModalOpen(false);
          setUnlockTarget(null);
        }}
      />
    </div>
  );
};
