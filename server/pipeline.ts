/**
 * Pipeline orchestrator.
 *
 * Runs the whole production end to end (Bible -> QA) as a single resumable
 * job: work already done is skipped unless forced, every unit is budget
 * checked before it spends, failures inside a step are recorded without
 * killing the run, and progress is streamed to the UI over SSE.
 */
import { EventEmitter } from "events";
import { COST } from "./config.ts";
import {
  buildAssembly,
  enforceVerbatim,
  generateBible,
  generateBreakdown,
  generateKeyframeImage,
  generateReferenceImage,
  generateScript,
  generateShotVideo,
  generateVoice,
  runQA,
} from "./director.ts";
import { chargeProject, getProject, saveProject, wouldExceedBudget } from "./store.ts";

export type StepKey =
  | "bible"
  | "references"
  | "script"
  | "voice"
  | "breakdown"
  | "keyframes"
  | "video"
  | "assembly"
  | "qa";

export const PIPELINE_STEPS: Array<{ key: StepKey; label: string; phase: 1 | 2 | 3 | 4 }> = [
  { key: "bible", label: "Stage 1 — Project Bible", phase: 1 },
  { key: "script", label: "Stage 2 — Script", phase: 1 },
  { key: "voice", label: "Voice & real duration", phase: 1 },
  { key: "references", label: "Reference sheets & plates", phase: 2 },
  { key: "breakdown", label: "Stage 3 — Shot breakdown", phase: 2 },
  { key: "keyframes", label: "Keyframe images (K1..Kn)", phase: 2 },
  { key: "video", label: "Image-to-video shots", phase: 3 },
  { key: "assembly", label: "Timeline & export package", phase: 3 },
  { key: "qa", label: "Stage 4 — Drift QA", phase: 4 },
];

export interface StepState {
  key: StepKey;
  label: string;
  phase: number;
  status: "pending" | "running" | "done" | "skipped" | "failed";
  progress: number;
  total: number;
  message: string;
  error?: string;
}

export interface PipelineJob {
  id: string;
  project_id: string;
  status: "running" | "completed" | "failed" | "cancelled" | "budget_exceeded";
  steps: StepState[];
  current_step: StepKey | null;
  created_at: string;
  finished_at?: string;
  log: Array<{ at: string; level: "info" | "warn" | "error"; message: string }>;
  cancelled: boolean;
}

const jobs = new Map<string, PipelineJob>();
const jobsByProject = new Map<string, string>();
export const pipelineEvents = new EventEmitter();
pipelineEvents.setMaxListeners(100);

export function getJob(jobId: string): PipelineJob | undefined {
  return jobs.get(jobId);
}

export function getJobForProject(projectId: string): PipelineJob | undefined {
  const id = jobsByProject.get(projectId);
  return id ? jobs.get(id) : undefined;
}

export function cancelJob(jobId: string): boolean {
  const job = jobs.get(jobId);
  if (!job || job.status !== "running") return false;
  job.cancelled = true;
  log(job, "warn", "Cancellation requested — stopping after the current unit.");
  emit(job);
  return true;
}

function emit(job: PipelineJob, project?: any): void {
  pipelineEvents.emit(job.id, { job: publicJob(job), project: project || getProject(job.project_id) });
}

/** Strips internal fields before the job crosses the wire. */
function publicJob(job: PipelineJob) {
  const { cancelled, ...rest } = job;
  return rest;
}
export { publicJob };

function log(job: PipelineJob, level: "info" | "warn" | "error", message: string): void {
  job.log.push({ at: new Date().toISOString(), level, message });
  if (job.log.length > 400) job.log.splice(0, job.log.length - 400);
  const prefix = level === "error" ? "[pipeline:error]" : "[pipeline]";
  console.log(`${prefix} ${message}`);
}

function setStep(job: PipelineJob, key: StepKey, patch: Partial<StepState>): void {
  const step = job.steps.find((s) => s.key === key);
  if (!step) return;
  Object.assign(step, patch);
  emit(job);
}

class BudgetStop extends Error {}
class Cancelled extends Error {}

/** Throws if the job was cancelled or the next unit would break the budget. */
function guard(job: PipelineJob, cost: number, what: string): void {
  if (job.cancelled) throw new Cancelled();
  if (cost > 0 && wouldExceedBudget(job.project_id, cost)) {
    throw new BudgetStop(`Budget limit reached before ${what}.`);
  }
}

