/**
 * Central configuration: models, cost table, paths.
 * Everything tunable lives here so the pipeline never hardcodes a model name.
 */
import path from "path";

export const PORT = Number(process.env.PORT) || 3000;

export const DATA_DIR = path.join(process.cwd(), ".data");
export const MEDIA_DIR = path.join(DATA_DIR, "media");
export const STORE_FILE = path.join(DATA_DIR, "projects-store.json");
/** Legacy store location kept for one-time migration. */
export const LEGACY_STORE_FILE = path.join(process.cwd(), "projects-store.json");

export const MODELS = {
  text: ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"],
  tts: "gemini-3.1-flash-tts-preview",
  image: ["gemini-3-pro-image-preview", "gemini-2.5-flash-image"],
  video: ["veo-3.1-fast-generate-preview", "veo-3.0-fast-generate-001"],
};

/** Gemini prebuilt TTS voices. Anything else falls back to Puck. */
export const VALID_TTS_VOICES = ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"];

/**
 * Estimated USD cost per operation. Used for budget guarding and the
 * cost ledger; these are estimates, not billed amounts.
 */
export const COST = {
  llm_call: 0.01,
  tts_scene: 0.02,
  reference_image: 0.04,
  keyframe_image: 0.04,
  video_shot: 0.35,
};

/** Keyframes generated per scene (K1..K4). K4 chains into the next scene. */
export const KEYFRAMES_PER_SCENE = 4;

/** Max seconds a single I2V shot may cover. */
export const MAX_SHOT_DURATION_S = 8;

export function hasGeminiKey(): boolean {
  const k = process.env.GEMINI_API_KEY;
  return !!k && k !== "MY_GEMINI_API_KEY";
}

export function hasElevenLabsKey(): boolean {
  return !!process.env.ELEVENLABS_API_KEY;
}
