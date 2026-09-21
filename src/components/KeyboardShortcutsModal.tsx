import React from 'react';
import { Command, X, Save, BookOpen, FileText, FolderKanban, Keyboard, Play } from 'lucide-react';
import { Translations } from '../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  t: Translations;
}

export const KeyboardShortcutsModal: React.FC<Props> = ({ isOpen, onClose, t }) => {
  if (!isOpen) return null;

  const shortcuts = [
    {
      keys: ['Ctrl', 'S'],
      macKeys: ['⌘', 'S'],
      action: 'Save Current Project & Stage',
      desc: 'Saves the Project Bible, scenes, voices, and metadata with instant cloud persistence.',
      icon: Save,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    {
      keys: ['Ctrl', 'B'],
      macKeys: ['⌘', 'B'],
      action: 'Navigate to Project Bible (Stage 1)',
      desc: 'Switch directly to the single source of truth Bible Editor.',
      icon: BookOpen,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    },
    {
      keys: ['Ctrl', 'Shift', 'S'],
      macKeys: ['⌘', 'Shift', 'S'],
      action: 'Navigate to Script & Scenes (Stage 2)',
      desc: 'Switch directly to the narrative script and scene breakdown editor.',
      icon: FileText,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    },
    {
      keys: ['Ctrl', '1 … 9'],
      macKeys: ['⌘', '1 … 9'],
      action: 'Quick Module Navigation',
      desc: '1 Bible · 2 Script · 3 Voice · 4 References · 5 Breakdown · 6 Keyframes · 7 Video · 8 Assembly · 9 QA',
      icon: Command,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      keys: ['Ctrl', 'P'],
      macKeys: ['⌘', 'P'],
      action: 'Toggle Projects Dashboard',
      desc: 'Return to the projects catalog to create or open projects.',
      icon: FolderKanban,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    {
      keys: ['Ctrl', 'Enter'],
      macKeys: ['⌘', 'Enter'],
      action: 'Run the full production pipeline',
      desc: 'Runs every stage end to end, skipping work that is already done.',
      icon: Play,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      keys: ['?'],
      macKeys: ['?'],
      action: 'Open Keyboard Shortcuts Help',
      desc: 'View this cheat sheet at any point during production.',
      icon: Keyboard,
      color: 'text-neutral-400 bg-neutral-800 border-neutral-700',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Keyboard Shortcuts</h3>
              <p className="text-xs text-neutral-400">Global production pipeline navigation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {shortcuts.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="flex items-center justify-between gap-4 p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 hover:border-neutral-700 transition"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`p-2 rounded-lg border shrink-0 ${s.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-neutral-200 block truncate">
                      {s.action}
                    </span>
                    <span className="text-[11px] text-neutral-400 block leading-tight">
                      {s.desc}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {s.keys.map((k, kIdx) => (
                    <kbd
                      key={kIdx}
                      className="px-2 py-1 text-[11px] font-mono font-bold bg-neutral-800 border border-neutral-700 rounded text-amber-300 shadow-sm"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Shortcuts are active across all stages and views.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs border border-neutral-700 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
