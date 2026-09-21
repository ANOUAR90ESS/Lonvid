/**
 * HTTP surface. Thin layer: validation, then delegate to director/pipeline.
 */
import express from "express";
import { COST, MODELS, hasElevenLabsKey, hasGeminiKey } from "./config.ts";
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
import { chargeProject, deleteProject, getProject, listProjects, saveProject } from "./store.ts";
import { deleteProjectMedia } from "./media.ts";
import {
  PIPELINE_STEPS,
  cancelJob,
  getJob,
  getJobForProject,
  pipelineEvents,
  publicJob,
  recomputeProgress,
  startPipeline,
  type StepKey,
} from "./pipeline.ts";

export const router = express.Router();

/** Wraps an async handler so a rejection becomes a 500 instead of a hang. */
function asyncRoute(fn: express.RequestHandler): express.RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error(`[api] ${req.method} ${req.path} failed:`, err);
      if (!res.headersSent) {
        res.status(500).json({ error: String(err?.message || err) });
      }
    });
  };
}

// --- health & settings -----------------------------------------------------

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    geminiConfigured: hasGeminiKey(),
    elevenLabsConfigured: hasElevenLabsKey(),
  });
});

router.get("/settings", (req, res) => {
  const gemini = hasGeminiKey();
  res.json({
    llm_provider: "gemini",
    llm_model: MODELS.text[0],
    voice_provider: hasElevenLabsKey() ? "elevenlabs" : gemini ? "gemini_tts" : "native_synth",
    voice_model: MODELS.tts,
    image_provider: "gemini",
    image_model: MODELS.image[0],
    video_provider: "veo",
    video_model: MODELS.video[0],
    has_gemini_key: gemini,
    has_elevenlabs_key: hasElevenLabsKey(),
    offline_mode: !gemini,
    cost_table: COST,
    pipeline_steps: PIPELINE_STEPS,
  });
});

// --- projects --------------------------------------------------------------

router.get("/projects", (req, res) => {
  res.json(listProjects());
});

router.get("/projects/:id", (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });
  res.json(project);
});

router.post("/projects", (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== "object") {
    return res.status(400).json({ error: "Project payload is required." });
  }

  // A running pipeline owns the project; refuse client writes that would
  // clobber the work in flight.
  const job = incoming.id ? getJobForProject(incoming.id) : undefined;
  if (job && job.status === "running") {
    return res.status(409).json({ error: "Pipeline is running for this project.", job: publicJob(job) });
  }

  res.json(saveProject(incoming));
});

router.delete("/projects/:id", (req, res) => {
  const job = getJobForProject(req.params.id);
  if (job && job.status === "running") cancelJob(job.id);
  deleteProject(req.params.id);
  deleteProjectMedia(req.params.id);
  res.json({ success: true, id: req.params.id });
});

// --- director stages (single-shot, used by the per-module buttons) ---------

router.post(
  "/director/stage1-bible",
  asyncRoute(async (req, res) => {
    const { idea, target_duration_min = 30 } = req.body;
    if (!idea || typeof idea !== "string") {
      return res.status(400).json({ error: "Story idea is required." });
    }
    const { bible } = await generateBible(idea, target_duration_min);
    res.json(bible);
  })
);

router.post(
  "/director/stage2-script",
  asyncRoute(async (req, res) => {
    const { bible, pilot_mode = false } = req.body;
    if (!bible || !bible.title) {
      return res.status(400).json({ error: "Project Bible is required for Script generation." });
    }
    const { scenes } = await generateScript(bible, pilot_mode);
    res.json({ scenes });
  })
);

