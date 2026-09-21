import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  SupportedLanguage, Project, ProjectBible, Scene, ProviderSettings, PipelineJob, PipelineStepKey,
} from './types';
import { translations } from './i18n';
import { api, streamPipeline } from './api';
import { Header } from './components/Header';
import { PhaseProgressBar } from './components/PhaseProgressBar';
import { ProjectsDashboard } from './components/ProjectsDashboard';
import { BibleEditor } from './components/BibleEditor';
import { ScriptEditor } from './components/ScriptEditor';
import { VoiceStudio } from './components/VoiceStudio';
import { ReferenceStudio } from './components/ReferenceStudio';
import { ShotBreakdown } from './components/ShotBreakdown';
import { KeyframeStudio } from './components/KeyframeStudio';
import { VideoStudio } from './components/VideoStudio';
import { AssemblyStudio } from './components/AssemblyStudio';
import { QAPanel } from './components/QAPanel';
import { PipelineRunner } from './components/PipelineRunner';
import { SettingsModal } from './components/SettingsModal';
import { DashboardWidget } from './components/DashboardWidget';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import {
  BookOpen, FileText, Volume2, ImageIcon, Scissors, Film, Clapperboard, ShieldCheck, Layers,
} from 'lucide-react';

type ModuleKey = 'bible' | 'script' | 'voice' | 'references' | 'breakdown' | 'images' | 'video' | 'assembly' | 'qa';

const MODULE_TABS: Array<{ key: ModuleKey; icon: React.ElementType; labelKey: keyof typeof translations['en'] }> = [
  { key: 'bible', icon: BookOpen, labelKey: 'navBible' },
  { key: 'script', icon: FileText, labelKey: 'navScript' },
  { key: 'voice', icon: Volume2, labelKey: 'navVoice' },
  { key: 'references', icon: Layers, labelKey: 'navReferences' },
  { key: 'breakdown', icon: Scissors, labelKey: 'navBreakdown' },
  { key: 'images', icon: ImageIcon, labelKey: 'navImages' },
  { key: 'video', icon: Film, labelKey: 'navVideo' },
  { key: 'assembly', icon: Clapperboard, labelKey: 'navAssembly' },
  { key: 'qa', icon: ShieldCheck, labelKey: 'navQA' },
];

