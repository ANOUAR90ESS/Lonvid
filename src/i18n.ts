import { SupportedLanguage } from './types';

export interface Translations {
  appName: string;
  appSubtitle: string;
  goldenRule: string;
  goldenRuleDesc: string;
  // Navigation & Modules
  navProjects: string;
  navBible: string;
  navReferences: string;
  navScript: string;
  navVoice: string;
  navBreakdown: string;
  navImages: string;
  navVideo: string;
  navAssembly: string;
  navQA: string;
  navSettings: string;
  // Phases
  phasesOverview: string;
  phase1Title: string;
  phase1Desc: string;
  phase2Title: string;
  phase2Desc: string;
  phase3Title: string;
  phase3Desc: string;
  phase4Title: string;
  phase4Desc: string;
  activePhase: string;
  upcomingPhase: string;
  completed: string;
  inProgress: string;
  // Project Dashboard
  newProject: string;
  createProjectModalTitle: string;
  projectIdeaPlaceholder: string;
  projectIdeaLabel: string;
  targetDuration: string;
  pilotMode: string;
  pilotModeDesc: string;
  budgetLimit: string;
  spentCost: string;
  estimatedTime: string;
  openProject: string;
  noProjectsYet: string;
  createFirstProject: string;
  sampleIdeas: string;
  sample1: string;
  sample2: string;
  sample3: string;
  // Bible Editor
  bibleEditorTitle: string;
  bibleEditorDesc: string;
  generateBibleBtn: string;
  generatingBible: string;
  bibleSingleSource: string;
  titleLabel: string;
  loglineLabel: string;
  visualStyle: string;
  stylePrompt: string;
  colorPalette: string;
  aspectRatio: string;
  negativePrompt: string;
  charactersTitle: string;
  addCharacter: string;
  characterName: string;
  lockedDescription: string;
  lockedBadge: string;
  unlockedBadge: string;
  lockDescriptionBtn: string;
  unlockDescriptionBtn: string;
  voiceSettings: string;
  voiceId: string;
  voiceTone: string;
  refSheetPrompt: string;
  locationsTitle: string;
  addLocation: string;
  locationName: string;
  refPrompt: string;
  continuityWarningTitle: string;
  continuityWarningBody: string;
  continuityConfirmUnlock: string;
  continuityCancel: string;
  // Script Module
  scriptTitle: string;
  scriptDesc: string;
  generateScriptBtn: string;
  generatingScript: string;
  scenesCount: string;
  totalWords: string;
  totalEstDuration: string;
  sceneCard: string;
  sceneSummary: string;
  emotionalBeat: string;
  assignedLocation: string;
  assignedCharacters: string;
  narrationDialogue: string;
  wordsWord: string;
  estDurationLabel: string;
  realDurationLabel: string;
  addScene: string;
  deleteScene: string;
  // Voice Module
  voiceTitle: string;
  voiceDesc: string;
  generateAllVoices: string;
  generatingAllVoices: string;
  generateSceneVoice: string;
  generatingVoice: string;
  realDurationDetected: string;
  voiceProviderLabel: string;
  noAudioYet: string;
  playAudio: string;
  pauseAudio: string;
  audioReady: string;
  waveformSim: string;
  // General
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  saving: string;
  actions: string;
  cost: string;
  stage: string;
  minutes: string;
  seconds: string;
  wordsPerMinuteRule: string;
  directorAILabel: string;
  verbatimRuleNotice: string;
  settingsTitle: string;
  llmProvider: string;
  voiceProvider: string;
  imageProvider: string;
  videoProvider: string;
  apiKeyNotice: string;
  phaseApprovalNote: string;
}

