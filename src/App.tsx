import React, { useState, useEffect } from 'react';
import { SupportedLanguage, Project, ProjectBible, Scene, ProviderSettings } from './types';
import { translations } from './i18n';
import { Header } from './components/Header';
import { PhaseProgressBar } from './components/PhaseProgressBar';
import { ProjectsDashboard } from './components/ProjectsDashboard';
import { BibleEditor } from './components/BibleEditor';
import { ScriptEditor } from './components/ScriptEditor';
import { VoiceStudio } from './components/VoiceStudio';
import { SettingsModal } from './components/SettingsModal';
import { DashboardWidget } from './components/DashboardWidget';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { BookOpen, FileText, Volume2, Sparkles, AlertCircle, ArrowLeft, ArrowRight, ShieldCheck, Film } from 'lucide-react';

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
  const [activeModule, setActiveModule] = useState<'bible' | 'script' | 'voice' | 'upcoming'>('bible');

  // Loading states
  const [isGeneratingBible, setIsGeneratingBible] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatingVoiceSceneId, setGeneratingVoiceSceneId] = useState<string | null>(null);
  const [isGeneratingAllVoices, setIsGeneratingAllVoices] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warn' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warn' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 2800);
  };

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

  // Load projects from backend
  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProjects(data);
          setCurrentProjectId(data[0].id);
        } else {
          // Initialize with a rich starter project
          initDefaultProject();
        }
      })
      .catch((err) => {
        console.warn('Could not fetch projects:', err);
        initDefaultProject();
      });

    fetch('/api/settings')
      .then((res) => res.json())
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
        real_audio_duration_s: 41.5,
        audio_url: "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
        voice_provider: "gemini_tts",
        status: "voiced",
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
        real_audio_duration_s: 44.8,
        audio_url: "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
        voice_provider: "gemini_tts",
        status: "voiced",
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
        real_audio_duration_s: 45.2,
        audio_url: "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
        voice_provider: "gemini_tts",
        status: "voiced",
      }
    ];

    const sampleProject: Project = {
      id: "proj_cyberpunk_01",
      title: "محقق السيبربانك: الأفق النيوني",
      idea: "محقق سايبراني في مدينة نيون يبحث عن أرشيف ذكريات مفقود مع عالمة منشقة",
      target_duration_min: 30,
      pilot_mode: true,
      budget_limit: 35,
      spent_cost: 0.12,
      current_stage: 3,
      bible: defaultBible,
      scenes: defaultScenes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      phase_progress: {
        phase1: 100, // Phase 1 complete!
        phase2: 0,
        phase3: 0,
        phase4: 0,
      },
    };

    setProjects([sampleProject]);
    setCurrentProjectId(sampleProject.id);
    saveProjectToServer(sampleProject);
  };

  const currentProject = projects.find((p) => p.id === currentProjectId) || null;

  const saveProjectToServer = (proj: Project) => {
    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proj),
    }).catch((err) => console.warn('Project save error:', err));
  };

  const handleCreateProject = async (data: {
    title: string;
    idea: string;
    target_duration_min: number;
    pilot_mode: boolean;
    budget_limit: number;
  }) => {
    setIsGeneratingBible(true);

    try {
      const bibleRes = await fetch('/api/director/stage1-bible', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: data.idea,
          target_duration_min: data.target_duration_min,
          pilot_mode: data.pilot_mode,
        }),
      });

      const bible: ProjectBible = await bibleRes.json();

      const newProj: Project = {
        id: `proj_${Date.now()}`,
        title: bible.title || data.title,
        idea: data.idea,
        target_duration_min: data.target_duration_min,
        pilot_mode: data.pilot_mode,
        budget_limit: data.budget_limit,
        spent_cost: 0.05,
        current_stage: 1,
        bible: bible,
        scenes: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        phase_progress: {
          phase1: 40, // Bible generated
          phase2: 0,
          phase3: 0,
          phase4: 0,
        },
      };

      setProjects((prev) => [newProj, ...prev]);
      setCurrentProjectId(newProj.id);
      setActiveModule('bible');
      saveProjectToServer(newProj);
    } catch (err) {
      console.error('Failed to create project with Director AI:', err);
    } finally {
      setIsGeneratingBible(false);
    }
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    fetch(`/api/projects/${id}`, { method: 'DELETE' }).catch(() => {});
    if (currentProjectId === id) {
      const remaining = projects.filter((p) => p.id !== id);
      setCurrentProjectId(remaining[0]?.id || null);
    }
  };

  const handleUpdateBible = (updatedBible: ProjectBible) => {
    if (!currentProject) return;
    const updated: Project = {
      ...currentProject,
      bible: updatedBible,
      title: updatedBible.title || currentProject.title,
      updated_at: new Date().toISOString(),
    };
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    saveProjectToServer(updated);
  };

  const handleGenerateBibleStage1 = async () => {
    if (!currentProject) return;
    setIsGeneratingBible(true);

    try {
      const res = await fetch('/api/director/stage1-bible', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: currentProject.idea || currentProject.title,
          target_duration_min: currentProject.target_duration_min,
          pilot_mode: currentProject.pilot_mode,
        }),
      });
      const generatedBible = await res.json();
      handleUpdateBible(generatedBible);
    } catch (err) {
      console.error('Stage 1 error:', err);
    } finally {
      setIsGeneratingBible(false);
    }
  };

  const handleUpdateScenes = (updatedScenes: Scene[]) => {
    if (!currentProject) return;
    const allVoiced = updatedScenes.length > 0 && updatedScenes.every((s) => !!s.real_audio_duration_s);
    const updated: Project = {
      ...currentProject,
      scenes: updatedScenes,
      current_stage: allVoiced ? 4 : updatedScenes.length > 0 ? 3 : currentProject.current_stage,
      phase_progress: {
        ...currentProject.phase_progress,
        phase1: allVoiced ? 100 : updatedScenes.length > 0 ? 75 : 40,
      },
      updated_at: new Date().toISOString(),
    };
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    saveProjectToServer(updated);
  };

  const handleGenerateScriptStage2 = async () => {
    if (!currentProject) return;
    setIsGeneratingScript(true);

    try {
      const res = await fetch('/api/director/stage2-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bible: currentProject.bible,
          pilot_mode: currentProject.pilot_mode,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.scenes)) {
        handleUpdateScenes(data.scenes);
        setActiveModule('script');
      }
    } catch (err) {
      console.error('Stage 2 error:', err);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleGenerateVoice = async (sceneId: string) => {
    if (!currentProject) return;
    const targetScene = currentProject.scenes.find((s) => s.scene_id === sceneId);
    if (!targetScene) return;

    setGeneratingVoiceSceneId(sceneId);

    try {
      // Lookup character voice
      const char = currentProject.bible.characters.find((c) => targetScene.character_ids?.includes(c.id))
        || currentProject.bible.characters[0];
      const voiceId = char?.voice?.voice_id || 'Fenrir';

      const res = await fetch('/api/voice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: targetScene.narration_text,
          voice_id: voiceId,
          scene_id: targetScene.scene_id,
          provider: providerSettings.voice_provider,
        }),
      });

      const audioData = await res.json();

      if (audioData.success) {
        const updatedScenes = currentProject.scenes.map((s) =>
          s.scene_id === sceneId
            ? {
                ...s,
                real_audio_duration_s: audioData.duration_s,
                audio_url: audioData.audio_url,
                voice_provider: audioData.provider,
                voice_id: audioData.voice_id,
                status: 'voiced' as const,
              }
            : s
        );
        handleUpdateScenes(updatedScenes);
      }
    } catch (err) {
      console.error('Voice generation error:', err);
    } finally {
      setGeneratingVoiceSceneId(null);
    }
  };

  const handleGenerateAllVoices = async () => {
    if (!currentProject || currentProject.scenes.length === 0) return;
    setIsGeneratingAllVoices(true);

    for (const scene of currentProject.scenes) {
      await handleGenerateVoice(scene.scene_id);
    }

    setIsGeneratingAllVoices(false);
  };

  const handleUpdateBudgetLimit = (newLimit: number) => {
    if (!currentProject) return;
    const updated: Project = {
      ...currentProject,
      budget_limit: newLimit,
      updated_at: new Date().toISOString(),
    };
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    saveProjectToServer(updated);
    showToast(`Project budget updated to $${newLimit} [Auto-Saved]`, 'success');
  };

  // Global Keyboard Shortcuts (Ctrl+S to save, Ctrl+B for Bible, Ctrl+Shift+S for Script, etc.)
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

      // Ctrl+S / Cmd+S: Save or Switch to Script (if Shift)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (e.shiftKey) {
          // Ctrl+Shift+S -> Switch to Script Editor
          if (currentProject) {
            setActiveModule('script');
            showToast('Switched to Script Editor (Stage 2) [Ctrl+Shift+S]', 'info');
          }
          return;
        }

        // Ctrl+S -> Save Project
        if (currentProject) {
          saveProjectToServer(currentProject);
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

      // Ctrl+1, 2, 3: Quick Module Navigation
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === '1' || e.key === '2' || e.key === '3')) {
        e.preventDefault();
        if (currentProject) {
          if (e.key === '1') {
            setActiveModule('bible');
            showToast('Switched to Project Bible [Ctrl+1]', 'info');
          } else if (e.key === '2') {
            setActiveModule('script');
            showToast('Switched to Script Editor [Ctrl+2]', 'info');
          } else if (e.key === '3') {
            setActiveModule('voice');
            showToast('Switched to Voice Studio [Ctrl+3]', 'info');
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
  }, [currentProject, currentProjectId, projects, shortcutsOpen, settingsOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 font-sans selection:bg-amber-500 selection:text-neutral-950">
      {/* Header */}
      <Header
        lang={lang}
        t={t}
        currentProject={currentProject}
        onSelectLanguage={setLang}
        onOpenProjects={() => setCurrentProjectId(null)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />

      {/* Phase Progress Bar (Always visible across all screens) */}
      <PhaseProgressBar
        t={t}
        phaseProgress={currentProject?.phase_progress || { phase1: 100, phase2: 0, phase3: 0, phase4: 0 }}
      />

      {/* Main Workspace */}
      <main className="flex-1">
        {!currentProject ? (
          /* Projects Dashboard Screen */
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
          /* Active Project Studio */
          <div>
            {/* Project Navigation Tabs */}
            <div className="bg-neutral-900/90 border-b border-neutral-800 sticky top-16 z-30 backdrop-blur-md">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar py-2">
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    id="tab-module-bible"
                    onClick={() => setActiveModule('bible')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      activeModule === 'bible'
                        ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>{t.navBible}</span>
                  </button>

                  <button
                    id="tab-module-script"
                    onClick={() => setActiveModule('script')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      activeModule === 'script'
                        ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>{t.navScript}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-950/40">
                      {currentProject.scenes?.length || 0}
                    </span>
                  </button>

                  <button
                    id="tab-module-voice"
                    onClick={() => setActiveModule('voice')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      activeModule === 'voice'
                        ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{t.navVoice}</span>
                    {currentProject.scenes?.some((s) => !!s.real_audio_duration_s) && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    )}
                  </button>
                </div>

                {/* Next Phases Preview Pills */}
                <div className="hidden md:flex items-center gap-2 text-[11px] text-neutral-500 font-medium">
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-800/60 border border-neutral-700/60 text-neutral-400">
                    Phase 2: References & K1-K4
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-800/60 border border-neutral-700/60 text-neutral-400">
                    Phase 3: Veo I2V & Assembly
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-800/60 border border-neutral-700/60 text-neutral-400">
                    Phase 4: QA Drift
                  </span>
                </div>
              </div>
            </div>

            {/* Top Project Dashboard Widget (Budget & Spend Breakdown with Recharts Donut) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
              <DashboardWidget
                t={t}
                project={currentProject}
                onUpdateBudgetLimit={handleUpdateBudgetLimit}
              />
            </div>

            {/* Active Module Body */}
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
                onGenerateAllVoices={handleGenerateAllVoices}
                generatingVoiceSceneId={generatingVoiceSceneId}
                isGeneratingAllVoices={isGeneratingAllVoices}
              />
            )}

            {activeModule === 'voice' && (
              <VoiceStudio
                t={t}
                bible={currentProject.bible}
                scenes={currentProject.scenes || []}
                projectId={currentProject.id}
                onGenerateVoice={handleGenerateVoice}
                onGenerateAllVoices={handleGenerateAllVoices}
                generatingVoiceSceneId={generatingVoiceSceneId}
                isGeneratingAllVoices={isGeneratingAllVoices}
              />
            )}
          </div>
        )}
      </main>

      {/* Global Shortcut Notification Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-950/50'
                : toast.type === 'warn'
                ? 'bg-amber-950/90 text-amber-200 border-amber-500/40 shadow-amber-950/50'
                : 'bg-neutral-900/90 text-neutral-200 border-neutral-700 shadow-black/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        t={t}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        t={t}
        settings={providerSettings}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
