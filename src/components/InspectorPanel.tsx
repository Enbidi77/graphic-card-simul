import React from 'react';
import { useGpuLabStore } from '../store/useGpuLabStore';

const ORIGIN_LABELS: Record<string, { label: string; color: string }> = {
  browser_rendered: { label: 'Browser-Rendered', color: 'text-signal-green border-signal-green/40' },
  user_configured: { label: 'User-Configured', color: 'text-slate-400 border-slate-500/40' },
  simulated: { label: 'Simulated Model', color: 'text-signal-cyan border-signal-cyan/40' },
  theoretical: { label: 'Theoretical Calc', color: 'text-signal-amber border-signal-amber/40' }
};

export const InspectorPanel: React.FC = () => {
  const inspector = useGpuLabStore((s) => s.inspector);

  if (!inspector) {
    return (
      <aside className="flex h-full w-72 shrink-0 flex-col border-l border-slate-300 bg-slate-100 p-3 text-xs dark:border-graphite-700 dark:bg-graphite-900">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">
          Inspector
        </div>
        <div className="rounded border border-dashed border-slate-300 p-3 text-slate-500 dark:border-graphite-700 dark:text-slate-400">
          Select any GPU component, pipeline stage, rasterized pixel, compute thread, VRAM block, or
          frame event to inspect its state, memory address, and educational notes.
        </div>
      </aside>
    );
  }

  const badge = ORIGIN_LABELS[inspector.origin] ?? ORIGIN_LABELS.simulated;

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col overflow-y-auto border-l border-slate-300 bg-slate-100 p-3 text-xs dark:border-graphite-700 dark:bg-graphite-900">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
          Inspector
        </span>
        <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      <div className="mb-3 border-b border-slate-300 pb-2 dark:border-graphite-700">
        <div className="font-semibold text-slate-900 dark:text-slate-100">{inspector.title}</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">{inspector.subtitle}</div>
        <div className="mt-1.5 inline-block rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[10px] text-signal-cyan dark:bg-graphite-850">
          STATE: {inspector.state}
        </div>
        {inspector.memoryAddress && (
          <div className="mt-1 font-mono text-[11px] text-slate-400">
            ADDR: <span className="text-slate-200">{inspector.memoryAddress}</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-1 font-mono text-[10px] uppercase text-slate-500">Inputs</div>
          <div className="space-y-1 rounded border border-slate-300 bg-white p-2 dark:border-graphite-700 dark:bg-graphite-950">
            {Object.entries(inspector.inputs).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 font-mono text-[11px]">
                <span className="text-slate-500">{k}</span>
                <span className="truncate text-right text-slate-900 dark:text-slate-200">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1 font-mono text-[10px] uppercase text-slate-500">Outputs</div>
          <div className="space-y-1 rounded border border-slate-300 bg-white p-2 dark:border-graphite-700 dark:bg-graphite-950">
            {Object.entries(inspector.outputs).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 font-mono text-[11px]">
                <span className="text-slate-500">{k}</span>
                <span className="truncate text-right text-signal-cyan">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1 font-mono text-[10px] uppercase text-slate-500">Configuration</div>
          <div className="space-y-1 rounded border border-slate-300 bg-white p-2 dark:border-graphite-700 dark:bg-graphite-950">
            {Object.entries(inspector.config).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 font-mono text-[11px]">
                <span className="text-slate-500">{k}</span>
                <span className="truncate text-right text-slate-900 dark:text-slate-200">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {inspector.history.length > 0 && (
          <div>
            <div className="mb-1 font-mono text-[10px] uppercase text-slate-500">
              Execution History
            </div>
            <ul className="space-y-1 rounded border border-slate-300 bg-white p-2 font-mono text-[10px] text-slate-400 dark:border-graphite-700 dark:bg-graphite-950">
              {inspector.history.map((h, i) => (
                <li key={i}>• {h}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <div className="mb-1 font-mono text-[10px] uppercase text-slate-500">
            Architecture Note
          </div>
          <p className="rounded border border-slate-300 bg-slate-50 p-2 leading-relaxed text-slate-700 dark:border-graphite-700 dark:bg-graphite-850 dark:text-slate-300">
            {inspector.educationalExplanation}
          </p>
        </div>
      </div>
    </aside>
  );
};