export interface PipelineOptions {
  steps?: StepKey[];
  force?: boolean;
  /** Skip video generation (the expensive step) and assemble from stills. */
  skipVideo?: boolean;
}

export function startPipeline(projectId: string, options: PipelineOptions = {}): PipelineJob {
  const existing = getJobForProject(projectId);
  if (existing && existing.status === "running") return existing;

  const project = getProject(projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);

  const requested = options.steps && options.steps.length > 0 ? new Set(options.steps) : null;
  const selected = PIPELINE_STEPS.filter((s) => (requested ? requested.has(s.key) : true)).filter(
    (s) => !(options.skipVideo && s.key === "video")
  );

  const job: PipelineJob = {
    id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    project_id: projectId,
    status: "running",
    steps: selected.map((s) => ({
      key: s.key,
      label: s.label,
      phase: s.phase,
      status: "pending",
      progress: 0,
      total: 0,
      message: "",
    })),
    current_step: null,
    created_at: new Date().toISOString(),
    log: [],
    cancelled: false,
  };

  jobs.set(job.id, job);
  jobsByProject.set(projectId, job.id);

  // Run detached; the client follows along over SSE.
  void runJob(job, options).catch((err) => {
    job.status = "failed";
    job.finished_at = new Date().toISOString();
    log(job, "error", `Pipeline crashed: ${err?.message || err}`);
    emit(job);
  });

  return job;
}

async function runJob(job: PipelineJob, options: PipelineOptions): Promise<void> {
  log(job, "info", `Pipeline started for project ${job.project_id}.`);
  emit(job);

  try {
    for (const step of job.steps) {
      job.current_step = step.key;
      setStep(job, step.key, { status: "running", message: "Working..." });

      try {
        await runStep(job, step, options);
        if (step.status === "running") setStep(job, step.key, { status: "done", progress: step.total || 1 });
      } catch (err: any) {
        if (err instanceof Cancelled || err instanceof BudgetStop) throw err;
        setStep(job, step.key, { status: "failed", error: String(err?.message || err) });
        log(job, "error", `${step.label} failed: ${err?.message || err}`);
      }
    }

    job.status = "completed";
    log(job, "info", "Pipeline finished.");
  } catch (err: any) {
    if (err instanceof Cancelled) {
      job.status = "cancelled";
      log(job, "warn", "Pipeline cancelled.");
    } else if (err instanceof BudgetStop) {
      job.status = "budget_exceeded";
      log(job, "warn", err.message);
    } else {
      job.status = "failed";
      log(job, "error", `Pipeline failed: ${err?.message || err}`);
    }
    for (const step of job.steps) {
      if (step.status === "running" || step.status === "pending") {
        setStep(job, step.key, { status: step.status === "running" ? "failed" : "skipped" });
      }
    }
  } finally {
    job.current_step = null;
    job.finished_at = new Date().toISOString();
    recomputeProgress(job.project_id);
    emit(job);
  }
}

async function runStep(job: PipelineJob, step: StepState, options: PipelineOptions): Promise<void> {
  const force = !!options.force;

  switch (step.key) {
    case "bible":
      return stepBible(job, step, force);
    case "script":
      return stepScript(job, step, force);
    case "voice":
      return stepVoice(job, step, force);
    case "references":
      return stepReferences(job, step, force);
    case "breakdown":
      return stepBreakdown(job, step, force);
    case "keyframes":
      return stepKeyframes(job, step, force);
    case "video":
      return stepVideo(job, step, force);
    case "assembly":
      return stepAssembly(job, step);
    case "qa":
      return stepQA(job, step);
  }
}

// --- individual steps -------------------------------------------------------

async function stepBible(job: PipelineJob, step: StepState, force: boolean): Promise<void> {
  const project = requireProject(job);
  const hasBible = !!project.bible?.title && (project.bible?.characters || []).length > 0;

  if (hasBible && !force) {
    setStep(job, step.key, { status: "skipped", message: "Bible already present." });
    return;
  }

  guard(job, COST.llm_call, "Bible generation");
  setStep(job, step.key, { total: 1, message: "Director AI is structuring the Bible..." });

  const { bible, source } = await generateBible(project.idea || project.title, project.target_duration_min || 30);
  project.bible = bible;
  project.title = bible.title || project.title;
  project.current_stage = Math.max(project.current_stage || 1, 1);
  saveProject(project);
  chargeProject(project.id, "llm", COST.llm_call, "Stage 1 Bible");

  setStep(job, step.key, {
    status: "done",
    progress: 1,
    total: 1,
    message: `Bible ready (${bible.characters.length} characters, ${bible.locations.length} locations) — ${source}.`,
  });
}

