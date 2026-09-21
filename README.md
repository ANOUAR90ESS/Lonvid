# LongForm Studio

A long-form AI video production pipeline. It keeps characters, locations and
visual style consistent across 30+ minute films by treating the **Project
Bible** as the only source of truth: every prompt the system sends carries the
bible's locked descriptions *verbatim*, because image and video models have no
memory of what they generated a minute ago.

## The pipeline

| # | Stage | What it produces |
|---|-------|------------------|
| 1 | **Bible** | Title, logline, visual style, characters with locked descriptions + voices, locations |
| 2 | **Script** | Scenes (30–90s each) with narration, location and cast |
| 3 | **Voice** | Narration audio per scene, and the **real measured duration** that drives all downstream timing |
| 4 | **References** | A model sheet per character, a plate per location — the visual identity anchors |
| 5 | **Shot breakdown** | Keyframes (K1..Kn) and shots per scene, timed from the real audio, never exceeding the video model's clip length |
| 6 | **Keyframes** | Each frame generated with its character sheet, location plate and the previous keyframe attached as references |
| 7 | **Video** | Image-to-video per shot, starting from its keyframe |
| 8 | **Assembly** | Timeline, downloadable FFmpeg script and EDL |
| 9 | **QA** | Continuity audit: verifies every prompt still carries the bible's locked text verbatim |

Run the whole thing with **Run pipeline** (or `Ctrl`/`⌘`+`Enter`), or run any
single stage from its tab. Work already done is skipped unless you tick
*Regenerate everything*, so an interrupted run resumes where it stopped.

## Setup

```bash
npm install
cp .env.example .env     # then fill in GEMINI_API_KEY
npm run dev              # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

### Environment

| Variable | Required | Purpose |
|----------|----------|---------|
| `GEMINI_API_KEY` | recommended | Text, TTS, image and Veo video generation |
| `ELEVENLABS_API_KEY` | optional | Alternative voice provider |
| `PORT` | optional | Defaults to `3000` |

**Offline mode.** Without `GEMINI_API_KEY` the app still runs the complete
pipeline: it writes stand-in scripts, synthesises narration WAVs whose length
matches the real reading time, and renders SVG storyboard cards carrying each
prompt. Timings, the timeline and the export package are all real — only the
model output is substituted. The UI says so in a banner.

## Data & media

- Projects are persisted to `.data/projects-store.json` (atomic writes, debounced).
- Generated audio, images and video go to `.data/media/<project_id>/` and are
  served from `/media/...`. Nothing large is stored inside the project JSON.
- Both live under `.data/` and are gitignored.

## Rendering the final cut

The assembly tab exports an FFmpeg script. Run it from the project root:

```bash
bash project_assemble.sh final_cut.mp4
```

It normalises every shot (real video, or a Ken Burns move over the keyframe for
shots with no video yet), concatenates the picture track, builds the narration
track and muxes them.

## Cost control

Every operation is charged against the project's budget with an estimate
(`server/config.ts` → `COST`). The pipeline checks the budget before each unit
and stops cleanly with `budget_exceeded` rather than overspending. The ledger
is visible in the dashboard widget.

## Layout

```
server.ts            entry: express + media host + vite/dist
server/
  config.ts          models, cost table, paths
  gemini.ts          all model access, with fallbacks
  director.ts        the four stages + verbatim enforcement
  pipeline.ts        resumable orchestrator + SSE progress
  routes.ts          HTTP surface
  store.ts           project persistence
  media.ts           media files + offline stand-ins
src/
  api.ts             typed client
  components/        one studio module per stage
```
