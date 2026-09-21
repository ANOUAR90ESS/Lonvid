export type SupportedLanguage = 'ar' | 'en' | 'es';

export interface VisualStyle {
  style_prompt: string;
  color_palette: string[];
  aspect_ratio: '16:9' | '9:16' | '1:1' | '21:9';
  negative_prompt: string;
}

export interface CharacterVoice {
  voice_id: string; // e.g. "Fenrir", "Kore", "Puck", "Charon", "Zephyr"
  tone: string; // e.g. "Deep resonant baritone, quiet grit"
  pitch?: string; // e.g. "Deep / Low", "Medium", "High"
  pace?: string; // e.g. "Deliberate & measured (~135 wpm)", "Moderate (~150 wpm)", "Urgent (~175 wpm)"
  accent_or_style?: string; // e.g. "Cyberpunk Noir / Cinematic", "Academic / Analytical", "Fast Staccato"
  vocal_traits?: string[]; // e.g. ["Gravelly breathing", "Subtle cybernetic reverb", "Measured pauses"]
}

export interface Character {
  id: string; // e.g., "CHAR_01"
  name: string;
  locked_description: string; // one dense paragraph: species, size, colors, markings, clothing, accessories, proportions
  voice: CharacterVoice;
  reference_sheet_prompt: string;
  locked?: boolean;
  reference_image_url?: string;
  reference_approved?: boolean;
}

export interface Location {
  id: string; // e.g., "LOC_01"
  name: string;
  locked_description: string;
  reference_prompt: string;
  locked?: boolean;
  reference_image_url?: string;
  reference_approved?: boolean;
}

export interface ProjectBible {
  title: string;
  logline: string;
  target_duration_min: number;
  visual_style: VisualStyle;
  characters: Character[];
  locations: Location[];
}

export interface Scene {
  scene_id: string; // e.g., "S001"
  location_id: string;
  character_ids: string[];
  summary: string;
  narration_text: string;
  emotional_beat: string;
  word_count: number;
  estimated_duration_s: number;
  real_audio_duration_s?: number;
  audio_url?: string;
  audio_generated_at?: string;
  voice_provider?: 'gemini_tts' | 'elevenlabs' | 'native_synth';
  voice_id?: string;
  status: 'draft' | 'voiced' | 'shots_ready' | 'rendered';
}

export interface Keyframe {
  id: string; // e.g. "S001_K1"
  scene_id: string;
  image_prompt: string;
  reference_images: string[];
  negative_prompt: string;
  image_url?: string;
  status: 'pending' | 'generating' | 'approved' | 'failed';
  drift_status?: 'ok' | 'drift_detected' | 'corrected';
  drift_notes?: string;
  seed?: number;
  cost?: number;
}

export interface Shot {
  id: string; // e.g. "S001_SH1"
  scene_id: string;
  start_frame: string;
  end_frame: string;
  duration_s: number;
  camera: string;
  motion_prompt: string;
  audio_slice: [number, number];
  video_url?: string;
  /** 'storyboard' = no video model available, the shot stays a timed still. */
  status: 'pending' | 'generating' | 'completed' | 'storyboard' | 'failed';
  cost?: number;
}

export interface CostEntry {
  at: string;
  kind: string;
  amount: number;
  detail: string;
}

export interface TimelineEntry {
  shot_id: string;
  scene_id: string;
  timeline_in: number;
  timeline_out: number;
  duration_s: number;
  video_url: string | null;
  still_url: string | null;
  audio_url: string | null;
  audio_in: number;
  audio_out: number;
  source: 'video' | 'still';
}

export interface Assembly {
  generated_at: string;
  total_duration_s: number;
  total_duration_label: string;
  resolution: string;
  shot_count: number;
  video_shot_count: number;
  still_shot_count: number;
  timeline: TimelineEntry[];
  ffmpeg_script: string;
  edl: string;
}

export interface DriftItem {
  item_id: string;
  item_type: 'character' | 'location' | 'style';
  drift_details: string;
  corrected_prompt: string;
}

export interface QAReport {
  status: 'passed' | 'drift_detected';
  checked_at: string;
  checked_keyframes: number;
  checked_shots: number;
  drift_items: DriftItem[];
}

export type PipelineStepKey =
  | 'bible'
  | 'script'
  | 'voice'
  | 'references'
  | 'breakdown'
  | 'keyframes'
  | 'video'
  | 'assembly'
  | 'qa';

export interface PipelineStep {
  key: PipelineStepKey;
  label: string;
  phase: number;
  status: 'pending' | 'running' | 'done' | 'skipped' | 'failed';
  progress: number;
  total: number;
  message: string;
  error?: string;
}

export interface PipelineJob {
  id: string;
  project_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'budget_exceeded';
  steps: PipelineStep[];
  current_step: PipelineStepKey | null;
  created_at: string;
  finished_at?: string;
  log: Array<{ at: string; level: 'info' | 'warn' | 'error'; message: string }>;
}

export interface PhaseProgress {
  phase1: number; // 0-100: Data model, Bible editor, Script, Voice
  phase2: number; // 0-100: References, Shot breakdown, Image generation
  phase3: number; // 0-100: Video generation, Queue, Assembly
  phase4: number; // 0-100: QA panel, Cost tracking, Polish
}

export interface Project {
  id: string;
  title: string;
  idea: string;
  target_duration_min: number;
  pilot_mode: boolean; // Pilot mode: first 3 minutes only
  budget_limit: number;
  spent_cost: number;
  current_stage: number; // 1: Bible, 2: References, 3: Script, 4: Voice, 5: Shots, 6: Images, 7: Video, 8: Assembly, 9: QA
  bible: ProjectBible;
  scenes: Scene[];
  keyframes?: Keyframe[];
  shots?: Shot[];
  created_at: string;
  updated_at: string;
  phase_progress: PhaseProgress;
  assembly?: Assembly;
  qa?: QAReport;
  cost_log?: CostEntry[];
}

export interface ProviderSettings {
  llm_provider: 'gemini';
  llm_model: string;
  voice_provider: 'gemini_tts' | 'elevenlabs' | 'native_synth';
  voice_model: string;
  image_provider: 'gemini';
  image_model?: string;
  video_provider: 'veo';
  video_model?: string;
  has_gemini_key: boolean;
  has_elevenlabs_key: boolean;
  /** True when no Gemini key is configured: the pipeline runs on offline stand-ins. */
  offline_mode?: boolean;
  cost_table?: Record<string, number>;
}

export interface DirectorAIBibleOutput {
  title: string;
  logline: string;
  target_duration_min: number;
  visual_style: VisualStyle;
  characters: Character[];
  locations: Location[];
}

export interface DirectorAIScriptOutput {
  scenes: Array<{
    scene_id: string;
    location_id: string;
    character_ids: string[];
    summary: string;
    narration_text: string;
    emotional_beat: string;
  }>;
}

export interface DirectorAIShotOutput {
  scene_id: string;
  audio_duration_s: number;
  keyframes: Array<{
    id: string;
    image_prompt: string;
    reference_images: string[];
    negative_prompt: string;
  }>;
  shots: Array<{
    id: string;
    start_frame: string;
    end_frame: string;
    duration_s: number;
    camera: string;
    motion_prompt: string;
    audio_slice: [number, number];
  }>;
}

export interface DirectorAIQAOutput {
  status: 'passed' | 'drift_detected';
  drift_items: Array<{
    item_id: string;
    item_type: 'character' | 'location' | 'style';
    drift_details: string;
    corrected_prompt: string;
  }>;
}
