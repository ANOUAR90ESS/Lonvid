import React, { useState } from 'react';
import { Plus, Film, Clock, DollarSign, Sparkles, Trash2, ArrowRight, CheckCircle2, Shield, Play } from 'lucide-react';
import { Project } from '../types';
import { Translations } from '../i18n';

interface Props {
  t: Translations;
  projects: Project[];
  currentProjectId: string | null;
  onOpenProject: (id: string) => void;
  onCreateProject: (data: {
    title: string;
    idea: string;
    target_duration_min: number;
    pilot_mode: boolean;
    budget_limit: number;
  }) => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectsDashboard: React.FC<Props> = ({
  t,
  projects,
  currentProjectId,
  onOpenProject,
  onCreateProject,
  onDeleteProject,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [idea, setIdea] = useState('');
  const [targetDuration, setTargetDuration] = useState(30);
  const [pilotMode, setPilotMode] = useState(true);
  const [budgetLimit, setBudgetLimit] = useState(25);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;

    // Derive a clean title from the idea
    const derivedTitle = idea.slice(0, 36).split('.')[0].trim() || 'Untitled Project';

    onCreateProject({
      title: derivedTitle,
      idea: idea.trim(),
      target_duration_min: targetDuration,
      pilot_mode: pilotMode,
      budget_limit: budgetLimit,
    });

    setIdea('');
    setShowModal(false);
  };

  const applyPreset = (presetText: string) => {
    setIdea(presetText);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t.navProjects}
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            {t.appSubtitle}
          </p>
        </div>

        <button
          id="btn-create-project-modal"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition transform active:scale-95"
        >
          <Plus className="w-4 h-4 text-neutral-950 stroke-[3]" />
          <span>{t.newProject}</span>
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-12 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-4">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-neutral-200 mb-2">
            {t.noProjectsYet}
          </h3>
          <p className="text-sm text-neutral-400 mb-6">
            {t.bibleEditorDesc}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 text-neutral-950 font-bold text-sm hover:bg-amber-400 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t.createFirstProject}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => {
            const isSelected = proj.id === currentProjectId;
            const stagePercent = Math.min(100, Math.round((proj.current_stage / 4) * 100));

            return (
              <div
                key={proj.id}
                id={`project-card-${proj.id}`}
                className={`flex flex-col justify-between rounded-2xl p-6 border transition-all ${
                  isSelected
                    ? 'bg-neutral-900 border-amber-500/60 shadow-xl shadow-amber-950/20 ring-1 ring-amber-500/30'
                    : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div>
                  {/* Card Header & Badges */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400 font-bold text-xs">
                        <Film className="w-4 h-4" />
                      </span>
                      <div>
                        <h3 className="font-bold text-base text-neutral-100 line-clamp-1">
                          {proj.title}
                        </h3>
                        <p className="text-[11px] text-neutral-400 font-mono">
                          {new Date(proj.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this project?')) {
                          onDeleteProject(proj.id);
                        }
                      }}
                      className="text-neutral-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-neutral-800 transition"
                      title={t.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Badges: Pilot Mode & Target Duration */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {proj.pilot_mode ? (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {t.pilotMode} (3 min)
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {proj.target_duration_min} {t.minutes}
                      </span>
                    )}

                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-emerald-400" />
                      {t.budgetLimit}: ${proj.budget_limit}
                    </span>
                  </div>

                  {/* Logline or Idea snippet */}
                  <p className="text-xs text-neutral-300/90 line-clamp-3 mb-4 leading-relaxed bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/80">
                    {proj.bible?.logline || proj.idea}
                  </p>

                  {/* Stage Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-neutral-400 font-medium">
                        {t.stage} {proj.current_stage}: {proj.current_stage === 1 ? t.navBible : proj.current_stage === 2 ? t.navScript : t.navVoice}
                      </span>
                      <span className="font-mono font-bold text-amber-400">
                        {stagePercent}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-950 rounded-full h-1.5 border border-neutral-800 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${stagePercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                  <div className="text-[11px] text-neutral-400">
                    <span>{proj.scenes?.length || 0} {t.scenesCount}</span>
                  </div>

                  <button
                    onClick={() => onOpenProject(proj.id)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-neutral-200 text-xs font-semibold border border-neutral-700 hover:border-amber-400 transition"
                  >
                    <span>{t.openProject}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {t.createProjectModalTitle}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {t.appSubtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              {/* Presets */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  {t.sampleIdeas}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { title: "Cyberpunk", text: t.sample1 },
                    { title: "Desert Myth", text: t.sample2 },
                    { title: "Space 2084", text: t.sample3 },
                  ].map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => applyPreset(p.text)}
                      className="text-start p-2.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 hover:border-amber-500/40 transition text-xs"
                    >
                      <div className="font-bold text-amber-400 mb-1">{p.title}</div>
                      <div className="text-neutral-300 line-clamp-2">{p.text}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Idea Textarea */}
              <div>
                <label className="block text-sm font-semibold text-neutral-200 mb-1.5">
                  {t.projectIdeaLabel} *
                </label>
                <textarea
                  id="input-project-idea"
                  required
                  rows={4}
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder={t.projectIdeaPlaceholder}
                  className="w-full bg-neutral-950 border border-neutral-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl p-3.5 text-sm text-neutral-100 placeholder-neutral-500 transition"
                />
              </div>

              {/* Target Duration & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    {t.targetDuration}
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={60}
                    value={targetDuration}
                    onChange={(e) => setTargetDuration(parseInt(e.target.value) || 30)}
                    className="w-full bg-neutral-950 border border-neutral-700 focus:border-amber-500 rounded-lg p-2.5 text-sm text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    {t.budgetLimit}
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={500}
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(parseInt(e.target.value) || 25)}
                    className="w-full bg-neutral-950 border border-neutral-700 focus:border-amber-500 rounded-lg p-2.5 text-sm text-neutral-100"
                  />
                </div>
              </div>

              {/* Pilot Mode Switch */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <input
                  type="checkbox"
                  id="pilot-mode-toggle"
                  checked={pilotMode}
                  onChange={(e) => setPilotMode(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-neutral-900 border-neutral-700"
                />
                <label htmlFor="pilot-mode-toggle" className="cursor-pointer">
                  <span className="block text-xs font-bold text-amber-300">
                    {t.pilotMode}
                  </span>
                  <span className="block text-[11px] text-neutral-300 mt-0.5">
                    {t.pilotModeDesc}
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium transition"
                >
                  {t.cancel}
                </button>
                <button
                  id="btn-submit-create-project"
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>{t.createFirstProject}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