export const translations: Record<SupportedLanguage, Translations> = {
  ar: {
    appName: "LongForm Studio",
    appSubtitle: "منظومة إنتاج أفلام الذكاء الاصطناعي الطويلة (30+ دقيقة) بتناسق تام",
    goldenRule: "القاعدة الذهبية: المصدر الوحيد للحقيقة هو دليل المشروع (Bible JSON)",
    goldenRuleDesc: "نماذج التوليد لا تمتلك ذاكرة. المخرج الذكي يستنسخ أوصاف الشخصيات والمواقع حرفياً دون أي تعديل أو اختصار.",
    navProjects: "المشاريع",
    navBible: "دليل المشروع (Bible)",
    navReferences: "استوديو المراجع",
    navScript: "السيناريو",
    navVoice: "الأصوات والسرد",
    navBreakdown: "تفكيك اللقطات",
    navImages: "توليد المشاهد K1-K4",
    navVideo: "توليد الفيديو",
    navAssembly: "المونتاج والتصدير",
    navQA: "فحص الانحراف (QA)",
    navSettings: "الإعدادات",
    phasesOverview: "مراحل تسليم المنظومة",
    phase1Title: "المرحلة 1: نموذج البيانات، دليل المشروع، السيناريو، الصوت",
    phase1Desc: "هيكلة البيانات الكاملة، محرر دليل المشروع المحمي بأقفال التناسق، توليد السيناريو وحساب التوقيت الحقيقي عبر الصوت.",
    phase2Title: "المرحلة 2: استوديو المراجع، تجزئة اللقطات، توليد الإطارات المفتاحية",
    phase2Desc: "توليد أوراق مرجعية للشخصيات والمواقع، تقسيم كل مشهد إلى 4 إطارات K1-K4 وتغذية K4 للمشهد التالي.",
    phase3Title: "المرحلة 3: توليد الفيديو I2V، رتل المهام المتين، مونتاج FFmpeg",
    phase3Desc: "توليد الفيديو من الإطار الأول إلى الأخير، رتل مهام قابل للاستئناف لـ 250 لقطة وتصدير MP4 بدقة 1080p.",
    phase4Title: "المرحلة 4: لوحة ضبط الجودة ومكافحة الانحراف، تتبع الميزانية والصقل النهائي",
    phase4Desc: "مقارنة جنباً إلى جنب مع أوراق المراجع، رصد الانحرافات اللحظية وإعادة توليد العناصر غير المتوافقة فقط.",
    activePhase: "المرحلة الحالية (جاهزة للعمل)",
    upcomingPhase: "المرحلة القادمة",
    completed: "مكتمل",
    inProgress: "قيد التنفيذ",
    newProject: "مشروع جديد",
    createProjectModalTitle: "إنشاء مشروع إنتاج جديد",
    projectIdeaPlaceholder: "اكتب فكرة الفيلم بالتفصيل (مثال: محقق في مدينة سيبرانية يبحث عن أرشيف ذكريات مفقود، بمشاركة روبوت عجوز وخبير تشفير...)",
    projectIdeaLabel: "فكرة الفيلم أو القصة",
    targetDuration: "المدة المستهدفة (دقيقة)",
    pilotMode: "وضع التجربة المصغرة (Pilot Mode)",
    pilotModeDesc: "إنتاج أول 3 دقائق فقط لاختبار التناسق وجودة الإخراج قبل استهلاك الميزانية الكاملة.",
    budgetLimit: "حد الميزانية الأقصى ($)",
    spentCost: "المصروف الفعلي ($)",
    estimatedTime: "الوقت المقدر",
    openProject: "فتح المشروع",
    noProjectsYet: "لا توجد مشاريع حتى الآن. ابدأ بإنشاء مشروعك الأول!",
    createFirstProject: "إنشاء أول مشروع سينمائي",
    sampleIdeas: "أفكار سينمائية جاهزة للاختبار",
    sample1: "محقق السيبربانك: البحث عن شفرة الوعي الضائعة في قطار نيون ليلي (30 دقيقة)",
    sample2: "أساطير الصحراء القديمة: رحلة حارس الواحة بحثاً عن ينبوع الرمال الذهبية (30 دقيقة)",
    sample3: "محطة الفضاء 2084: لغز الإشارة المجهولة خارج حزام الكويكبات (30 دقيقة)",
    bibleEditorTitle: "محرر دليل المشروع (Project Bible)",
    bibleEditorDesc: "الدستور البصري والقصصي للمشروع. كل كلمة هنا تُنقل حرفياً لنماذج الذكاء الاصطناعي لضمان تطابق الأشكال والمواقع.",
    generateBibleBtn: "توليد الدليل عبر المخرج الذكي (Stage 1)",
    generatingBible: "المخرج الذكي يقوم بتحليل الفكرة وهيكلة الدليل...",
    bibleSingleSource: "وثيقة الحقيقة المطلقة - يتم تزويد كل طلب بها",
    titleLabel: "عنوان الفيلم",
    loglineLabel: "الملخص المكثف (Logline)",
    visualStyle: "الأسلوب البصري الموحد (Visual Style)",
    stylePrompt: "موجه الأسلوب (Style Prompt)",
    colorPalette: "لوحة الألوان (Color Palette)",
    aspectRatio: "نسبة الأبعاد (Aspect Ratio)",
    negativePrompt: "الموجه السلبي (Negative Prompt)",
    charactersTitle: "الشخصيات الرئيسية وأوصافها المحمية",
    addCharacter: "إضافة شخصية جديدة",
    characterName: "اسم الشخصية",
    lockedDescription: "الوصف المحمي والمغلق (Verbatim Description)",
    lockedBadge: "مُقفل للتناسق",
    unlockedBadge: "مفتوح للتعديل",
    lockDescriptionBtn: "قفل الوصف",
    unlockDescriptionBtn: "فك القفل (تحذير)",
    voiceSettings: "إعدادات الصوت والنبرة",
    voiceId: "معرّف الصوت (Voice ID)",
    voiceTone: "نبرة الصوت (Tone)",
    refSheetPrompt: "موجه ورقة المراجع (Reference Sheet)",
    locationsTitle: "المواقع والمشاهد البيئية",
    addLocation: "إضافة موقع جديد",
    locationName: "اسم الموقع",
    refPrompt: "موجه مرجع الموقع",
    continuityWarningTitle: "تحذير كسر التناسق البصري (Continuity Break)",
    continuityWarningBody: "تعديل هذا الوصف بعد إقفاله سيؤدي إلى كسر التطابق الشكلي للشخصية أو الموقع عبر جميع المشاهد واللقطات اللاحقة. هل أنت متأكد تماماً من رغبتك في المتابعة؟",
    continuityConfirmUnlock: "نعم، أفهم الخطر وأريد المتابعة",
    continuityCancel: "إلغاء والاحتفاظ بالقفل",
    scriptTitle: "السيناريو وتقسيم المشاهد",
    scriptDesc: "تقسيم الحوار والسرد إلى مشاهد مدة كل منها (30–90 ثانية). المعدل: ~150 كلمة مقروءة = دقيقة واحدة.",
    generateScriptBtn: "توليد السيناريو كاملاً (Stage 2)",
    generatingScript: "جاري كتابة السيناريو وتقسيم المشاهد وفق دليل المشروع...",
    scenesCount: "عدد المشاهد",
    totalWords: "إجمالي الكلمات",
    totalEstDuration: "المدة التقديرية",
    sceneCard: "المشهد",
    sceneSummary: "ملخص المشهد",
    emotionalBeat: "النبض الشعوري (Emotional Beat)",
    assignedLocation: "الموقع المخصص",
    assignedCharacters: "الشخصيات الحاضرة",
    narrationDialogue: "نص السرد والحوار",
    wordsWord: "كلمة",
    estDurationLabel: "المدة التقديرية (150 ك/د)",
    realDurationLabel: "المدة الحقيقية للصوت المسجل",
    addScene: "إضافة مشهد يدوي",
    deleteScene: "حذف المشهد",
    voiceTitle: "توليد النطق وتحديد التوقيت الدقيق",
    voiceDesc: "توليد التعليق الصوتي لكل مشهد باستخدام الصوت الثابت للشخصية عبر ElevenLabs / Gemini TTS، وقراءة المدة الحقيقية بالميلي ثانية.",
    generateAllVoices: "توليد جميع الأصوات للمشاهد",
    generatingAllVoices: "جاري توليد الملفات الصوتية وقراءة التوقيت الدقيق...",
    generateSceneVoice: "توليد صوت المشهد",
    generatingVoice: "جاري المعالجة الصوتية...",
    realDurationDetected: "تم رصد التوقيت الحقيقي:",
    voiceProviderLabel: "مزود الصوت",
    noAudioYet: "لم يتم توليد الصوت بعد. اضغط على توليد الصوت لقياس المدة الدقيقة.",
    playAudio: "تشغيل",
    pauseAudio: "إيقاف مؤقت",
    audioReady: "الصوت جاهز والتوقيت دقيق",
    waveformSim: "الموجة الصوتية والتزامن",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    saving: "جاري الحفظ...",
    actions: "الإجراءات",
    cost: "التكلفة",
    stage: "المرحلة",
    minutes: "دقيقة",
    seconds: "ثانية",
    wordsPerMinuteRule: "قاعدة التوقيت: 150 كلمة = 60 ثانية",
    directorAILabel: "المخرج الذكي (Director AI)",
    verbatimRuleNotice: "الأوصاف تُنقل بالحرف الواحد في كل نداء للموديل لضمان الذاكرة الصفرية.",
    settingsTitle: "إعدادات المزودات والمفاتيح",
    llmProvider: "مزود نماذج اللغة والسيناريو",
    voiceProvider: "مزود الصوت والنطق",
    imageProvider: "مزود توليد الصور",
    videoProvider: "مزود توليد الفيديو",
    apiKeyNotice: "يتم تخزين المفاتيح الحساسة في خادم التطبيق بصورة آمنة ولا يتم إرسالها إلى المتصفح أبداً.",
    phaseApprovalNote: "تم تسليم المرحلة 1 بنجاح (نموذج البيانات، دليل المشروع، السيناريو، ومحرك الصوت). بانتظار موافقتكم للانتقال للمرحلة 2."
  },
  en: {
    appName: "LongForm Studio",
    appSubtitle: "Consistent Long-Form AI Video Pipeline (30+ Minutes)",
    goldenRule: "GOLDEN RULE: The Project Bible (JSON) is the ONLY source of truth.",
    goldenRuleDesc: "Image and video models have no memory. The Director AI copies locked character/location descriptions VERBATIM into every prompt.",
    navProjects: "Projects",
    navBible: "Project Bible",
    navReferences: "Reference Studio",
    navScript: "Script",
    navVoice: "Voice & Narration",
    navBreakdown: "Shot Breakdown",
    navImages: "Keyframes (K1-K4)",
    navVideo: "Video Generation",
    navAssembly: "Assembly & Export",
    navQA: "Drift QA Panel",
    navSettings: "Settings",
    phasesOverview: "Pipeline Delivery Phases",
    phase1Title: "Phase 1: Data Model, Bible Editor, Script, Voice",
    phase1Desc: "Complete data structures, continuity-locked bible editor, scene-by-scene script generator, and real audio duration calculation.",
    phase2Title: "Phase 2: Reference Studio, Shot Breakdown, Image Generation",
    phase2Desc: "Character sheets, location references, 4 keyframes per scene (K1-K4), and auto-attaching previous scene K4 as continuity bridge.",
    phase3Title: "Phase 3: Video Generation, Job Queue, Assembly",
    phase3Desc: "First & last frame video interpolation, restartable queue for 250+ shots, and server-side FFmpeg assembly.",
    phase4Title: "Phase 4: QA Drift Panel, Cost Tracker, Final Polish",
    phase4Desc: "Side-by-side character sheet vs keyframe comparison, automated drift detection, and budget limit pauses.",
    activePhase: "Active Phase (Live & Ready)",
    upcomingPhase: "Next Phase",
    completed: "Completed",
    inProgress: "In Progress",
    newProject: "New Project",
    createProjectModalTitle: "Create New Production Project",
    projectIdeaPlaceholder: "Describe your film concept in detail (e.g., A cybernetic detective hunting for lost memories across an eternal night train, accompanied by an obsolete maintenance droid...)",
    projectIdeaLabel: "Film Concept or Story Idea",
    targetDuration: "Target Duration (minutes)",
    pilotMode: "Pilot Mode (3 Minutes)",
    pilotModeDesc: "Generate the first 3 minutes only to verify character consistency, voice, and pacing before committing full budget.",
    budgetLimit: "Budget Limit ($)",
    spentCost: "Spent Cost ($)",
    estimatedTime: "Estimated Time",
    openProject: "Open Project",
    noProjectsYet: "No projects created yet. Start by creating your first project!",
    createFirstProject: "Create First Film Project",
    sampleIdeas: "Ready-Made Presets",
    sample1: "Cyberpunk Detective: The Neon Horizon (30 min)",
    sample2: "Ancient Desert Myth: Whispers of the Dune (30 min)",
    sample3: "Deep Space 2084: The Signal from Kepler-186f (30 min)",
    bibleEditorTitle: "Project Bible Editor",
    bibleEditorDesc: "The single source of truth for the entire pipeline. Every character and location description here is injected verbatim into image and video prompts.",
    generateBibleBtn: "Generate Bible via Director AI (Stage 1)",
    generatingBible: "Director AI is structuring Bible JSON from your idea...",
    bibleSingleSource: "Single Source of Truth - Sent with every request",
    titleLabel: "Film Title",
    loglineLabel: "Logline",
    visualStyle: "Visual Style & Art Direction",
    stylePrompt: "Style Prompt",
    colorPalette: "Color Palette",
    aspectRatio: "Aspect Ratio",
    negativePrompt: "Negative Prompt",
    charactersTitle: "Characters & Locked Descriptions",
    addCharacter: "Add Character",
    characterName: "Character Name",
    lockedDescription: "Locked Verbatim Description",
    lockedBadge: "Locked for Continuity",
    unlockedBadge: "Unlocked (Editable)",
    lockDescriptionBtn: "Lock Description",
    unlockDescriptionBtn: "Unlock (Warning)",
    voiceSettings: "Voice Settings & Tone",
    voiceId: "Voice ID",
    voiceTone: "Voice Tone",
    refSheetPrompt: "Reference Sheet Prompt",
    locationsTitle: "Locations & Environments",
    addLocation: "Add Location",
    locationName: "Location Name",
    refPrompt: "Reference Image Prompt",
    continuityWarningTitle: "Continuity Break Warning",
    continuityWarningBody: "Modifying locked character or location descriptions breaks visual and narrative continuity across all subsequent scenes, keyframes, and video renders. Are you sure you want to proceed?",
    continuityConfirmUnlock: "Yes, I accept the risk and wish to unlock",
    continuityCancel: "Cancel, keep description locked",
    scriptTitle: "Script & Scene Breakdown",
    scriptDesc: "Full narration split into scenes (30–90 seconds each). Industry standard: ~150 spoken words equals 1 minute.",
    generateScriptBtn: "Generate Full Script (Stage 2)",
    generatingScript: "Director AI is writing scenes based on the Project Bible...",
    scenesCount: "Scenes Count",
    totalWords: "Total Words",
    totalEstDuration: "Estimated Duration",
    sceneCard: "Scene",
    sceneSummary: "Scene Summary",
    emotionalBeat: "Emotional Beat",
    assignedLocation: "Assigned Location",
    assignedCharacters: "Characters Present",
    narrationDialogue: "Narration & Dialogue",
    wordsWord: "words",
    estDurationLabel: "Est. Duration (~150 wpm)",
    realDurationLabel: "Real Audio Duration",
    addScene: "Add Scene Manually",
    deleteScene: "Delete Scene",
    voiceTitle: "Voice & Real Duration Measurement",
    voiceDesc: "Synthesize narration per scene using fixed character voice IDs via ElevenLabs or Gemini TTS, reading real audio duration down to milliseconds.",
    generateAllVoices: "Generate All Scene Voices",
    generatingAllVoices: "Synthesizing audio and reading exact durations...",
    generateSceneVoice: "Generate Voice",
    generatingVoice: "Synthesizing audio...",
    realDurationDetected: "Real Audio Duration:",
    voiceProviderLabel: "Voice Provider",
    noAudioYet: "No audio generated yet. Click generate voice to measure exact duration.",
    playAudio: "Play",
    pauseAudio: "Pause",
    audioReady: "Audio Ready & Duration Verified",
    waveformSim: "Audio Waveform & Sync",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    saving: "Saving...",
    actions: "Actions",
    cost: "Cost",
    stage: "Stage",
    minutes: "minutes",
    seconds: "seconds",
    wordsPerMinuteRule: "Timing rule: ~150 words = 60 seconds",
    directorAILabel: "Director AI",
    verbatimRuleNotice: "Descriptions are passed verbatim to ensure 0-memory consistency.",
    settingsTitle: "Provider Adapters & Settings",
    llmProvider: "LLM & Script Provider",
    voiceProvider: "Voice & TTS Provider",
    imageProvider: "Image Generation Provider",
    videoProvider: "Video Generation Provider",
    apiKeyNotice: "API keys are securely held on the backend server and never exposed to the client browser.",
    phaseApprovalNote: "Phase 1 is fully delivered and operational (Data Model, Bible Editor, Script, and Voice). Ready for user review and approval to proceed to Phase 2."
  },
  es: {
    appName: "LongForm Studio",
    appSubtitle: "Pipeline de producción de video IA de larga duración (30+ min) con total coherencia",
    goldenRule: "REGLA DE ORO: La Biblia del Proyecto (JSON) es la ÚNICA fuente de verdad.",
    goldenRuleDesc: "Los modelos de imagen y video no tienen memoria. El Director AI copia las descripciones textuales palabra por palabra.",
    navProjects: "Proyectos",
    navBible: "Biblia del Proyecto",
    navReferences: "Estudio de Referencias",
    navScript: "Guion",
    navVoice: "Voz y Narración",
    navBreakdown: "Desglose de Tomas",
    navImages: "Fotogramas K1-K4",
    navVideo: "Generación de Video",
    navAssembly: "Montaje y Exportación",
    navQA: "Panel de Calidad (QA)",
    navSettings: "Ajustes",
    phasesOverview: "Fases de Entrega del Pipeline",
    phase1Title: "Fase 1: Modelo de Datos, Editor de Biblia, Guion, Voz",
    phase1Desc: "Estructuras de datos, editor con bloqueos de coherencia, generador de guion escena por escena y medición de audio real.",
    phase2Title: "Fase 2: Estudio de Referencias, Desglose de Tomas, Generación de Imágenes",
    phase2Desc: "Hojas de personajes, referencias de locaciones, 4 fotogramas clave por escena (K1-K4) y encadenamiento de continuidad K4.",
    phase3Title: "Fase 3: Generación de Video, Cola de Tareas, Montaje FFmpeg",
    phase3Desc: "Interpolación de primer y último fotograma, cola reanudable para 250+ tomas y montaje con audio en servidor.",
    phase4Title: "Fase 4: Panel QA de Desviación, Control de Costes y Pulido",
    phase4Desc: "Comparativa lado a lado con hojas de personajes, detección automática de desviaciones y límites presupuestarios.",
    activePhase: "Fase Activa (Operativa)",
    upcomingPhase: "Próxima Fase",
    completed: "Completado",
    inProgress: "En curso",
    newProject: "Nuevo Proyecto",
    createProjectModalTitle: "Crear Nuevo Proyecto de Producción",
    projectIdeaPlaceholder: "Describe la idea del film (ej: Un detective cibernético que busca recuerdos perdidos en un tren nocturno...)",
    projectIdeaLabel: "Idea o Concepto del Film",
    targetDuration: "Duración Objetivo (minutos)",
    pilotMode: "Modo Piloto (3 Minutos)",
    pilotModeDesc: "Genera únicamente los primeros 3 minutos para evaluar coherencia y estilo antes de gastar presupuesto completo.",
    budgetLimit: "Límite de Presupuesto ($)",
    spentCost: "Gasto Real ($)",
    estimatedTime: "Tiempo Estimado",
    openProject: "Abrir Proyecto",
    noProjectsYet: "Aún no hay proyectos. ¡Crea el primero!",
    createFirstProject: "Crear Primer Proyecto Cinematográfico",
    sampleIdeas: "Ideas Preconfiguradas",
    sample1: "Detective Cyberpunk: El Horizonte de Neón (30 min)",
    sample2: "Mito del Desierto: Susurros de la Duna (30 min)",
    sample3: "Estación Espacial 2084: Señal de Kepler (30 min)",
    bibleEditorTitle: "Editor de la Biblia del Proyecto",
    bibleEditorDesc: "La única fuente de verdad. Cada descripción de personaje y locación se inyecta literalmente en cada prompt futuro.",
    generateBibleBtn: "Generar Biblia con Director AI (Etapa 1)",
    generatingBible: "Director AI estructurando el JSON de la biblia...",
    bibleSingleSource: "Fuente única de verdad - Enviada en cada petición",
    titleLabel: "Título del Film",
    loglineLabel: "Logline",
    visualStyle: "Estilo Visual y Dirección Artística",
    stylePrompt: "Prompt de Estilo",
    colorPalette: "Paleta de Color",
    aspectRatio: "Relación de Aspecto",
    negativePrompt: "Prompt Negativo",
    charactersTitle: "Personajes y Descripciones Bloqueadas",
    addCharacter: "Añadir Personaje",
    characterName: "Nombre del Personaje",
    lockedDescription: "Descripción Bloqueada Textual",
    lockedBadge: "Bloqueado para Coherencia",
    unlockedBadge: "Desbloqueado (Editable)",
    lockDescriptionBtn: "Bloquear Descripción",
    unlockDescriptionBtn: "Desbloquear (Advertencia)",
    voiceSettings: "Ajustes de Voz y Tono",
    voiceId: "ID de Voz",
    voiceTone: "Tono de Voz",
    refSheetPrompt: "Prompt de Hoja de Referencia",
    locationsTitle: "Locaciones y Entornos",
    addLocation: "Añadir Locación",
    locationName: "Nombre de Locación",
    refPrompt: "Prompt de Referencia",
    continuityWarningTitle: "Advertencia de Ruptura de Continuidad",
    continuityWarningBody: "Modificar esta descripción tras ser bloqueada romperá la coherencia visual y narrativa en todas las tomas siguientes. ¿Seguro que deseas continuar?",
    continuityConfirmUnlock: "Sí, acepto el riesgo y deseo desbloquear",
    continuityCancel: "Cancelar, mantener bloqueado",
    scriptTitle: "Guion y Desglose de Escenas",
    scriptDesc: "Surtido completo dividido en escenas (30–90 seg cada una). Regla: ~150 palabras habladas = 1 minuto.",
    generateScriptBtn: "Generar Guion Completo (Etapa 2)",
    generatingScript: "Director AI escribiendo escenas basadas en la Biblia...",
    scenesCount: "Número de Escenas",
    totalWords: "Palabras Totales",
    totalEstDuration: "Duración Estimada",
    sceneCard: "Escena",
    sceneSummary: "Resumen de la Escena",
    emotionalBeat: "Pulso Emocional",
    assignedLocation: "Locación Asignada",
    assignedCharacters: "Personajes Presentes",
    narrationDialogue: "Narración y Diálogo",
    wordsWord: "palabras",
    estDurationLabel: "Duración Est. (~150 ppm)",
    realDurationLabel: "Duración de Audio Real",
    addScene: "Añadir Escena Manualmente",
    deleteScene: "Eliminar Escena",
    voiceTitle: "Generación de Voz y Medición Real",
    voiceDesc: "Sintetizar locución por escena utilizando la voz fija del personaje con ElevenLabs o Gemini TTS, registrando la duración real en milisegundos.",
    generateAllVoices: "Generar Todas las Voces",
    generatingAllVoices: "Sintetizando audios y midiendo duración...",
    generateSceneVoice: "Generar Voz de Escena",
    generatingVoice: "Sintetizando audio...",
    realDurationDetected: "Duración Real Detectada:",
    voiceProviderLabel: "Proveedor de Voz",
    noAudioYet: "Sin audio generado. Haz clic para medir la duración exacta.",
    playAudio: "Reproducir",
    pauseAudio: "Pausar",
    audioReady: "Audio Listo y Duración Verificada",
    waveformSim: "Forma de Onda y Sincronización",
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    saving: "Guardando...",
    actions: "Acciones",
    cost: "Coste",
    stage: "Etapa",
    minutes: "minutos",
    seconds: "segundos",
    wordsPerMinuteRule: "Regla: ~150 palabras = 60 segundos",
    directorAILabel: "Director AI",
    verbatimRuleNotice: "Las descripciones se envían palabra por palabra.",
    settingsTitle: "Proveedores y Ajustes",
    llmProvider: "Proveedor LLM y Guion",
    voiceProvider: "Proveedor de Voz",
    imageProvider: "Proveedor de Imágenes",
    videoProvider: "Proveedor de Video",
    apiKeyNotice: "Las claves API se mantienen seguras en el servidor y nunca se envían al navegador.",
    phaseApprovalNote: "Fase 1 completada con éxito (Modelo de Datos, Biblia, Guion y Motor de Voz). Listo para revisión y aprobación del usuario para la Fase 2."
  }
};
