import React, { useState } from 'react';
import { Film, Globe, Settings, ShieldCheck, Sparkles, FolderKanban, Info, Keyboard } from 'lucide-react';
import { SupportedLanguage, Project } from '../types';
import { Translations } from '../i18n';

interface Props {
  lang: SupportedLanguage;
  t: Translations;
  currentProject: Project | null;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onOpenProjects: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts?: () => void;
}

export const Header: React.FC<Props> = ({
  lang,
  t,
  currentProject,
  onSelectLanguage,
  onOpenProjects,
  onOpenSettings,
  onOpenShortcuts,
}) => {
  const [showRuleInfo, setShowRuleInfo] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Project Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={onOpenProjects}
            className="flex items-center gap-2.5 group text-left cursor-pointer"
            title={t.navProjects}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              <Film className="w-5 h-5 text-neutral-950" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-base">
                  {t.appName}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Director AI
                </span>
              </div>
              <p className="text-xs text-neutral-400 truncate max-w-xs">
                {currentProject ? currentProject.title : t.appSubtitle}
              </p>
            </div>
          </button>

          {currentProject && (
            <div className="flex items-center gap-2 pl-2 border-s border-neutral-700">
              <button
                id="header-nav-projects"
                onClick={onOpenProjects}
                className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-2.5 py-1.5 rounded-lg border border-neutral-700 transition"
              >
                <FolderKanban className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.navProjects}</span>
              </button>
            </div>
          )}
        </div>

        {/* Center Golden Rule Pill */}
        <div className="hidden lg:flex items-center">
          <button
            onClick={() => setShowRuleInfo(!showRuleInfo)}
            className="flex items-center gap-2 text-xs text-amber-300/90 bg-amber-950/40 hover:bg-amber-950/60 border border-amber-500/30 px-3 py-1.5 rounded-full transition"
            title={t.goldenRuleDesc}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium truncate max-w-md">{t.goldenRule}</span>
            <Info className="w-3 h-3 text-amber-400/70" />
          </button>
        </div>

        {/* Right Tools: Language, Settings */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="flex items-center bg-neutral-800/80 border border-neutral-700 rounded-lg p-0.5">
            <Globe className="w-3.5 h-3.5 mx-1.5 text-neutral-400" />
            <button
              id="lang-btn-ar"
              onClick={() => onSelectLanguage('ar')}
              className={`px-2 py-1 text-xs font-semibold rounded ${
                lang === 'ar'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-300 hover:text-white'
              } transition`}
            >
              عربي
            </button>
            <button
              id="lang-btn-en"
              onClick={() => onSelectLanguage('en')}
              className={`px-2 py-1 text-xs font-semibold rounded ${
                lang === 'en'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-300 hover:text-white'
              } transition`}
            >
              EN
            </button>
            <button
              id="lang-btn-es"
              onClick={() => onSelectLanguage('es')}
              className={`px-2 py-1 text-xs font-semibold rounded ${
                lang === 'es'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-300 hover:text-white'
              } transition`}
            >
              ES
            </button>
          </div>

          {/* Keyboard Shortcuts Button */}
          {onOpenShortcuts && (
            <button
              id="header-open-shortcuts"
              onClick={onOpenShortcuts}
              className="p-2 text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition flex items-center gap-1.5 text-xs font-mono"
              title="Keyboard Shortcuts (Ctrl+S, Ctrl+B, Ctrl+Shift+S, ?)"
            >
              <Keyboard className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline font-bold text-[11px] text-amber-300/90">⌘ / Ctrl</span>
            </button>
          )}

          {/* Settings Button */}
          <button
            id="header-open-settings"
            onClick={onOpenSettings}
            className="p-2 text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition"
            title={t.navSettings}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Golden Rule Dropdown/Drawer banner if toggled */}
      {showRuleInfo && (
        <div className="bg-amber-950/70 border-t border-b border-amber-500/30 px-4 py-3 text-xs text-amber-200 animate-in slide-in-from-top-2">
          <div className="max-w-7xl mx-auto flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-100 font-bold">{t.goldenRule}</strong>
                <p className="text-amber-200/90 mt-0.5">{t.goldenRuleDesc}</p>
                <p className="text-[11px] text-amber-300/80 mt-1 font-mono">
                  Stage 1: Bible JSON &bull; Stage 2: Script Scenes &bull; Stage 3: Shot Breakdown (K1-K4) &bull; Stage 4: QA Drift Detection
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRuleInfo(false)}
              className="text-amber-300 hover:text-white p-1"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