export default function App() {
  const [lang, setLang] = useState<SupportedLanguage>('ar');
  const t = translations[lang];

  // Set HTML dir attribute whenever language changes
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Projects State
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleKey>('bible');

  // Loading states
  const [isGeneratingBible, setIsGeneratingBible] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatingVoiceSceneId, setGeneratingVoiceSceneId] = useState<string | null>(null);
  const [generatingReferenceId, setGeneratingReferenceId] = useState<string | null>(null);
  const [generatingKeyframeId, setGeneratingKeyframeId] = useState<string | null>(null);
  const [generatingShotId, setGeneratingShotId] = useState<string | null>(null);
  const [isBuildingAssembly, setIsBuildingAssembly] = useState(false);
  const [isRunningQA, setIsRunningQA] = useState(false);
  const [isApplyingQAFixes, setIsApplyingQAFixes] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warn' | 'error' } | null>(null);

  // Pipeline state
  const [job, setJob] = useState<PipelineJob | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warn' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, type === 'error' ? 6000 : 2800);
  };

  const reportError = useCallback((context: string, err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${context}:`, err);
    showToast(`${context}: ${message}`, 'error');
  }, []);

  const [providerSettings, setProviderSettings] = useState<ProviderSettings>({
    llm_provider: 'gemini',
    llm_model: 'gemini-3.8-flash',
    voice_provider: 'gemini_tts',
    voice_model: 'gemini-3.1-flash-tts-preview',
    image_provider: 'gemini',
    video_provider: 'veo',
    has_gemini_key: true,
    has_elevenlabs_key: false,
  });

  // Load projects & provider settings from the backend
  useEffect(() => {
    api
      .listProjects()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProjects(data);
          setCurrentProjectId(data[0].id);
        } else {
          initDefaultProject();
        }
      })
      .catch((err) => {
        console.warn('Could not fetch projects:', err);
        initDefaultProject();
      });

    api
      .settings()
      .then((settings) => setProviderSettings((prev) => ({ ...prev, ...settings })))
      .catch(() => {});
  }, []);

  const initDefaultProject = () => {
    const defaultBible: ProjectBible = {
      title: "محقق السيبربانك: الأفق النيوني",
      logline: "في أعماق مدينة نيون دائمة المطر، محقق سايبراني يطارد آخر أرشيف ذكريات حية غير معدلة، برفقة عالمة بيانات منشقة وروبوت صيانة قديم.",
      target_duration_min: 30,
      visual_style: {
        style_prompt: "Cinematic 35mm film still, Blade Runner 2049 meets Ghost in the Shell, wet reflective asphalt, moody volumetric rain mist, cyan and amber neon signage, rich obsidian shadows, anamorphic lens flare.",
        color_palette: ["#0284c7", "#f59e0b", "#0f172a", "#38bdf8", "#475569"],
        aspect_ratio: "16:9",
        negative_prompt: "cartoon, oversaturated, deformed anatomy, blurry, low resolution, watermark, bad text",
      },
      characters: [
        {
          id: "CHAR_01",
          name: "المحقق كايزن (Kaelen)",
          locked_description: "Human male in early 40s, 185cm tall, weathered square jaw with graying tactical stubble and a matte titanium cybernetic optical implant over left eye emitting faint amber glow. Broad heroic muscular build. Wearing a weather-beaten charcoal modular ballistic duster coat with high collar and weathered combat gloves.",
          voice: {
            voice_id: "Fenrir",
            tone: "Deep resonant baritone, gravelly, calm authority with melancholic undertone.",
            pitch: "Deep / Low Pitch",
            pace: "Deliberate (~135 wpm)",
            accent_or_style: "Cyberpunk Noir / Classical Dramatic",
            vocal_traits: ["Controlled dynamic range", "Measured dramatic pauses", "Subtle gravelly breath"],
          },
          reference_sheet_prompt: "Model turnaround sheet of Commander Kaelen: front, 45 degree side, back view. 4 facial expressions (stoic focus, stern warning, weary realization, determined command). Neutral studio backdrop.",
          locked: true,
        },
        {
          id: "CHAR_02",
          name: "د. إيلينا فاسكيز (Elena)",
          locked_description: "Human female, mid-30s, 172cm tall, piercing analytical hazel eyes, dark auburn hair bound in a functional braided knot. Slender athletic posture. Wearing an insulated off-white environmental scout suit with brass sensor nodes on lapels and an amber holographic gauntlet terminal on right forearm.",
          voice: {
            voice_id: "Kore",
            tone: "Crisp, precise, intellectual cadence with hidden warmth.",
            pitch: "Medium-Low Pitch",
            pace: "Narrative Mid-Tempo (~150 wpm)",
            accent_or_style: "Academic / Analytical",
            vocal_traits: ["Articulate enunciation", "Sharp intellectual cadence", "Melodic softness under pressure"],
          },
          reference_sheet_prompt: "Model turnaround sheet of Dr. Elena Vasquez: front, profile, rear view. 4 facial expressions (calculating gaze, surprise, cautious optimism, intense concentration). Neutral backdrop.",
          locked: true,
        }
      ],
      locations: [
        {
          id: "LOC_01",
          name: "محطة قطار ماغليف تحت الأرض (Basalt Terminus)",
          locked_description: "Brutalist subterranean maglev hub carved into obsidian basalt rock with exposed ribbed steel vaults. Wet polished pavement reflecting cyan and gold neon departure signs. Heavy humidity mist billowing from ventilation grates.",
          reference_prompt: "Wide architectural establishing shot of Basalt Terminus, brutalist obsidian pillars, cyan neon reflections on wet platform floor, humid vapor mist.",
          locked: true,
        },
        {
          id: "LOC_02",
          name: "مرصد السحاب الأيوني (Cloud Spire)",
          locked_description: "High-altitude glass dome observatory suspended above the perpetual storm clouds. Antique brass astrolabe ribs framing vast quartz panorama windows looking into iridescent twilight skies.",
          reference_prompt: "Panoramic interior of Cloud Spire observatory, brass astrolabe structures, deep blue twilight view through curved quartz glass.",
          locked: true,
        },
        {
          id: "LOC_03",
          name: "سوق الزقاق النبضي المغمور (The Submerged Pulse Bazaar)",
          locked_description: "Multi-tiered subterranean marketplace suspended beneath massive hydraulic floodgates in Sector 7. Dense labyrinth of corrugated sheet metal stalls with fluorescent holographic awnings glowing in intense magenta and viridian emerald through thick swirling steam from open drainage grates. Worn hexagonal basalt pavers slick with iridescent oily rainwater. Overhead tangled networks of heavy industrial cabling, dangling crimson paper lanterns, and humming electrical transformers. Merchant stalls display glowing jars of bio-luminescent algae, copper cooling heat sinks, and sizzling street noodle woks.",
          reference_prompt: "Wide atmospheric architectural establishing shot of The Submerged Pulse Bazaar, tiered subterranean alleyways, neon magenta and emerald light cutting through humid sewer steam, wet reflective basalt ground, dense aerial power cables, 35mm cinematic film still.",
          locked: true,
        },
        {
          id: "LOC_04",
          name: "خزنة الأرشيف السيليكوني المتجمدة (The Apex Cryo-Silicon Vault)",
          locked_description: "Monolithic subterranean data sanctuary kept at sub-zero cryogenic temperatures with visible creeping plumes of white vapor across mirror-polished black obsidian flooring. Colossal four-story cylindrical towers of liquid-nitrogen-cooled glass server columns pulsing with rhythmic amber optical data nodes. Brutalist vaulted ceiling with exposed brushed-titanium load trusses. In the chamber center sits an elevated circular quartz terminal pedestal with a floating amber volumetric starmap. Floating silent surveillance drones with blue lens apertures hover motionless in the frigid mist.",
          reference_prompt: "Grand architectural interior establishing shot of The Apex Cryo-Silicon Vault, towering vertical glass server monoliths pulsing amber light, swirling sub-zero fog over mirror-finish obsidian floor, cold teal and amber lighting, high cinematic symmetry, 8k resolution.",
          locked: true,
        }
      ]
    };

    const defaultScenes: Scene[] = [
      {
        scene_id: "S001",
        location_id: "LOC_01",
        character_ids: ["CHAR_01"],
        summary: "الوصول إلى رصيف قطار الماغليف تحت المطر المستمر وبدء تعقب الإشارة.",
        narration_text: "قطارات الماغليف في هذا القطاع لا تهدأ أبداً. حتى في ساعات الحظر، تتساقط قطرات الماء المتكثف من الأقواس الحجرية العالية، كأنها عدّ تنازلي لنهاية صامتة. تفقّد كايزن ياقة معطفه الواقي؛ هنا عند حافة المحطة القديمة، لا أحد يسأل عن وجهتك، وكل وجه يروي حكاية محاولة نسيان لماضٍ لم يعد مسجلاً في أي أرشيف رسمي.",
        emotional_beat: "عزلة قاسية وترقب حذر مع إيقاع السرد البطيء",
        word_count: 63,
        estimated_duration_s: 42,
        status: "draft",
      },
      {
        scene_id: "S002",
        location_id: "LOC_01",
        character_ids: ["CHAR_01", "CHAR_02"],
        summary: "اللقاء السري مع إيلينا بجوار المحول الكهربائي وفك شفرة الكبسولة البرونزية.",
        narration_text: "لم تلتفت إيلينا حين اقترب كايزن. كانت أصابعها تتحرك بسرعة خافتة عبر لوحة البيانات المضيئة. 'أغلقوا مسارات الشمال قبل نصف ساعة،' قالت بصوت متزن رغم ارتعاش خطوط الضغط الكهربائي خلفها. رفعت أسطوانة الذاكرة النحاسية المشفرة؛ كانت شاشتها تنبض بإحداثيات محذوفة من كل الخرائط المصرح بها. 'ما تبقى من الحقيقة لا يملك وقتاً للانتظار.'",
        emotional_beat: "توتر متبادل وثقة حذرة في مواجهة المجهول",
        word_count: 67,
        estimated_duration_s: 45,
        status: "draft",
      },
      {
        scene_id: "S003",
        location_id: "LOC_02",
        character_ids: ["CHAR_01", "CHAR_02"],
        summary: "الصعود بالمصعد الهوائي نحو المرصد واختراق الغيوم لرؤية النبض الضوئي.",
        narration_text: "ارتجف المصعد النحاسي وهو يخترق طبقة العواصف الكثيفة، منبثقاً فجأة في سكون الغسق الفضي الصافي. وفوقهما، عبر قبة الكوارتز الشاهقة، لم تكن السماء فارغة. دوامة من الضوء الأيوني كانت تلتف ببطء نحو البرج المداري الأخير. أدرك كايزن للمرة الأولى في مسيرته الطويلة أن بعض الألغاز لا تحتاج إلى سلاح لحلها، بل تحتاج إلى شهود على الحقيقة.",
        emotional_beat: "رهبة واكتشاف مهيب يختتم المرحلة التمهيدية للفيلم",
        word_count: 68,
        estimated_duration_s: 46,
        status: "draft",
      }
    ];

    const sampleProject: Project = {
      id: "proj_cyberpunk_01",
      title: "محقق السيبربانك: الأفق النيوني",
      idea: "محقق سايبراني في مدينة نيون يبحث عن أرشيف ذكريات مفقود مع عالمة منشقة",
      target_duration_min: 30,
      pilot_mode: true,
      budget_limit: 35,
      spent_cost: 0,
      current_stage: 3,
      bible: defaultBible,
      scenes: defaultScenes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      phase_progress: {
        phase1: 60, // Bible + script done, voice pending
        phase2: 0,
        phase3: 0,
        phase4: 0,
      },
    };

    setProjects([sampleProject]);
    setCurrentProjectId(sampleProject.id);
    void persistProject(sampleProject);
  };

  const currentProject = projects.find((p) => p.id === currentProjectId) || null;

  /** Writes a project to the server, keeping local state as the source of truth. */
  const persistProject = useCallback(
    async (project: Project) => {
      try {
        await api.saveProject(project);
      } catch (err) {
        // A 409 means the pipeline owns the project right now; its own writes win.
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('Pipeline is running')) return;
        reportError('Save failed', err);
      }
    },
    [reportError]
  );

  const applyProject = useCallback((project: Project) => {
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === project.id);
      return exists ? prev.map((p) => (p.id === project.id ? project : p)) : [project, ...prev];
    });
  }, []);

  /** Pulls the server's copy after any server-side mutation. */
  const refreshProject = useCallback(
    async (projectId: string) => {
      try {
        applyProject(await api.getProject(projectId));
      } catch (err) {
        reportError('Refresh failed', err);
      }
    },
    [applyProject, reportError]
  );

  const updateProject = useCallback(
    (patch: Partial<Project>) => {
      if (!currentProject) return;
      const updated: Project = { ...currentProject, ...patch, updated_at: new Date().toISOString() };
      applyProject(updated);
      void persistProject(updated);
    },
    [currentProject, applyProject, persistProject]
  );

  // --- pipeline --------------------------------------------------------------

  /** Attaches to a job's SSE stream and mirrors its project snapshots locally. */
  const followJob = useCallback(
    (nextJob: PipelineJob) => {
      setJob(nextJob);
      unsubscribeRef.current?.();
      unsubscribeRef.current = streamPipeline(nextJob.id, {
        onUpdate: (updatedJob, project) => {
          setJob(updatedJob);
          if (project) applyProject(project);
        },
        onDone: (finishedJob) => {
          void refreshProject(finishedJob.project_id);
          showToast(
            finishedJob.status === 'completed'
              ? t.pipelineCompleted
              : finishedJob.status === 'cancelled'
                ? t.pipelineCancelledLabel
                : finishedJob.status === 'budget_exceeded'
                  ? t.pipelineBudgetStop
                  : t.pipelineFailedLabel,
            finishedJob.status === 'completed' ? 'success' : 'warn'
          );
        },
        onError: (message) => reportError('Pipeline stream', new Error(message)),
      });
    },
    [applyProject, refreshProject, reportError, t]
  );

  const runPipeline = useCallback(
    async (options: { force?: boolean; skipVideo?: boolean; steps?: PipelineStepKey[] } = {}) => {
      if (!currentProject) return;
      try {
        const { job: started } = await api.runPipeline(currentProject.id, options);
        followJob(started);
      } catch (err) {
        reportError('Pipeline failed to start', err);
      }
    },
    [currentProject, followJob, reportError]
  );

  const cancelPipeline = useCallback(async () => {
    if (!job) return;
    try {
      await api.cancelPipeline(job.id);
    } catch (err) {
      reportError('Cancel failed', err);
    }
  }, [job, reportError]);

  // Reattach to a run already in flight (page reload, tab switch).
  useEffect(() => {
    if (!currentProjectId) return;
    let cancelled = false;

    api
      .activeJob(currentProjectId)
      .then(({ job: existing }) => {
        if (cancelled) return;
        setJob(existing);
        if (existing && existing.status === 'running') followJob(existing);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, [currentProjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- project lifecycle -----------------------------------------------------

  const handleCreateProject = async (data: {
    title: string;
    idea: string;
    target_duration_min: number;
    pilot_mode: boolean;
    budget_limit: number;
  }) => {
    setIsGeneratingBible(true);
    try {
      const bible = await api.generateBible(data.idea, data.target_duration_min);
      const newProj: Project = {
        id: `proj_${Date.now()}`,
        title: bible.title || data.title,
        idea: data.idea,
        target_duration_min: data.target_duration_min,
        pilot_mode: data.pilot_mode,
        budget_limit: data.budget_limit,
        spent_cost: 0,
        current_stage: 1,
        bible,
        scenes: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        phase_progress: { phase1: 30, phase2: 0, phase3: 0, phase4: 0 },
      };

      applyProject(newProj);
      setCurrentProjectId(newProj.id);
      setActiveModule('bible');
      await persistProject(newProj);
      showToast(`Project "${newProj.title}" created. Run the pipeline to produce it.`, 'success');
    } catch (err) {
      reportError('Project creation failed', err);
    } finally {
      setIsGeneratingBible(false);
    }
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    api.deleteProject(id).catch((err) => reportError('Delete failed', err));
    if (currentProjectId === id) {
      const remaining = projects.filter((p) => p.id !== id);
      setCurrentProjectId(remaining[0]?.id || null);
    }
  };

  // --- stage actions ---------------------------------------------------------

  const handleUpdateBible = (updatedBible: ProjectBible) => {
    updateProject({ bible: updatedBible, title: updatedBible.title || currentProject?.title });
  };

  const handleGenerateBibleStage1 = async () => {
    if (!currentProject) return;
    setIsGeneratingBible(true);
    try {
      const bible = await api.generateBible(
        currentProject.idea || currentProject.title,
        currentProject.target_duration_min
      );
      handleUpdateBible(bible);
      showToast('Project Bible regenerated.', 'success');
    } catch (err) {
      reportError('Stage 1 failed', err);
    } finally {
      setIsGeneratingBible(false);
    }
  };

  const handleUpdateScenes = (updatedScenes: Scene[]) => {
    if (!currentProject) return;
    const allVoiced = updatedScenes.length > 0 && updatedScenes.every((s) => !!s.real_audio_duration_s);
    updateProject({
      scenes: updatedScenes,
      current_stage: allVoiced ? 4 : updatedScenes.length > 0 ? 3 : currentProject.current_stage,
    });
  };

  const handleGenerateScriptStage2 = async () => {
    if (!currentProject) return;
    setIsGeneratingScript(true);
    try {
      const { scenes } = await api.generateScript(currentProject.bible, currentProject.pilot_mode);
      handleUpdateScenes(scenes);
      setActiveModule('script');
      showToast(`${scenes.length} scenes written.`, 'success');
    } catch (err) {
      reportError('Stage 2 failed', err);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleGenerateVoice = async (sceneId: string) => {
    if (!currentProject) return;
    const scene = currentProject.scenes.find((s) => s.scene_id === sceneId);
    if (!scene) return;

    setGeneratingVoiceSceneId(sceneId);
    try {
      const character =
        currentProject.bible.characters.find((c) => scene.character_ids?.includes(c.id)) ||
        currentProject.bible.characters[0];
      await api.generateVoice(
        currentProject.id,
        sceneId,
        scene.narration_text,
        character?.voice?.voice_id || 'Fenrir'
      );
      await refreshProject(currentProject.id);
    } catch (err) {
      reportError(`Voice for ${sceneId} failed`, err);
    } finally {
      setGeneratingVoiceSceneId(null);
    }
  };

  const handleGenerateReference = async (itemId: string) => {
    if (!currentProject) return;
    setGeneratingReferenceId(itemId);
    try {
      await api.generateReference(currentProject.id, itemId);
      await refreshProject(currentProject.id);
    } catch (err) {
      reportError(`Reference ${itemId} failed`, err);
    } finally {
      setGeneratingReferenceId(null);
    }
  };

  const handleGenerateKeyframe = async (keyframeId: string) => {
    if (!currentProject) return;
    setGeneratingKeyframeId(keyframeId);
    try {
      await api.generateKeyframe(currentProject.id, keyframeId);
      await refreshProject(currentProject.id);
    } catch (err) {
      reportError(`Keyframe ${keyframeId} failed`, err);
    } finally {
      setGeneratingKeyframeId(null);
    }
  };

  const handleGenerateShotVideo = async (shotId: string) => {
    if (!currentProject) return;
    setGeneratingShotId(shotId);
    try {
      const result = await api.generateShotVideo(currentProject.id, shotId);
      await refreshProject(currentProject.id);
      if (!result.url) showToast(t.storyboardOnly, 'warn');
    } catch (err) {
      reportError(`Shot ${shotId} failed`, err);
    } finally {
      setGeneratingShotId(null);
    }
  };

  const handleBuildAssembly = async () => {
    if (!currentProject) return;
    setIsBuildingAssembly(true);
    try {
      await api.buildAssembly(currentProject.id);
      await refreshProject(currentProject.id);
      showToast('Timeline built.', 'success');
    } catch (err) {
      reportError('Assembly failed', err);
    } finally {
      setIsBuildingAssembly(false);
    }
  };

  const handleRunQA = async () => {
    if (!currentProject) return;
    setIsRunningQA(true);
    try {
      const report = await api.runQA(currentProject.id);
      await refreshProject(currentProject.id);
      showToast(report.status === 'passed' ? t.qaPassed : `${t.qaDriftDetected}: ${report.drift_items.length}`,
        report.status === 'passed' ? 'success' : 'warn');
    } catch (err) {
      reportError('QA failed', err);
    } finally {
      setIsRunningQA(false);
    }
  };

  const handleApplyQAFixes = async () => {
    if (!currentProject) return;
    setIsApplyingQAFixes(true);
    try {
      const { applied } = await api.applyQAFixes(currentProject.id);
      await refreshProject(currentProject.id);
      showToast(`${applied} prompts corrected. Re-run keyframes to render them.`, 'success');
    } catch (err) {
      reportError('Applying QA fixes failed', err);
    } finally {
      setIsApplyingQAFixes(false);
    }
  };

  const handleUpdateBudgetLimit = (newLimit: number) => {
    updateProject({ budget_limit: newLimit });
    showToast(`Project budget updated to $${newLimit} [Auto-Saved]`, 'success');
  };

  const pipelineRunning = job?.status === 'running';
  const runningStep = pipelineRunning ? job?.current_step : null;

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.getAttribute('role') === 'textbox');

      // Escape: Close modals
      if (e.key === 'Escape') {
        if (shortcutsOpen) {
          setShortcutsOpen(false);
          return;
        }
        if (settingsOpen) {
          setSettingsOpen(false);
          return;
        }
      }

      // Help: ? (when not typing in an input) or Ctrl+/
      if ((e.key === '?' && !isInput) || ((e.ctrlKey || e.metaKey) && e.key === '/')) {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
        return;
      }

      // Ctrl+Enter: run the whole pipeline
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (currentProject && !pipelineRunning) {
          void runPipeline();
          showToast(t.runningPipeline, 'info');
        }
        return;
      }

      // Ctrl+S / Cmd+S: Save, or Ctrl+Shift+S to jump to the Script editor
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (e.shiftKey) {
          if (currentProject) {
            setActiveModule('script');
            showToast('Switched to Script Editor (Stage 2) [Ctrl+Shift+S]', 'info');
          }
          return;
        }

        if (currentProject) {
          void persistProject(currentProject);
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          showToast(`Project "${currentProject.title.slice(0, 24)}" saved to server at ${timeStr} [Ctrl+S]`, 'success');
        } else {
          showToast('No active project to save [Ctrl+S]', 'warn');
        }
        return;
      }

      // Ctrl+B / Cmd+B: Switch to Project Bible
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        if (currentProject) {
          setActiveModule('bible');
          showToast('Switched to Project Bible (Stage 1) [Ctrl+B]', 'info');
        }
        return;
      }

      // Ctrl+1..9: jump straight to a module
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        if (currentProject) {
          const tab = MODULE_TABS[Number(e.key) - 1];
          if (tab) {
            setActiveModule(tab.key);
            showToast(`${t[tab.labelKey]} [Ctrl+${e.key}]`, 'info');
          }
        }
        return;
      }

      // Ctrl+P / Cmd+P: Return to Projects Dashboard or open first
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        if (currentProjectId) {
          setCurrentProjectId(null);
          showToast('Returned to Projects Dashboard [Ctrl+P]', 'info');
        } else if (projects.length > 0) {
          setCurrentProjectId(projects[0].id);
          showToast(`Opened project: ${projects[0].title.slice(0, 24)}... [Ctrl+P]`, 'info');
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentProject, currentProjectId, projects, shortcutsOpen, settingsOpen, pipelineRunning, runPipeline, persistProject, t]);

  /** Badge shown on a module tab: how much of that module is already produced. */
  const tabBadge = (key: ModuleKey): string | null => {
    if (!currentProject) return null;
    switch (key) {
      case 'script':
        return String(currentProject.scenes?.length || 0);
      case 'voice':
        return `${(currentProject.scenes || []).filter((s) => s.real_audio_duration_s).length}/${currentProject.scenes?.length || 0}`;
      case 'references': {
        const items = [...(currentProject.bible?.characters || []), ...(currentProject.bible?.locations || [])];
        return `${items.filter((i) => i.reference_image_url).length}/${items.length}`;
      }
      case 'breakdown':
        return String(currentProject.shots?.length || 0);
      case 'images': {
        const frames = currentProject.keyframes || [];
        return `${frames.filter((k) => k.image_url).length}/${frames.length}`;
      }
      case 'video': {
        const shots = currentProject.shots || [];
        return `${shots.filter((s) => s.video_url).length}/${shots.length}`;
      }
      case 'qa':
        return currentProject.qa ? (currentProject.qa.status === 'passed' ? 'OK' : String(currentProject.qa.drift_items.length)) : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 font-sans selection:bg-amber-500 selection:text-neutral-950">
      <Header
        lang={lang}
        t={t}
        currentProject={currentProject}
        onSelectLanguage={setLang}
        onOpenProjects={() => setCurrentProjectId(null)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />

      <PhaseProgressBar
        t={t}
        phaseProgress={currentProject?.phase_progress || { phase1: 0, phase2: 0, phase3: 0, phase4: 0 }}
      />

      <main className="flex-1">
        {!currentProject ? (
          <ProjectsDashboard
            t={t}
            projects={projects}
            currentProjectId={currentProjectId}
            onOpenProject={(id) => {
              setCurrentProjectId(id);
              setActiveModule('bible');
            }}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
          />
        ) : (
          <div>
            {/* Module tabs — one per pipeline stage */}
            <div className="bg-neutral-900/90 border-b border-neutral-800 sticky top-16 z-30 backdrop-blur-md">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2">
                {MODULE_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const badge = tabBadge(tab.key);
                  const isBusyStep =
                    pipelineRunning &&
                    ((tab.key === 'images' && runningStep === 'keyframes') ||
                      (tab.key === 'breakdown' && runningStep === 'breakdown') ||
                      tab.key === runningStep);

                  return (
                    <button
                      key={tab.key}
                      id={`tab-module-${tab.key}`}
                      onClick={() => setActiveModule(tab.key)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                        activeModule === tab.key
                          ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                          : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="whitespace-nowrap">{t[tab.labelKey]}</span>
                      {badge && (
                        <span className="text-[10px] font-mono px-1.5 rounded bg-neutral-950/40">{badge}</span>
                      )}
                      {isBusyStep && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
              <PipelineRunner
                t={t}
                job={job}
                offlineMode={providerSettings.offline_mode === true}
                onRun={({ force, skipVideo }) => void runPipeline({ force, skipVideo })}
                onCancel={() => void cancelPipeline()}
              />

              <DashboardWidget t={t} project={currentProject} onUpdateBudgetLimit={handleUpdateBudgetLimit} />
            </div>

            {activeModule === 'bible' && (
              <BibleEditor
                t={t}
                bible={currentProject.bible}
                projectIdea={currentProject.idea}
                isGenerating={isGeneratingBible}
                onGenerateBible={handleGenerateBibleStage1}
                onUpdateBible={handleUpdateBible}
              />
            )}

            {activeModule === 'script' && (
              <ScriptEditor
                t={t}
                bible={currentProject.bible}
                scenes={currentProject.scenes || []}
                pilotMode={currentProject.pilot_mode}
                isGeneratingScript={isGeneratingScript}
                onGenerateScript={handleGenerateScriptStage2}
                onUpdateScenes={handleUpdateScenes}
                onGenerateVoice={handleGenerateVoice}
                onGenerateAllVoices={() => runPipeline({ steps: ['voice'] })}
                generatingVoiceSceneId={generatingVoiceSceneId}
                isGeneratingAllVoices={pipelineRunning && runningStep === 'voice'}
              />
            )}

            {activeModule === 'voice' && (
              <VoiceStudio
                t={t}
                bible={currentProject.bible}
                scenes={currentProject.scenes || []}
                projectId={currentProject.id}
                onGenerateVoice={handleGenerateVoice}
                onGenerateAllVoices={() => runPipeline({ steps: ['voice'] })}
                generatingVoiceSceneId={generatingVoiceSceneId}
                isGeneratingAllVoices={pipelineRunning && runningStep === 'voice'}
              />
            )}

            {activeModule === 'references' && (
              <ReferenceStudio
                t={t}
                bible={currentProject.bible}
                generatingItemId={generatingReferenceId}
                isGeneratingAll={pipelineRunning && runningStep === 'references'}
                onGenerateReference={handleGenerateReference}
                onGenerateAll={() => runPipeline({ steps: ['references'] })}
              />
            )}

            {activeModule === 'breakdown' && (
              <ShotBreakdown
                t={t}
                bible={currentProject.bible}
                scenes={currentProject.scenes || []}
                keyframes={currentProject.keyframes || []}
                shots={currentProject.shots || []}
                isGenerating={pipelineRunning && runningStep === 'breakdown'}
                onGenerateBreakdown={() => runPipeline({ steps: ['breakdown'], force: true })}
              />
            )}

            {activeModule === 'images' && (
              <KeyframeStudio
                t={t}
                keyframes={currentProject.keyframes || []}
                generatingKeyframeId={generatingKeyframeId}
                isGeneratingAll={pipelineRunning && runningStep === 'keyframes'}
                onGenerateKeyframe={handleGenerateKeyframe}
                onGenerateAll={() => runPipeline({ steps: ['keyframes'] })}
              />
            )}

            {activeModule === 'video' && (
              <VideoStudio
                t={t}
                shots={currentProject.shots || []}
                keyframes={currentProject.keyframes || []}
                generatingShotId={generatingShotId}
                isGeneratingAll={pipelineRunning && runningStep === 'video'}
                onGenerateShotVideo={handleGenerateShotVideo}
                onGenerateAll={() => runPipeline({ steps: ['video'] })}
              />
            )}

            {activeModule === 'assembly' && (
              <AssemblyStudio
                t={t}
                project={currentProject}
                assembly={currentProject.assembly}
                isBuilding={isBuildingAssembly || (pipelineRunning && runningStep === 'assembly')}
                onBuildAssembly={handleBuildAssembly}
              />
            )}

            {activeModule === 'qa' && (
              <QAPanel
                t={t}
                qa={currentProject.qa}
                isRunning={isRunningQA || (pipelineRunning && runningStep === 'qa')}
                isApplying={isApplyingQAFixes}
                onRunQA={handleRunQA}
                onApplyFixes={handleApplyQAFixes}
              />
            )}
          </div>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-5 end-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-md">
          <div
            className={`flex items-start gap-2.5 px-4 py-2.5 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-950/50'
                : toast.type === 'error'
                  ? 'bg-red-950/90 text-red-200 border-red-500/40 shadow-red-950/50'
                  : toast.type === 'warn'
                    ? 'bg-amber-950/90 text-amber-200 border-amber-500/40 shadow-amber-950/50'
                    : 'bg-neutral-900/90 text-neutral-200 border-neutral-700 shadow-black/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current opacity-70 mt-1 shrink-0" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <KeyboardShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} t={t} />

      <SettingsModal
        isOpen={settingsOpen}
        t={t}
        settings={providerSettings}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