async function stepScript(job: PipelineJob, step: StepState, force: boolean): Promise<void> {
  const project = requireProject(job);
  if ((project.scenes || []).length > 0 && !force) {
    setStep(job, step.key, { status: "skipped", message: `${project.scenes.length} scenes already written.` });
    return;
  }

  guard(job, COST.llm_call, "Script generation");
  setStep(job, step.key, { total: 1, message: "Director AI is writing the script..." });

  const { scenes, source } = await generateScript(project.bible, !!project.pilot_mode);
  project.scenes = scenes;
  project.current_stage = Math.max(project.current_stage || 1, 3);
  saveProject(project);
  chargeProject(project.id, "llm", COST.llm_call, "Stage 2 Script");

  setStep(job, step.key, {
    status: "done",
    progress: 1,
    total: 1,
    message: `${scenes.length} scenes written — ${source}.`,
  });
}

async function stepVoice(job: PipelineJob, step: StepState, force: boolean): Promise<void> {
  const project = requireProject(job);
  const scenes = project.scenes || [];
  const pending = force ? scenes : scenes.filter((s: any) => !s.real_audio_duration_s);

  setStep(job, step.key, { total: pending.length, message: `${pending.length} scenes to voice.` });
  if (pending.length === 0) {
    setStep(job, step.key, { status: "skipped", message: "All scenes already voiced." });
    return;
  }

  let done = 0;
  for (const scene of pending) {
    guard(job, COST.tts_scene, `voicing ${scene.scene_id}`);
    const character =
      (project.bible?.characters || []).find((c: any) => (scene.character_ids || []).includes(c.id)) ||
      project.bible?.characters?.[0];
    const voiceId = character?.voice?.voice_id || "Fenrir";

    const result = await generateVoice(project.id, scene, voiceId);
    Object.assign(scene, {
      real_audio_duration_s: result.duration_s,
      audio_url: result.audio_url,
      audio_generated_at: new Date().toISOString(),
      voice_provider: result.provider,
      voice_id: result.voice_id,
      status: "voiced",
    });
    saveProject(project);
    chargeProject(project.id, "tts", COST.tts_scene, `Voice ${scene.scene_id}`);

    done++;
    setStep(job, step.key, {
      progress: done,
      message: `Voiced ${scene.scene_id} — ${result.duration_s}s (${result.provider}).`,
    });
  }

  project.current_stage = Math.max(project.current_stage || 1, 4);
  saveProject(project);
}

async function stepReferences(job: PipelineJob, step: StepState, force: boolean): Promise<void> {
  const project = requireProject(job);
  const bible = project.bible || {};
  const items: Array<{ kind: "character" | "location"; item: any }> = [
    ...(bible.characters || []).map((item: any) => ({ kind: "character" as const, item })),
    ...(bible.locations || []).map((item: any) => ({ kind: "location" as const, item })),
  ];
  const pending = force ? items : items.filter(({ item }) => !item.reference_image_url);

  setStep(job, step.key, { total: pending.length, message: `${pending.length} reference images to render.` });
  if (pending.length === 0) {
    setStep(job, step.key, { status: "skipped", message: "All references already rendered." });
    return;
  }

  let done = 0;
  for (const { kind, item } of pending) {
    guard(job, COST.reference_image, `reference ${item.id}`);
    const result = await generateReferenceImage(project.id, bible, kind, item);
    item.reference_image_url = result.url;
    item.reference_approved = result.source === "gemini";
    saveProject(project);
    chargeProject(project.id, "image", COST.reference_image, `Reference ${item.id}`);

    done++;
    setStep(job, step.key, { progress: done, message: `Reference ready: ${item.id} (${result.source}).` });
  }

  project.current_stage = Math.max(project.current_stage || 1, 5);
  saveProject(project);
}

