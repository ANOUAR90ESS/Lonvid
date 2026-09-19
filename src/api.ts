/**
 * Typed client for the studio API.
 * Every call surfaces server errors as real exceptions so the UI can show
 * them instead of silently swallowing a failed stage.
 */
import { Assembly, PipelineJob, PipelineStepKey, Project, ProjectBible, ProviderSettings, QAReport, Scene } from './types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });

  const text = await res.text();
  let payload: any = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!res.ok) {
    const message = (payload && payload.error) || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return payload as T;
}

export const api = {
  settings: () => request<ProviderSettings>('/api/settings'),

  listProjects: () => request<Project[]>('/api/projects'),
  getProject: (id: string) => request<Project>(`/api/projects/${id}`),
  saveProject: (project: Project) =>
    request<Project>('/api/projects', { method: 'POST', body: JSON.stringify(project) }),
  deleteProject: (id: string) => request<{ success: boolean }>(`/api/projects/${id}`, { method: 'DELETE' }),

  generateBible: (idea: string, targetDurationMin: number) =>
    request<ProjectBible>('/api/director/stage1-bible', {
      method: 'POST',
      body: JSON.stringify({ idea, target_duration_min: targetDurationMin }),
    }),

  generateScript: (bible: ProjectBible, pilotMode: boolean) =>
    request<{ scenes: Scene[] }>('/api/director/stage2-script', {
      method: 'POST',
      body: JSON.stringify({ bible, pilot_mode: pilotMode }),
    }),

  generateBreakdown: (projectId: string) =>
    request<{ project: Project }>('/api/director/stage3-breakdown', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId }),
    }),

  runQA: (projectId: string) =>
    request<QAReport>('/api/director/stage4-qa', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId }),
    }),

  applyQAFixes: (projectId: string) =>
    request<{ applied: number; qa: QAReport; project: Project }>('/api/director/apply-qa-fixes', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId }),
    }),

  generateVoice: (projectId: string, sceneId: string, text: string, voiceId: string) =>
    request<{ success: boolean; audio_url: string; duration_s: number; provider: string; voice_id: string }>(
      '/api/voice/generate',
      {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId, scene_id: sceneId, text, voice_id: voiceId }),
      }
    ),

  generateReference: (projectId: string, itemId: string) =>
    request<{ url: string; source: string }>('/api/references/generate', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, item_id: itemId }),
    }),

  generateKeyframe: (projectId: string, keyframeId: string) =>
    request<{ url: string; source: string }>('/api/images/keyframe', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, keyframe_id: keyframeId }),
    }),

  generateShotVideo: (projectId: string, shotId: string) =>
    request<{ url: string | null; source: string; status: string }>('/api/video/generate', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, shot_id: shotId }),
    }),

  buildAssembly: (projectId: string) =>
    request<Assembly>('/api/assembly/build', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId }),
    }),

  runPipeline: (projectId: string, options: { steps?: PipelineStepKey[]; force?: boolean; skipVideo?: boolean } = {}) =>
    request<{ job: PipelineJob }>('/api/pipeline/run', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        steps: options.steps,
        force: options.force,
        skip_video: options.skipVideo,
      }),
    }),

  cancelPipeline: (jobId: string) =>
    request<{ success: boolean }>(`/api/pipeline/${jobId}/cancel`, { method: 'POST' }),

  activeJob: (projectId: string) => request<{ job: PipelineJob | null }>(`/api/pipeline/project/${projectId}`),
};

/**
 * Subscribes to a pipeline job's live progress. Returns an unsubscribe fn.
 * Falls back to nothing if the browser drops the stream — callers should also
 * refresh the project when `onDone` fires.
 */
export function streamPipeline(
  jobId: string,
  handlers: {
    onUpdate: (job: PipelineJob, project: Project | null) => void;
    onDone?: (job: PipelineJob) => void;
    onError?: (message: string) => void;
  }
): () => void {
  const source = new EventSource(`/api/pipeline/${jobId}/stream`);

  source.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data) as { job: PipelineJob; project: Project | null };
      handlers.onUpdate(payload.job, payload.project);
      if (payload.job.status !== 'running') {
        handlers.onDone?.(payload.job);
        source.close();
      }
    } catch (err) {
      handlers.onError?.(String(err));
    }
  };

  source.onerror = () => {
    // The server closes the stream once the job settles; that is not an error.
    source.close();
  };

  return () => source.close();
}
