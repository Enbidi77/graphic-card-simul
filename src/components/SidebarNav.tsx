import React from 'react';
import {
  Cpu,
  GitBranch,
  Grid3x3,
  Scan,
  Layers,
  HardDrive,
  Gauge,
  Code2,
  Bug,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import type { NavSectionId } from '../engine';
import { useGpuLabStore } from '../store/useGpuLabStore';

const NAV_ITEMS: Array<{ id: NavSectionId; label: string; icon: React.FC<{ className?: string }> }> = [
  { id: 'architecture', label: 'GPU Architecture', icon: Cpu },
  { id: 'pipeline', label: 'Graphics Pipeline', icon: GitBranch },
  { id: 'compute', label: 'Compute Shaders', icon: Grid3x3 },
  { id: 'rasterization', label: 'Rasterization Lab', icon: Scan },
  { id: 'texture-memory', label: 'Texture & Memory', icon: Layers },
  { id: 'vram', label: 'VRAM Explorer', icon: HardDrive },
  { id: 'performance', label: 'Performance Lab', icon: Gauge },
  { id: 'shaders', label: 'Shader Playground', icon: Code2 },
  { id: 'frame-debugger', label: 'Frame Debugger', icon: Bug },
  { id: 'scenarios', label: 'Learning Scenarios', icon: BookOpen }
];

export const SidebarNav: React.FC = () => {
  const activeNav = useGpuLabStore((s) => s.activeNav);
  const setActiveNav = useGpuLabStore((s) => s.setActiveNav);
  const collapsed = useGpuLabStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useGpuLabStore((s) => s.toggleSidebar);

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-slate-300 bg-slate-100 transition-all dark:border-graphite-700 dark:bg-graphite-900 ${
        collapsed ? 'w-12' : 'w-48'
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-300 px-2.5 py-2 dark:border-graphite-700">
        {!collapsed && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
            Workbenches
          </span>
        )}
        <button
          onClick={toggleSidebar}
          aria-label="Toggle Navigation Sidebar"
          className="rounded p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-graphite-800"
        >
          {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-1.5">
        {NAV_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              title={item.label}
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors ${
                active
                  ? 'border border-signal-cyan/50 bg-signal-cyan/10 font-medium text-slate-900 dark:text-signal-cyan'
                  : 'border border-transparent text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-graphite-850'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  <span className="ml-auto font-mono text-[10px] text-slate-400">
                    {idx + 1 === 10 ? '0' : idx + 1}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