async function stepBreakdown(job: PipelineJob, step: StepState, force: boolean): Promise<void> {
  const project = requireProject(job);
  const scenes = project.scenes || [];

  if (!force && (project.shots || []).length > 0) {
    const covered = new Set((project.shots || []).map((s: any) => s.scene_id));
    if (scenes.every((s: any) => covered.has(s.scene_id))) {
      setStep(job, step.key, { status: "skipped", message: "Shot breakdown already complete." });
      return;
    }
  }

  setStep(job, step.key, { total: scenes.length, message: `Breaking down ${scenes.length} scenes.` });

  const keyframes: any[] = force ? [] : (project.keyframes || []).slice();
  const shots: any[] = force ? [] : (project.shots || []).slice();
  let done = 0;
  let previousKeyframePrompt: string | null = null;

  for (const scene of scenes) {
    guard(job, COST.llm_call, `breakdown of ${scene.scene_id}`);

    const already = shots.some((s: any) => s.scene_id === scene.scene_id);
    if (already && !force) {
      const sceneKeyframes = keyframes.filter((k: any) => k.scene_id === scene.scene_id);
      previousKeyframePrompt = sceneKeyframes[sceneKeyframes.length - 1]?.image_prompt || previousKeyframePrompt;
      done++;
      setStep(job, step.key, { progress: done, message: `${scene.scene_id} already broken down.` });
      continue;
    }

    const result = await generateBreakdown(project.bible, scene, previousKeyframePrompt);
    // Replace any partial data for this scene.
    for (let i = keyframes.length - 1; i >= 0; i--) if (keyframes[i].scene_id === scene.scene_id) keyframes.splice(i, 1);
    for (let i = shots.length - 1; i >= 0; i--) if (shots[i].scene_id === scene.scene_id) shots.splice(i, 1);

    keyframes.push(...result.keyframes);
    shots.push(...result.shots);
    previousKeyframePrompt = result.keyframes[result.keyframes.length - 1]?.image_prompt || previousKeyframePrompt;

    scene.status = "shots_ready";
    project.keyframes = keyframes;
    project.shots = shots;
    saveProject(project);
    chargeProject(project.id, "llm", COST.llm_call, `Stage 3 breakdown ${scene.scene_id}`);

    done++;
    setStep(job, step.key, {
      progress: done,
      message: `${scene.scene_id}: ${result.keyframes.length} keyframes / ${result.shots.length} shots.`,
    });
  }

  const { repaired } = enforceVerbatim(project);
  project.current_stage = Math.max(project.current_stage || 1, 5);
  saveProject(project);

  if (repaired > 0) {
    log(job, "warn", `Verbatim rule enforced on ${repaired} keyframe prompts.`);
  }
}

async function stepKeyframes(job: PipelineJob, step: StepState, force: boolean): Promise<void> {
  const project = requireProject(job);
  const keyframes = project.keyframes || [];
  const pending = force ? keyframes : keyframes.filter((k: any) => !k.image_url);

  setStep(job, step.key, { total: pending.length, message: `${pending.length} keyframes to render.` });
  if (pending.length === 0) {
    setStep(job, step.key, { status: "skipped", message: "All keyframes already rendered." });
    return;
  }

  let done = 0;
  // Sequential on purpose: each keyframe uses the previous one as a reference.
  for (const keyframe of pending) {
    guard(job, COST.keyframe_image, `keyframe ${keyframe.id}`);
    keyframe.status = "generating";
    emit(job);

    try {
      const result = await generateKeyframeImage(project, keyframe);
      keyframe.image_url = result.url;
      keyframe.status = "approved";
      chargeProject(project.id, "image", COST.keyframe_image, `Keyframe ${keyframe.id}`);
    } catch (err: any) {
      keyframe.status = "failed";
      log(job, "error", `Keyframe ${keyframe.id} failed: ${err?.message || err}`);
    }

    saveProject(project);
    done++;
    setStep(job, step.key, { progress: done, message: `Keyframe ${keyframe.id} ${keyframe.status}.` });
  }

  project.current_stage = Math.max(project.current_stage || 1, 6);
  saveProject(project);
}

