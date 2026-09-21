import React from 'react';

interface Props {
  badge: string;
  meta?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

/** Shared banner used by every studio module so the headers stay consistent. */
export const ModuleHeader: React.FC<Props> = ({ badge, meta, title, description, action }) => (
  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
    <div>
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
          {badge}
        </span>
        {meta && <span className="text-xs text-neutral-400 font-mono">{meta}</span>}
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{title}</h1>
      <p className="text-xs sm:text-sm text-neutral-300 mt-1 max-w-3xl leading-relaxed">{description}</p>
    </div>
    {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
  </div>
);

interface EmptyProps {
  icon: React.ReactNode;
  message: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyProps> = ({ icon, message, action }) => (
  <div className="flex flex-col items-center justify-center gap-4 py-20 px-6 bg-neutral-900/50 border border-dashed border-neutral-800 rounded-2xl text-center">
    <div className="text-neutral-600">{icon}</div>
    <p className="text-sm text-neutral-400 max-w-md">{message}</p>
    {action}
  </div>
);
