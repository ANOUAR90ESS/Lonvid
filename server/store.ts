/**
 * Project persistence: in-memory map mirrored to .data/projects-store.json.
 * Writes are atomic (tmp + rename) and debounced so a pipeline run that
 * updates a project dozens of times does not thrash the disk.
 */
import fs from "fs";
import path from "path";
import { DATA_DIR, STORE_FILE, LEGACY_STORE_FILE } from "./config.ts";
import { saveBase64Media } from "./media.ts";

export type StoredProject = Record<string, any>;

const projects = new Map<string, StoredProject>();
let flushTimer: NodeJS.Timeout | null = null;

export function initStore(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const source = fs.existsSync(STORE_FILE)
    ? STORE_FILE
    : fs.existsSync(LEGACY_STORE_FILE)
      ? LEGACY_STORE_FILE
      : null;

  if (!source) return;

  try {
    const raw = JSON.parse(fs.readFileSync(source, "utf-8"));
    for (const [id, project] of Object.entries(raw)) {
      projects.set(id, project as StoredProject);
    }
    const moved = migrateInlineMedia();
    if (source === LEGACY_STORE_FILE || moved > 0) {
      if (moved > 0) console.log(`[store] Moved ${moved} inline data URLs out of the store into .data/media`);
      if (source === LEGACY_STORE_FILE) console.log("[store] Migrated projects from legacy projects-store.json");
      flushNow();
    }
  } catch (err) {
    console.warn(`[store] Could not read ${path.basename(source)}, starting empty:`, err);
  }
}

/**
 * Older versions embedded generated audio as base64 data URLs, which pushed the
 * store into the megabytes and made every read slow. Rewrite them as files.
 */
function migrateInlineMedia(): number {
  let moved = 0;

  for (const project of projects.values()) {
    for (const scene of project.scenes || []) {
      if (typeof scene.audio_url === "string" && scene.audio_url.startsWith("data:")) {
        const match = /^data:([^;]+);base64,(.*)$/s.exec(scene.audio_url);
        if (!match) {
          delete scene.audio_url;
          continue;
        }
        const ext = match[1].includes("wav") ? "wav" : match[1].includes("mp3") ? "mp3" : "bin";
        try {
          scene.audio_url = saveBase64Media(project.id, `${scene.scene_id}_narration.${ext}`, match[2]);
          moved++;
        } catch {
          delete scene.audio_url;
        }
      }
    }
  }

  return moved;
}

export function listProjects(): StoredProject[] {
  return Array.from(projects.values()).sort((a, b) =>
    String(b.updated_at || "").localeCompare(String(a.updated_at || ""))
  );
}

export function getProject(id: string): StoredProject | undefined {
  return projects.get(id);
}

export function saveProject(project: StoredProject): StoredProject {
  if (!project.id) project.id = `proj_${Date.now()}`;
  project.updated_at = new Date().toISOString();
  projects.set(project.id, project);
  scheduleFlush();
  return project;
}

export function deleteProject(id: string): void {
  projects.delete(id);
  scheduleFlush();
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushNow();
  }, 400);
}

export function flushNow(): void {
  try {
    const payload = JSON.stringify(Object.fromEntries(projects), null, 2);
    const tmp = `${STORE_FILE}.tmp`;
    fs.writeFileSync(tmp, payload, "utf-8");
    fs.renameSync(tmp, STORE_FILE);
  } catch (err) {
    console.error("[store] Failed to persist project store:", err);
  }
}

/** Records an estimated cost against a project's ledger and running total. */
export function chargeProject(projectId: string, kind: string, amount: number, detail: string): void {
  const project = projects.get(projectId);
  if (!project) return;
  project.spent_cost = parseFloat(((project.spent_cost || 0) + amount).toFixed(4));
  project.cost_log = [
    ...(project.cost_log || []).slice(-199),
    { at: new Date().toISOString(), kind, amount, detail },
  ];
  scheduleFlush();
}

/** True when one more operation of `amount` would exceed the project budget. */
export function wouldExceedBudget(projectId: string, amount: number): boolean {
  const project = projects.get(projectId);
  if (!project || !project.budget_limit) return false;
  return (project.spent_cost || 0) + amount > project.budget_limit;
}