router.post(
  "/director/stage3-breakdown",
  asyncRoute(async (req, res) => {
    const { project_id } = req.body;
    const project = getProject(project_id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!(project.scenes || []).length) return res.status(400).json({ error: "Script is required first." });

    const keyframes: any[] = [];
    const shots: any[] = [];
    let previous: string | null = null;

    for (const scene of project.scenes) {
      const result = await generateBreakdown(project.bible, scene, previous);
      keyframes.push(...result.keyframes);
      shots.push(...result.shots);
      previous = result.keyframes[result.keyframes.length - 1]?.image_prompt || previous;
      scene.status = "shots_ready";
      chargeProject(project.id, "llm", COST.llm_call, `Stage 3 breakdown ${scene.scene_id}`);
    }

    project.keyframes = keyframes;
    project.shots = shots;
    enforceVerbatim(project);
    saveProject(project);
    recomputeProgress(project.id);

    res.json({ keyframes, shots, project: getProject(project.id) });
  })
);

router.post(
  "/director/stage4-qa",
  asyncRoute(async (req, res) => {
    const project = getProject(req.body.project_id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    project.qa = await runQA(project);
    saveProject(project);
    recomputeProgress(project.id);
    res.json(project.qa);
  })
);

/** Applies QA's suggested corrections back into the keyframe prompts. */
router.post(
  "/director/apply-qa-fixes",
  asyncRoute(async (req, res) => {
    const project = getProject(req.body.project_id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    let applied = 0;
    for (const item of project.qa?.drift_items || []) {
      const keyframe = (project.keyframes || []).find((k: any) => k.id === item.item_id);
      if (keyframe && item.corrected_prompt) {
        keyframe.image_prompt = item.corrected_prompt;
        keyframe.drift_status = "corrected";
        keyframe.drift_notes = item.drift_details;
        keyframe.image_url = undefined; // force a re-render on the next run
        keyframe.status = "pending";
        applied++;
      }
    }

    enforceVerbatim(project);
    project.qa = await runQA(project);
    saveProject(project);
    recomputeProgress(project.id);

    res.json({ applied, qa: project.qa, project: getProject(project.id) });
  })
);

// --- assets ----------------------------------------------------------------

router.post(
  "/voice/generate",
  asyncRoute(async (req, res) => {
    const { text, voice_id = "Fenrir", scene_id = "S001", project_id } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required for voice generation." });
    }

    const result = await generateVoice(project_id || "scratch", { scene_id, narration_text: text }, voice_id);

    if (project_id) {
      const project = getProject(project_id);
      const scene = project?.scenes?.find((s: any) => s.scene_id === scene_id);
      if (project && scene) {
        Object.assign(scene, {
          real_audio_duration_s: result.duration_s,
          audio_url: result.audio_url,
          audio_generated_at: new Date().toISOString(),
          voice_provider: result.provider,
          voice_id: result.voice_id,
          status: "voiced",
        });
        saveProject(project);
        chargeProject(project.id, "tts", COST.tts_scene, `Voice ${scene_id}`);
        recomputeProgress(project.id);
      }
    }

    res.json({
      success: true,
      provider: result.provider,
      voice_id: result.voice_id,
      duration_s: result.duration_s,
      audio_url: result.audio_url,
      file_name: `${scene_id}_narration.wav`,
    });
  })
);

router.post(
  "/references/generate",
  asyncRoute(async (req, res) => {
    const { project_id, item_id } = req.body;
    const project = getProject(project_id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const character = (project.bible?.characters || []).find((c: any) => c.id === item_id);
    const location = (project.bible?.locations || []).find((l: any) => l.id === item_id);
    const item = character || location;
    if (!item) return res.status(404).json({ error: `No bible item with id ${item_id}` });

    const result = await generateReferenceImage(project.id, project.bible, character ? "character" : "location", item);
    item.reference_image_url = result.url;
    item.reference_approved = result.source === "gemini";
    saveProject(project);
    chargeProject(project.id, "image", COST.reference_image, `Reference ${item_id}`);
    recomputeProgress(project.id);

    res.json({ success: true, item_id, url: result.url, source: result.source });
  })
);

router.post(
  "/images/keyframe",
  asyncRoute(async (req, res) => {
    const { project_id, keyframe_id } = req.body;
    const project = getProject(project_id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const keyframe = (project.keyframes || []).find((k: any) => k.id === keyframe_id);
    if (!keyframe) return res.status(404).json({ error: `No keyframe ${keyframe_id}` });

    const result = await generateKeyframeImage(project, keyframe);
    keyframe.image_url = result.url;
    keyframe.status = "approved";
    saveProject(project);
    chargeProject(project.id, "image", COST.keyframe_image, `Keyframe ${keyframe_id}`);
    recomputeProgress(project.id);

    res.json({ success: true, keyframe_id, url: result.url, source: result.source });
  })
);

router.post(
  "/video/generate",
  asyncRoute(async (req, res) => {
    const { project_id, shot_id } = req.body;
    const project = getProject(project_id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const shot = (project.shots || []).find((s: any) => s.id === shot_id);
    if (!shot) return res.status(404).json({ error: `No shot ${shot_id}` });

    shot.status = "generating";
    saveProject(project);

    const result = await generateShotVideo(project, shot);
    if (result.url) {
      shot.video_url = result.url;
      shot.status = "completed";
      shot.cost = COST.video_shot;
      chargeProject(project.id, "video", COST.video_shot, `Shot ${shot_id}`);
    } else {
      shot.status = "storyboard";
    }
    saveProject(project);
    recomputeProgress(project.id);

    res.json({ success: true, shot_id, url: result.url, source: result.source, status: shot.status });
  })
);

router.post(
  "/assembly/build",
  asyncRoute(async (req, res) => {
    const project = getProject(req.body.project_id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    project.assembly = buildAssembly(project);
    saveProject(project);
    recomputeProgress(project.id);
    res.json(project.assembly);
  })
);

/** Downloads the assembly artefacts (ffmpeg script / EDL / timeline JSON). */
router.get("/assembly/:id/:artifact", (req, res) => {
  const project = getProject(req.params.id);
  if (!project?.assembly) return res.status(404).json({ error: "No assembly built yet" });

  const base = String(project.title || "project").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "project";

  switch (req.params.artifact) {
    case "ffmpeg":
      res.setHeader("Content-Type", "text/x-shellscript");
      res.setHeader("Content-Disposition", `attachment; filename="${base}_assemble.sh"`);
      return res.send(project.assembly.ffmpeg_script);
    case "edl":
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", `attachment; filename="${base}.edl"`);
      return res.send(project.assembly.edl);
    case "timeline":
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${base}_timeline.json"`);
      return res.send(JSON.stringify(project.assembly.timeline, null, 2));
    default:
      return res.status(404).json({ error: "Unknown artifact. Use ffmpeg | edl | timeline." });
  }
});

// --- pipeline --------------------------------------------------------------

router.post("/pipeline/run", (req, res) => {
  const { project_id, steps, force, skip_video } = req.body;
  const project = getProject(project_id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  try {
    const job = startPipeline(project_id, {
      steps: Array.isArray(steps) ? (steps as StepKey[]) : undefined,
      force: !!force,
      skipVideo: !!skip_video,
    });
    res.json({ job: publicJob(job) });
  } catch (err: any) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

router.post("/pipeline/:jobId/cancel", (req, res) => {
  const ok = cancelJob(req.params.jobId);
  res.json({ success: ok });
});

router.get("/pipeline/project/:projectId", (req, res) => {
  const job = getJobForProject(req.params.projectId);
  res.json({ job: job ? publicJob(job) : null });
});

/** Server-sent events: live job state + the project snapshot after each step. */
router.get("/pipeline/:jobId/stream", (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const send = (payload: any) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  send({ job: publicJob(job), project: getProject(job.project_id) });

  const onUpdate = (payload: any) => {
    send(payload);
    if (payload.job.status !== "running") {
      clearInterval(heartbeat);
      pipelineEvents.off(job.id, onUpdate);
      res.end();
    }
  };

  // Keeps proxies from closing an idle stream during long Veo renders.
  const heartbeat = setInterval(() => res.write(": ping\n\n"), 15000);

  pipelineEvents.on(job.id, onUpdate);
  req.on("close", () => {
    clearInterval(heartbeat);
    pipelineEvents.off(job.id, onUpdate);
  });
});
