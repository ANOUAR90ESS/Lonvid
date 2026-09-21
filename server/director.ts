/**
 * DIRECTOR AI — the four production stages.
 *
 * GOLDEN RULE: the Project Bible is the only source of truth. Character and
 * location `locked_description` values are copied VERBATIM into every prompt.
 * The model is asked to do this, and `enforceVerbatim` guarantees it
 * afterwards regardless of what the model returned.
 */
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { KEYFRAMES_PER_SCENE, MAX_SHOT_DURATION_S, MEDIA_DIR } from "./config.ts";
import { callGeminiText, parseJsonSafely, generateImage, generateSpeech, generateVideo, getGeminiClient } from "./gemini.ts";
import { saveMedia, pcmToWav, synthesizePlaceholderWav, placeholderImage } from "./media.ts";

const GOLDEN_RULE = `You are the DIRECTOR AI of a long-form AI video production pipeline.
Your job is to keep characters, locations and style 100% consistent across
videos up to 30+ minutes, because image/video models have no memory.

GOLDEN RULE: You never rely on memory. The PROJECT BIBLE (JSON) is the only
source of truth. It is sent to you with every request. You must copy
character/location descriptions VERBATIM from the bible into every prompt.
Never paraphrase, shorten or "improve" them.

You work in 4 stages. Only do the stage requested.`;

// ---------------------------------------------------------------------------
// STAGE 1 — BIBLE
// ---------------------------------------------------------------------------

export async function generateBible(
  idea: string,
  targetDurationMin: number
): Promise<{ bible: any; source: "gemini" | "offline" }> {
  const systemInstruction = `${GOLDEN_RULE}

STAGE 1 — BIBLE
From the user's idea, produce:
{
 "title": "", "logline": "", "target_duration_min": ${targetDurationMin},
 "visual_style": {"style_prompt": "", "color_palette": [], "aspect_ratio": "16:9",
                  "negative_prompt": ""},
 "characters": [{"id": "CHAR_01", "name": "",
   "locked_description": "one dense paragraph: species, size, colors, markings, clothing, accessories, proportions",
   "voice": {"voice_id": "Fenrir", "tone": "", "pitch": "Deep / Low Pitch", "pace": "Deliberate (~135 wpm)", "accent_or_style": "Cyberpunk Noir / Cinematic", "vocal_traits": ["Controlled dynamic range", "Measured pauses"]},
   "reference_sheet_prompt": "front, side, back views + 4 expressions, neutral background"}],
 "locations": [
   {"id": "LOC_01", "name": "", "locked_description": "Dense architectural visual description", "reference_prompt": "Wide cinematic shot..."},
   {"id": "LOC_02", "name": "", "locked_description": "Dense architectural visual description", "reference_prompt": "Wide cinematic shot..."},
   {"id": "LOC_03", "name": "", "locked_description": "Dense architectural visual description", "reference_prompt": "Wide cinematic shot..."},
   {"id": "LOC_04", "name": "", "locked_description": "Dense architectural visual description", "reference_prompt": "Wide cinematic shot..."}
 ]
}

Voice IDs must be one of: Puck, Charon, Kore, Fenrir, Zephyr.
Always answer with valid JSON only, no commentary.`;

  const ai = getGeminiClient();
  if (ai) {
    try {
      const { text, model } = await callGeminiText(ai, {
        contents: `Produce the Stage 1 Project Bible JSON for this concept: ${idea}`,
        systemInstruction,
        temperature: 0.7,
      });
      const bible = parseJsonSafely(text);
      if (bible.title && bible.visual_style && Array.isArray(bible.characters) && Array.isArray(bible.locations)) {
        console.log(`[Director AI] Stage 1 Bible generated using ${model}`);
        return { bible: normalizeBible(bible, targetDurationMin), source: "gemini" };
      }
    } catch (err: any) {
      console.log(`[Director AI] Stage 1: models unavailable (${err?.status || "503"}), using offline Bible template.`);
    }
  }

  return { bible: normalizeBible(offlineBible(idea, targetDurationMin), targetDurationMin), source: "offline" };
}

function normalizeBible(bible: any, targetDurationMin: number): any {
  bible.target_duration_min = bible.target_duration_min || targetDurationMin;
  bible.visual_style = bible.visual_style || {};
  bible.visual_style.aspect_ratio = bible.visual_style.aspect_ratio || "16:9";
  bible.visual_style.color_palette = Array.isArray(bible.visual_style.color_palette)
    ? bible.visual_style.color_palette
    : ["#0f172a", "#38bdf8", "#f59e0b"];
  bible.visual_style.negative_prompt =
    bible.visual_style.negative_prompt ||
    "cartoon, oversaturated, deformed anatomy, blurry, low resolution, bad hands, double faces, watermark, text";

  bible.characters = (bible.characters || []).map((c: any, i: number) => ({
    ...c,
    id: c.id || `CHAR_0${i + 1}`,
    locked: c.locked !== false,
    voice: {
      voice_id: c.voice?.voice_id || (i % 2 === 0 ? "Fenrir" : "Kore"),
      tone: c.voice?.tone || "Evocative, clear cinematic delivery with measured cadence.",
      pitch: c.voice?.pitch || (i % 2 === 0 ? "Deep / Low Pitch" : "Medium-Low Pitch"),
      pace: c.voice?.pace || "Deliberate (~140 wpm)",
      accent_or_style: c.voice?.accent_or_style || "Cinematic Dramatic",
      vocal_traits: Array.isArray(c.voice?.vocal_traits)
        ? c.voice.vocal_traits
        : ["Controlled dynamic range", "Natural breath pauses"],
    },
  }));

  bible.locations = (bible.locations || []).map((l: any, i: number) => ({
    ...l,
    id: l.id || `LOC_0${i + 1}`,
    locked: l.locked !== false,
  }));

  return bible;
}