async function stepVideo(job: PipelineJob, step: StepState, force: boolean): Promise<void> {
  const project = requireProject(job);
  const shots = project.shots || [];
  const pending = force ? shots : shots.filter((s: any) => !s.video_url && s.status !== "storyboard");

  setStep(job, step.key, { total: pending.length, message: `${pending.length} shots to render.` });
  if (pending.length === 0) {
    setStep(job, step.key, { status: "skipped", message: "All shots already rendered." });
    return;
  }

  let done = 0;
  for (const shot of pending) {
    guard(job, COST.video_shot, `shot ${shot.id}`);
    shot.status = "generating";
    saveProject(project);
    emit(job);

    try {
      const result = await generateShotVideo(project, shot, {
        onPoll: (elapsed) =>
          setStep(job, step.key, { message: `Rendering ${shot.id} — ${elapsed}s elapsed (${done}/${pending.length} done).` }),
        signal: { get cancelled() { return job.cancelled; } } as any,
      });

      if (result.url) {
        shot.video_url = result.url;
        shot.status = "completed";
        shot.cost = COST.video_shot;
        chargeProject(project.id, "video", COST.video_shot, `Shot ${shot.id}`);
      } else {
        // No video model available: keep the shot as a timed still.
        shot.status = "storyboard";
      }
    } catch (err: any) {
      if (String(err?.message || "").includes("Cancelled")) throw new Cancelled();
      shot.status = "failed";
      log(job, "error", `Shot ${shot.id} failed: ${err?.message || err}`);
    }

    saveProject(project);
    done++;
    setStep(job, step.key, { progress: done, message: `Shot ${shot.id}: ${shot.status}.` });
  }

  project.current_stage = Math.max(project.current_stage || 1, 7);
  saveProject(project);
}

async function stepAssembly(job: PipelineJob, step: StepState): Promise<void> {
  const project = requireProject(job);
  setStep(job, step.key, { total: 1, message: "Building timeline and export package..." });

  project.assembly = buildAssembly(project);
  project.current_stage = Math.max(project.current_stage || 1, 8);
  saveProject(project);

  setStep(job, step.key, {
    status: "done",
    progress: 1,
    total: 1,
    message: `Timeline: ${project.assembly.shot_count} shots, ${project.assembly.total_duration_label}.`,
  });
}

async function stepQA(job: PipelineJob, step: StepState): Promise<void> {
  const project = requireProject(job);
  setStep(job, step.key, { total: 1, message: "Auditing continuity..." });

  project.qa = await runQA(project);
  project.current_stage = Math.max(project.current_stage || 1, 9);
  saveProject(project);

  setStep(job, step.key, {
    status: "done",
    progress: 1,
    total: 1,
    message:
      project.qa.status === "passed"
        ? "No drift detected."
        : `${project.qa.drift_items.length} drift items found.`,
  });
}

// --- helpers ---------------------------------------------------------------

function requireProject(job: PipelineJob): any {
  const project = getProject(job.project_id);
  if (!project) throw new Error(`Project ${job.project_id} disappeared mid-run`);
  return project;
}

/** Derives the four phase percentages from what actually exists on disk. */
export function recomputeProgress(projectId: string): void {
  const project = getProject(projectId);
  if (!project) return;

  const scenes = project.scenes || [];
  const keyframes = project.keyframes || [];
  const shots = project.shots || [];
  const characters = project.bible?.characters || [];
  const locations = project.bible?.locations || [];

  const ratio = (done: number, total: number) => (total === 0 ? 0 : Math.round((done / total) * 100));

  const phase1 =
    Math.round(
      ((project.bible?.title ? 1 : 0) * 30 +
        (scenes.length > 0 ? 1 : 0) * 30 +
        (scenes.length > 0 ? scenes.filter((s: any) => s.real_audio_duration_s).length / scenes.length : 0) * 40)
    );

  const refTotal = characters.length + locations.length;
  const refDone =
    characters.filter((c: any) => c.reference_image_url).length +
    locations.filter((l: any) => l.reference_image_url).length;
  const phase2 = Math.round(
    ratio(refDone, refTotal) * 0.3 +
      (shots.length > 0 ? 100 : 0) * 0.2 +
      ratio(keyframes.filter((k: any) => k.image_url).length, keyframes.length) * 0.5
  );

  const renderedShots = shots.filter((s: any) => s.video_url || s.status === "storyboard").length;
  const phase3 = Math.round(ratio(renderedShots, shots.length) * 0.7 + (project.assembly ? 100 : 0) * 0.3);

  const phase4 = project.qa ? (project.qa.status === "passed" ? 100 : 60) : 0;

  project.phase_progress = {
    phase1: Math.min(100, phase1),
    phase2: Math.min(100, phase2),
    phase3: Math.min(100, phase3),
    phase4: Math.min(100, phase4),
  };
  saveProject(project);
}