function offlineBible(idea: string, targetDurationMin: number): any {
  const title = idea.slice(0, 40).replace(/[^a-zA-Z0-9 ؀-ۿ]/g, "").trim() || "The Lost Echoes";
  return {
    title,
    logline: `In an unforgettable cinematic journey, ${idea.slice(0, 180)}`,
    target_duration_min: targetDurationMin,
    visual_style: {
      style_prompt:
        "Cinematic 35mm film still, Kodak Vision3 500T aesthetic, atmospheric volumetric lighting, anamorphic lens flare, rich shadows, 8k resolution hyper-detailed texture, panavision color grading",
      color_palette: ["#0f172a", "#38bdf8", "#f59e0b", "#475569", "#0284c7"],
      aspect_ratio: "16:9",
      negative_prompt:
        "cartoon, oversaturated, deformed anatomy, blurry, low resolution, bad hands, double faces, watermark, text",
    },
    characters: [
      {
        id: "CHAR_01",
        name: "Commander Kaelen",
        locked_description:
          "Human male, early 40s, 185cm tall, weathered jawline with tactical stubble and a faint silver cybernetic ocular graft over his left eye. Broad athletic build. Wearing a matte-charcoal modular ballistic duster coat with reinforced obsidian-fiber collar, magnetic gear clasps across the chest, and distressed leather combat gloves. Proportions are grounded, muscular and heroic.",
        voice: {
          voice_id: "Fenrir",
          tone: "Low resonant baritone, quiet grit, contemplative and authoritative.",
          pitch: "Deep / Low Pitch",
          pace: "Deliberate (~135 wpm)",
          accent_or_style: "Cyberpunk Noir / Classical Dramatic",
          vocal_traits: ["Controlled dynamic range", "Measured dramatic pauses", "Subtle gravelly breath"],
        },
        reference_sheet_prompt:
          "Character model sheet of Commander Kaelen, front view, 45 degree angle side view, and back view. 4 distinct facial expressions (stoic focus, grim realization, determined command, subtle empathy). Neutral gray studio backdrop, sharp studio key lighting.",
      },
      {
        id: "CHAR_02",
        name: "Dr. Elena Vasquez",
        locked_description:
          "Human female, mid-30s, 172cm tall, sharp observant amber eyes, dark auburn hair tied into a utilitarian high braided knot. Slender agile posture. Wearing an off-white insulated surveyor flight suit with brass atmospheric sensor nodes along the lapels and a holoscreen gauntlet strapped to her right forearm.",
        voice: {
          voice_id: "Kore",
          tone: "Crisp, analytical, warm melodic cadence with quiet urgency.",
          pitch: "Medium-Low Pitch",
          pace: "Narrative Mid-Tempo (~150 wpm)",
          accent_or_style: "Academic / Analytical",
          vocal_traits: ["Articulate enunciation", "Sharp intellectual cadence", "Melodic softness under pressure"],
        },
        reference_sheet_prompt:
          "Character model sheet of Dr. Elena Vasquez, front, profile, back views. 4 facial expressions (focused analysis, sudden discovery, tension, resolved hope). Solid neutral backdrop.",
      },
    ],
    locations: [
      {
        id: "LOC_01",
        name: "The Sub-Surface Transit Terminus",
        locked_description:
          "Massive subterranean high-speed maglev platform carved from brutalist obsidian basalt and frosted structural glass. Wet reflective polished floor reflecting cyan neon signage and amber signal lamps. Heavy industrial atmospheric mist venting from ceiling grilles, damp condensation on structural pillars.",
        reference_prompt:
          "Wide architectural establishing shot of The Sub-Surface Transit Terminus. Obsidian pillars, frosted glass walkways, cyan and amber neon reflections, humid mist.",
      },
      {
        id: "LOC_02",
        name: "The High Observatory Sanctuary",
        locked_description:
          "Grand domed panoramic observation chamber perched over the endless cloud sea. Curved brass astrolabe ribs framing reinforced quartz observation windows. Heavy oak holographic terminal table in the center casting cool cerulean light across ancient star charts.",
        reference_prompt:
          "Wide interior shot of The High Observatory Sanctuary, domed ceiling, golden astrolabe framework, cool blue holographic starmap.",
      },
      {
        id: "LOC_03",
        name: "The Submerged Pulse Bazaar",
        locked_description:
          "Multi-tiered subterranean marketplace suspended beneath massive hydraulic floodgates in Sector 7. Dense labyrinth of corrugated sheet metal stalls with fluorescent holographic awnings glowing in intense magenta and viridian emerald through thick swirling steam from open drainage grates. Worn hexagonal basalt pavers slick with iridescent oily rainwater.",
        reference_prompt:
          "Wide atmospheric establishing shot of The Submerged Pulse Bazaar, tiered subterranean alleyways, neon magenta and emerald light cutting through humid steam, wet reflective basalt ground, 35mm cinematic film still.",
      },
      {
        id: "LOC_04",
        name: "The Apex Cryo-Silicon Vault",
        locked_description:
          "Monolithic subterranean data sanctuary kept at sub-zero cryogenic temperatures with visible creeping plumes of white vapor across mirror-polished black obsidian flooring. Colossal four-story cylindrical towers of liquid-nitrogen-cooled glass server columns pulsing with rhythmic amber optical data nodes. Brutalist vaulted ceiling with exposed brushed-titanium load trusses.",
        reference_prompt:
          "Grand architectural interior establishing shot of The Apex Cryo-Silicon Vault, towering vertical glass server monoliths pulsing amber light, swirling sub-zero fog over mirror-finish obsidian floor, cold teal and amber lighting, 8k resolution.",
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// STAGE 2 — SCRIPT
// ---------------------------------------------------------------------------

export async function generateScript(
  bible: any,
  pilotMode: boolean
): Promise<{ scenes: any[]; source: "gemini" | "offline" }> {
  const sceneTargetCount = pilotMode
    ? 3
    : Math.min(12, Math.max(4, Math.round((bible.target_duration_min || 30) / 3.5)));

  const systemInstruction = `${GOLDEN_RULE}

STAGE 2 — SCRIPT
Write the full narration/dialogue split into SCENES (30-90 s each).
Each scene: scene_id, location_id, character_ids, summary, narration text,
emotional beat. ~150 spoken words = 1 minute.
Generate exactly ${sceneTargetCount} scenes for this ${pilotMode ? "3-minute pilot production" : `${bible.target_duration_min}-minute film`}.
location_id and character_ids MUST reference ids that exist in the bible.

Output must be valid JSON:
{
 "scenes": [
   {
     "scene_id": "S001",
     "location_id": "LOC_01",
     "character_ids": ["CHAR_01"],
     "summary": "Brief scene description",
     "narration_text": "Spoken narration or dialogue, 75-180 words matching the 30-90s duration.",
     "emotional_beat": "Tense discovery / quiet reflection / dramatic confrontation"
   }
 ]
}

Always answer with valid JSON only, no commentary.`;

  const ai = getGeminiClient();
  if (ai) {
    try {
      const { text, model } = await callGeminiText(ai, {
        contents: `Here is the PROJECT BIBLE JSON:\n${JSON.stringify(bible, null, 2)}\n\nGenerate Stage 2 Script with exactly ${sceneTargetCount} scenes.`,
        systemInstruction,
        temperature: 0.7,
      });
      const output = parseJsonSafely(text);
      if (Array.isArray(output.scenes) && output.scenes.length > 0) {
        console.log(`[Director AI] Stage 2 Script generated using ${model}`);
        return { scenes: normalizeScenes(output.scenes, bible), source: "gemini" };
      }
    } catch (err: any) {
      console.log(`[Director AI] Stage 2: models unavailable (${err?.status || "503"}), using offline script.`);
    }
  }

  return { scenes: normalizeScenes(offlineScenes(bible, sceneTargetCount), bible), source: "offline" };
}

function normalizeScenes(scenes: any[], bible: any): any[] {
  const validLocations = new Set((bible.locations || []).map((l: any) => l.id));
  const validCharacters = new Set((bible.characters || []).map((c: any) => c.id));
  const fallbackLocation = bible.locations?.[0]?.id || "LOC_01";
  const fallbackCharacter = bible.characters?.[0]?.id || "CHAR_01";

  return scenes.map((s: any, idx: number) => {
    const wordCount = s.narration_text ? s.narration_text.split(/\s+/).filter(Boolean).length : 80;
    const estimated = Math.round((wordCount / 150) * 60);
    const characterIds = (Array.isArray(s.character_ids) ? s.character_ids : []).filter((id: string) =>
      validCharacters.has(id)
    );

    return {
      ...s,
      scene_id: s.scene_id || `S${String(idx + 1).padStart(3, "0")}`,
      location_id: validLocations.has(s.location_id) ? s.location_id : fallbackLocation,
      character_ids: characterIds.length > 0 ? characterIds : [fallbackCharacter],
      summary: s.summary || "",
      emotional_beat: s.emotional_beat || "Narrative beat",
      word_count: wordCount,
      estimated_duration_s: Math.max(30, Math.min(90, estimated)),
      status: s.status || "draft",
    };
  });
}

function offlineScenes(bible: any, count: number): any[] {
  const chars = bible.characters || [];
  const locs = bible.locations || [];
  const beats = [
    "Grim solitude and cautious entry into danger",
    "Tense discovery and unspoken trust under pressure",
    "Awe, revelation, and irrevocable commitment",
    "Rising confrontation with the unseen adversary",
    "Quiet reflection before the final descent",
    "Decisive action and the cost it demands",
  ];

  return Array.from({ length: count }, (_, i) => {
    const loc = locs[i % Math.max(1, locs.length)] || { id: "LOC_01", name: "Location" };
    const char = chars[i % Math.max(1, chars.length)] || { id: "CHAR_01", name: "Lead" };
    const second = chars[(i + 1) % Math.max(1, chars.length)];
    return {
      scene_id: `S${String(i + 1).padStart(3, "0")}`,
      location_id: loc.id,
      character_ids: second && second.id !== char.id && i > 0 ? [char.id, second.id] : [char.id],
      summary: `${char.name} at ${loc.name} — beat ${i + 1} of the ${bible.title} arc.`,
      narration_text: `${char.name} moved through ${loc.name} without a sound. The air carried the weight of everything left unsaid since the archive went dark. Every instrument read the same impossible value, and every instinct said to turn back. But the signal was still climbing, still folding in on itself somewhere beyond the next threshold, and there was no version of this night that ended with walking away. Whatever waited on the other side had been waiting a very long time, and it had learned patience the way the city had learned rain: completely, and without mercy.`,
      emotional_beat: beats[i % beats.length],
    };
  });
}

// ---------------------------------------------------------------------------
// VOICE — real audio duration drives every downstream timing decision
// ---------------------------------------------------------------------------

export async function generateVoice(
  projectId: string,
  scene: any,
  voiceId: string
): Promise<{ audio_url: string; duration_s: number; provider: string; voice_id: string }> {
  const ai = getGeminiClient();

  if (ai) {
    try {
      const result = await generateSpeech(ai, scene.narration_text, voiceId);
      if (result) {
        const wav = pcmToWav(result.pcm, 24000);
        // 24kHz, 16-bit mono => 48000 bytes per second of audio.
        const durationS = Math.max(1, parseFloat((result.pcm.length / 48000).toFixed(2)));
        const url = saveMedia(projectId, `${scene.scene_id}_narration.wav`, wav);
        return { audio_url: url, duration_s: durationS, provider: "gemini_tts", voice_id: result.voiceId };
      }
    } catch (err: any) {
      console.log(`[Voice] Gemini TTS unavailable for ${scene.scene_id}, using offline synth:`, err?.message || err);
    }
  }

  const { buffer, durationS } = synthesizePlaceholderWav(scene.narration_text, voiceId);
  const url = saveMedia(projectId, `${scene.scene_id}_narration.wav`, buffer);
  return { audio_url: url, duration_s: durationS, provider: "native_synth", voice_id: voiceId };
}

// ---------------------------------------------------------------------------
// REFERENCES — character sheets and location plates (Phase 2 anchor images)
// ---------------------------------------------------------------------------

export async function generateReferenceImage(
  projectId: string,
  bible: any,
  kind: "character" | "location",
  item: any
): Promise<{ url: string; source: "gemini" | "offline" }> {
  const style = bible.visual_style || {};
  const basePrompt =
    kind === "character"
      ? item.reference_sheet_prompt || `Character model sheet of ${item.name}`
      : item.reference_prompt || `Wide establishing shot of ${item.name}`;

  const prompt = [
    style.style_prompt,
    basePrompt,
    `${kind === "character" ? "CHARACTER" : "LOCATION"} DESCRIPTION (copy exactly, do not reinterpret): ${item.locked_description}`,
    `Aspect ratio ${style.aspect_ratio || "16:9"}.`,
    `Avoid: ${style.negative_prompt || ""}`,
  ]
    .filter(Boolean)
    .join("\n");

  const fileName = `ref_${item.id}.png`;
  const ai = getGeminiClient();

  if (ai) {
    try {
      const image = await generateImage(ai, prompt);
      if (image) {
        const url = saveMedia(projectId, fileName, image.buffer);
        return { url, source: "gemini" };
      }
    } catch (err: any) {
      console.log(`[References] Image model unavailable for ${item.id}:`, err?.message || err);
    }
  }

  const svg = placeholderImage(`${item.id} — ${item.name}`, basePrompt, style.color_palette || [], style.aspect_ratio || "16:9");
  const url = saveMedia(projectId, `ref_${item.id}.svg`, svg);
  return { url, source: "offline" };
}

// ---------------------------------------------------------------------------
// STAGE 3 — SHOT BREAKDOWN (keyframes + I2V shots, timed to real audio)
// ---------------------------------------------------------------------------

/**
 * Splits one scene into keyframes and shots. The number of keyframes scales
 * with the scene's REAL audio duration so no shot ever exceeds the model's
 * maximum clip length; K1 of a scene continues from the previous scene's
 * last keyframe, which is what prevents visual jumps between scenes.
 */
export async function generateBreakdown(
  bible: any,
  scene: any,
  previousKeyframePrompt: string | null
): Promise<{ keyframes: any[]; shots: any[]; source: "gemini" | "offline" }> {
  const duration = scene.real_audio_duration_s || scene.estimated_duration_s || 45;
  const shotCount = Math.max(KEYFRAMES_PER_SCENE - 1, Math.ceil(duration / MAX_SHOT_DURATION_S));
  const keyframeCount = shotCount + 1;

  const characters = (bible.characters || []).filter((c: any) => (scene.character_ids || []).includes(c.id));
  const location = (bible.locations || []).find((l: any) => l.id === scene.location_id) || bible.locations?.[0];

  let beats: Array<{ beat: string; camera: string; motion: string }> | null = null;
  const ai = getGeminiClient();

  if (ai) {
    try {
      const systemInstruction = `${GOLDEN_RULE}

STAGE 3 — SHOT BREAKDOWN
The scene's REAL measured audio duration is ${duration} seconds. Split it into
exactly ${keyframeCount} keyframes and ${shotCount} shots of about ${(duration / shotCount).toFixed(1)}s each.

For each keyframe give a short visual BEAT (what is framed, the action, the light).
For each shot give the CAMERA (e.g. "slow dolly in, 35mm") and the MOTION prompt.
Do NOT restate character or location descriptions; the pipeline injects them verbatim.

Output valid JSON only:
{"beats":[{"beat":"...","camera":"...","motion":"..."}]}
Provide exactly ${keyframeCount} entries.`;

      const { text } = await callGeminiText(ai, {
        contents: `SCENE:\n${JSON.stringify(
          {
            scene_id: scene.scene_id,
            summary: scene.summary,
            emotional_beat: scene.emotional_beat,
            narration_text: scene.narration_text,
            location: location?.name,
            characters: characters.map((c: any) => c.name),
          },
          null,
          2
        )}\n\nProduce the Stage 3 beats.`,
        systemInstruction,
        temperature: 0.6,
      });
      const parsed = parseJsonSafely(text);
      if (Array.isArray(parsed.beats) && parsed.beats.length > 0) {
        beats = parsed.beats;
      }
    } catch (err: any) {
      console.log(`[Director AI] Stage 3: models unavailable for ${scene.scene_id}, using deterministic breakdown.`);
    }
  }

  if (!beats) beats = offlineBeats(scene, keyframeCount);

  // Pad or trim to the exact count the timing math requires.
  while (beats.length < keyframeCount) beats.push(beats[beats.length - 1] || offlineBeats(scene, 1)[0]);
  beats = beats.slice(0, keyframeCount);

  const keyframes = beats.map((b, i) => {
    const id = `${scene.scene_id}_K${i + 1}`;
    const continuity =
      i === 0 && previousKeyframePrompt
        ? `CONTINUITY: this frame continues directly from the previous scene's final frame. Match lighting, wardrobe and grade exactly.`
        : i > 0
          ? `CONTINUITY: this frame continues from ${scene.scene_id}_K${i}. Match lighting, wardrobe and grade exactly.`
          : "";

    return {
      id,
      scene_id: scene.scene_id,
      image_prompt: buildKeyframePrompt(bible, scene, characters, location, b.beat, continuity),
      reference_images: [
        ...characters.map((c: any) => c.id),
        ...(location ? [location.id] : []),
        ...(i === 0 ? [] : [`${scene.scene_id}_K${i}`]),
      ],
      negative_prompt: bible.visual_style?.negative_prompt || "",
      status: "pending",
      drift_status: "ok",
    };
  });

  const perShot = parseFloat((duration / shotCount).toFixed(2));
  const shots = Array.from({ length: shotCount }, (_, i) => {
    const start = parseFloat((i * perShot).toFixed(2));
    const end = parseFloat((i === shotCount - 1 ? duration : (i + 1) * perShot).toFixed(2));
    const beat = beats![i] || beats![beats!.length - 1];
    return {
      id: `${scene.scene_id}_SH${i + 1}`,
      scene_id: scene.scene_id,
      start_frame: keyframes[i].id,
      end_frame: keyframes[i + 1].id,
      duration_s: parseFloat((end - start).toFixed(2)),
      camera: beat.camera || "Slow cinematic push-in, 35mm anamorphic",
      motion_prompt: buildMotionPrompt(bible, beat.motion || beat.beat, characters, location),
      audio_slice: [start, end] as [number, number],
      status: "pending",
    };
  });

  return { keyframes, shots, source: beats ? "gemini" : "offline" };
}

function offlineBeats(scene: any, count: number): Array<{ beat: string; camera: string; motion: string }> {
  const cameras = [
    "Wide establishing, static tripod, 24mm",
    "Slow dolly in, 35mm anamorphic",
    "Medium over-the-shoulder, handheld micro-drift, 50mm",
    "Close-up, slow push, 85mm shallow depth",
    "Slow lateral track, 35mm",
    "Rising crane move, 24mm",
  ];
  return Array.from({ length: count }, (_, i) => ({
    beat: `${scene.summary || scene.emotional_beat} — frame ${i + 1} of ${count}, carrying the beat "${scene.emotional_beat}".`,
    camera: cameras[i % cameras.length],
    motion: `Subtle continuous motion matching "${scene.emotional_beat}": drifting atmosphere, gentle parallax, no cuts, no morphing.`,
  }));
}

function buildKeyframePrompt(
  bible: any,
  scene: any,
  characters: any[],
  location: any,
  beat: string,
  continuity: string
): string {
  const style = bible.visual_style || {};
  const lines = [
    style.style_prompt,
    `SHOT: ${beat}`,
    `EMOTIONAL BEAT: ${scene.emotional_beat}`,
  ];

  for (const c of characters) {
    lines.push(`CHARACTER ${c.id} — ${c.name} (VERBATIM, do not alter): ${c.locked_description}`);
  }
  if (location) {
    lines.push(`LOCATION ${location.id} — ${location.name} (VERBATIM, do not alter): ${location.locked_description}`);
  }
  if (continuity) lines.push(continuity);

  lines.push(`Aspect ratio ${style.aspect_ratio || "16:9"}. Cinematic film still, no text overlays.`);
  lines.push(`Avoid: ${style.negative_prompt || ""}`);

  return lines.filter(Boolean).join("\n");
}

function buildMotionPrompt(bible: any, motion: string, characters: any[], location: any): string {
  const style = bible.visual_style || {};
  const lines = [
    `MOTION: ${motion}`,
    `STYLE (unchanged across the film): ${style.style_prompt || ""}`,
  ];
  for (const c of characters) {
    lines.push(`Keep ${c.name} identical to: ${c.locked_description}`);
  }
  if (location) lines.push(`Keep the environment identical to: ${location.locked_description}`);
  lines.push("No cuts, no scene changes, no morphing of faces or wardrobe.");
  return lines.filter(Boolean).join("\n");
}

/**
 * Re-injects the bible's locked descriptions into every prompt. Runs after any
 * model output so the verbatim rule holds even if a model paraphrased.
 */
export function enforceVerbatim(project: any): { repaired: number } {
  const bible = project.bible || {};
  let repaired = 0;

  for (const keyframe of project.keyframes || []) {
    const scene = (project.scenes || []).find((s: any) => s.scene_id === keyframe.scene_id);
    if (!scene) continue;
    const characters = (bible.characters || []).filter((c: any) => (scene.character_ids || []).includes(c.id));
    const location = (bible.locations || []).find((l: any) => l.id === scene.location_id);

    const missing = [
      ...characters.filter((c: any) => c.locked_description && !keyframe.image_prompt.includes(c.locked_description)),
      ...(location && location.locked_description && !keyframe.image_prompt.includes(location.locked_description)
        ? [location]
        : []),
    ];

    if (missing.length > 0) {
      for (const item of missing) {
        keyframe.image_prompt += `\n${item.id} (VERBATIM, re-injected): ${item.locked_description}`;
      }
      keyframe.drift_status = "corrected";
      keyframe.drift_notes = `Re-injected verbatim description for: ${missing.map((m: any) => m.id).join(", ")}`;
      repaired++;
    }
  }

  return { repaired };
}

// ---------------------------------------------------------------------------
// KEYFRAME IMAGES — each frame is conditioned on its reference images
// ---------------------------------------------------------------------------

function readMediaAsInline(url: string): { data: string; mimeType: string } | null {
  if (!url || !url.startsWith("/media/")) return null;
  const filePath = path.join(MEDIA_DIR, url.replace("/media/", ""));
  try {
    if (!fs.existsSync(filePath)) return null;
    const ext = path.extname(filePath).toLowerCase();
    // SVG placeholders are not valid model input; skip them as references.
    if (ext === ".svg") return null;
    const mimeType = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
    return { data: fs.readFileSync(filePath).toString("base64"), mimeType };
  } catch {
    return null;
  }
}

export async function generateKeyframeImage(
  project: any,
  keyframe: any
): Promise<{ url: string; source: "gemini" | "offline" }> {
  const bible = project.bible || {};
  const style = bible.visual_style || {};

  // Attach every reference the keyframe declares: character sheets, the
  // location plate, and the previous keyframe (visual continuity chain).
  const references: Array<{ data: string; mimeType: string }> = [];
  for (const refId of keyframe.reference_images || []) {
    const character = (bible.characters || []).find((c: any) => c.id === refId);
    const location = (bible.locations || []).find((l: any) => l.id === refId);
    const priorKeyframe = (project.keyframes || []).find((k: any) => k.id === refId);
    const url = character?.reference_image_url || location?.reference_image_url || priorKeyframe?.image_url;
    const inline = url ? readMediaAsInline(url) : null;
    if (inline) references.push(inline);
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      const image = await generateImage(ai, keyframe.image_prompt, references.slice(0, 4));
      if (image) {
        const url = saveMedia(project.id, `${keyframe.id}.png`, image.buffer);
        return { url, source: "gemini" };
      }
    } catch (err: any) {
      console.log(`[Keyframes] Image model unavailable for ${keyframe.id}:`, err?.message || err);
    }
  }

  const svg = placeholderImage(keyframe.id, keyframe.image_prompt, style.color_palette || [], style.aspect_ratio || "16:9");
  const url = saveMedia(project.id, `${keyframe.id}.svg`, svg);
  return { url, source: "offline" };
}

// ---------------------------------------------------------------------------
// VIDEO — image-to-video per shot
// ---------------------------------------------------------------------------

export async function generateShotVideo(
  project: any,
  shot: any,
  hooks: { onPoll?: (elapsedS: number) => void; signal?: { cancelled: boolean } } = {}
): Promise<{ url: string | null; source: "veo" | "storyboard" }> {
  const bible = project.bible || {};
  const startKeyframe = (project.keyframes || []).find((k: any) => k.id === shot.start_frame);
  const startImage = startKeyframe?.image_url ? readMediaAsInline(startKeyframe.image_url) : null;

  const ai = getGeminiClient();
  if (ai) {
    try {
      const video = await generateVideo(ai, {
        prompt: `${shot.camera}\n${shot.motion_prompt}`,
        startImage: startImage || undefined,
        durationS: shot.duration_s,
        aspectRatio: bible.visual_style?.aspect_ratio || "16:9",
        onPoll: hooks.onPoll,
        signal: hooks.signal,
      });
      if (video) {
        const url = saveMedia(project.id, `${shot.id}.mp4`, video.buffer);
        return { url, source: "veo" };
      }
    } catch (err: any) {
      if (String(err?.message || "").includes("Cancelled by user")) throw err;
      console.log(`[Video] Veo unavailable for ${shot.id}:`, err?.message || err);
    }
  }

  // Without a video model the shot still carries its start keyframe, so the
  // assembly can render it as a timed still (animatic) instead of failing.
  return { url: null, source: "storyboard" };
}

// ---------------------------------------------------------------------------
// STAGE 4 — QA / DRIFT
// ---------------------------------------------------------------------------

export async function runQA(project: any): Promise<any> {
  const bible = project.bible || {};
  const driftItems: any[] = [];

  // Deterministic audit first: any prompt that lost its verbatim description
  // is a hard drift, no model judgement needed.
  for (const keyframe of project.keyframes || []) {
    const scene = (project.scenes || []).find((s: any) => s.scene_id === keyframe.scene_id);
    if (!scene) continue;

    const expected = [
      ...(bible.characters || []).filter((c: any) => (scene.character_ids || []).includes(c.id)),
      ...(bible.locations || []).filter((l: any) => l.id === scene.location_id),
    ];

    for (const item of expected) {
      if (item.locked_description && !String(keyframe.image_prompt || "").includes(item.locked_description)) {
        driftItems.push({
          item_id: keyframe.id,
          item_type: bible.characters?.some((c: any) => c.id === item.id) ? "character" : "location",
          drift_details: `Keyframe ${keyframe.id} does not carry the verbatim locked description of ${item.id} (${item.name}).`,
          corrected_prompt: `${keyframe.image_prompt}\n${item.id} (VERBATIM): ${item.locked_description}`,
        });
      }
    }
  }

  // Missing-asset audit: anything the pipeline never produced.
  for (const character of bible.characters || []) {
    if (!character.reference_image_url) {
      driftItems.push({
        item_id: character.id,
        item_type: "character",
        drift_details: `No reference sheet generated for ${character.name}. Keyframes have no identity anchor.`,
        corrected_prompt: character.reference_sheet_prompt || "",
      });
    }
  }
  for (const location of bible.locations || []) {
    if (!location.reference_image_url) {
      driftItems.push({
        item_id: location.id,
        item_type: "location",
        drift_details: `No reference plate generated for ${location.name}.`,
        corrected_prompt: location.reference_prompt || "",
      });
    }
  }

  const unvoiced = (project.scenes || []).filter((s: any) => !s.real_audio_duration_s);
  for (const scene of unvoiced) {
    driftItems.push({
      item_id: scene.scene_id,
      item_type: "style",
      drift_details: `Scene ${scene.scene_id} has no measured audio duration; its shot timings are estimates only.`,
      corrected_prompt: "",
    });
  }

  return {
    status: driftItems.length === 0 ? "passed" : "drift_detected",
    checked_at: new Date().toISOString(),
    checked_keyframes: (project.keyframes || []).length,
    checked_shots: (project.shots || []).length,
    drift_items: driftItems,
  };
}

// ---------------------------------------------------------------------------
// ASSEMBLY — timeline, FFmpeg script, EDL
// ---------------------------------------------------------------------------

export function buildAssembly(project: any): any {
  const shots = project.shots || [];
  const scenes = project.scenes || [];
  const aspect = project.bible?.visual_style?.aspect_ratio || "16:9";
  const [width, height] = aspect === "9:16" ? [1080, 1920] : aspect === "1:1" ? [1080, 1080] : [1920, 1080];

  let timelineCursor = 0;
  const timeline = shots.map((shot: any) => {
    const scene = scenes.find((s: any) => s.scene_id === shot.scene_id);
    const keyframe = (project.keyframes || []).find((k: any) => k.id === shot.start_frame);
    const entry = {
      shot_id: shot.id,
      scene_id: shot.scene_id,
      timeline_in: parseFloat(timelineCursor.toFixed(2)),
      timeline_out: parseFloat((timelineCursor + shot.duration_s).toFixed(2)),
      duration_s: shot.duration_s,
      video_url: shot.video_url || null,
      still_url: keyframe?.image_url || null,
      audio_url: scene?.audio_url || null,
      audio_in: shot.audio_slice?.[0] ?? 0,
      audio_out: shot.audio_slice?.[1] ?? shot.duration_s,
      source: shot.video_url ? "video" : "still",
    };
    timelineCursor += shot.duration_s;
    return entry;
  });

  const totalDuration = parseFloat(timelineCursor.toFixed(2));

  const ffmpegScript = buildFfmpegScript(timeline, scenes, { width, height });
  const edl = buildEdl(timeline, project.title || "LongForm Project");

  return {
    generated_at: new Date().toISOString(),
    total_duration_s: totalDuration,
    total_duration_label: formatTimecode(totalDuration),
    resolution: `${width}x${height}`,
    shot_count: timeline.length,
    video_shot_count: timeline.filter((t: any) => t.source === "video").length,
    still_shot_count: timeline.filter((t: any) => t.source === "still").length,
    timeline,
    ffmpeg_script: ffmpegScript,
    edl,
  };
}

function buildFfmpegScript(timeline: any[], scenes: any[], size: { width: number; height: number }): string {
  const lines = [
    "#!/usr/bin/env bash",
    "# LongForm Studio — assembly script",
    "# Run from the project root; media paths resolve under .data/media/<project_id>/.",
    "# Storyboard stills are SVG when no image model was configured; ffmpeg needs",
    "# librsvg support for those, or re-run the pipeline with GEMINI_API_KEY set.",
    "set -euo pipefail",
    "",
    `OUT=\${1:-final_cut.mp4}`,
    `W=${size.width}; H=${size.height}`,
    "WORK=$(mktemp -d)",
    "",
    "# 1) Normalise every shot to a uniform clip",
  ];

  timeline.forEach((entry, i) => {
    const idx = String(i).padStart(3, "0");
    if (entry.source === "video" && entry.video_url) {
      lines.push(
        `ffmpeg -y -i ".data${entry.video_url}" -t ${entry.duration_s} -vf "scale=$W:$H:force_original_aspect_ratio=increase,crop=$W:$H,fps=24" -an "$WORK/clip_${idx}.mp4"`
      );
    } else if (entry.still_url) {
      lines.push(
        `ffmpeg -y -loop 1 -i ".data${entry.still_url}" -t ${entry.duration_s} -vf "scale=$W:$H:force_original_aspect_ratio=increase,crop=$W:$H,zoompan=z='min(zoom+0.0006,1.10)':d=${Math.round(entry.duration_s * 24)}:s=${size.width}x${size.height},fps=24" -pix_fmt yuv420p -an "$WORK/clip_${idx}.mp4"`
      );
    } else {
      lines.push(`# clip_${idx}: no media available for ${entry.shot_id}`);
    }
  });

  lines.push("", "# 2) Concatenate the picture track");
  lines.push(`for f in "$WORK"/clip_*.mp4; do echo "file '$f'" >> "$WORK/list.txt"; done`);
  lines.push(`ffmpeg -y -f concat -safe 0 -i "$WORK/list.txt" -c copy "$WORK/picture.mp4"`);

  lines.push("", "# 3) Build the narration track from the per-scene audio");
  const audioScenes = scenes.filter((s: any) => s.audio_url);
  if (audioScenes.length > 0) {
    audioScenes.forEach((scene: any) => {
      lines.push(`echo "file '$(pwd)/.data${scene.audio_url}'" >> "$WORK/audio_list.txt" # ${scene.scene_id}`);
    });
    lines.push(`ffmpeg -y -f concat -safe 0 -i "$WORK/audio_list.txt" -c:a aac -b:a 192k "$WORK/narration.m4a"`);
    lines.push("", "# 4) Mux picture + narration");
    lines.push(`ffmpeg -y -i "$WORK/picture.mp4" -i "$WORK/narration.m4a" -c:v libx264 -crf 18 -preset medium -c:a aac -shortest "$OUT"`);
  } else {
    lines.push("# No narration audio generated yet — exporting picture only.");
    lines.push(`ffmpeg -y -i "$WORK/picture.mp4" -c:v libx264 -crf 18 -preset medium "$OUT"`);
  }

  lines.push("", `rm -rf "$WORK"`, `echo "Done: $OUT"`);
  return lines.join("\n");
}

function buildEdl(timeline: any[], title: string): string {
  const lines = [`TITLE: ${title}`, "FCM: NON-DROP FRAME", ""];
  timeline.forEach((entry, i) => {
    const num = String(i + 1).padStart(3, "0");
    const reel = entry.shot_id.slice(0, 8).toUpperCase();
    lines.push(
      `${num}  ${reel} V     C        ${formatTimecode(0)} ${formatTimecode(entry.duration_s)} ${formatTimecode(entry.timeline_in)} ${formatTimecode(entry.timeline_out)}`
    );
    lines.push(`* FROM CLIP NAME: ${entry.video_url || entry.still_url || entry.shot_id}`);
    lines.push("");
  });
  return lines.join("\n");
}

function formatTimecode(seconds: number): string {
  const total = Math.max(0, seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  const f = Math.floor((total % 1) * 24);
  return [h, m, s, f].map((n) => String(n).padStart(2, "0")).join(":");
}
